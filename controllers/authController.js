const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
// const passport = require("../config/passport");
const { OAuth2Client } = require("google-auth-library");
const clientId = process.env.GOOGLE_CLIENT_ID;
const client = new OAuth2Client(clientId);

const mongoose = require("mongoose");
const { GridFSBucket } = require("mongodb");
const multer = require("multer");
const crypto = require("crypto");
const path = require("path");

const register = async (req, res) => {
  try {
    const { name, email, password, role, company } = req.body;

    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ message: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);

    user = new User({
      name,
      email,
      password: hashedPassword,
      role,
      company: role === "employer" ? company : null,
    });

    await user.save();
    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET_KEY,
      { expiresIn: "1d" }
    );
    res.json({ token, user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const me = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Error fetching user details" });
  }
};

const updateUserProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const updateFields = req.body;

    if (req.body.profilePicture) {
      updateFields.profilePicture = req.body.profilePicture;
    }

    const updatedUser = await User.findByIdAndUpdate(userId, updateFields, {
      new: true,
    }).select("-password");
    console.log("--------", updatedUser);
    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const fetchApplicant = async (req, res) => {
  try {
    const applicant = await User.findById(req.params.id);
    if (!applicant) {
      return res.status(404).json({ message: "Applicant not found" });
    }
    res.json(applicant);
  } catch (error) {
    console.error("Error fetching applicant details:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const googleLogin = async (req, res) => {
  console.log("google login..");

  try {
    const { token } = req.body;
    console.log("Received Google token:", token);
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    console.log("Ticket verified:", ticket);

    const { email, name, picture } = ticket.getPayload();

    console.log("User payload:", { email, name, picture });

    let user = await User.findOne({ email });

    if (!user) {
      user = new User({
        name,
        email,
        profilePicture: picture,
        password: "google-auth-user",
        role: "jobseeker",
        socialLogin: true,
        provider: "google",
      });
      await user.save();
    }

    const authToken = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET_KEY,
      {
        expiresIn: "7d",
      }
    );

    res.json({ token: authToken, user });
  } catch (error) {
    console.error("Full Google auth error:", error);
    res.status(400).json({
      message: "Google authentication failed",
      error: error.message,
    });
  }
};

// const uploadResume = async (req, res) => {
//   console.log("Received resume file:", req.file);

//   try {
//     if (!req.file) {
//       throw new Error("No file uploaded.");
//     }

//     const userId = req.user.id;
//     const resumePath = req.file.path;

//     const updatedUser = await User.findByIdAndUpdate(
//       userId,
//       { resume: resumePath },
//       { new: true }
//     ).select("-password");
//     console.log("updated user...", updatedUser);

//     await updatedUser.save();
//     res.json({ resumePath });
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// };

const storage = new multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only PDF, DOC, and DOCX files are allowed"), false);
    }
  },
});

let gfs;
mongoose.connection.once("open", () => {
  gfs = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
    bucketName: "resumes",
  });
});

// Upload Resume
const uploadResume = async (req, res) => {
  console.log("Received resume file:", req.file);

  try {
    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, message: "No file uploaded" });
    }

    // Generate a unique filename
    const filename =
      crypto.randomBytes(16).toString("hex") +
      path.extname(req.file.originalname);
    console.log("Generated filename:", filename);

    // Create write stream to GridFS
    const writeStream = gfs.openUploadStream(filename, {
      contentType: req.file.mimetype,
    });
    console.log("Write stream created:", writeStream.id);
    writeStream.end(req.file.buffer);

    console.log("File written to GridFS");

    writeStream.on("finish", async () => {
      console.log("File uploaded successfully");

      // Fetch the uploaded file metadata
      const uploadedFile = await gfs.find({ filename }).toArray();
      if (!uploadedFile.length) {
        return res
          .status(500)
          .json({ success: false, message: "File metadata not found" });
      }
      console.log("Uploaded file metadata:", uploadedFile[0]);

      //Update user with resume reference
      const user = await User.findByIdAndUpdate(
        req.user.id,
        {
          resume: {
            fileId: uploadedFile[0]._id,
            filename: uploadedFile[0].filename,
            originalName: req.file.originalname,
            uploadDate: new Date(),
          },
        },
        { new: true }
      ).select("-password");
      const resumeUrl = `${req.protocol}://${req.get("host")}/api/auth/resume/${uploadedFile[0]._id}`;


      return res.status(200).json({
        success: true,
        message: "Resume uploaded successfully",
        // resumeUrl: `/api/auth/resume/${uploadedFile[0]._id}`,
        resumeUrl: resumeUrl,
        originalName: req.file.originalname,
        user,
      });
    });

    writeStream.on("error", (error) => {
      console.error("Error uploading file:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to upload resume",
        error: error.message,
      });
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to upload resume",
    });
  }
};

const getResume = async (req, res) => {
  console.log("Fetching resume...",req.params.id);
  try {
    const fileId = new mongoose.Types.ObjectId(req.params.id);
    const user = await User.findOne({ "resume.fileId": fileId });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Resume not found",
      });
    }

    const downloadStream = gfs.openDownloadStream(fileId);

    downloadStream.on("error", () => {
      res.status(404).json({
        success: false,
        message: "Error streaming file",
      });
    });

    res.set("Content-Type", user.resume.contentType || "application/pdf");
    res.set(
      "Content-Disposition",
      `attachment; filename="${user.resume.originalName}"`
    );

    downloadStream.pipe(res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to get resume",
    });
  }
};

// Delete Resume
const deleteResume = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user.resume || !user.resume.fileId) {
      return res.status(404).json({
        success: false,
        message: "No resume found",
      });
    }

    const fileId = new mongoose.Types.ObjectId(user.resume.fileId);

    if (!mongoose.Types.ObjectId.isValid(fileId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid file ID",
      });
    }

    const file = await gfs.find({ _id: fileId }).toArray();
    if (file.length === 0) {
      return res.status(404).json({
        success: false,
        message: "File not found in GridFS",
      });
    }

    // Delete from GridFS
    await gfs.delete(fileId);

    // Remove reference from user
    user.resume = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Resume deleted successfully",
      user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to delete resume",
    });
  }
};

module.exports = {
  register,
  login,
  me,
  updateUserProfile,
  fetchApplicant,
  googleLogin,
  upload,
  uploadResume,
  getResume,
  deleteResume,
};

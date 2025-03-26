const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
// const passport = require("../config/passport");
const { OAuth2Client } = require("google-auth-library");
const clientId=process.env.GOOGLE_CLIENT_ID;
const client = new OAuth2Client(clientId);
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

    if (req.file) {
      updateFields.resume = req.file.path;
    }

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

const uploadResume = async (req, res) => {
  console.log("Received resume file:", req.file);

  try {
    if (!req.file) {
      throw new Error("No file uploaded.");
    }

    const userId = req.user.id;
    const resumePath = req.file.path;

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { resume: resumePath },
      { new: true }
    ).select("-password");
    console.log("updated user...", updatedUser);

    await updatedUser.save();
    res.json({ resumePath });
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

module.exports = {
  register,
  login,
  me,
  updateUserProfile,
  uploadResume,
  fetchApplicant,
  googleLogin,
};

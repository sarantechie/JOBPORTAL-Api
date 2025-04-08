const Application = require("../models/Application");
const Notification = require("../models/Notification");
const User = require("../models/User");

const applyJob = async (req, res) => {
  try {
    const { jobId } = req.body;
    const application = new Application({ jobId, jobSeekerId: req.user.id });

    await application.save();

    const notification = new Notification({
      userId: req.user.id,
      type: "application_update",
      message: "A job application has been submitted.",
    });

    await notification.save();

    res.status(201).json({ message: "Application submitted" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const applicationStatus = async (req, res) => {
  try {
    const { id: jobId } = req.params;
    const userId = req.user.id;

    const existingApplication = await Application.findOne({
      jobId,
      jobSeekerId: userId,
    });

    if (existingApplication) {
      return res.json({ applied: true });
    }

    res.json({ applied: false });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getJobApplications = async (req, res) => {
  try {
    const { jobId } = req.params;

    const applications = await Application.find({ jobId })
      .populate({
        path: "jobSeekerId",
        select: "name email experience education phone",
      })
      .select("-__v")
      .sort({ createdAt: -1 });
    res.status(200).json(applications);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateApplicationStatus = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { status } = req.body; 

    if (!["accepted", "rejected"].includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    const application = await Application.findById(applicationId);
    if (!application) {
      return res.status(404).json({ error: "Application not found" });
    }

    application.status = status;
    await application.save();

  
    const notification = new Notification({
      userId: application.jobSeekerId,
      type: "application_update",
      message: `Your job application has been ${status}.`,
    });

    await notification.save();

    res.status(200).json({ message: `Application ${status} successfully` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getJobsAppliedByUser = async (req, res) => {
  try {
    const userId = req.user.id;

    const applications = await Application.find({ jobSeekerId: userId })
      .populate({
        path: "jobId",
        select: "title companyName location description",
      })
      .sort({ createdAt: -1 });
    res.status(200).json(applications);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const withdrawApplication = async (req, res) => {
  try {
    const { applicationId } = req.params;

    const application = await Application.findById(applicationId);

    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    if (application.status !== "Pending") {
      return res
        .status(400)
        .json({ message: "Only pending applications can be withdrawn" });
    }

    application.status = "Withdrawn";
    application.updatedAt = new Date();
    await application.save();

    res.status(200).json({ message: "Application withdrawn successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


module.exports = {
  applyJob,
  applicationStatus,
  getJobApplications,
  updateApplicationStatus,
  getJobsAppliedByUser,
  withdrawApplication,
};

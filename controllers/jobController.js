const Job = require("../models/Job");

const createJob = async (req, res) => {
  try {
    if (req.user.role !== "employer") {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const job = new Job({ ...req.body, employerId: req.user.id });

    await job.save();

    res.status(201).json({ message: "Job posted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getJobs = async (req, res) => {
  try {
    const jobs = await Job.find();
    res.json(jobs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id).populate("employerId", [
      "email",
      "companyName",
      "companyWebsite",
      "logo",
    ]);
    res.json(job);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getMyPostedJob = async (req, res) => {
  try {
    if (req.user.role !== "employer") {
      return res.status(403).json({ message: "Access denied" });
    }
    const jobs = await Job.find({ employerId: req.user.id });

    res.json(jobs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { createJob, getJobs, getJob, getMyPostedJob };

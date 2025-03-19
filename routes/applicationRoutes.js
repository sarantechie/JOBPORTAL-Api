const express = require("express");
const { applyJob, applicationStatus, getJobApplications, updateApplicationStatus, getJobsAppliedByUser, withdrawApplication } = require("../controllers/applicationController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/", authMiddleware, applyJob);
router.get('/myJobs',authMiddleware,getJobsAppliedByUser);
router.get('/:id',authMiddleware,applicationStatus)
router.get("/:jobId/applications", authMiddleware, getJobApplications);
router.put("/:applicationId/status", authMiddleware, updateApplicationStatus);
router.put("/withdraw/:applicationId", authMiddleware, withdrawApplication);

module.exports = router;

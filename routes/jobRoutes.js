const express = require("express");
const { createJob, getJobs,getJob, getMyPostedJob } = require("../controllers/jobController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/",authMiddleware, createJob);
router.get("/", getJobs);
router.get("/getJob/:id", getJob);
router.get('/my-jobs',authMiddleware,getMyPostedJob)


module.exports = router;

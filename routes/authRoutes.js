const express = require("express");
const {
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
} = require("../controllers/authController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();
// const upload = require("../config/multer");
// const passport = require("../config/passport");

router.use(express.json());
router.post("/register", register);
router.post("/login", login);
router.get("/me", authMiddleware, me);
router.put("/", authMiddleware, updateUserProfile);
// router.post(
//   "/upload-resume",
//   authMiddleware,
//   upload.single("resume"),
//   uploadResume
// );
router.get("/:id", authMiddleware, fetchApplicant);

router.post(
  "/resume/upload",
  authMiddleware,
  upload.single("resume"), // 'resume' must match the field name in FormData
  uploadResume
);
router.get("/resume/:id", authMiddleware, getResume);
router.delete("/resume", authMiddleware, deleteResume);

router.post("/google-login", googleLogin);
module.exports = router;

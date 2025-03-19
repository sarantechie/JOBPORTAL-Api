const express = require("express");
const { register, login,me, updateUserProfile } = require("../controllers/authController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/me",authMiddleware, me);
router.put("/",authMiddleware,updateUserProfile);

module.exports = router;

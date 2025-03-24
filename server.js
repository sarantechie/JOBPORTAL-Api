const express = require("express");
const app = express();
const dotenv = require("dotenv");
const cors = require("cors");
const passport = require("passport");
const session = require("express-session");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const path = require("path");
dotenv.config();
const PORT = process.env.PORT || 5000;

const connectDB = require("./config/db");
require("./config/passport");

connectDB();

app.use(express.json({limit: '50mb'}));
app.use(cors({credentials:true}));
app.use(session({ secret:process.env.SECRET_KEY, resave: false, saveUninitialized: false }));
app.use(passport.initialize());
app.use(passport.session());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/jobs", require("./routes/jobRoutes"));
app.use("/api/applications", require("./routes/applicationRoutes"));
app.use("/api/notifications", require("./routes/notificationRoutes"));

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

const express = require("express");
const app = express();
const dotenv = require("dotenv");
const cors = require("cors");
const passport = require("passport");
dotenv.config();
const PORT = process.env.PORT || 5000;

const connectDB = require("./config/db");
require("./config/passport");

connectDB();

app.use(express.json());
app.use(cors({credentials:true}));

app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/jobs", require("./routes/jobRoutes"));
app.use("/api/applications", require("./routes/applicationRoutes"));
app.use("/api/notifications", require("./routes/notificationRoutes"));

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

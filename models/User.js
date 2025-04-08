const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: function () {
        return this.role === "jobseeker";
      },
    },
    email: { type: String, required: true, unique: true },
    password: { type: String },
    role: { type: String, enum: ["jobseeker", "employer"], required: true },
    phone: { type: String },
    address: { type: String },
    skills: { type: [String], default: [] },
    education: [
      {
        institution: String,
        degree: String,
        fieldOfStudy: String,
        startDate: Date,
        endDate: Date,
        currentlyStudying: Boolean,
      },
    ],
    experience: [
      {
        company: String,
        position: String,
        startDate: Date,
        endDate: String,
        description: String,
        currentlyWorking: Boolean,
      },
    ],
    resume: { type: String },
    profilePicture: { type: String },
    companyName: {
      type: String,
      required: function () {
        return this.role === "employer";
      },
    },
    companyWebsite: { type: String },
    industry: { type: String },
    logo: { type: String },
    socialLogin: { type: Boolean, default: false },
    provider: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", UserSchema);

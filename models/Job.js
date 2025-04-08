const mongoose = require("mongoose");

const JobSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    location: { type: String, required: true },
    minSalary: {
      type: Number,
      required: true,
      min: 0,
    },
    maxSalary: {
      type: Number,
      required: true,
      validate: {
        validator: function (value) {
          return value >= this.minSalary;
        },
        message: "Max Salary must be greater than or equal to Min Salary",
      },
    },
    skills: { type: [String], required: true },
    companyName: {
      type: String,
      required: true,
    },
    remote: {
      type: Boolean,
      default: false,
    },
    employmentType: {
      type: String,
      enum: ["Full-time", "Part-time", "Contract", "Internship"],
      required: true,
    },
    experienceLevel: {
      type: String,
      enum: ["Entry", "Mid", "Senior"],
      required: true,
    },
    minExperience: {
      type: Number,
      required: true,
      min: 0,
    },
    maxExperience: {
      type: Number,
      required: true,
      validate: {
        validator: function (value) {
          return value >= this.minExperience;
        },
        message: "Max Experience must be greater than or equal to Min Experience",
      },
    },
    education: {
      type: String,
      enum: ["High School", "Diploma", "Bachelor’s Degree", "Master’s Degree"],
      required: true,
    },
    benefits: {
      type: [String],
      default: [],
    },
    contactEmail: {
      type: String,
      required: true,
      match: [/^\S+@\S+\.\S+$/, "Please enter a valid email"],
    },
    applicationDeadline: {
      type: Date,
      required: true,
    },
    companyWebsite: {
      type: String,
      validate: {
        validator: function (v) {
          return !v || /^(https?:\/\/)?([\w.-]+)+\.[a-z]{2,}(\S*)?$/i.test(v);
        },
        message: "Please enter a valid URL",
      },
    },
    visible:{type:Boolean,default:true},
    postedAt: {
      type: Date,
      default: Date.now,
    },
    employerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Job", JobSchema);

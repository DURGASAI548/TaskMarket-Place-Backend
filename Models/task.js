const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema(
  {
    taskNo: {
      type: Number,
      required: true,
      unique: true,
    },

    taskTitle: {
      type: String,
      required: true,
      trim: true,
    },

    taskDescription: {
      type: String,
      trim: true,
    },

    taskSubmissionDeadline: {
      type: Date,
    },

    taskRegistrationDeadline: {
      type: Date,
    },

    taskRegistrationLiveFrom: {
      type: Date,
    },

    taskRewardType: {
      type: String,
      enum: ["cash", "certificate"],
    },

    taskRewardNo: {
      type: Number,
    },

    taskRewards: {
      type: String,
    },

    isLive: {
      type: Boolean,
      default: false,
    },

    taskDocument: {
      type: String, 
    },

    taskTags: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "tag", 
      },
    ],

    taskConstraints: [
      {
        type: String,
      },
    ],

    fileAcceptType: [
      {
        type: String, // e.g. "pdf", "docx", "pptx"
      },
    ],

    acceptGithubLink: {
      type: Boolean,
      default: false,
    },

    acceptLiveLink: {
      type: Boolean,
      default: false,
    },

    branchScope: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "branch",
    },

    orgScope: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "organization",
    },

    evaluators: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
      },
    ],

    taskResultDeadline: {
      type: Date,
    },

    isResultDeclared: {
      type: Boolean,
      default: false,
    },

    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
    },

    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
    },
  },
  {
    timestamps: true, 
  }
);

module.exports = mongoose.model("task", taskSchema);
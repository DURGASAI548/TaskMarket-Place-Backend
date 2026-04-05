// models/Submission.js
const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema(
  {
    TaskID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'task',
      required: true,
    },
    UserID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'user',
      required: true,
    },
    SubmittedFilePath: {
      type: String,
      default: null,
    },
    GithubLink: {
      type: String,
      default: null,
    },
    LiveLink: {
      type: String,
      default: null,
    },
    SubmissionNote: {
      type: String,
      default: null,
    },
    AddedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'user',
      required: true,
    },
    UpdatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'user',
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('submission', submissionSchema);
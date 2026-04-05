// models/Evaluation.js
const mongoose = require('mongoose');

const evaluationSchema = new mongoose.Schema(
  {
    TaskID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'task',
      required: true,
    },
    SubmissionID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'submission',
      required: true,
    },
    EvaluationData: [
      {
        EvaluationPointID: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'evaluationpoint',
        },
        Score: {
          type: Number,
        },
      },
    ],
    EvaluationNote: {
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
  { timestamps: true}
);

module.exports = mongoose.model('evaluation', evaluationSchema);
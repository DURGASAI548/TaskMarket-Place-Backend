
const mongoose = require('mongoose');

const evaluationMatrixSchema = new mongoose.Schema(
  {
    TaskID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'task',
      required: true,
    },
    EvaluationPointID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'evaluationpoint',
      required: true,
    },
    EvaluationScore: {
      type: Number,
      required: true,
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
  {
    timestamps: true, 
  }
);

module.exports = mongoose.model('evaluationMatrix', evaluationMatrixSchema);
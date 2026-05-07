const mongoose = require("mongoose");

const EvaluationMatrixSchema = require("../../Models/evalutionMatrix");
const EvaluationPointSchema = require("../../Models/evalutionPoint");
const TaskSchema = require("../../Models/task");
const UserSchema = require("../../Models/user");

const AddEvaluationMatrix = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const user = await UserSchema.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.userType === "user") {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to add evaluation matrix",
      });
    }

    const {
      TaskID,
      EvaluationPointID,
      EvaluationScore,
    } = req.body;

    if (!TaskID || !EvaluationPointID || EvaluationScore === undefined) {
      return res.status(400).json({
        success: false,
        message: "Required fields missing",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(TaskID)) {
      return res.status(400).json({
        success: false,
        message: "Invalid TaskID",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(EvaluationPointID)) {
      return res.status(400).json({
        success: false,
        message: "Invalid EvaluationPointID",
      });
    }

    const score = Number(EvaluationScore);

    if (isNaN(score) || score < 0) {
      return res.status(400).json({
        success: false,
        message: "EvaluationScore must be a valid positive number",
      });
    }

    const task = await TaskSchema.findById(TaskID);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    const point = await EvaluationPointSchema.findById(EvaluationPointID);

    if (!point) {
      return res.status(404).json({
        success: false,
        message: "Evaluation point not found",
      });
    }

    const existingMatrix = await EvaluationMatrixSchema.findOne({
      TaskID,
      EvaluationPointID,
    });

    if (existingMatrix) {
      return res.status(409).json({
        success: false,
        message: "Evaluation matrix already exists for this task and point",
      });
    }

    const newMatrix = await EvaluationMatrixSchema.create({
      TaskID,
      EvaluationPointID,
      EvaluationScore: score,
      AddedBy: userId,
    });

    return res.status(201).json({
      success: true,
      message: "Evaluation matrix added successfully",
      data: newMatrix,
    });

  } catch (error) {
    console.error("Error in AddEvaluationMatrix:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

exports.AddEvaluationMatrix = AddEvaluationMatrix;
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

const GetTaskNames = async (req, res) => {
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
        message: "You are not allowed to access tasks",
      });
    }

    let filter = {};

    if (user.userType === "orgAdmin") {
      filter.orgScope = user.org;
    }

    if (user.userType === "branchAdmin") {
      filter.orgScope = user.org;
      filter.branchScope = user.branch;
    }

    const tasks = await TaskSchema.find(filter)
      .select("_id taskTitle")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: tasks.length,
      data: tasks,
    });

  } catch (error) {
    console.error("Error in GetTaskNames:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

const GetEvaluationPoints = async (req, res) => {
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
        message: "You are not allowed to access evaluation points",
      });
    }

    const points = await EvaluationPointSchema.find()
      .select("_id EvaluationPoint")
      .sort({ EvaluationPoint: 1 });

    return res.status(200).json({
      success: true,
      count: points.length,
      data: points,
    });

  } catch (error) {
    console.error("Error in GetEvaluationPoints:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

const GetEvaluationMatrix = async (req, res) => {
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
        message: "You are not allowed to access evaluation matrix",
      });
    }

    let taskMatch = {};

    if (user.userType === "orgAdmin") {
      taskMatch.orgScope = new mongoose.Types.ObjectId(user.org);
    }

    if (user.userType === "branchAdmin") {
      taskMatch.orgScope = new mongoose.Types.ObjectId(user.org);
      taskMatch.branchScope = new mongoose.Types.ObjectId(user.branch);
    }

    const matrix = await EvaluationMatrixSchema.aggregate([
      {
        $lookup: {
          from: "tasks",
          localField: "TaskID",
          foreignField: "_id",
          as: "task",
        },
      },

      {
        $unwind: "$task",
      },

      {
        $match: taskMatch,
      },

      {
        $lookup: {
          from: "organizations",
          localField: "task.orgScope",
          foreignField: "_id",
          as: "organization",
        },
      },

      {
        $unwind: {
          path: "$organization",
          preserveNullAndEmptyArrays: true,
        },
      },

      {
        $lookup: {
          from: "branches",
          localField: "task.branchScope",
          foreignField: "_id",
          as: "branch",
        },
      },

      {
        $unwind: {
          path: "$branch",
          preserveNullAndEmptyArrays: true,
        },
      },

      {
        $lookup: {
          from: "evaluationpoints",
          localField: "EvaluationPointID",
          foreignField: "_id",
          as: "point",
        },
      },

      {
        $unwind: "$point",
      },

      {
        $group: {
          _id: "$task._id",

          taskTitle: {
            $first: "$task.taskTitle",
          },

          orgScope: {
            $first: "$organization.orgName",
          },

          branchScope: {
            $first: "$branch.branchName",
          },

          evaluationMatrix: {
            $push: {
              EvaluationPoint: "$point.EvaluationPoint",
              EvaluationScore: "$EvaluationScore",
            },
          },
        },
      },

      {
        $sort: {
          taskTitle: 1,
        },
      },
    ]);

    return res.status(200).json({
      success: true,
      count: matrix.length,
      data: matrix,
    });

  } catch (error) {
    console.error("Error in GetEvaluationMatrix:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};


exports.AddEvaluationMatrix = AddEvaluationMatrix;
exports.GetTaskNames = GetTaskNames;
exports.GetEvaluationPoints = GetEvaluationPoints;
exports.GetEvaluationMatrix = GetEvaluationMatrix;
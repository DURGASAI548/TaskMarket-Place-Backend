const mongoose = require('mongoose')
const EvalutionPointSchema = require("../../Models/evalutionPoint")
const UserSchema = require("../../Models/user")

const AddEvaluationPoint = async (req, res) => {
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
        message: "You are not allowed to add evaluation points",
      });
    }

    const { EvaluationPoint } = req.body;

    if (!EvaluationPoint || !EvaluationPoint.trim()) {
      return res.status(400).json({
        success: false,
        message: "EvaluationPoint is required",
      });
    }

    const cleanedPoint = EvaluationPoint.trim();

    const existingPoint = await EvalutionPointSchema.findOne({
      EvaluationPoint: {
        $regex: `^${cleanedPoint}$`,
        $options: "i",
      },
    });

    if (existingPoint) {
      return res.status(409).json({
        success: false,
        message: "Evaluation point already exists",
      });
    }

    const newPoint = await EvalutionPointSchema.create({
      EvaluationPoint: cleanedPoint,
      AddedBy: userId,
    });

    return res.status(201).json({
      success: true,
      message: "Evaluation point added successfully",
      data: newPoint,
    });

  } catch (error) {
    console.error("Error in AddEvaluationPoint:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

const GetAllEvaluationPoints = async (req, res) => {
  try {
     const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const user = await UserSchema.findById(userId);
    if (user.userType === "user") {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to get evaluation points",
      });
    }
    const points = await EvalutionPointSchema.find()
      .populate({
        path: "AddedBy",
        select: "name email",
      })
      .populate({
        path: "UpdatedBy",
        select: "name email",
      })
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: points.length,
      data: points,
    });

  } catch (error) {
    console.error("Error in GetAllEvaluationPoints:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

const UpdateEvaluationPoint = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;
    const { EvaluationPoint } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Evaluation Point ID",
      });
    }

    if (!EvaluationPoint || !EvaluationPoint.trim()) {
      return res.status(400).json({
        success: false,
        message: "EvaluationPoint is required",
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
        message: "You are not allowed to update evaluation points",
      });
    }

    const point = await EvalutionPointSchema.findById(id);

    if (!point) {
      return res.status(404).json({
        success: false,
        message: "Evaluation point not found",
      });
    }

    const cleanedPoint = EvaluationPoint.trim();

    const existingPoint = await EvalutionPointSchema.findOne({
      _id: { $ne: id },
      EvaluationPoint: {
        $regex: `^${cleanedPoint}$`,
        $options: "i",
      },
    });

    if (existingPoint) {
      return res.status(409).json({
        success: false,
        message: "Evaluation point already exists",
      });
    }

    point.EvaluationPoint = cleanedPoint;
    point.UpdatedBy = userId;

    await point.save();

    return res.status(200).json({
      success: true,
      message: "Evaluation point updated successfully",
      data: point,
    });

  } catch (error) {
    console.error("Error in UpdateEvaluationPoint:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

const DeleteEvaluationPoint = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Evaluation Point ID",
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
        message: "You are not allowed to delete evaluation points",
      });
    }

    const point = await EvalutionPointSchema.findById(id);

    if (!point) {
      return res.status(404).json({
        success: false,
        message: "Evaluation point not found",
      });
    }

    await EvalutionPointSchema.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "Evaluation point deleted successfully",
    });

  } catch (error) {
    console.error("Error in DeleteEvaluationPoint:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

exports.AddEvaluationPoint = AddEvaluationPoint
exports.GetAllEvaluationPoints = GetAllEvaluationPoints
exports.UpdateEvaluationPoint = UpdateEvaluationPoint
exports.DeleteEvaluationPoint = DeleteEvaluationPoint
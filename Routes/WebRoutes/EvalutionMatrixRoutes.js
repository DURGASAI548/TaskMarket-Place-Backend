const express = require("express");
const router = express.Router();
const EvalutionMatrixController = require("../../Controllers/WebControllers//EvalutionMatrixController")
const VerifyToken = require('../../ExternalSources/JwtController');

router.post('/add-evaluation-matrix', VerifyToken, EvalutionMatrixController.AddEvaluationMatrix)
router.get('/get-tasks-for-evalution-matrix', VerifyToken, EvalutionMatrixController.GetTaskNames)
router.get('/get-evalution-points-for-evalution-matrix', VerifyToken, EvalutionMatrixController.GetEvaluationPoints)
router.get('/get-evalution-matrix', VerifyToken, EvalutionMatrixController.GetEvaluationMatrix)


module.exports = router;
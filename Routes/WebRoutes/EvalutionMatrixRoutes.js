const express = require("express");
const router = express.Router();
const EvalutionMatrixController = require("../../Controllers/WebControllers//EvalutionMatrixController")
const VerifyToken = require('../../ExternalSources/JwtController');

router.post('/add-evaluation-matrix', VerifyToken, EvalutionMatrixController.AddEvaluationMatrix)


module.exports = router;
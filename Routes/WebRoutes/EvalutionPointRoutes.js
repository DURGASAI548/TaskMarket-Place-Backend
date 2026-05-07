const express = require("express");
const router = express.Router();
const EvalutionPointController = require("../../Controllers/WebControllers/EvalutionPointController")
const VerifyToken = require('../../ExternalSources/JwtController');


router.post('/add-evalution-point',VerifyToken, EvalutionPointController.AddEvaluationPoint);
router.get('/get-evalution-points',VerifyToken, EvalutionPointController.GetAllEvaluationPoints);
router.post('/edit-evalution-point/:id',VerifyToken, EvalutionPointController.UpdateEvaluationPoint);
router.delete('/delete-evalution-point/:id',VerifyToken, EvalutionPointController.DeleteEvaluationPoint);

module.exports = router;
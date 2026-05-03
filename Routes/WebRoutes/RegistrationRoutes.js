const express = require("express");
const router = express.Router();
const RegistrationController = require("../../Controllers/WebControllers/RegistrationController")
const VerifyToken = require('../../ExternalSources/JwtController');

router.get("/register-for-task/:taskId",VerifyToken,RegistrationController.RegisterForTask)


module.exports = router
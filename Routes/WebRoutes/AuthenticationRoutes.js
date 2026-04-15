const express = require("express");
const router = express.Router();
const AuthenticationController = require("../../Controllers/WebControllers/AuthenticationController")
const VerifyToken = require('../../ExternalSources/JwtController');


router.post('/login', AuthenticationController.Login);
router.get('/logout',VerifyToken,AuthenticationController.Logout);

module.exports = router;
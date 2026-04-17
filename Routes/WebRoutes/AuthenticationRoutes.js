const express = require("express");
const router = express.Router();
const AuthenticationController = require("../../Controllers/WebControllers/AuthenticationController")
const VerifyToken = require('../../ExternalSources/JwtController');


router.post('/login', AuthenticationController.Login);
router.get('/logout',VerifyToken,AuthenticationController.Logout);
router.get('/verify-token',AuthenticationController.VerifyTokenEachPage);
router.post('/check-user-otp',AuthenticationController.CheckUserAndSendOTP);
router.post('/verify-otp',AuthenticationController.VerifyUserOTP);
router.post('/set-password',AuthenticationController.SetUserPassword);

module.exports = router;
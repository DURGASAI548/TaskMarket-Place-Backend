const express = require("express");
const router = express.Router();
const AuthenticationController = require("../../Controllers/WebControllers/AuthenticationController")
// const VerifyToken = require('../../ExternalSource/Jwtcontroller');


router.get('/login', AuthenticationController.Login)

module.exports = router;
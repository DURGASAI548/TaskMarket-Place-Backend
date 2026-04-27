const express = require("express");
const router = express.Router();
const TagController = require("../../Controllers/WebControllers/TagController")
const VerifyToken = require('../../ExternalSources/JwtController');

router.post('/add-tag', VerifyToken, TagController.CreateTag)

module.exports = router;
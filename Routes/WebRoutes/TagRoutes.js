const express = require("express");
const router = express.Router();
const TagController = require("../../Controllers/WebControllers/TagController")
const VerifyToken = require('../../ExternalSources/JwtController');

router.post('/add-tag', VerifyToken, TagController.CreateTag)
router.get('/get-all-tags', VerifyToken, TagController.GetAllTags)

module.exports = router;
const express = require("express");
const router = express.Router();
const OrganizationController = require("../../Controllers/WebControllers/OrganizationController")
const VerifyToken = require('../../ExternalSources/JwtController');

router.post('/add-organization', VerifyToken, OrganizationController.AddOrganization)
router.get('/get-organizations', VerifyToken, OrganizationController.GetOrganizations)
router.put('/edit-organizations/:orgId', VerifyToken, OrganizationController.UpdateOrganization)
router.get('/get-organization-id/:orgId', VerifyToken, OrganizationController.GetOrganizationById)

module.exports = router;
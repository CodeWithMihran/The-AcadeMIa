const express = require("express");
const router = express.Router();
const tenantController = require("../../controllers/api/tenantApiController");
const authApi = require("../../middlewares/authApi");

// Public endpoints
router.get("/", tenantController.getTenants);
router.post("/resolve-domain", tenantController.resolveDomain);
router.get("/:id", tenantController.getTenantById);

// Protected onboarding
router.post("/onboarding", authApi, tenantController.completeOnboarding);

module.exports = router;

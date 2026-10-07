const express = require("express");
const router = express.Router();
const subjectController = require("../../controllers/api/subjectApiController");
const authApi = require("../../middlewares/authApi");
const subjectVaultRateLimit = require("../../middlewares/subjectVaultRateLimit");

router.get("/", authApi, subjectVaultRateLimit, subjectController.getSubjects);
router.get("/branches", authApi, subjectVaultRateLimit, subjectController.getAvailableBranches);
router.post("/:id/link-reports", authApi, subjectVaultRateLimit, subjectController.reportBrokenLink);
router.get("/:id", authApi, subjectVaultRateLimit, subjectController.getSubjectById);

module.exports = router;

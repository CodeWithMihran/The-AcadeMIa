const express = require("express");
const router = express.Router();
const progressController = require("../../controllers/api/progressApiController");
const authApi = require("../../middlewares/authApi");

router.post("/toggle", authApi, progressController.toggleTopic);
router.get("/overview", authApi, progressController.getGlobalProgress);
router.get("/subject/:subjectId", authApi, progressController.getSubjectProgress);
router.get("/:subjectId", authApi, progressController.getSubjectProgress);

module.exports = router;

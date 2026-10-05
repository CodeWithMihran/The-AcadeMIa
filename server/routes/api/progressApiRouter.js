const express = require("express");
const router = express.Router();
const progressController = require("../../controllers/api/progressApiController");
const authApi = require("../../middlewares/authApi");

router.post("/toggle", authApi, progressController.toggleTopic);
router.get("/overview", authApi, progressController.getGlobalProgress);
router.get("/leaderboard", authApi, progressController.getLeaderboard);
router.get("/activity", authApi, progressController.getActivityHeatmap);
router.get("/career/:subjectId", authApi, progressController.getCareerProgress);
router.put("/career-resource", authApi, progressController.setCareerResourceCompletion);
router.get("/subject/:subjectId", authApi, progressController.getSubjectProgress);
router.get("/:subjectId", authApi, progressController.getSubjectProgress);

module.exports = router;

const express = require("express");
const router = express.Router();
const subjectController = require("../../controllers/api/subjectApiController");
const authApi = require("../../middlewares/authApi");

router.get("/", authApi, subjectController.getSubjects);
router.get("/:id", authApi, subjectController.getSubjectById);

module.exports = router;

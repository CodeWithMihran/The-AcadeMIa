const express = require("express");
const router = express.Router();

const progressController = require("../controllers/progressController");

const isLoggedIn = require("../middlewares/isLoggedIn");


// ==========================
// Show Progress Tracker
// ==========================

router.get("/:subjectId", isLoggedIn, progressController.showProgress);


// ==========================
// Toggle Topic Completion
// ==========================

router.post("/toggle", isLoggedIn, progressController.toggleTopic);


module.exports = router;
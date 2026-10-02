const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const isLoggedIn = require("../middlewares/isLoggedIn");
const validateProfileUpdate = require("../middlewares/validateProfileUpdate");

// Dashboard (after login)
router.get("/dashboard", isLoggedIn, userController.showDashboard);

// View profile
router.get("/profile", isLoggedIn, userController.viewProfile);

// Update profile
router.post("/profile/update", isLoggedIn, validateProfileUpdate, userController.updateProfile);

module.exports = router;
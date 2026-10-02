const express = require("express");
const router = express.Router();
const passport = require("passport"); // Added
const authController = require("../controllers/authController");
const validateUserInput = require("../middlewares/validateUserInput"); 
const { generateToken } = require("../utils/generateToken"); // Added

// --- Manual Auth Routes ---

// Registration
router.post("/register", validateUserInput, authController.registerUser);

// Login
router.post("/login", (req, res, next) => {
    const { email, password } = req.body;
    if (!email || !password) {
        req.flash("error", "All fields are required");
        return res.redirect("/#auth");
    }
    next();
}, authController.loginUser);

// Logout
router.get("/logout", authController.logoutUser);

// --- Google OAuth Routes (NEW) ---

// 1. Trigger Google Login
router.get('/google', passport.authenticate('google', { 
    scope: ['profile', 'email'] 
}));

// 2. Google Callback
router.get('/google/callback', 
    passport.authenticate('google', { 
        failureRedirect: '/#auth', 
        failureFlash: true 
    }),
    (req, res) => {
        // req.user is populated by passport after successful login
        const token = generateToken(req.user);
        res.cookie("token", token);
        
        // Redirect based on role
        if (req.user.role === "admin") {
            res.redirect("/admin");
        } else {
            res.redirect("/dashboard");
        }
    }
);

module.exports = router;
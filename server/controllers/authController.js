const userModel = require("../models/user-model");
const bcrypt = require("bcrypt");
const { generateToken } = require("../utils/generateToken");

// Register
module.exports.registerUser = async (req, res) => {
    try {
        const { name, branch, year, semester, email, password, confirmPassword } = req.body;

        // --- DOMAIN RESTRICTION LOGIC ---
        const allowedDomain = "ritroorkee.com";
        const emailDomain = email.split('@')[1];

        if (emailDomain !== allowedDomain) {
            req.flash("error", "Access Restricted: Please use your @ritroorkee.com institutional email.");
            return req.session.save(() => res.redirect("/#auth"));
        }

        // 1. Password Match Validation
        if (password !== confirmPassword) {
            req.flash("error", "Passwords do not match");
            return req.session.save(() => res.redirect("/#auth"));
        }

        // 2. Existing User Validation
        let existingUser = await userModel.findOne({ email });
        if (existingUser) {
            req.flash("error", "You already have an account, please login.");
            return req.session.save(() => res.redirect("/#auth"));
        }

        // 3. Hash Password
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(password, salt);

        // 4. Create User
        const user = await userModel.create({
            name,
            branch,
            year,
            semester,
            email,
            password: hash
        });

        // 5. Generate Token & Success Message
        const token = generateToken(user);
        res.cookie("token", token);
        
        req.flash("success", "Registration successful! Welcome to AcadeMIA.");
        return req.session.save(() => res.redirect("/dashboard"));

    } catch (err) {
        req.flash("error", err.message);
        return req.session.save(() => res.redirect("/#auth"));
    }
};

// Login
module.exports.loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await userModel.findOne({ email });

        // 1. User Existence Check
        if (!user) {
            req.flash("error", "No account found with this email.");
            return req.session.save(() => res.redirect("/#auth"));
        }

        // 2. Password Validation (Only if user has a password - handles Google users trying to log in manually)
        if (!user.password) {
            req.flash("error", "This account was created with Google. Please use 'Continue with Google'.");
            return req.session.save(() => res.redirect("/#auth"));
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            req.flash("error", "Invalid email or password.");
            return req.session.save(() => res.redirect("/#auth"));
        }

        // 3. Success Logic
        let token = generateToken(user);
        res.cookie("token", token);

        if (user.role === "admin") {
            return res.redirect("/admin");
        } else {
            return res.redirect("/dashboard");
        }

    } catch (err) {
        req.flash("error", "Internal Server Error. Please try again.");
        return req.session.save(() => res.redirect("/#auth"));
    }
};

// Logout
module.exports.logoutUser = (req, res) => {
    res.clearCookie("token");
    req.flash("success", "Logged out successfully.");
    req.session.save(() => res.redirect("/"));
};
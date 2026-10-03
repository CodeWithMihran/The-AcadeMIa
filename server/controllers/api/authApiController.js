const bcrypt = require("bcrypt");
const mongoose = require("mongoose");
const userModel = require("../../models/user-model");
const tenantModel = require("../../models/tenant-model");
const { generateToken } = require("../../utils/generateToken");

// Helper to configure cookie
const sendTokenResponse = (user, statusCode, res, message) => {
    const token = generateToken(user);

    const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    };

    res.status(statusCode)
        .cookie("token", token, cookieOptions)
        .json({
            success: true,
            message,
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                track: user.track,
                tenant: user.tenant,
                college: user.college,
                branch: user.branch,
                year: user.year,
                semester: user.semester,
                targetExam: user.targetExam,
                onboardingCompleted: user.onboardingCompleted
            }
        });
};

// 1. Register User with Dynamic Domain Inspection
module.exports.register = async (req, res) => {
    try {
        const { name, email, password, confirmPassword } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: "Name, email, and password are required."
            });
        }

        if (password !== confirmPassword) {
            return res.status(400).json({
                success: false,
                message: "Passwords do not match."
            });
        }

        const normalizedEmail = email.toLowerCase().trim();
        const existingUser = await userModel.findOne({ email: normalizedEmail });
        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: "An account with this email already exists. Please log in."
            });
        }

        // Domain-based tenant discovery
        const emailDomain = normalizedEmail.split("@")[1];
        let matchedTenant = null;
        let matchedCollegeName = "Not Set";

        if (emailDomain) {
            // Find tenant by global domain or affiliated college domain
            matchedTenant = await tenantModel.findOne({
                $or: [
                    { domains: emailDomain },
                    { "affiliatedColleges.domain": emailDomain }
                ],
                active: true
            });

            if (matchedTenant) {
                // If matched via an affiliated college, pick that college name
                const college = matchedTenant.affiliatedColleges.find(c => c.domain === emailDomain);
                if (college) {
                    matchedCollegeName = college.name;
                }
            }
        }

        // Hash Password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create User
        const newUser = await userModel.create({
            name,
            email: normalizedEmail,
            password: hashedPassword,
            tenant: matchedTenant ? matchedTenant._id : null,
            college: matchedCollegeName,
            onboardingCompleted: false
        });

        const populatedUser = await userModel.findById(newUser._id).populate("tenant", "name shortCode type state");

        return sendTokenResponse(populatedUser, 201, res, "Registration successful!");

    } catch (err) {
        console.error("Register Error:", err);
        return res.status(500).json({
            success: false,
            message: "Internal server error during registration: " + err.message
        });
    }
};

// 2. Login User
module.exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required."
            });
        }

        const normalizedEmail = email.toLowerCase().trim();
        const user = await userModel
            .findOne({ email: normalizedEmail })
            .populate("tenant", "name shortCode type state");

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password."
            });
        }

        if (!user.password) {
            return res.status(400).json({
                success: false,
                message: "This account was registered via Google. Please use 'Continue with Google'."
            });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password."
            });
        }

        return sendTokenResponse(user, 200, res, "Logged in successfully!");

    } catch (err) {
        console.error("Login Error:", err);
        return res.status(500).json({
            success: false,
            message: "Internal server error during login: " + err.message
        });
    }
};

// 3. Get Current User Profile
module.exports.getMe = async (req, res) => {
    try {
        return res.status(200).json({
            success: true,
            user: req.user
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: "Failed to fetch user: " + err.message
        });
    }
};

// Update only fields that users are allowed to edit from their profile.
module.exports.updateProfile = async (req, res) => {
    try {
        const { name, track, tenantId, college, branch, year, semester, targetExam, targetYear } = req.body;
        const updates = {};

        if (name !== undefined) {
            if (typeof name !== "string" || name.trim().length < 2) {
                return res.status(400).json({ success: false, message: "Name must be at least 2 characters." });
            }
            updates.name = name.trim();
        }

        const requestedTrack = track || req.user.track;
        if (!(["UNIVERSITY", "JEE", "NEET"].includes(requestedTrack))) {
            return res.status(400).json({ success: false, message: "Select a valid learning track." });
        }

        if (requestedTrack === "UNIVERSITY") {
            if (!tenantId || !mongoose.isValidObjectId(tenantId)) {
                return res.status(400).json({ success: false, message: "Select a valid university." });
            }
            const tenant = await tenantModel.findOne({ _id: tenantId, type: "UNIVERSITY", active: true }).select("_id");
            if (!tenant) {
                return res.status(400).json({ success: false, message: "The selected university is unavailable." });
            }
            if (typeof college !== "string" || !college.trim() || college.trim() === "Other") {
                return res.status(400).json({ success: false, message: "Enter or select your college or campus." });
            }
            updates.track = "UNIVERSITY";
            updates.tenant = tenant._id;
            updates.college = college.trim();
            if (branch !== undefined) {
                if (typeof branch !== "string" || !branch.trim()) {
                    return res.status(400).json({ success: false, message: "Branch is required." });
                }
                updates.branch = branch.trim().toUpperCase();
            }
            if (year !== undefined) {
                const value = Number(year);
                if (!Number.isInteger(value) || value < 1 || value > 4) {
                    return res.status(400).json({ success: false, message: "Year must be between 1 and 4." });
                }
                updates.year = value;
            }
            if (semester !== undefined) {
                const value = Number(semester);
                if (!Number.isInteger(value) || value < 1 || value > 8) {
                    return res.status(400).json({ success: false, message: "Semester must be between 1 and 8." });
                }
                updates.semester = value;
            }
            const effectiveYear = updates.year ?? req.user.year;
            const effectiveSemester = updates.semester ?? req.user.semester;
            if (effectiveYear && effectiveSemester && ![effectiveYear * 2 - 1, effectiveYear * 2].includes(effectiveSemester)) {
                return res.status(400).json({ success: false, message: "Semester must belong to the selected year." });
            }
        } else {
            const effectiveExam = targetExam || (requestedTrack === "NEET" ? "NEET" : req.user.targetExam);
            if (!["JEE_MAINS", "JEE_ADVANCED", "NEET"].includes(effectiveExam)) {
                return res.status(400).json({ success: false, message: "Select a valid target exam." });
            }
            if ((requestedTrack === "NEET") !== (effectiveExam === "NEET")) {
                return res.status(400).json({ success: false, message: "The selected track must match the target exam." });
            }
            const value = Number(targetYear ?? req.user.targetYear);
            if (!Number.isInteger(value) || value < 2020 || value > 2100) {
                return res.status(400).json({ success: false, message: "Select a valid target year." });
            }
            const competitiveTenant = await tenantModel.findOne({ shortCode: "COMPETITIVE", active: true }).select("_id");
            updates.track = requestedTrack;
            updates.targetExam = effectiveExam;
            updates.targetYear = value;
            updates.tenant = competitiveTenant?._id || null;
            updates.college = "Not Set";
        }
        updates.onboardingCompleted = true;

        const user = await userModel.findByIdAndUpdate(req.user._id, updates, {
            returnDocument: "after",
            runValidators: true
        }).populate("tenant", "name shortCode type state").select("-password");

        return res.status(200).json({ success: true, message: "Profile updated successfully.", user });
    } catch (err) {
        console.error("Update Profile Error:", err);
        return res.status(500).json({ success: false, message: "Failed to update profile." });
    }
};

// 4. Logout User
module.exports.logout = (req, res) => {
    res.clearCookie("token", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax"
    });

    if (req.session) {
        req.session.destroy();
    }

    return res.status(200).json({
        success: true,
        message: "Logged out successfully."
    });
};

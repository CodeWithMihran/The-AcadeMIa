const bcrypt = require("bcrypt");
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

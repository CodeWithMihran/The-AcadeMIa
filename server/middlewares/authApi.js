const jwt = require("jsonwebtoken");
const userModel = require("../models/user-model");

module.exports = async function (req, res, next) {
    let token = null;

    // 1. Extract from Authorization header (Bearer ...)
    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
        token = req.headers.authorization.split(" ")[1];
    } 
    // 2. Or extract from cookies
    else if (req.cookies && req.cookies.token) {
        token = req.cookies.token;
    }

    if (!token) {
        return res.status(401).json({
            success: false,
            message: "Authentication token required. Please sign in."
        });
    }

    let decoded;
    try {
        decoded = jwt.verify(token, process.env.JWT_KEY);
    } catch {
        res.clearCookie("token", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "none" : "lax"
        });
        return res.status(401).json({
            success: false,
            message: "Session expired or invalid token. Please log in again."
        });
    }

    try {
        const user = await userModel
            .findById(decoded.id)
            .populate("tenant", "name shortCode type state")
            .select("-password");

        if (!user) {
            res.clearCookie("token", {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: process.env.NODE_ENV === "production" ? "none" : "lax"
            });
            return res.status(401).json({
                success: false,
                message: "Account not found. Please register."
            });
        }

        req.user = user;
        return next();
    } catch (err) {
        // A database or application failure does not make a valid token invalid.
        return next(err);
    }
};

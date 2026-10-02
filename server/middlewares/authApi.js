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

    try {
        const decoded = jwt.verify(token, process.env.JWT_KEY);
        const user = await userModel
            .findById(decoded.id)
            .populate("tenant", "name shortCode type state")
            .select("-password");

        if (!user) {
            res.clearCookie("token");
            return res.status(401).json({
                success: false,
                message: "Account not found. Please register."
            });
        }

        req.user = user;
        next();
    } catch (err) {
        res.clearCookie("token");
        return res.status(401).json({
            success: false,
            message: "Session expired or invalid token. Please log in again."
        });
    }
};

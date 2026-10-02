const jwt = require('jsonwebtoken');
const userModel = require('../models/user-model');

module.exports = async function (req, res, next) {
    // 1. Check if the JWT token exists in cookies
    if (!req.cookies || !req.cookies.token) {
        req.flash("error", "Your session has expired. Please login to continue.");
        return res.redirect("/");
    }

    try {
        // 2. Verify the token using your Secret Key
        const decoded = jwt.verify(req.cookies.token, process.env.JWT_KEY);

        // 3. Find the user in the database
        // This works for both Manual and Google users because both are stored in userModel
        const user = await userModel
            .findById(decoded.id)
            .select("-password"); // Security: Do not carry the password hash in the request object

        if (!user) {
            res.clearCookie("token");
            req.flash("error", "Account not found. Please register.");
            return res.redirect("/");
        }

        // 4. Attach the user to the request object
        // This allows all subsequent routes (like /dashboard) to access 'req.user'
        req.user = user;
        
        next();

    } catch (err) {
        // Handle cases where the token is tampered with or expired
        res.clearCookie("token");
        req.flash("error", "Authentication failed. Please login again.");
        return res.redirect("/");
    }
};
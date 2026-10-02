module.exports = function (req, res, next) {

    const { name, branch, year, semester } = req.body;

    const redirectUrl = req.get("Referer") || "/";

    // Only validate required fields for profile
    if (!name || !branch || !year || !semester) {
        req.flash("error", "All fields are required");
        return res.redirect(redirectUrl);
    }

    next();
};
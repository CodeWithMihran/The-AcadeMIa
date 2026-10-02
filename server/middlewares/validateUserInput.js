module.exports = function (req, res, next) {
    const { name, branch, year, semester, email, password, confirmPassword } = req.body;

    const redirectUrl = req.get("Referer") || "/";

    if (!name || !branch || !year || !semester || !email || !password || !confirmPassword) {
        req.flash("error", "All fields are required");
        return res.redirect(redirectUrl);
    }

    if (password !== confirmPassword) {
        req.flash("error", "Passwords do not match");
        return res.redirect(redirectUrl);
    }

    const emailRegex = /\S+@\S+\.\S+/;
    if (!emailRegex.test(email)) {
        req.flash("error", "Invalid email address");
        return res.redirect(redirectUrl);
    }

    next();
};
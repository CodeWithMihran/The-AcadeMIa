module.exports = function (allowedRoles) {

    return function (req, res, next) {

        // Safety check
        if (!req.user || !req.user.role) {
            req.flash("error", "Access Denied");
            return res.redirect("/");
        }

        // Check if user's role is allowed
        if (!allowedRoles.includes(req.user.role)) {
            req.flash("error", "You are not authorized to access this page");
            return res.redirect("/");
        }

        next();
    };
};
module.exports = function (allowedRoles) {
    return function (req, res, next) {
        if (!req.user || !req.user.role) {
            return res.status(403).json({
                success: false,
                message: "Access Denied. Authentication required."
            });
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: "Unauthorized: Administrative role required."
            });
        }

        next();
    };
};

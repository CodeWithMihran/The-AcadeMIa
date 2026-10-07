const userModel = require("../models/user-model");
const subjectModel = require("../models/subject-model");
const { normalizeBranch, branchQueryValues } = require("../utils/branch");

// show Dashboard
module.exports.showDashboard = async (req, res) => {
    try {
        const subjects = await subjectModel.find({
            branch: { $in: branchQueryValues(req.user.branch) },
            semester: req.user.semester
        });

        res.render("dashboard", {
            user: req.user,
            subjects
        });

    } catch (err) {
        console.log(err);
        res.redirect("/");
    }
};

// View profile
module.exports.viewProfile = async (req, res) => {
    try {
        const user = await userModel.findById(req.user._id).select("-password");
        res.render("profile", { user });
    } catch (err) {
        res.send(err.message);
    }
};

// Update profile
module.exports.updateProfile = async (req, res) => {
    try {
        const { name, branch, year, semester } = req.body;
        await userModel.findByIdAndUpdate(req.user._id, { name, branch: normalizeBranch(branch), year, semester });
        req.flash("success", "Profile updated successfully");
        res.redirect("/dashboard");
    } catch (err) {
        res.send(err.message);
    }
};

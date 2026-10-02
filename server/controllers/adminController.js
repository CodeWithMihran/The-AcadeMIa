const userModel = require("../models/user-model");
const subjectModel = require("../models/subject-model");

// Show admin dashboard
module.exports.showAdminDashboard = async (req, res) => {
    try {
        const users = await userModel.find().select("-password");
        const subjects = await subjectModel.find();
        res.render("admin-dashboard", { users, subjects });
    } catch (err) {
        res.send(err.message);
    }
};

// View all users
module.exports.viewUsers = async (req, res) => {
    try {
        const users = await userModel.find().select("-password");
        res.render("users", { users });
    } catch (err) {
        res.send(err.message);
    }
};

// Delete user
module.exports.deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Safety: Don't let an admin delete themselves by accident
        if (id === req.user._id.toString()) {
            req.flash("error", "Security Alert: You cannot delete your own account.");
            return res.redirect("/admin/users");
        }

        await userModel.findByIdAndDelete(id);
        
        req.flash("success", "User record purged successfully.");
        // Ensure this redirect matches the route that shows users
        res.redirect("/admin/users"); 
    } catch (err) {
        req.flash("error", "Database Error: " + err.message);
        res.redirect("/admin/users");
    }
};

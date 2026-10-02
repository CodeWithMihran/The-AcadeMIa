const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const isLoggedIn = require("../middlewares/isLoggedIn");
const checkRole = require("../middlewares/checkRole");

// Admin dashboard
router.get("/", isLoggedIn, checkRole(["admin"]), adminController.showAdminDashboard);

// View users
router.get("/users", isLoggedIn, checkRole(["admin"]), adminController.viewUsers);

// Delete user
router.get("/delete-user/:id", isLoggedIn, checkRole(["admin"]), adminController.deleteUser);

// Admin manage subjects (optional)
// router.get("/subjects", isLoggedIn, checkRole(["admin"]), (req, res) => {
//     res.render("edit-subject"); // redirect to subjectsRouter admin pages
// });

module.exports = router;
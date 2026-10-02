const express = require("express");
const router = express.Router();
const adminController = require("../../controllers/api/adminApiController");
const authApi = require("../../middlewares/authApi");
const checkRoleApi = require("../../middlewares/checkRoleApi");

// All admin routes require authentication and admin role
router.use(authApi, checkRoleApi(["admin"]));

// Overview & Analytics
router.get("/overview", adminController.getAdminOverview);

// Subject Management
router.get("/subjects", adminController.getAdminSubjects);
router.post("/subjects", adminController.createSubject);
router.put("/subjects/:id", adminController.updateSubject);
router.delete("/subjects/:id", adminController.deleteSubject);

// User Management
router.get("/users", adminController.getAdminUsers);
router.delete("/users/:id", adminController.deleteUser);

module.exports = router;

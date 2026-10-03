const express = require("express");
const router = express.Router();
const authController = require("../../controllers/api/authApiController");
const authApi = require("../../middlewares/authApi");

router.post("/register", authController.register);
router.post("/login", authController.login);
router.get("/me", authApi, authController.getMe);
router.put("/profile", authApi, authController.updateProfile);
router.post("/logout", authApi, authController.logout);

module.exports = router;

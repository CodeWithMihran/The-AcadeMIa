const express = require("express");
const router = express.Router();
const authController = require("../../controllers/api/authApiController");
const authApi = require("../../middlewares/authApi");
const authActionLimit = require("../../middlewares/authActionLimit");

const ipIdentity = (req) => req.ip || req.socket?.remoteAddress || "unknown";
const loginIdentity = (req) => {
    const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase().slice(0, 254) : "invalid-email";
    return `${ipIdentity(req)}:${email}`;
};

router.post("/register", authActionLimit({ action: "register-ip", limit: 100, windowMs: 60 * 60 * 1000, identityForRequest: ipIdentity }), authController.register);
router.post("/login", authActionLimit({ action: "login-ip", limit: 200, windowMs: 15 * 60 * 1000, identityForRequest: ipIdentity }), authActionLimit({ action: "login-identity", limit: 10, windowMs: 15 * 60 * 1000, identityForRequest: loginIdentity }), authController.login);
router.post("/google/mobile/exchange", authActionLimit({ action: "google-mobile-exchange", limit: 10, windowMs: 15 * 60 * 1000, identityForRequest: ipIdentity }), authController.exchangeMobileGoogleCode);
router.get("/me", authApi, authController.getMe);
router.put("/profile", authApi, authController.updateProfile);
router.post("/logout", authApi, authController.logout);

module.exports = router;

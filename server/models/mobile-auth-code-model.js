const mongoose = require("mongoose");

const mobileAuthCodeSchema = new mongoose.Schema({
    codeHash: { type: String, required: true, unique: true },
    codeChallenge: { type: String, required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true },
    expiresAt: { type: Date, required: true, expires: 0 }
}, { timestamps: true });

module.exports = mongoose.model("mobile-auth-code", mobileAuthCodeSchema);

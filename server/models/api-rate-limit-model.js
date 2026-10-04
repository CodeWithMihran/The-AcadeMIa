const mongoose = require("mongoose");

const apiRateLimitSchema = new mongoose.Schema({
    _id: { type: String },
    count: { type: Number, required: true },
    expiresAt: { type: Date, required: true, index: { expires: 0 } }
}, { versionKey: false, timestamps: false });

module.exports = mongoose.models.ApiRateLimit || mongoose.model("ApiRateLimit", apiRateLimitSchema);

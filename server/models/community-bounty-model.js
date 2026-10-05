const mongoose = require("mongoose");

const communityBountySchema = new mongoose.Schema({
    subject: { type: mongoose.Schema.Types.ObjectId, ref: "Subject", required: true, index: true },
    tenant: { type: mongoose.Schema.Types.ObjectId, ref: "tenant", default: null, index: true },
    college: { type: String, trim: true, default: "" },
    branch: { type: String, trim: true, uppercase: true, default: "" },
    semester: { type: Number, min: 1, max: 8, default: null },
    unitTitle: { type: String, trim: true, required: true, maxlength: 160 },
    title: { type: String, trim: true, required: true, maxlength: 120 },
    description: { type: String, trim: true, required: true, maxlength: 1000 },
    reward: { type: Number, required: true, min: 10, max: 500 },
    creator: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true, index: true },
    status: { type: String, enum: ["PENDING", "OPEN", "FULFILLING", "FULFILLED", "CANCELLING", "CANCELLED"], default: "PENDING", index: true },
    fulfilledBy: { type: mongoose.Schema.Types.ObjectId, ref: "CommunityNote", default: null },
    fulfilledAt: { type: Date, default: null }
}, { timestamps: true });

communityBountySchema.index({ subject: 1, status: 1, createdAt: -1 });
module.exports = mongoose.models.CommunityBounty || mongoose.model("CommunityBounty", communityBountySchema);

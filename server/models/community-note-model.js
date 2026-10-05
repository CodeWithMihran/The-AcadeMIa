const mongoose = require("mongoose");

const communityNoteSchema = new mongoose.Schema({
    subject: { type: mongoose.Schema.Types.ObjectId, ref: "Subject", required: true, index: true },
    tenant: { type: mongoose.Schema.Types.ObjectId, ref: "tenant", default: null, index: true },
    college: { type: String, trim: true, default: "" },
    branch: { type: String, trim: true, uppercase: true, default: "" },
    semester: { type: Number, min: 1, max: 8, default: null },
    unitId: { type: mongoose.Schema.Types.ObjectId, default: null },
    unitTitle: { type: String, trim: true, required: true, maxlength: 160 },
    title: { type: String, trim: true, required: true, maxlength: 120 },
    description: { type: String, trim: true, maxlength: 1000, default: "" },
    originalName: { type: String, trim: true, required: true, maxlength: 180 },
    mimeType: { type: String, enum: ["application/pdf", "image/jpeg", "image/png"], required: true },
    size: { type: Number, required: true, min: 1, max: 8 * 1024 * 1024 },
    fileData: { type: Buffer, required: true, select: false },
    contributor: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true, index: true },
    status: { type: String, enum: ["PENDING", "REVIEWING", "APPROVED", "REJECTED"], default: "PENDING", index: true },
    reviewNote: { type: String, trim: true, maxlength: 500, default: "" },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "user", default: null },
    reviewedAt: { type: Date, default: null },
    approvedAt: { type: Date, default: null },
    bounty: { type: mongoose.Schema.Types.ObjectId, ref: "CommunityBounty", default: null },
    bountyPaid: { type: Boolean, default: false }
}, { timestamps: true });

communityNoteSchema.index({ subject: 1, status: 1, createdAt: -1 });
communityNoteSchema.index({ tenant: 1, college: 1, branch: 1, semester: 1, status: 1 });

module.exports = mongoose.models.CommunityNote || mongoose.model("CommunityNote", communityNoteSchema);

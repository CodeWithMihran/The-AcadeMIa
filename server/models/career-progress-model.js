const mongoose = require("mongoose");

const careerProgressSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true, index: true },
    subject: { type: mongoose.Schema.Types.ObjectId, ref: "Subject", required: true, index: true },
    resourceType: { type: String, enum: ["INTERVIEW_QUESTION", "CODING_LINK"], required: true },
    resourceId: { type: mongoose.Schema.Types.ObjectId, required: true },
    completed: { type: Boolean, default: false, required: true },
    completedAt: { type: Date, default: null },
    activityLoggedAt: { type: Date, default: null }
}, { timestamps: true });

careerProgressSchema.index({ user: 1, subject: 1, resourceType: 1, resourceId: 1 }, { unique: true });
careerProgressSchema.index({ user: 1, subject: 1, completed: 1 });

module.exports = mongoose.model("CareerProgress", careerProgressSchema);

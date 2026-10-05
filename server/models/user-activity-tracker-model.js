const mongoose = require("mongoose");

const userActivityTrackerSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true, index: true },
    subject: { type: mongoose.Schema.Types.ObjectId, ref: "Subject", required: true },
    resourceType: { type: String, enum: ["INTERVIEW_QUESTION", "CODING_LINK"], required: true },
    resourceId: { type: mongoose.Schema.Types.ObjectId, required: true },
    eventKey: { type: String, required: true, unique: true },
    dayStart: { type: Date, required: true },
    completedAt: { type: Date, required: true }
}, { timestamps: true });

userActivityTrackerSchema.index({ user: 1, dayStart: -1 });

module.exports = mongoose.model("UserActivityTracker", userActivityTrackerSchema);

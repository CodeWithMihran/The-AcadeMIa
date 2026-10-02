const mongoose = require("mongoose");

const progressSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
        required: true,
        index: true
    },
    subject: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Subject",
        required: true,
        index: true
    },
    topicId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        index: true
    },
    completed: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

// Prevent duplicate progress entries for the same user and topic
progressSchema.index({ user: 1, topicId: 1 }, { unique: true });
// Facilitate lightning-fast lookup for all topics completed by a user in a subject
progressSchema.index({ user: 1, subject: 1 });

module.exports = mongoose.model("progress", progressSchema);
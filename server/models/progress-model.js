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
        ref: "Subject", // Make sure this matches your exact Subject model name
        required: true,
        index: true
    },
    topicId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    completed: {
        type: Boolean,
        default: true
    },
    completedTopicIds: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "topic" // Strictly ObjectIds grouped in an array
    }],
    subjectProgress: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
    }
}, { timestamps: true });

// Each user tracks completion independently for every topic in a subject.
progressSchema.index({ user: 1, subject: 1, topicId: 1 }, { unique: true });

module.exports = mongoose.model("progress", progressSchema);

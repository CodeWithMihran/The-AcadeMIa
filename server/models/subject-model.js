const mongoose = require("mongoose");

const resourceSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    link: {
        type: String,
        required: true,
        trim: true
    }
}, { _id: true });

const topicSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    importance: {
        type: String,
        enum: ["HIGH", "MEDIUM", "LOW"],
        default: "MEDIUM"
    }
}, { _id: true });

const unitSchema = new mongoose.Schema({
    unitNumber: {
        type: Number,
        required: true
    },
    unitTitle: {
        type: String,
        required: true,
        trim: true
    },
    notes: [resourceSchema],
    books: [resourceSchema],
    pyqs: [resourceSchema],
    youtubeLinks: [resourceSchema],
    topics: [topicSchema]
}, { _id: true });

const subjectSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    courseCode: {
        type: String,
        trim: true,
        uppercase: true
    },
    track: {
        type: String,
        enum: ["UNIVERSITY", "JEE", "NEET"],
        default: "UNIVERSITY"
    },
    // Associated university tenant (null for global or national competitive tracks)
    tenant: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "tenant",
        default: null
    },
    // For University Track
    branch: {
        type: String,
        trim: true,
        uppercase: true
    },
    semester: {
        type: Number
    },
    // For Competitive Track
    examCategory: {
        type: String, // e.g. "Physics", "Chemistry", "Mathematics", "Biology"
        trim: true
    },
    units: {
        type: [unitSchema],
        default: []
    }
}, { timestamps: true });

// Fast querying by university, branch, and semester
subjectSchema.index({ tenant: 1, branch: 1, semester: 1 });
subjectSchema.index({ track: 1, examCategory: 1 });

module.exports = mongoose.model("Subject", subjectSchema);
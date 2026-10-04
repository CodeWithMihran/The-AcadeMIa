const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema({
    subject: { type: mongoose.Schema.Types.ObjectId, ref: "Subject", default: null },
    subjectName: { type: String, required: true, trim: true, maxlength: 120 },
    classesHeld: { type: Number, required: true, min: 0, max: 100000 },
    classesAttended: { type: Number, required: true, min: 0, max: 100000 },
    threshold: { type: Number, required: true, min: 1, max: 100, default: 75 }
}, { _id: true, timestamps: true });

const assessmentSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true, maxlength: 80 },
    category: { type: String, enum: ["MIDTERM", "CLASS_TEST", "LAB_VIVA", "OTHER"], default: "OTHER" },
    marks: { type: Number, required: true, min: 0, max: 10000 },
    maxMarks: { type: Number, required: true, min: 0.01, max: 10000 }
}, { _id: true });

const sessionalSchema = new mongoose.Schema({
    subject: { type: mongoose.Schema.Types.ObjectId, ref: "Subject", default: null },
    subjectName: { type: String, required: true, trim: true, maxlength: 120 },
    internalMaximum: { type: Number, required: true, min: 0.01, max: 10000, default: 40 },
    externalMaximum: { type: Number, required: true, min: 0.01, max: 10000, default: 60 },
    targetPercent: { type: Number, required: true, min: 1, max: 100, default: 40 },
    assessments: { type: [assessmentSchema], default: [] }
}, { _id: true, timestamps: true });

const gradeBandSchema = new mongoose.Schema({
    label: { type: String, required: true, trim: true, maxlength: 12 },
    minimumPercent: { type: Number, required: true, min: 0, max: 100 },
    gradePoint: { type: Number, required: true, min: 0, max: 10 }
}, { _id: false });

const gradeSettingsSchema = new mongoose.Schema({
    tenant: { type: mongoose.Schema.Types.ObjectId, ref: "tenant", required: true },
    previousCgpa: { type: Number, min: 0, max: 10, default: 0 },
    completedCredits: { type: Number, min: 0, max: 10000, default: 0 },
    targetCgpa: { type: Number, min: 0, max: 10, default: 8.5 },
    gradeScale: { type: [gradeBandSchema], default: [] },
    projections: [{
        subject: { type: mongoose.Schema.Types.ObjectId, ref: "Subject", required: true },
        percent: { type: Number, min: 0, max: 100, required: true }
    }]
}, { _id: false });

const studyToolsSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true, unique: true, index: true },
    attendance: { type: [attendanceSchema], default: [] },
    sessionals: { type: [sessionalSchema], default: [] },
    gradeSettings: { type: [gradeSettingsSchema], default: [] }
}, { timestamps: true });

module.exports = mongoose.model("StudyTools", studyToolsSchema);

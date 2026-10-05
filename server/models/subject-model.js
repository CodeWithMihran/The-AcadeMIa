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

const examQuestionSchema = new mongoose.Schema({
    question: { type: String, trim: true, required: true, maxlength: 2000 },
    topic: { type: String, trim: true, required: true, maxlength: 160 },
    year: { type: Number, min: 1980, max: 2100, required: true },
    marks: { type: Number, min: 0, max: 100, default: null },
    sourceLabel: { type: String, trim: true, required: true, maxlength: 160 },
    sourceUrl: { type: String, trim: true, default: "", maxlength: 2048 }
}, { _id: true });

const quickSummarySchema = new mongoose.Schema({
    definition: { type: String, trim: true, maxlength: 12000, default: "" },
    diagram: { type: String, trim: true, maxlength: 12000, default: "" },
    workingPrinciple: { type: String, trim: true, maxlength: 12000, default: "" },
    advantages: { type: String, trim: true, maxlength: 12000, default: "" },
    disadvantages: { type: String, trim: true, maxlength: 12000, default: "" }
}, { _id: false });

const rapidRevisionSchema = new mongoose.Schema({
    formulas: { type: String, trim: true, maxlength: 12000, default: "" },
    derivations: { type: String, trim: true, maxlength: 12000, default: "" },
    diagrams: { type: String, trim: true, maxlength: 12000, default: "" },
    keyPoints: { type: String, trim: true, maxlength: 12000, default: "" }
}, { _id: false });

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
    topics: [topicSchema],
    // Coverage is entered explicitly so recurrence scores have an honest denominator.
    examYearsCovered: [{ type: Number, min: 1980, max: 2100 }],
    examQuestions: { type: [examQuestionSchema], default: [] },
    rapidRevision: { type: rapidRevisionSchema, default: () => ({}) },
    quickSummary: { type: quickSummarySchema, default: () => ({}) }
}, { _id: true });

const careerQuestionSchema = new mongoose.Schema({
    question: { type: String, trim: true, required: true },
    answerMarkdown: { type: String, trim: true, maxlength: 20000, default: "" },
    companies: [{ type: String, trim: true, maxlength: 60 }],
    // Retained so existing subject documents and older admin payloads remain readable.
    company: { type: String, trim: true, default: "" },
    topic: { type: String, trim: true, default: "" },
    difficulty: { type: String, enum: ["", "Easy", "Medium", "Hard"], default: "" },
    isPremium: { type: Boolean, default: false }
}, { _id: true });

const careerLinkSchema = new mongoose.Schema({
    title: { type: String, trim: true, required: true },
    platform: { type: String, trim: true, default: "Other" },
    url: { type: String, trim: true, required: true },
    topic: { type: String, trim: true, default: "" },
    difficulty: { type: String, enum: ["", "Easy", "Medium", "Hard"], default: "" },
    isPremium: { type: Boolean, default: false }
}, { _id: true });

const gatePyqSchema = new mongoose.Schema({
    title: { type: String, trim: true, required: true },
    year: { type: Number, min: 1980, max: 2100 },
    topic: { type: String, trim: true, default: "" },
    url: { type: String, trim: true, required: true },
    isPremium: { type: Boolean, default: false }
}, { _id: true });

const careerBridgeSchema = new mongoose.Schema({
    interviewQuestions: { type: [careerQuestionSchema], default: [] },
    codingLinks: { type: [careerLinkSchema], default: [] },
    gate: {
        examCode: { type: String, trim: true, default: "GATE CS" },
        weightageMinMarks: { type: Number, min: 0, max: 100, default: null },
        weightageMaxMarks: { type: Number, min: 0, max: 100, default: null },
        weightagePeriod: { type: String, trim: true, default: "" },
        pyqs: { type: [gatePyqSchema], default: [] }
    }
}, { _id: false });

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
    // University-issued course credit value used by the student's SGPA planner.
    credits: {
        type: Number,
        min: 0,
        default: 0
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
    },
    careerBridge: { type: careerBridgeSchema, default: () => ({}) }
}, { timestamps: true });

// Fast querying by university, branch, and semester
subjectSchema.index({ tenant: 1, branch: 1, semester: 1 });
subjectSchema.index({ track: 1, examCategory: 1 });

module.exports = mongoose.model("Subject", subjectSchema);

const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        minLength: 2,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String
    },
    googleId: {
        type: String,
        unique: true,
        sparse: true
    },
    role: {
        type: String,
        enum: ["student", "admin", "moderator"],
        default: "student"
    },
    // Core Track: University vs Competitive Exams
    track: {
        type: String,
        enum: ["UNIVERSITY", "JEE", "NEET"],
        default: "UNIVERSITY"
    },
    // University / Institution Tenant
    tenant: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "tenant",
        default: null
    },
    college: {
        type: String,
        default: "Not Set",
        trim: true
    },
    branch: {
        type: String,
        default: "Not Set",
        trim: true
    },
    year: {
        type: Number,
        default: 1
    },
    semester: {
        type: Number,
        default: 1
    },
    // Competitive exam tracking
    targetExam: {
        type: String,
        enum: ["JEE_MAINS", "JEE_ADVANCED", "NEET", "NONE"],
        default: "NONE"
    },
    targetYear: {
        type: Number
    },
    onboardingCompleted: {
        type: Boolean,
        default: false
    },
    leaderboardOptIn: {
        type: Boolean,
        default: false
    },
    // Set only by trusted billing/admin workflows. A live entitlement also
    // requires an unexpired period end; client profile updates cannot set it.
    premiumSubscription: {
        status: {
            type: String,
            enum: ["INACTIVE", "ACTIVE", "PAST_DUE", "CANCELED"],
            default: "INACTIVE"
        },
        currentPeriodEnd: {
            type: Date,
            default: null
        }
    },
    campusAmbassador: {
        active: { type: Boolean, default: false },
        tenant: { type: mongoose.Schema.Types.ObjectId, ref: "tenant", default: null },
        college: { type: String, trim: true, default: "" },
        branches: [{ type: String, trim: true, uppercase: true }],
        semesters: [{ type: Number, min: 1, max: 8 }],
        grantedBy: { type: mongoose.Schema.Types.ObjectId, ref: "user", default: null },
        grantedAt: { type: Date, default: null }
    }
}, { timestamps: true });

module.exports = mongoose.model("user", userSchema);

const mongoose = require("mongoose");

const affiliatedCollegeSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    code: {
        type: String,
        trim: true
    },
    domain: {
        type: String,
        lowercase: true,
        trim: true
    },
    city: {
        type: String,
        trim: true
    }
});

const tenantSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    shortCode: {
        type: String,
        required: true,
        uppercase: true,
        trim: true
    },
    type: {
        type: String,
        enum: ["UNIVERSITY", "COMPETITIVE_EXAM"],
        default: "UNIVERSITY"
    },
    state: {
        type: String,
        default: "All India",
        trim: true
    },
    // Domains associated directly or via affiliated colleges
    domains: [{
        type: String,
        lowercase: true,
        trim: true
    }],
    affiliatedColleges: [affiliatedCollegeSchema],
    active: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

// Index domains for rapid tenant lookup during login/registration
tenantSchema.index({ domains: 1 });
tenantSchema.index({ "affiliatedColleges.domain": 1 });

module.exports = mongoose.model("tenant", tenantSchema);

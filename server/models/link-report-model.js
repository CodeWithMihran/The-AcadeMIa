const mongoose = require("mongoose");

const linkReportSchema = new mongoose.Schema({
    subject: { type: mongoose.Schema.Types.ObjectId, ref: "Subject", required: true, index: true },
    reporter: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true, index: true },
    resourceType: { type: String, enum: ["CODING_LINK", "GATE_PYQ"], required: true },
    resourceId: { type: mongoose.Schema.Types.ObjectId, required: true },
    resourceTitle: { type: String, trim: true, required: true, maxlength: 200 },
    resourceUrl: { type: String, trim: true, required: true, maxlength: 2048 },
    topic: { type: String, trim: true, default: "", maxlength: 120 },
    status: { type: String, enum: ["OPEN", "RESOLVED", "DISMISSED"], default: "OPEN", index: true },
    resolutionNote: { type: String, trim: true, default: "", maxlength: 500 },
    resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "user", default: null },
    resolvedAt: { type: Date, default: null }
}, { timestamps: true });

linkReportSchema.index(
    { subject: 1, reporter: 1, resourceType: 1, resourceId: 1 },
    { unique: true, partialFilterExpression: { status: "OPEN" } }
);

module.exports = mongoose.models.LinkReport || mongoose.model("LinkReport", linkReportSchema);

const subjectModel = require("../../models/subject-model");
const mongoose = require("mongoose");
const studentSubjectFilter = require("../../utils/studentSubjectFilter");
const { hasActivePremium, filterSubjectForStudent } = require("../../utils/premiumAccess");
const linkReportModel = require("../../models/link-report-model");
const tenantModel = require("../../models/tenant-model");
const { getAvailableBranches } = require("../../utils/tenantBranches");

const canViewPremiumCareerBridge = (user) => hasActivePremium(user);

module.exports.getAvailableBranches = async (req, res) => {
    try {
        const { tenantId } = req.query;
        if (typeof tenantId !== "string" || !mongoose.isValidObjectId(tenantId)) {
            return res.status(400).json({ success: false, message: "Choose a valid university." });
        }
        const tenant = await tenantModel.findOne({ _id: tenantId, type: "UNIVERSITY", active: true }).select("_id");
        if (!tenant) return res.status(404).json({ success: false, message: "The selected university is unavailable." });

        const branches = await getAvailableBranches(tenant._id);
        return res.status(200).json({ success: true, branches });
    } catch (err) {
        console.error("Get Available Branches Error:", err);
        return res.status(500).json({ success: false, message: "Could not load branches for this university." });
    }
};

// 1. Get Subjects for Logged In Student
module.exports.getSubjects = async (req, res) => {
    try {
        const query = studentSubjectFilter(req.user);

        const subjects = await subjectModel
            .find(query)
            .populate("tenant", "name shortCode")
            .sort({ name: 1 });
        const includePremium = canViewPremiumCareerBridge(req.user);

        return res.status(200).json({
            success: true,
            count: subjects.length,
            subjects: subjects.map((subject) => filterSubjectForStudent(subject, includePremium))
        });

    } catch (err) {
        console.error("Get Subjects Error:", err);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch curriculum subjects: " + err.message
        });
    }
};

// 2. Get Single Subject Detail
module.exports.getSubjectById = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({ success: false, message: "Invalid subject id." });
        }
        const subject = await subjectModel
            .findOne({ _id: id, ...studentSubjectFilter(req.user) })
            .populate("tenant", "name shortCode");

        if (!subject) {
            return res.status(404).json({
                success: false,
                message: "Subject not found."
            });
        }

        const safeSubject = filterSubjectForStudent(subject, canViewPremiumCareerBridge(req.user));

        return res.status(200).json({
            success: true,
            subject: safeSubject
        });

    } catch (err) {
        console.error("Get Subject Detail Error:", err);
        return res.status(500).json({
            success: false,
            message: "Failed to load subject: " + err.message
        });
    }
};

module.exports.reportBrokenLink = async (req, res) => {
    try {
        const { id: subjectId } = req.params;
        const { resourceId, resourceType } = req.body || {};
        if (!mongoose.isValidObjectId(subjectId) || !mongoose.isValidObjectId(resourceId)) {
            return res.status(400).json({ success: false, message: "Invalid subject or resource id." });
        }
        if (!["CODING_LINK", "GATE_PYQ"].includes(resourceType)) {
            return res.status(400).json({ success: false, message: "Unsupported link report type." });
        }

        const subject = await subjectModel.findOne({ _id: subjectId, ...studentSubjectFilter(req.user) });
        if (!subject) return res.status(404).json({ success: false, message: "Subject not found." });

        const resources = resourceType === "CODING_LINK"
            ? subject.careerBridge?.codingLinks || []
            : subject.careerBridge?.gate?.pyqs || [];
        const resource = resources.find(item => item._id.toString() === resourceId);
        if (!resource?.url) return res.status(404).json({ success: false, message: "Link not found." });
        if (resource.isPremium && !hasActivePremium(req.user)) {
            return res.status(403).json({ success: false, message: "An active premium subscription is required to report this link." });
        }

        const reportData = {
            subject: subject._id,
            reporter: req.user._id,
            resourceType,
            resourceId: resource._id,
            resourceTitle: resource.title,
            resourceUrl: resource.url,
            topic: resource.topic || ""
        };

        try {
            const report = await linkReportModel.create(reportData);
            return res.status(201).json({ success: true, alreadyReported: false, reportId: report._id, message: "Thanks. The admin team has been notified." });
        } catch (err) {
            if (err.code !== 11000) throw err;
            const existingReport = await linkReportModel.findOne({
                subject: subject._id,
                reporter: req.user._id,
                resourceType,
                resourceId: resource._id,
                status: "OPEN"
            }).select("_id");
            return res.status(200).json({ success: true, alreadyReported: true, reportId: existingReport?._id, message: "You have already reported this link. The admin team has been notified." });
        }
    } catch (err) {
        console.error("Report Broken Link Error:", err);
        return res.status(500).json({ success: false, message: "Could not submit the broken-link report." });
    }
};

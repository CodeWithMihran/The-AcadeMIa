const subjectModel = require("../../models/subject-model");
const userModel = require("../../models/user-model");
const tenantModel = require("../../models/tenant-model");
const progressModel = require("../../models/progress-model");
const studyToolsModel = require("../../models/study-tools-model");
const linkReportModel = require("../../models/link-report-model");
const mongoose = require("mongoose");

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const careerBridgeValidationError = (bridge) => {
    if (bridge == null) return null;
    if (typeof bridge !== "object" || Array.isArray(bridge)) return "Career Bridge data must be an object.";
    if (bridge.interviewQuestions !== undefined && !Array.isArray(bridge.interviewQuestions)) return "Interview questions must be an array.";
    if (bridge.codingLinks !== undefined && !Array.isArray(bridge.codingLinks)) return "Coding links must be an array.";
    if (bridge.gate?.pyqs !== undefined && !Array.isArray(bridge.gate.pyqs)) return "GATE PYQs must be an array.";
    for (const item of bridge.interviewQuestions || []) {
        if (typeof item?.answerMarkdown === "string" && item.answerMarkdown.length > 20000) {
            return "Interview answers must be 20,000 characters or fewer.";
        }
        if (item?.companies !== undefined && (!Array.isArray(item.companies) || item.companies.length > 20 || item.companies.some(company => typeof company !== "string" || company.length > 60))) {
            return "Add at most 20 company tags, each 60 characters or fewer.";
        }
    }
    const links = [
        ...(Array.isArray(bridge.codingLinks) ? bridge.codingLinks.map(item => item?.url) : []),
        ...(Array.isArray(bridge.gate?.pyqs) ? bridge.gate.pyqs.map(item => item?.url) : [])
    ].filter(Boolean);
    if (links.some(value => {
        try { return !["http:", "https:"].includes(new URL(value).protocol); }
        catch { return true; }
    })) return "Career Bridge links must be valid HTTP(S) URLs.";
    return null;
};

// 1. Admin System Overview
module.exports.getAdminOverview = async (req, res) => {
    try {
        const [totalUsers, totalSubjects, totalTenants] = await Promise.all([
            userModel.countDocuments(),
            subjectModel.countDocuments(),
            tenantModel.countDocuments({ active: true })
        ]);

        return res.status(200).json({
            success: true,
            stats: {
                totalUsers,
                totalSubjects,
                totalTenants
            }
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: "Failed to load admin stats: " + err.message
        });
    }
};

// 2. Get Subjects with Tenant Filter
module.exports.getAdminSubjects = async (req, res) => {
    try {
        const { tenantId, track } = req.query;
        let filter = {};

        if (tenantId && tenantId !== "ALL") {
            if (!mongoose.isValidObjectId(tenantId)) return res.status(400).json({ success: false, message: "Invalid university filter." });
            filter.tenant = tenantId;
        }
        if (track && track !== "ALL") {
            if (!["UNIVERSITY", "JEE", "NEET"].includes(track)) return res.status(400).json({ success: false, message: "Invalid track filter." });
            filter.track = track;
        }

        const subjects = await subjectModel
            .find(filter)
            .populate("tenant", "name shortCode")
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            subjects
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: "Failed to fetch subjects: " + err.message
        });
    }
};

// 3. Create Subject Under Tenant
module.exports.createSubject = async (req, res) => {
    try {
        const { name, courseCode, track, tenantId, branch, semester, examCategory, units, credits, careerBridge } = req.body;

        const careerBridgeError = careerBridgeValidationError(careerBridge);
        if (careerBridgeError) return res.status(400).json({ success: false, message: careerBridgeError });

        if (!name) {
            return res.status(400).json({
                success: false,
                message: "Subject name is required."
            });
        }

        const subjectTrack = track || "UNIVERSITY";
        let tenant = null;
        if (subjectTrack === "UNIVERSITY") {
            if (!tenantId || !mongoose.isValidObjectId(tenantId)) {
                return res.status(400).json({ success: false, message: "Select a valid university for this subject." });
            }
            if (!branch?.trim() || !Number.isInteger(Number(semester)) || Number(semester) < 1 || Number(semester) > 8) {
                return res.status(400).json({ success: false, message: "University subjects require a branch and semester from 1 to 8." });
            }
            tenant = await tenantModel.findOne({ _id: tenantId, type: "UNIVERSITY", active: true }).select("_id");
            if (!tenant) return res.status(400).json({ success: false, message: "The selected university is unavailable." });
            if (!Number.isFinite(Number(credits)) || Number(credits) <= 0 || Number(credits) > 100) {
                return res.status(400).json({ success: false, message: "Enter the official course credits (greater than 0 and at most 100)." });
            }
        } else if (!["JEE", "NEET"].includes(subjectTrack)) {
            return res.status(400).json({ success: false, message: "Invalid subject track." });
        }

        const newSubject = await subjectModel.create({
            name,
            courseCode,
            credits: subjectTrack === "UNIVERSITY" ? Number(credits) : 0,
            track: subjectTrack,
            tenant: tenant?._id || null,
            branch: subjectTrack === "UNIVERSITY" ? branch.toUpperCase().trim() : undefined,
            semester: subjectTrack === "UNIVERSITY" ? Number(semester) : undefined,
            examCategory,
            units: units || [],
            careerBridge: careerBridge || undefined
        });

        const populated = await subjectModel.findById(newSubject._id).populate("tenant", "name shortCode");

        return res.status(201).json({
            success: true,
            message: "Subject created successfully.",
            subject: populated
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: "Failed to create subject: " + err.message
        });
    }
};

// 4. Update Subject
module.exports.updateSubject = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({ success: false, message: "Invalid subject id." });
        }
        const existing = await subjectModel.findById(id);
        if (!existing) return res.status(404).json({ success: false, message: "Subject not found." });

        const updateData = { ...req.body };
        if (updateData.careerBridge !== undefined) {
            const careerBridgeError = careerBridgeValidationError(updateData.careerBridge);
            if (careerBridgeError) return res.status(400).json({ success: false, message: careerBridgeError });
        }
        const requestedTenantId = updateData.tenantId;
        delete updateData.tenantId;
        const nextTrack = updateData.track || existing.track;

        if (nextTrack === "UNIVERSITY") {
            const tenantId = requestedTenantId || updateData.tenant || existing.tenant;
            if (!tenantId || !mongoose.isValidObjectId(tenantId)) {
                return res.status(400).json({ success: false, message: "Select a valid university for this subject." });
            }
            if (requestedTenantId !== undefined || updateData.tenant !== undefined || !existing.tenant) {
                const tenant = await tenantModel.findOne({ _id: tenantId, type: "UNIVERSITY", active: true }).select("_id");
                if (!tenant) return res.status(400).json({ success: false, message: "The selected university is unavailable." });
                updateData.tenant = tenant._id;
            }
            const branch = updateData.branch ?? existing.branch;
            const semester = updateData.semester ?? existing.semester;
            if (!branch?.trim() || !Number.isInteger(Number(semester)) || Number(semester) < 1 || Number(semester) > 8) {
                return res.status(400).json({ success: false, message: "University subjects require a branch and semester from 1 to 8." });
            }
            const credits = Number(updateData.credits ?? existing.credits);
            if (!Number.isFinite(credits) || credits <= 0 || credits > 100) {
                return res.status(400).json({ success: false, message: "Enter the official course credits (greater than 0 and at most 100)." });
            }
            updateData.credits = credits;
            if (updateData.branch !== undefined) updateData.branch = branch.toUpperCase().trim();
            if (updateData.semester !== undefined) updateData.semester = Number(semester);
            updateData.track = "UNIVERSITY";
        } else if (["JEE", "NEET"].includes(nextTrack)) {
            updateData.track = nextTrack;
            updateData.tenant = null;
            updateData.credits = 0;
            delete updateData.branch;
            delete updateData.semester;
        } else {
            return res.status(400).json({ success: false, message: "Invalid subject track." });
        }

        const updated = await subjectModel
            .findByIdAndUpdate(id, updateData, { returnDocument: "after", runValidators: true })
            .populate("tenant", "name shortCode");

        if (!updated) {
            return res.status(404).json({
                success: false,
                message: "Subject not found."
            });
        }

        return res.status(200).json({
            success: true,
            message: "Subject updated successfully.",
            subject: updated
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: "Failed to update subject: " + err.message
        });
    }
};

// 5. Delete Subject (Cascade Delete Progress)
module.exports.deleteSubject = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.isValidObjectId(id)) return res.status(400).json({ success: false, message: "Invalid subject id." });

        const deleted = await subjectModel.findByIdAndDelete(id);
        if (!deleted) return res.status(404).json({ success: false, message: "Subject not found." });
        // Cascade delete orphaned progress records
        await progressModel.deleteMany({ subject: id });

        return res.status(200).json({
            success: true,
            message: "Subject and associated student progress purged successfully."
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: "Failed to delete subject: " + err.message
        });
    }
};

// 6. Get Users with Tenant Filter
module.exports.getAdminUsers = async (req, res) => {
    try {
        const { tenantId, role, search } = req.query;
        let filter = {};

        if (tenantId && tenantId !== "ALL") {
            if (!mongoose.isValidObjectId(tenantId)) return res.status(400).json({ success: false, message: "Invalid university filter." });
            filter.tenant = tenantId;
        }
        if (role && role !== "ALL") {
            if (!["student", "admin", "moderator"].includes(role)) return res.status(400).json({ success: false, message: "Invalid role filter." });
            filter.role = role;
        }
        if (search) {
            if (typeof search !== "string" || search.length > 100) return res.status(400).json({ success: false, message: "Search text must be 100 characters or fewer." });
            const safeSearch = escapeRegex(search);
            filter.$or = [
                { name: { $regex: safeSearch, $options: "i" } },
                { email: { $regex: safeSearch, $options: "i" } },
                { college: { $regex: safeSearch, $options: "i" } }
            ];
        }

        const users = await userModel
            .find(filter)
            .populate("tenant", "name shortCode")
            .select("-password")
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            users
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: "Failed to fetch user directory: " + err.message
        });
    }
};

// 7. Delete User (Cascade Delete Progress & Self-Deletion Guard)
module.exports.deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.isValidObjectId(id)) return res.status(400).json({ success: false, message: "Invalid user id." });

        if (id === req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: "Security Alert: You cannot delete your own administrative account."
            });
        }

        const deleted = await userModel.findByIdAndDelete(id);
        if (!deleted) return res.status(404).json({ success: false, message: "User not found." });
        await Promise.all([
            progressModel.deleteMany({ user: id }),
            studyToolsModel.deleteOne({ user: id })
        ]);

        return res.status(200).json({
            success: true,
            message: "User account and progress data permanently deleted."
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: "Failed to delete user: " + err.message
        });
    }
};

module.exports.getLinkReports = async (req, res) => {
    try {
        const { status = "OPEN" } = req.query;
        if (! ["OPEN", "RESOLVED", "DISMISSED", "ALL"].includes(status)) {
            return res.status(400).json({ success: false, message: "Invalid report status filter." });
        }
        const filter = status === "ALL" ? {} : { status };
        const reports = await linkReportModel.find(filter)
            .populate("subject", "name courseCode tenant branch semester")
            .populate("reporter", "name email")
            .populate("resolvedBy", "name email")
            .sort({ createdAt: -1 })
            .limit(200)
            .lean();
        return res.status(200).json({ success: true, reports });
    } catch (err) {
        console.error("Get Link Reports Error:", err);
        return res.status(500).json({ success: false, message: "Failed to load broken-link reports." });
    }
};

module.exports.updateLinkReport = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, resolutionNote = "" } = req.body || {};
        if (!mongoose.isValidObjectId(id)) return res.status(400).json({ success: false, message: "Invalid report id." });
        if (!["RESOLVED", "DISMISSED"].includes(status)) return res.status(400).json({ success: false, message: "Choose Resolved or Dismissed." });
        if (typeof resolutionNote !== "string" || resolutionNote.length > 500) {
            return res.status(400).json({ success: false, message: "Resolution note must be 500 characters or fewer." });
        }
        const report = await linkReportModel.findByIdAndUpdate(id, {
            status,
            resolutionNote: resolutionNote.trim(),
            resolvedBy: req.user._id,
            resolvedAt: new Date()
        }, { returnDocument: "after", runValidators: true });
        if (!report) return res.status(404).json({ success: false, message: "Link report not found." });
        return res.status(200).json({ success: true, report, message: `Link report marked ${status.toLowerCase()}.` });
    } catch (err) {
        console.error("Update Link Report Error:", err);
        return res.status(500).json({ success: false, message: "Failed to update link report." });
    }
};

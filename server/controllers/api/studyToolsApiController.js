const mongoose = require("mongoose");
const StudyTools = require("../../models/study-tools-model");
const Subject = require("../../models/subject-model");
const studentSubjectFilter = require("../../utils/studentSubjectFilter");

const defaultGradeScale = [
    { label: "A+", minimumPercent: 90, gradePoint: 10 },
    { label: "A", minimumPercent: 80, gradePoint: 9 },
    { label: "B+", minimumPercent: 70, gradePoint: 8 },
    { label: "B", minimumPercent: 60, gradePoint: 7 },
    { label: "C", minimumPercent: 50, gradePoint: 6 },
    { label: "D", minimumPercent: 40, gradePoint: 5 },
    { label: "F", minimumPercent: 0, gradePoint: 0 }
];

function currentTenantId(user) {
    return user.tenant?._id || user.tenant || null;
}

function validNumber(value, min, max) {
    if (value === null || value === undefined || typeof value === "boolean" || (typeof value === "string" && value.trim() === "")) return null;
    const number = Number(value);
    return Number.isFinite(number) && number >= min && number <= max ? number : null;
}

function validText(value, maxLength) {
    return typeof value === "string" && value.trim().length > 0 && value.trim().length <= maxLength;
}

module.exports.getTools = async (req, res) => {
    try {
        const profile = await StudyTools.findOne({ user: req.user._id }).lean();
        const tenantId = currentTenantId(req.user)?.toString();
        const settings = profile?.gradeSettings?.find(item => item.tenant?.toString() === tenantId);
        return res.json({
            success: true,
            attendance: profile?.attendance || [],
            sessionals: profile?.sessionals || [],
            planner: settings || { tenant: tenantId || null, previousCgpa: 0, completedCredits: 0, targetCgpa: 8.5, gradeScale: defaultGradeScale, projections: [] }
        });
    } catch (err) {
        console.error("Get Study Tools Error:", err);
        return res.status(500).json({ success: false, message: "Could not load study tools." });
    }
};

module.exports.saveAttendance = async (req, res) => {
    try {
        if (!Array.isArray(req.body.attendance) || req.body.attendance.length > 300) {
            return res.status(400).json({ success: false, message: "Attendance data must be a list of up to 300 subjects." });
        }
        const entries = [];
        for (const entry of req.body.attendance) {
            const classesHeld = validNumber(entry.classesHeld, 0, 100000);
            const classesAttended = validNumber(entry.classesAttended, 0, 100000);
            const threshold = validNumber(entry.threshold, 1, 100);
            if (!entry || !validText(entry.subjectName, 120) || classesHeld === null || classesAttended === null || threshold === null || classesAttended > classesHeld) {
                return res.status(400).json({ success: false, message: "Check subject names, class totals, attendance counts, and threshold values." });
            }
            if (entry.subject && !mongoose.isValidObjectId(entry.subject)) return res.status(400).json({ success: false, message: "An attendance subject reference is invalid." });
            entries.push({ subject: entry.subject || null, subjectName: entry.subjectName.trim(), classesHeld, classesAttended, threshold });
        }
        const profile = await StudyTools.findOneAndUpdate({ user: req.user._id }, { $set: { attendance: entries }, $setOnInsert: { user: req.user._id } }, { upsert: true, new: true, runValidators: true });
        return res.json({ success: true, attendance: profile.attendance });
    } catch (err) {
        console.error("Save Attendance Error:", err);
        return res.status(500).json({ success: false, message: "Could not save attendance records." });
    }
};

module.exports.saveSessionals = async (req, res) => {
    try {
        if (!Array.isArray(req.body.sessionals) || req.body.sessionals.length > 300) {
            return res.status(400).json({ success: false, message: "Marks data must be a list of up to 300 subjects." });
        }
        const entries = [];
        for (const entry of req.body.sessionals) {
            const internalMaximum = validNumber(entry.internalMaximum, 0.01, 10000);
            const externalMaximum = validNumber(entry.externalMaximum, 0.01, 10000);
            const targetPercent = validNumber(entry.targetPercent, 1, 100);
            if (!entry || !validText(entry.subjectName, 120) || internalMaximum === null || externalMaximum === null || targetPercent === null || !Array.isArray(entry.assessments) || entry.assessments.length > 100) {
                return res.status(400).json({ success: false, message: "Check subject names, assessment limits, and maximum mark values." });
            }
            if (entry.subject && !mongoose.isValidObjectId(entry.subject)) return res.status(400).json({ success: false, message: "A marks subject reference is invalid." });
            const assessments = [];
            for (const assessment of entry.assessments) {
                const marks = validNumber(assessment.marks, 0, 10000);
                const maxMarks = validNumber(assessment.maxMarks, 0.01, 10000);
                if (!assessment || !validText(assessment.name, 80) || marks === null || maxMarks === null || marks > maxMarks || !["MIDTERM", "CLASS_TEST", "LAB_VIVA", "OTHER"].includes(assessment.category)) {
                    return res.status(400).json({ success: false, message: "Each assessment needs a name and a valid score within its maximum marks." });
                }
                assessments.push({ name: assessment.name.trim(), category: assessment.category, marks, maxMarks });
            }
            entries.push({ subject: entry.subject || null, subjectName: entry.subjectName.trim(), internalMaximum, externalMaximum, targetPercent, assessments });
        }
        const profile = await StudyTools.findOneAndUpdate({ user: req.user._id }, { $set: { sessionals: entries }, $setOnInsert: { user: req.user._id } }, { upsert: true, new: true, runValidators: true });
        return res.json({ success: true, sessionals: profile.sessionals });
    } catch (err) {
        console.error("Save Sessional Marks Error:", err);
        return res.status(500).json({ success: false, message: "Could not save sessional marks." });
    }
};

module.exports.savePlanner = async (req, res) => {
    try {
        if (req.user.track !== "UNIVERSITY" || req.user.tenant?.type !== "UNIVERSITY") {
            return res.status(400).json({ success: false, message: "The credit planner is available for university students." });
        }
        const tenantId = currentTenantId(req.user);
        if (!tenantId || !mongoose.isValidObjectId(tenantId)) return res.status(400).json({ success: false, message: "Choose a university before setting a grading scheme." });
        const previousCgpa = validNumber(req.body.previousCgpa, 0, 10);
        const completedCredits = validNumber(req.body.completedCredits, 0, 10000);
        const targetCgpa = validNumber(req.body.targetCgpa, 0, 10);
        const gradeScale = req.body.gradeScale;
        const rawProjections = req.body.projections || [];
        if (previousCgpa === null || completedCredits === null || targetCgpa === null || !Array.isArray(gradeScale) || gradeScale.length < 2 || gradeScale.length > 20 || !Array.isArray(rawProjections) || rawProjections.length > 300) {
            return res.status(400).json({ success: false, message: "Provide a valid prior CGPA, credit total, and grading scale." });
        }
        const normalizedScale = [];
        for (const band of gradeScale) {
            const minimumPercent = validNumber(band.minimumPercent, 0, 100);
            const gradePoint = validNumber(band.gradePoint, 0, 10);
            if (!band || !validText(band.label, 12) || minimumPercent === null || gradePoint === null) {
                return res.status(400).json({ success: false, message: "Each grade band needs a label, percentage threshold, and grade point." });
            }
            normalizedScale.push({ label: band.label.trim(), minimumPercent, gradePoint });
        }
        normalizedScale.sort((a, b) => b.minimumPercent - a.minimumPercent);
        if (normalizedScale[normalizedScale.length - 1].minimumPercent !== 0 || new Set(normalizedScale.map(band => band.minimumPercent)).size !== normalizedScale.length) {
            return res.status(400).json({ success: false, message: "Grade bands must have unique thresholds and include a 0% fallback." });
        }
        const projections = [];
        const allowedSubjects = await Subject.find({
            ...studentSubjectFilter(req.user),
            tenant: tenantId
        }).select("_id").lean();
        const allowedSubjectIds = new Set(allowedSubjects.map(subject => subject._id.toString()));
        for (const item of rawProjections) {
            const percent = validNumber(item.percent, 0, 100);
            if (!item || !mongoose.isValidObjectId(item.subject) || !allowedSubjectIds.has(item.subject.toString()) || percent === null) return res.status(400).json({ success: false, message: "Each projected mark needs a subject in your current university catalog and a valid percentage." });
            projections.push({ subject: item.subject, percent });
        }
        let profile = await StudyTools.findOne({ user: req.user._id });
        if (!profile) profile = new StudyTools({ user: req.user._id });
        const tenantKey = tenantId.toString();
        const setting = { tenant: tenantId, previousCgpa, completedCredits, targetCgpa, gradeScale: normalizedScale, projections };
        const index = profile.gradeSettings.findIndex(item => item.tenant.toString() === tenantKey);
        if (index < 0) profile.gradeSettings.push(setting);
        else profile.gradeSettings[index] = setting;
        await profile.save();
        return res.json({ success: true, planner: setting });
    } catch (err) {
        console.error("Save SGPA Planner Error:", err);
        return res.status(500).json({ success: false, message: "Could not save planner settings." });
    }
};

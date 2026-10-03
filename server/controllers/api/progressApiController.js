const progressModel = require("../../models/progress-model");
const subjectModel = require("../../models/subject-model");
const mongoose = require("mongoose");

// 1. Toggle Topic Completion (Atomic)
module.exports.toggleTopic = async (req, res) => {
    try {
        const { subjectId, topicId } = req.body;
        const userId = req.user._id;

        if (!subjectId || !topicId) {
            return res.status(400).json({
                success: false,
                message: "subjectId and topicId are required."
            });
        }

        if (!mongoose.isValidObjectId(subjectId) || !mongoose.isValidObjectId(topicId)) {
            return res.status(400).json({ success: false, message: "Invalid subjectId or topicId." });
        }
        const normalizedSubjectId = new mongoose.Types.ObjectId(subjectId);
        const normalizedTopicId = new mongoose.Types.ObjectId(topicId);

        const subject = await subjectModel.findById(normalizedSubjectId).select("units.topics._id");
        if (!subject) return res.status(404).json({ success: false, message: "Subject not found." });
        const topicExists = subject.units.some(unit => unit.topics.some(topic => topic._id.equals(normalizedTopicId)));
        if (!topicExists) return res.status(404).json({ success: false, message: "Topic not found in this subject." });

        let progress = await progressModel.findOne({ user: userId, subject: normalizedSubjectId, topicId: normalizedTopicId });

        if (progress) {
            progress.completed = !progress.completed;
            await progress.save();
        } else {
            progress = await progressModel.create({
                user: userId,
                subject: normalizedSubjectId,
                topicId: normalizedTopicId,
                completed: true
            });
        }

        return res.status(200).json({
            success: true,
            topicId,
            completed: progress.completed
        });

    } catch (err) {
        console.error("Toggle Topic Error:", err);
        return res.status(500).json({
            success: false,
            message: "Failed to toggle topic progress: " + err.message
        });
    }
};

// 2. Get Progress for a Specific Subject
module.exports.getSubjectProgress = async (req, res) => {
    try {
        const { subjectId } = req.params;
        const userId = req.user._id;

        if (!mongoose.isValidObjectId(subjectId)) {
            return res.status(400).json({ success: false, message: "Invalid subjectId." });
        }

        const subject = await subjectModel.findById(subjectId);
        if (!subject) {
            return res.status(404).json({
                success: false,
                message: "Subject not found."
            });
        }

        const completedRecords = await progressModel.find({
            user: userId,
            subject: subjectId,
            completed: true
        });

        const completedTopicIdMap = {};
        completedRecords.forEach(rec => {
            completedTopicIdMap[rec.topicId.toString()] = true;
        });

        let totalTopics = 0;
        let completedTopics = 0;
        const unitProgress = [];

        subject.units.forEach(unit => {
            let unitTotal = unit.topics.length;
            let unitCompleted = 0;

            unit.topics.forEach(topic => {
                totalTopics++;
                if (completedTopicIdMap[topic._id.toString()]) {
                    unitCompleted++;
                    completedTopics++;
                }
            });

            const unitPercent = unitTotal === 0 ? 0 : Math.round((unitCompleted / unitTotal) * 100);
            unitProgress.push(unitPercent);
        });

        const subjectProgress = totalTopics === 0 ? 0 : Math.round((completedTopics / totalTopics) * 100);

        return res.status(200).json({
            success: true,
            completedTopicIds: Object.keys(completedTopicIdMap),
            subjectProgress,
            unitProgress,
            totalTopics,
            completedTopics
        });

    } catch (err) {
        console.error("Get Subject Progress Error:", err);
        return res.status(500).json({
            success: false,
            message: "Failed to calculate subject progress: " + err.message
        });
    }
};

// 3. Get Global / All Subjects Progress Overview
module.exports.getGlobalProgress = async (req, res) => {
    try {
        const user = req.user;
        const userId = user._id;

        let query = {};
        if (user.track === "JEE" || user.track === "NEET") {
            query.track = user.track;
        } else {
            query.track = "UNIVERSITY";
            if (user.tenant) query.tenant = user.tenant._id || user.tenant;
            if (user.branch && user.branch !== "Not Set") query.branch = user.branch;
            if (user.semester) query.semester = user.semester;
        }

        // 1. Fetch all matching subjects
        const subjects = await subjectModel.find(query).lean();
        const subjectIds = subjects.map(s => s._id);

        // 2. Single DB call for all user completed records across all enrolled subjects
        const completedRecords = await progressModel.find({
            user: userId,
            subject: { $in: subjectIds },
            completed: true
        }).lean();

        const completedSet = new Set(completedRecords.map(r => r.topicId.toString()));

        const subjectProgressMap = {};
        let overallTotalTopics = 0;
        let overallCompletedTopics = 0;

        subjects.forEach(subject => {
            let subTotal = 0;
            let subCompleted = 0;

            if (subject.units) {
                subject.units.forEach(unit => {
                    if (unit.topics) {
                        unit.topics.forEach(topic => {
                            subTotal++;
                            overallTotalTopics++;
                            if (completedSet.has(topic._id.toString())) {
                                subCompleted++;
                                overallCompletedTopics++;
                            }
                        });
                    }
                });
            }

            subjectProgressMap[subject._id.toString()] = subTotal === 0 ? 0 : Math.round((subCompleted / subTotal) * 100);
        });

        const averageReadiness = overallTotalTopics === 0 ? 0 : Math.round((overallCompletedTopics / overallTotalTopics) * 100);

        return res.status(200).json({
            success: true,
            averageReadiness,
            subjectProgressMap,
            totalSubjects: subjects.length
        });

    } catch (err) {
        console.error("Global Progress Error:", err);
        return res.status(500).json({
            success: false,
            message: "Failed to calculate global progress: " + err.message
        });
    }
};

const progressModel = require("../../models/progress-model");
const subjectModel = require("../../models/subject-model");
const mongoose = require("mongoose");
const studentSubjectFilter = require("../../utils/studentSubjectFilter");
const userModel = require("../../models/user-model");
const careerProgressModel = require("../../models/career-progress-model");
const userActivityModel = require("../../models/user-activity-tracker-model");
const { hasActivePremium } = require("../../utils/premiumAccess");

const idString = value => (value?._id || value)?.toString?.() || "";
const activityKey = (resourceType, resourceId) => `${resourceType}:${idString(resourceId)}`;
const startOfUtcDay = date => new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
const dateKey = date => startOfUtcDay(new Date(date)).toISOString().slice(0, 10);

async function ensureCompletionActivity(record) {
    if (!record?.completed || !record.completedAt || record.activityLoggedAt?.getTime() === record.completedAt.getTime()) return;
    const completedAt = new Date(record.completedAt);
    const eventKey = `${record._id}:${completedAt.getTime()}`;
    try {
        await userActivityModel.create({
            user: record.user,
            subject: record.subject,
            resourceType: record.resourceType,
            resourceId: record.resourceId,
            eventKey,
            dayStart: startOfUtcDay(completedAt),
            completedAt
        });
    } catch (error) {
        if (error.code !== 11000) throw error;
    }
    await careerProgressModel.updateOne({ _id: record._id, activityLoggedAt: { $ne: completedAt } }, { $set: { activityLoggedAt: completedAt } });
}

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

        const subject = await subjectModel.findOne({
            _id: normalizedSubjectId,
            ...studentSubjectFilter(req.user)
        }).select("units.topics._id");
        if (!subject) return res.status(404).json({ success: false, message: "Subject not found." });
        const topicExists = subject.units.some(unit => unit.topics.some(topic => topic._id.equals(normalizedTopicId)));
        if (!topicExists) return res.status(404).json({ success: false, message: "Topic not found in this subject." });

        const progressKey = { user: userId, subject: normalizedSubjectId, topicId: normalizedTopicId };
        let completed;
        // Compare-and-set makes concurrent toggles reliable while respecting the unique index.
        for (let attempt = 0; attempt < 20; attempt += 1) {
            const current = await progressModel.findOne(progressKey).select("_id completed").lean();
            if (!current) {
                try {
                    await progressModel.create({ ...progressKey, completed: true });
                    completed = true;
                    break;
                } catch (error) {
                    if (error.code === 11000) continue;
                    throw error;
                }
            }

            const nextValue = !current.completed;
            const result = await progressModel.updateOne(
                { _id: current._id, completed: current.completed },
                { $set: { completed: nextValue } }
            );
            if (result.modifiedCount === 1) {
                completed = nextValue;
                break;
            }
        }
        if (completed === undefined) {
            return res.status(409).json({ success: false, message: "Progress changed concurrently. Please try again." });
        }

        return res.status(200).json({
            success: true,
            topicId,
            completed
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

        const subject = await subjectModel.findOne({
            _id: subjectId,
            ...studentSubjectFilter(req.user)
        });
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

        const query = studentSubjectFilter(user);

        // 1. Fetch all matching subjects
        const subjects = await subjectModel.find(query).lean();
        const subjectIds = subjects.map(s => s._id);

        // 2. Single DB call for all user completed records across all enrolled subjects
        const [completedRecords, careerRecords] = await Promise.all([
            progressModel.find({ user: userId, subject: { $in: subjectIds }, completed: true }).lean(),
            careerProgressModel.find({ user: userId, subject: { $in: subjectIds }, completed: true }).select("subject resourceType resourceId").lean()
        ]);

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
        const completedCareerKeys = new Set(careerRecords.map(record => `${idString(record.subject)}:${activityKey(record.resourceType, record.resourceId)}`));
        const skillRadar = subjects.map(subject => {
            const interview = (subject.careerBridge?.interviewQuestions || []).filter(item => hasActivePremium(user) || !item.isPremium).map(item => ({ type: "INTERVIEW_QUESTION", item }));
            const coding = (subject.careerBridge?.codingLinks || []).filter(item => hasActivePremium(user) || !item.isPremium).map(item => ({ type: "CODING_LINK", item }));
            const resources = [...interview, ...coding];
            const completed = resources.filter(({ type, item }) => completedCareerKeys.has(`${idString(subject._id)}:${activityKey(type, item._id)}`)).length;
            return { subjectId: idString(subject._id), subjectName: subject.name, completed, total: resources.length, score: resources.length ? Math.round((completed / resources.length) * 100) : 0 };
        }).filter(item => item.total > 0).sort((a, b) => b.total - a.total || a.subjectName.localeCompare(b.subjectName));

        return res.status(200).json({
            success: true,
            averageReadiness,
            subjectProgressMap,
            skillRadar,
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

module.exports.getLeaderboard = async (req, res) => {
    try {
        const user = req.user;
        const tenantId = user.tenant?._id || user.tenant;
        const branch = typeof user.branch === "string" ? user.branch.trim().toUpperCase() : "";
        const college = typeof user.college === "string" ? user.college.trim() : "";
        const semester = Number(user.semester);
        if (user.track !== "UNIVERSITY" || !tenantId || !branch || branch === "NOT SET" || !college || college === "Not Set" || !Number.isInteger(semester) || semester < 1 || semester > 8) {
            return res.json({ success: true, available: false, participating: false, message: "Complete your university, campus, branch, and semester profile to view your cohort rankings." });
        }

        // Each opted-in student is scored against the same tenant/campus/branch/semester
        // subject set. Names, emails, and IDs never leave this aggregation.
        const rows = await userModel.aggregate([
            { $match: {
                role: "student", onboardingCompleted: true, leaderboardOptIn: true,
                track: "UNIVERSITY", tenant: new mongoose.Types.ObjectId(tenantId),
                college, branch, semester
            } },
            { $lookup: {
                from: subjectModel.collection.name,
                let: { tenantId: "$tenant", branch: "$branch", semester: "$semester" },
                pipeline: [
                    { $match: { $expr: { $and: [
                        { $eq: ["$track", "UNIVERSITY"] },
                        { $eq: ["$tenant", "$$tenantId"] },
                        { $eq: ["$branch", "$$branch"] },
                        { $eq: ["$semester", "$$semester"] }
                    ] } } },
                    { $project: { units: 1 } }
                ],
                as: "curriculum"
            } },
            { $set: {
                subjectIds: { $map: { input: "$curriculum", as: "subject", in: "$$subject._id" } },
                totalTopics: { $sum: { $map: {
                    input: "$curriculum", as: "subject",
                    in: { $reduce: {
                        input: { $ifNull: ["$$subject.units", []] }, initialValue: 0,
                        in: { $add: ["$$value", { $size: { $ifNull: ["$$this.topics", []] } }] }
                    } }
                } } }
            } },
            { $lookup: {
                from: progressModel.collection.name,
                let: { studentId: "$_id", subjectIds: "$subjectIds" },
                pipeline: [
                    { $match: { $expr: { $and: [
                        { $eq: ["$user", "$$studentId"] },
                        { $in: ["$subject", "$$subjectIds"] },
                        { $eq: ["$completed", true] }
                    ] } } },
                    { $group: { _id: "$topicId" } }
                ],
                as: "completedTopics"
            } },
            { $set: { averageReadiness: { $cond: [
                { $gt: ["$totalTopics", 0] },
                { $round: [{ $multiply: [{ $divide: [{ $size: "$completedTopics" }, "$totalTopics"] }, 100] }, 0] },
                0
            ] } } },
            { $match: { totalTopics: { $gt: 0 } } },
            { $sort: { averageReadiness: -1, _id: 1 } },
            { $project: { _id: 1, averageReadiness: 1 } }
        ]);

        const minCohortSize = 5;
        if (rows.length < minCohortSize) {
            return res.json({ success: true, available: false, participating: user.leaderboardOptIn === true, cohortSize: rows.length, minimumCohortSize: minCohortSize, message: `Rankings appear after at least ${minCohortSize} students in your cohort opt in.` });
        }

        const topCount = Math.max(1, Math.ceil(rows.length * 0.1));
        const cutoff = rows[topCount - 1].averageReadiness;
        const currentIndex = rows.findIndex(row => row._id.toString() === user._id.toString());
        const yourRank = currentIndex < 0 ? null : rows.findIndex(row => row.averageReadiness === rows[currentIndex].averageReadiness) + 1;
        const top = rows.filter((row, index) => index < topCount || row.averageReadiness === cutoff).map((row, index) => ({
            rank: rows.findIndex(item => item.averageReadiness === row.averageReadiness) + 1,
            label: row._id.toString() === user._id.toString() ? "You" : `Peer ${index + 1}`,
            averageReadiness: row.averageReadiness
        }));
        return res.json({
            success: true, available: true, participating: user.leaderboardOptIn === true,
            cohort: { college, branch, semester }, cohortSize: rows.length,
            yourRank, yourReadiness: currentIndex < 0 ? null : rows[currentIndex].averageReadiness,
            topTenPercent: yourRank !== null && (yourRank <= topCount || rows[currentIndex].averageReadiness === cutoff),
            topTen: top
        });
    } catch (error) {
        console.error("Get progress leaderboard error:", error);
        return res.status(500).json({ success: false, message: "Could not load your cohort rankings." });
    }
};

module.exports.getCareerProgress = async (req, res) => {
    try {
        const { subjectId } = req.params;
        if (!mongoose.isValidObjectId(subjectId)) return res.status(400).json({ success: false, message: "Invalid subject id." });
        const subject = await subjectModel.findOne({ _id: subjectId, ...studentSubjectFilter(req.user) }).select("_id");
        if (!subject) return res.status(404).json({ success: false, message: "Subject not found." });
        const records = await careerProgressModel.find({ user: req.user._id, subject: subject._id, completed: true }).select("resourceType resourceId completedAt activityLoggedAt").lean();
        for (const record of records) await ensureCompletionActivity({ ...record, user: req.user._id, subject: subject._id });
        return res.json({ success: true, completed: records.map(record => ({ resourceType: record.resourceType, resourceId: idString(record.resourceId), completed: true, completedAt: record.completedAt })) });
    } catch (error) {
        console.error("Get career progress error:", error);
        return res.status(500).json({ success: false, message: "Could not load your career progress." });
    }
};

module.exports.setCareerResourceCompletion = async (req, res) => {
    try {
        const { subjectId, resourceType, resourceId, completed } = req.body || {};
        if (!mongoose.isValidObjectId(subjectId) || !mongoose.isValidObjectId(resourceId) || !["INTERVIEW_QUESTION", "CODING_LINK"].includes(resourceType) || typeof completed !== "boolean") {
            return res.status(400).json({ success: false, message: "Provide a valid subject, career resource, and completion state." });
        }
        const subject = await subjectModel.findOne({ _id: subjectId, ...studentSubjectFilter(req.user) })
            .select("careerBridge.interviewQuestions._id careerBridge.interviewQuestions.isPremium careerBridge.codingLinks._id careerBridge.codingLinks.isPremium");
        if (!subject) return res.status(404).json({ success: false, message: "Subject not found." });
        const resources = resourceType === "INTERVIEW_QUESTION" ? subject.careerBridge?.interviewQuestions || [] : subject.careerBridge?.codingLinks || [];
        const resource = resources.find(item => item._id.toString() === resourceId);
        if (!resource) return res.status(404).json({ success: false, message: "Career resource not found." });
        if (resource.isPremium && !hasActivePremium(req.user)) return res.status(403).json({ success: false, message: "An active premium subscription is required to track this resource." });

        const key = { user: req.user._id, subject: subject._id, resourceType, resourceId: new mongoose.Types.ObjectId(resourceId) };
        let record;
        try {
            record = await careerProgressModel.findOneAndUpdate(key, { $setOnInsert: { ...key, completed: false } }, { upsert: true, returnDocument: "after", setDefaultsOnInsert: true });
        } catch (error) {
            if (error.code !== 11000) throw error;
            record = await careerProgressModel.findOne(key);
        }
        if (completed) {
            const transitioned = await careerProgressModel.findOneAndUpdate(
                { _id: record._id, completed: { $ne: true } },
                { $set: { completed: true, completedAt: new Date(), activityLoggedAt: null } },
                { returnDocument: "after" }
            );
            record = transitioned || await careerProgressModel.findById(record._id);
            await ensureCompletionActivity(record);
        } else {
            record = await careerProgressModel.findOneAndUpdate(
                { _id: record._id, completed: true },
                { $set: { completed: false, completedAt: null, activityLoggedAt: null } },
                { returnDocument: "after" }
            ) || await careerProgressModel.findById(record._id);
        }
        return res.json({ success: true, resourceType, resourceId, completed: record.completed, completedAt: record.completedAt });
    } catch (error) {
        console.error("Set career resource progress error:", error);
        return res.status(500).json({ success: false, message: "Could not update career resource progress." });
    }
};

module.exports.getActivityHeatmap = async (req, res) => {
    try {
        const now = new Date();
        const today = startOfUtcDay(now);
        const currentWeekStart = new Date(today);
        currentWeekStart.setUTCDate(currentWeekStart.getUTCDate() - currentWeekStart.getUTCDay());
        const chartStart = new Date(currentWeekStart);
        chartStart.setUTCDate(chartStart.getUTCDate() - 52 * 7);
        const [recent, allActivityDays] = await Promise.all([
            userActivityModel.aggregate([
                { $match: { user: req.user._id, dayStart: { $gte: chartStart, $lte: today } } },
                { $group: {
                    _id: "$dayStart", total: { $sum: 1 },
                    interviewUnderstood: { $sum: { $cond: [{ $eq: ["$resourceType", "INTERVIEW_QUESTION"] }, 1, 0] } },
                    codingSolved: { $sum: { $cond: [{ $eq: ["$resourceType", "CODING_LINK"] }, 1, 0] } }
                } },
                { $sort: { _id: 1 } }
            ]),
            userActivityModel.distinct("dayStart", { user: req.user._id })
        ]);
        const activeKeys = new Set(allActivityDays.map(dateKey));
        let currentStreak = 0;
        let streakCursor = new Date(today);
        if (!activeKeys.has(dateKey(streakCursor))) streakCursor.setUTCDate(streakCursor.getUTCDate() - 1);
        while (activeKeys.has(dateKey(streakCursor))) { currentStreak += 1; streakCursor.setUTCDate(streakCursor.getUTCDate() - 1); }
        const sortedDates = [...activeKeys].sort();
        let longestStreak = 0, runningStreak = 0, previousDate = null;
        for (const key of sortedDates) {
            const currentDate = new Date(`${key}T00:00:00.000Z`);
            runningStreak = previousDate && currentDate.getTime() - previousDate.getTime() === 86400000 ? runningStreak + 1 : 1;
            longestStreak = Math.max(longestStreak, runningStreak);
            previousDate = currentDate;
        }
        return res.json({
            success: true,
            startDate: dateKey(chartStart),
            today: dateKey(today),
            days: recent.map(item => ({ date: dateKey(item._id), total: item.total, interviewUnderstood: item.interviewUnderstood, codingSolved: item.codingSolved })),
            currentStreak, longestStreak, activeDays: allActivityDays.length
        });
    } catch (error) {
        console.error("Get activity heatmap error:", error);
        return res.status(500).json({ success: false, message: "Could not load your activity history." });
    }
};

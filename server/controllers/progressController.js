const progressModel = require("../models/progress-model");
const subjectModel = require("../models/subject-model");


// ===============================
// 1️⃣ Show Progress Tracker Page
// ===============================
module.exports.showProgress = async (req, res) => {

    try {

        const userId = req.user._id;
        const subjectId = req.params.subjectId;

        const subject = await subjectModel.findById(subjectId);

        if (!subject) {
            req.flash("error", "Subject not found");
            return res.redirect("/subjects");
        }

        const progress = await progressModel.find({
            user: userId,
            subject: subjectId,
            completed: true
        });

        // -----------------------
        // Completed Topics Map
        // -----------------------

        const completedMap = {};

        progress.forEach(p => {
            completedMap[`${p.unitIndex}-${p.topicIndex}`] = true;
        });


        // -----------------------
        // Subject Progress
        // -----------------------

        let totalTopics = 0;
        let completedTopics = 0;

        // -----------------------
        // Unit Progress Array
        // -----------------------

        const unitProgress = [];

        subject.units.forEach((unit, uIndex) => {

            let unitTotal = 0;
            let unitCompleted = 0;

            unit.topics.forEach((topic, tIndex) => {

                totalTopics++;
                unitTotal++;

                if (completedMap[`${uIndex}-${tIndex}`]) {
                    completedTopics++;
                    unitCompleted++;
                }

            });

            const progressPercent = unitTotal === 0
                ? 0
                : Math.round((unitCompleted / unitTotal) * 100);

            unitProgress.push(progressPercent);

        });


        const subjectProgress = totalTopics === 0
            ? 0
            : Math.round((completedTopics / totalTopics) * 100);


        res.render("progress", {
            subject,
            completedMap,
            subjectProgress,
            unitProgress
        });

    } catch (err) {

        console.log(err);
        res.redirect("/subjects");

    }

};



// ===============================
// 2️⃣ Toggle Topic Completion
// ===============================
module.exports.toggleTopic = async (req, res) => {

    try {

        const { subjectId, unitIndex, topicIndex } = req.body;
        const userId = req.user._id;

        let progress = await progressModel.findOne({
            user: userId,
            subject: subjectId,
            unitIndex,
            topicIndex
        });

        if (progress) {

            progress.completed = !progress.completed;
            await progress.save();

        } else {

            await progressModel.create({
                user: userId,
                subject: subjectId,
                unitIndex,
                topicIndex,
                completed: true
            });

        }

        res.redirect("/progress/" + subjectId);

    } catch (err) {

        console.log(err);
        res.redirect("back");

    }

};
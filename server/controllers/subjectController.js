const subjectModel = require("../models/subject-model");


// =============================
// Show subjects for students
// =============================
module.exports.showSubjects = async (req, res) => {

    try {

        const { branch, semester } = req.user;

        const subjects = await subjectModel.find({
            branch,
            semester
        });

        res.render("subjects", {
            user: req.user,
            subjects
        });

    } catch (err) {

        console.log(err);
        res.status(500).render("500");

    }

};



// =============================
// View Single Subject
// =============================
module.exports.viewSubject = async (req, res) => {

    try {

        const { id } = req.params;

        const subject = await subjectModel.findById(id);

        if (!subject) {
            return res.status(404).render("404");
        }

        res.render("view-subject", { subject });

    } catch (err) {

        console.log(err);
        res.status(500).render("500");

    }

};



// =============================
// Admin: Add Subject
// =============================
module.exports.addSubject = async (req, res) => {

    try {

        const { name, branch, semester, units } = req.body;

        const formattedUnits = [];

        if (units) {

            Object.keys(units).forEach((key) => {

                const unit = units[key];

                const topics = unit.topics
                    ? unit.topics.split(",").map(t => ({ title: t.trim() }))
                    : [];

                formattedUnits.push({

                    unitNumber: unit.unitNumber,
                    unitTitle: unit.unitTitle,

                    topics,

                    notes: unit.notes
                        ? Object.values(unit.notes).filter(n => n.title || n.link)
                        : [],

                    books: unit.books
                        ? Object.values(unit.books).filter(b => b.title || b.link)
                        : [],

                    pyqs: unit.pyqs
                        ? Object.values(unit.pyqs).filter(p => p.title || p.link)
                        : [],

                    youtubeLinks: unit.youtubeLinks
                        ? Object.values(unit.youtubeLinks).filter(v => v.title || v.link)
                        : []

                });

            });

        }

        await subjectModel.create({

            name,
            branch,
            semester,
            units: formattedUnits

        });

        req.flash("success", "Subject added successfully");

        res.redirect("/admin");

    } catch (err) {

        console.log(err);
        res.status(500).render("500");

    }

};



// =============================
// Admin: Edit Subject
// =============================
module.exports.editSubject = async (req, res) => {

    try {

        const { id } = req.params;

        const subject = await subjectModel.findById(id);

        if (!subject) {

            req.flash("error", "Subject not found");
            return res.redirect("/admin");

        }

        res.render("edit-subject", { subject });

    } catch (err) {

        console.log(err);
        res.status(500).render("500");

    }

};



// =============================
// Admin: Update Subject
// =============================
module.exports.updateSubject = async (req, res) => {

    try {

        const { id } = req.params;
        const { name, branch, semester, units } = req.body;

        const formattedUnits = [];

        if (units) {

            Object.keys(units).forEach((key) => {

                const unit = units[key];

                const topics = unit.topics
                    ? unit.topics.split(",").map(t => ({ title: t.trim() }))
                    : [];

                formattedUnits.push({

                    unitNumber: unit.unitNumber,
                    unitTitle: unit.unitTitle,

                    topics,

                    notes: unit.notes
                        ? Object.values(unit.notes).filter(n => n.title || n.link)
                        : [],

                    books: unit.books
                        ? Object.values(unit.books).filter(b => b.title || b.link)
                        : [],

                    pyqs: unit.pyqs
                        ? Object.values(unit.pyqs).filter(p => p.title || p.link)
                        : [],

                    youtubeLinks: unit.youtubeLinks
                        ? Object.values(unit.youtubeLinks).filter(v => v.title || v.link)
                        : []

                });

            });

        }

        await subjectModel.findByIdAndUpdate(id, {

            name,
            branch,
            semester,
            units: formattedUnits

        });

        req.flash("success", "Subject updated successfully");

        res.redirect("/admin");

    } catch (err) {

        console.log(err);
        res.status(500).render("500");

    }

};


// =============================
// Show All Progress for students
// =============================
const progressModel = require("../models/progress-model");

module.exports.showAllProgress = async (req, res) => {
    try {

        const { branch, semester, _id: userId } = req.user;

        const subjects = await subjectModel.find({
            branch,
            semester
        });

        const subjectProgressMap = {};

        for (let subject of subjects) {

            const progress = await progressModel.find({
                user: userId,
                subject: subject._id,
                completed: true
            });

            const completedMap = {};

            progress.forEach(p => {
                completedMap[`${p.unitIndex}-${p.topicIndex}`] = true;
            });

            let totalTopics = 0;
            let completedTopics = 0;

            subject.units.forEach((unit, uIndex) => {

                unit.topics.forEach((topic, tIndex) => {

                    totalTopics++;

                    if (completedMap[`${uIndex}-${tIndex}`]) {
                        completedTopics++;
                    }

                });

            });

            const percent = totalTopics === 0
                ? 0
                : Math.round((completedTopics / totalTopics) * 100);

            subjectProgressMap[subject._id] = percent;

        }

        res.render("all-progress", {
            subjects,
            user: req.user,
            subjectProgressMap
        });

    } catch (err) {

        console.log(err);
        res.status(500).render("500");

    }
};



// =============================
// Admin: Delete Subject
// =============================
module.exports.deleteSubject = async (req, res) => {

    try {

        const { id } = req.params;

        await subjectModel.findByIdAndDelete(id);

        req.flash("success", "Subject deleted successfully");

        res.redirect("/admin");

    } catch (err) {

        console.log(err);
        res.status(500).render("500");

    }

};
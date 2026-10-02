const subjectModel = require("../../models/subject-model");

// 1. Get Subjects for Logged In Student
module.exports.getSubjects = async (req, res) => {
    try {
        const user = req.user;
        let query = {};

        if (user.track === "JEE" || user.track === "NEET") {
            query.track = user.track;
        } else {
            // University Track
            query.track = "UNIVERSITY";
            if (user.tenant) {
                query.tenant = user.tenant._id || user.tenant;
            }
            if (user.branch && user.branch !== "Not Set") {
                query.branch = user.branch;
            }
            if (user.semester) {
                query.semester = user.semester;
            }
        }

        const subjects = await subjectModel
            .find(query)
            .populate("tenant", "name shortCode")
            .sort({ name: 1 });

        return res.status(200).json({
            success: true,
            count: subjects.length,
            subjects
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
        const subject = await subjectModel
            .findById(id)
            .populate("tenant", "name shortCode");

        if (!subject) {
            return res.status(404).json({
                success: false,
                message: "Subject not found."
            });
        }

        return res.status(200).json({
            success: true,
            subject
        });

    } catch (err) {
        console.error("Get Subject Detail Error:", err);
        return res.status(500).json({
            success: false,
            message: "Failed to load subject: " + err.message
        });
    }
};

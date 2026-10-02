const subjectModel = require("../../models/subject-model");
const userModel = require("../../models/user-model");
const tenantModel = require("../../models/tenant-model");
const progressModel = require("../../models/progress-model");

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
            filter.tenant = tenantId;
        }
        if (track && track !== "ALL") {
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
        const { name, courseCode, track, tenantId, branch, semester, examCategory, units } = req.body;

        if (!name) {
            return res.status(400).json({
                success: false,
                message: "Subject name is required."
            });
        }

        const newSubject = await subjectModel.create({
            name,
            courseCode,
            track: track || "UNIVERSITY",
            tenant: tenantId || null,
            branch: branch ? branch.toUpperCase().trim() : undefined,
            semester: semester ? Number(semester) : undefined,
            examCategory,
            units: units || []
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
        const updateData = req.body;

        const updated = await subjectModel
            .findByIdAndUpdate(id, updateData, { new: true })
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

        await subjectModel.findByIdAndDelete(id);
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
            filter.tenant = tenantId;
        }
        if (role && role !== "ALL") {
            filter.role = role;
        }
        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: "i" } },
                { email: { $regex: search, $options: "i" } },
                { college: { $regex: search, $options: "i" } }
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

        if (id === req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: "Security Alert: You cannot delete your own administrative account."
            });
        }

        await userModel.findByIdAndDelete(id);
        await progressModel.deleteMany({ user: id });

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

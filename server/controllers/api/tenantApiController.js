const tenantModel = require("../../models/tenant-model");
const userModel = require("../../models/user-model");
const mongoose = require("mongoose");
const { normalizeBranch } = require("../../utils/branch");
const { isBranchAvailableForTenant } = require("../../utils/tenantBranches");

// 1. Get All Active Tenants (Universities & Competitive Tracks)
module.exports.getTenants = async (req, res) => {
    try {
        const tenants = await tenantModel.find({ active: true }).sort({ name: 1 });
        return res.status(200).json({
            success: true,
            tenants
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: "Failed to fetch universities: " + err.message
        });
    }
};

// 2. Get Single Tenant with Affiliated Colleges
module.exports.getTenantById = async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({ success: false, message: "Invalid institution id." });
        }
        const tenant = await tenantModel.findOne({ _id: req.params.id, active: true });
        if (!tenant) {
            return res.status(404).json({
                success: false,
                message: "Institution not found."
            });
        }
        return res.status(200).json({
            success: true,
            tenant
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: "Failed to fetch institution: " + err.message
        });
    }
};

// 3. Resolve Domain from Email
module.exports.resolveDomain = async (req, res) => {
    try {
        const { email } = req.body;
        if (typeof email !== "string" || !/^\S+@\S+\.\S+$/.test(email.trim())) {
            return res.status(400).json({
                success: false,
                message: "Valid email address required."
            });
        }

        const domain = email.trim().split("@")[1].toLowerCase();

        // 1. Search tenant by global domain or affiliated college domain
        const matchedTenant = await tenantModel.findOne({
            $or: [
                { domains: domain },
                { "affiliatedColleges.domain": domain }
            ],
            active: true
        });

        if (!matchedTenant) {
            return res.status(200).json({
                success: true,
                matched: false,
                message: "No automatic university match for this domain."
            });
        }

        let collegeName = "Direct University Enrollment";
        const matchedCollege = matchedTenant.affiliatedColleges.find(c => c.domain === domain);
        if (matchedCollege) {
            collegeName = matchedCollege.name;
        }

        return res.status(200).json({
            success: true,
            matched: true,
            tenant: {
                id: matchedTenant._id,
                name: matchedTenant.name,
                shortCode: matchedTenant.shortCode,
                state: matchedTenant.state
            },
            college: collegeName
        });

    } catch (err) {
        return res.status(500).json({
            success: false,
            message: "Domain check failed: " + err.message
        });
    }
};

// 4. Complete Onboarding Profile
module.exports.completeOnboarding = async (req, res) => {
    try {
        const {
            track,
            tenantId,
            college,
            branch,
            year,
            semester,
            targetExam,
            targetYear
        } = req.body;

        const userId = req.user._id;
        const selectedTrack = track || "UNIVERSITY";
        if (!["UNIVERSITY", "JEE", "NEET"].includes(selectedTrack)) {
            return res.status(400).json({ success: false, message: "Select a valid learning track." });
        }

        const updatePayload = { track: selectedTrack, onboardingCompleted: true };

        if (selectedTrack === "JEE" || selectedTrack === "NEET") {
            const selectedExam = targetExam || (selectedTrack === "JEE" ? "JEE_MAINS" : "NEET");
            const examYear = Number(targetYear || new Date().getFullYear() + 1);
            if (!["JEE_MAINS", "JEE_ADVANCED", "NEET"].includes(selectedExam) || (selectedTrack === "NEET") !== (selectedExam === "NEET")) {
                return res.status(400).json({ success: false, message: "Select an exam that matches your learning track." });
            }
            if (!Number.isInteger(examYear) || examYear < 2020 || examYear > 2100) {
                return res.status(400).json({ success: false, message: "Select a valid examination year." });
            }
            updatePayload.targetExam = selectedExam;
            updatePayload.targetYear = examYear;
            // Link to national competitive track tenant if available
            const compTenant = await tenantModel.findOne({ shortCode: "COMPETITIVE", active: true });
            if (compTenant) {
                updatePayload.tenant = compTenant._id;
            } else {
                updatePayload.tenant = null;
            }
        } else {
            if (typeof tenantId !== "string" || !mongoose.isValidObjectId(tenantId)) {
                return res.status(400).json({ success: false, message: "Choose a valid university." });
            }
            const tenant = await tenantModel.findOne({ _id: tenantId, type: "UNIVERSITY", active: true }).select("_id");
            if (!tenant) return res.status(400).json({ success: false, message: "The selected university is unavailable." });
            const yearValue = Number(year);
            const semesterValue = Number(semester);
            if (typeof college !== "string" || !college.trim() || college.trim() === "Other") {
                return res.status(400).json({ success: false, message: "Enter or select your college or campus." });
            }
            if (typeof branch !== "string" || !branch.trim()) {
                return res.status(400).json({ success: false, message: "Enter your branch." });
            }
            if (!await isBranchAvailableForTenant(tenant._id, branch)) {
                return res.status(400).json({ success: false, message: "Choose a branch listed for your selected university." });
            }
            if (!Number.isInteger(yearValue) || yearValue < 1 || yearValue > 4 || !Number.isInteger(semesterValue) || semesterValue < 1 || semesterValue > 8 || ![yearValue * 2 - 1, yearValue * 2].includes(semesterValue)) {
                return res.status(400).json({ success: false, message: "Choose a semester within your selected year." });
            }
            updatePayload.tenant = tenant._id;
            updatePayload.college = college.trim();
            updatePayload.branch = normalizeBranch(branch);
            updatePayload.year = yearValue;
            updatePayload.semester = semesterValue;
        }

        const updatedUser = await userModel
            .findByIdAndUpdate(userId, updatePayload, { returnDocument: "after", runValidators: true })
            .populate("tenant", "name shortCode type state")
            .select("-password");

        return res.status(200).json({
            success: true,
            message: "Academic profile successfully configured!",
            user: updatedUser
        });

    } catch (err) {
        return res.status(500).json({
            success: false,
            message: "Failed to complete onboarding: " + err.message
        });
    }
};

const tenantModel = require("../../models/tenant-model");
const userModel = require("../../models/user-model");

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
        const tenant = await tenantModel.findById(req.params.id);
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
        if (!email || !email.includes("@")) {
            return res.status(400).json({
                success: false,
                message: "Valid email address required."
            });
        }

        const domain = email.split("@")[1].toLowerCase().trim();

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
        const updatePayload = {
            track: track || "UNIVERSITY",
            onboardingCompleted: true
        };

        if (track === "JEE" || track === "NEET") {
            updatePayload.targetExam = targetExam || (track === "JEE" ? "JEE_MAINS" : "NEET");
            updatePayload.targetYear = targetYear || new Date().getFullYear() + 1;
            // Link to national competitive track tenant if available
            const compTenant = await tenantModel.findOne({ shortCode: "COMPETITIVE" });
            if (compTenant) {
                updatePayload.tenant = compTenant._id;
            }
        } else {
            // University Track
            if (tenantId) updatePayload.tenant = tenantId;
            if (college) updatePayload.college = college;
            if (branch) updatePayload.branch = branch.toUpperCase().trim();
            if (year) updatePayload.year = Number(year);
            if (semester) updatePayload.semester = Number(semester);
        }

        const updatedUser = await userModel
            .findByIdAndUpdate(userId, updatePayload, { new: true })
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

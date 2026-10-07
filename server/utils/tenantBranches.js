const Subject = require("../models/subject-model");
const { normalizeBranch, COMMON_BRANCHES } = require("./branch");

async function getAvailableBranches(tenantId) {
    const savedBranches = await Subject.distinct("branch", {
        tenant: tenantId,
        track: "UNIVERSITY",
        branch: { $exists: true, $nin: ["", "Not Set"] }
    });
    return [...new Set(savedBranches.map(normalizeBranch).filter(Boolean))].sort((a, b) => a.localeCompare(b));
}

async function isBranchAvailableForTenant(tenantId, value) {
    const configuredBranches = await getAvailableBranches(tenantId);
    const allowedBranches = configuredBranches.length ? configuredBranches : COMMON_BRANCHES;
    return allowedBranches.includes(normalizeBranch(value));
}

module.exports = { getAvailableBranches, isBranchAvailableForTenant };

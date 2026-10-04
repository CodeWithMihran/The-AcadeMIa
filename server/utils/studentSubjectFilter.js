/** Build the catalog scope that a signed-in student is allowed to access. */
module.exports = function studentSubjectFilter(user) {
    if (user.track === "JEE" || user.track === "NEET") {
        return { track: user.track };
    }

    const tenantId = user.tenant?._id || user.tenant || null;
    const filter = { track: "UNIVERSITY", tenant: tenantId };
    if (user.branch && user.branch !== "Not Set") filter.branch = user.branch;
    if (user.semester) filter.semester = user.semester;
    return filter;
};

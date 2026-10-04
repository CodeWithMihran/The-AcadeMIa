const { createHash } = require("crypto");
const ApiRateLimit = require("../models/api-rate-limit-model");

// These counters are stored in MongoDB so restarts and additional API
// instances do not reset or bypass Subject Vault scraping limits.
const WINDOW_MS = 5 * 60 * 1000;
const MAX_REQUESTS = 120;

const bucketId = (identity, windowId) => createHash("sha256")
    .update(`${identity}:${windowId}`)
    .digest("hex");

const incrementBucket = async (id, resetAt) => {
    try {
        return await ApiRateLimit.findOneAndUpdate(
            { _id: id },
            { $inc: { count: 1 }, $setOnInsert: { expiresAt: new Date(resetAt + WINDOW_MS) } },
            { upsert: true, returnDocument: "after", setDefaultsOnInsert: false }
        ).lean();
    } catch (err) {
        // Simultaneous first requests may race to insert this unique _id.
        if (err.code !== 11000) throw err;
        return ApiRateLimit.findOneAndUpdate(
            { _id: id },
            { $inc: { count: 1 } },
            { returnDocument: "after" }
        ).lean();
    }
};

module.exports = async function subjectVaultRateLimit(req, res, next) {
    const now = Date.now();
    const windowId = Math.floor(now / WINDOW_MS);
    const resetAt = (windowId + 1) * WINDOW_MS;
    const identities = [`user:${req.user?._id || "unknown"}`];
    if (req.ip) identities.push(`ip:${req.ip}`);

    try {
        const buckets = await Promise.all(identities.map(identity => incrementBucket(bucketId(identity, windowId), resetAt)));
        const count = Math.max(...buckets.map((bucket) => bucket.count));
        const remaining = Math.max(0, MAX_REQUESTS - count);

        res.setHeader("RateLimit-Limit", String(MAX_REQUESTS));
        res.setHeader("RateLimit-Remaining", String(remaining));
        res.setHeader("RateLimit-Reset", String(Math.ceil(resetAt / 1000)));
        if (count > MAX_REQUESTS) {
            res.setHeader("Retry-After", String(Math.max(1, Math.ceil((resetAt - now) / 1000))));
            return res.status(429).json({
                success: false,
                message: "Too many Subject Vault requests. Please wait a few minutes and try again."
            });
        }

        return next();
    } catch (err) {
        console.error("Subject Vault rate-limit store error:", err.message);
        return res.status(503).json({
            success: false,
            message: "Subject Vault is temporarily unavailable. Please try again shortly."
        });
    }
};

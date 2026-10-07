const { createHash } = require("crypto");
const ApiRateLimit = require("../models/api-rate-limit-model");

async function incrementBucket(id, expiresAt) {
    try {
        return await ApiRateLimit.findOneAndUpdate(
            { _id: id },
            { $inc: { count: 1 }, $setOnInsert: { expiresAt: new Date(expiresAt) } },
            { upsert: true, returnDocument: "after", setDefaultsOnInsert: false }
        ).lean();
    } catch (error) {
        // Concurrent first requests can race to create the same fixed-window bucket.
        if (error.code !== 11000) throw error;
        return ApiRateLimit.findOneAndUpdate(
            { _id: id },
            { $inc: { count: 1 } },
            { returnDocument: "after" }
        ).lean();
    }
}

function bucketId(action, identity, windowId) {
    return createHash("sha256").update(`auth:${action}:${identity}:${windowId}`).digest("hex");
}

/** Persistent auth throttling; only hashes of IP/email identities are stored. */
module.exports = function authActionLimit({ action, limit, windowMs, identityForRequest }) {
    return async function limitAuthAction(req, res, next) {
        const now = Date.now();
        const windowId = Math.floor(now / windowMs);
        const resetAt = (windowId + 1) * windowMs;
        const identity = identityForRequest(req);
        const id = bucketId(action, identity, windowId);

        try {
            const bucket = await incrementBucket(id, resetAt + windowMs);
            res.setHeader("RateLimit-Limit", String(limit));
            res.setHeader("RateLimit-Remaining", String(Math.max(0, limit - bucket.count)));
            res.setHeader("RateLimit-Reset", String(Math.ceil(resetAt / 1000)));
            if (bucket.count > limit) {
                res.setHeader("Retry-After", String(Math.max(1, Math.ceil((resetAt - now) / 1000))));
                return res.status(429).json({
                    success: false,
                    message: "Too many authentication attempts. Please wait a few minutes and try again."
                });
            }
            return next();
        } catch (error) {
            console.error("Authentication rate-limit store error:", error.message);
            return res.status(503).json({
                success: false,
                message: "Authentication is temporarily unavailable. Please try again shortly."
            });
        }
    };
};

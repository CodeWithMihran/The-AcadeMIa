const { createHash } = require("crypto");
const ApiRateLimit = require("../models/api-rate-limit-model");

function increment(id, expiresAt) {
    return ApiRateLimit.findOneAndUpdate(
        { _id: id },
        { $inc: { count: 1 }, $setOnInsert: { expiresAt: new Date(expiresAt) } },
        { upsert: true, returnDocument: "after", setDefaultsOnInsert: false }
    ).lean().catch((error) => {
        if (error.code !== 11000) throw error;
        return ApiRateLimit.findOneAndUpdate({ _id: id }, { $inc: { count: 1 } }, { returnDocument: "after" }).lean();
    });
}

module.exports = function communityActionLimit({ action, limit, windowMs }) {
    return async function (req, res, next) {
        const now = Date.now();
        const windowId = Math.floor(now / windowMs);
        const id = createHash("sha256").update(`community:${action}:${req.user._id}:${windowId}`).digest("hex");
        try {
            const bucket = await increment(id, (windowId + 1) * windowMs + windowMs);
            res.setHeader("RateLimit-Limit", String(limit));
            res.setHeader("RateLimit-Remaining", String(Math.max(0, limit - bucket.count)));
            if (bucket.count > limit) {
                res.setHeader("Retry-After", String(Math.max(1, Math.ceil((((windowId + 1) * windowMs) - now) / 1000))));
                return res.status(429).json({ success: false, message: "Too many community actions. Please try again later." });
            }
            return next();
        } catch (error) {
            console.error("Community action limit store error:", error.message);
            return res.status(503).json({ success: false, message: "Community tools are temporarily unavailable." });
        }
    };
};

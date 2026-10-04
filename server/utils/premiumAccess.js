/**
 * Premium access is derived from the persisted user entitlement. No request
 * header, query parameter, or UI flag can grant access.
 */
module.exports.hasActivePremium = (user, now = Date.now()) => {
    const subscription = user?.premiumSubscription;
    const expiresAt = subscription?.currentPeriodEnd
        ? new Date(subscription.currentPeriodEnd).getTime()
        : 0;

    return subscription?.status === "ACTIVE" && Number.isFinite(expiresAt) && expiresAt > now;
};

const redactPremiumItem = (item) => {
    const safeItem = { ...item };
    ["question", "answerMarkdown", "answer", "solution", "explanation", "url", "link"].forEach((field) => delete safeItem[field]);
    return safeItem;
};

module.exports.filterSubjectForStudent = (subject, hasPremiumAccess) => {
    const result = typeof subject?.toObject === "function" ? subject.toObject() : { ...subject };
    if (hasPremiumAccess || !result.careerBridge) return result;

    const bridge = result.careerBridge;
    bridge.interviewQuestions = (bridge.interviewQuestions || []).map((item) =>
        item.isPremium ? redactPremiumItem(item) : item
    );
    bridge.codingLinks = (bridge.codingLinks || []).map((item) =>
        item.isPremium ? redactPremiumItem(item) : item
    );
    if (bridge.gate) {
        bridge.gate.pyqs = (bridge.gate.pyqs || []).map((item) =>
            item.isPremium ? redactPremiumItem(item) : item
        );
    }

    return result;
};

const BRANCH_ALIASES = {
    CSE: ["COMPUTER SCIENCE", "COMPUTER SCIENCE ENGINEERING", "COMPUTER SCIENCE AND ENGINEERING", "COMPUTER SCIENCE & ENGINEERING"],
    AIML: ["AI ML", "AI/ML", "AI & ML", "AI AND ML", "ARTIFICIAL INTELLIGENCE AND MACHINE LEARNING", "ARTIFICIAL INTELLIGENCE & MACHINE LEARNING"],
    AIDS: ["AI DS", "AI/DS", "AI & DS", "AI AND DATA SCIENCE", "ARTIFICIAL INTELLIGENCE AND DATA SCIENCE"],
    ECE: ["ELECTRONICS AND COMMUNICATION", "ELECTRONICS AND COMMUNICATION ENGINEERING", "ELECTRONICS & COMMUNICATION ENGINEERING"],
    EEE: ["ELECTRICAL AND ELECTRONICS", "ELECTRICAL AND ELECTRONICS ENGINEERING", "ELECTRICAL & ELECTRONICS ENGINEERING"],
    ME: ["MECHANICAL", "MECHANICAL ENGINEERING"],
    CE: ["CIVIL", "CIVIL ENGINEERING"],
    IT: ["INFORMATION TECHNOLOGY"],
};
const COMMON_BRANCHES = Object.freeze(["CSE", "AIML", "AIDS", "IT", "ECE", "EEE", "EE", "ME", "CE", "CHE", "BT"]);

const normalizeToken = (value) => String(value || "")
    .trim()
    .toUpperCase()
    .replace(/&/g, " AND ")
    .replace(/[/.]+/g, " ")
    .replace(/[^A-Z0-9 -]/g, "")
    .replace(/\s+/g, " ")
    .trim();

const canonicalByAlias = new Map(Object.entries(BRANCH_ALIASES).flatMap(([canonical, aliases]) => [
    [normalizeToken(canonical), canonical],
    ...aliases.map((alias) => [normalizeToken(alias), canonical]),
]));

const normalizeBranch = (value) => {
    const trimmed = String(value || "").trim();
    if (!trimmed) return "";
    const token = normalizeToken(trimmed);
    return canonicalByAlias.get(token) || trimmed.toUpperCase().replace(/\s+/g, " ");
};

const branchQueryValues = (value) => {
    const canonical = normalizeBranch(value);
    if (!canonical) return [];
    const aliases = BRANCH_ALIASES[canonical] || [];
    return [...new Set([canonical, ...aliases.map((alias) => alias.toUpperCase().replace(/\s+/g, " "))])];
};

module.exports = { normalizeBranch, branchQueryValues, COMMON_BRANCHES };

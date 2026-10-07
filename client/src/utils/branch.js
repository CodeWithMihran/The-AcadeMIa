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

const normalizeToken = (value) => String(value || "")
  .trim()
  .toUpperCase()
  .replace(/&/g, " AND ")
  .replace(/[/.]+/g, " ")
  .replace(/[^A-Z0-9 -]/g, "")
  .replace(/\s+/g, " ")
  .trim();

const CANONICAL_BRANCHES = Object.entries(BRANCH_ALIASES).flatMap(([canonical, aliases]) => [
  [normalizeToken(canonical), canonical],
  ...aliases.map((alias) => [normalizeToken(alias), canonical]),
]);
const CANONICAL_BY_ALIAS = new Map(CANONICAL_BRANCHES);

export const normalizeBranch = (value) => {
  const trimmed = String(value || "").trim();
  if (!trimmed) return "";
  const token = normalizeToken(trimmed);
  return CANONICAL_BY_ALIAS.get(token) || trimmed.toUpperCase().replace(/\s+/g, " ");
};

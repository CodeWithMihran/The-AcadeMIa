/** Shared frontend option values. Server-side schemas remain authoritative. */
export const TRACKS = Object.freeze({
  UNIVERSITY: "UNIVERSITY",
  JEE: "JEE",
  NEET: "NEET",
});
export const SUBJECT_TRACKS = Object.freeze(Object.values(TRACKS));

/** Used when a selected university has not had its first subject branch configured yet. */
export const UNIVERSITY_BRANCHES = Object.freeze(["CSE", "AIML", "AIDS", "IT", "ECE", "EEE", "EE", "ME", "CE", "CHE", "BT"]);

export const TARGET_EXAMS = Object.freeze({
  JEE_MAINS: "JEE_MAINS",
  JEE_ADVANCED: "JEE_ADVANCED",
  NEET: "NEET",
});

export const DIFFICULTY_LEVELS = Object.freeze(["Easy", "Medium", "Hard"]);
export const DIFFICULTY_RANK = Object.freeze({ Easy: 1, Medium: 2, Hard: 3 });

export const CODING_PLATFORMS = Object.freeze([
  "LeetCode",
  "GeeksforGeeks",
  "HackerRank",
  "Codeforces",
  "Other",
]);

export const ASSESSMENT_CATEGORIES = Object.freeze([
  { value: "MIDTERM", label: "Mid-term" },
  { value: "CLASS_TEST", label: "Class test" },
  { value: "LAB_VIVA", label: "Lab viva" },
  { value: "OTHER", label: "Other" },
]);

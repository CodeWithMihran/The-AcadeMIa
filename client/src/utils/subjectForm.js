import { z } from "zod";
import { SUBJECT_TRACKS, TRACKS } from "../constants";
import { emptyCareerBridge } from "./careerBridge";
import { emptyQuickSummary, emptyRapidRevision } from "./examNight";

export const blankSubjectResource = () => ({ title: "", link: "" });

export const blankSubjectUnit = ({ editing = false, unitNumber = 1 } = {}) => ({
  unitNumber,
  unitTitle: "",
  topics: "",
  ...(editing ? { originalTopics: [] } : {}),
  notes: [blankSubjectResource()],
  books: [blankSubjectResource()],
  pyqs: [blankSubjectResource()],
  youtubeLinks: [blankSubjectResource()],
  examYearsCoveredText: "",
  examQuestions: [],
  rapidRevision: emptyRapidRevision(),
  quickSummary: emptyQuickSummary(),
});

const resourceSchema = z.object({ title: z.string().max(300), link: z.string().max(2048) }).passthrough();
const examNightQuestionSchema = z.object({
  question: z.string().max(2000),
  topic: z.string().max(160),
  year: z.union([z.string(), z.number()]),
  marks: z.union([z.string(), z.number(), z.null()]).optional(),
  sourceLabel: z.string().max(160),
  sourceUrl: z.string().max(2048).optional(),
}).passthrough();
const contentSchema = z.object({
  formulas: z.string().max(12000), derivations: z.string().max(12000),
  diagrams: z.string().max(12000), keyPoints: z.string().max(12000),
}).passthrough();
const summarySchema = z.object({
  definition: z.string().max(12000), diagram: z.string().max(12000),
  workingPrinciple: z.string().max(12000), advantages: z.string().max(12000),
  disadvantages: z.string().max(12000),
}).passthrough();
const unitSchema = z.object({
  unitTitle: z.string().max(160),
  topics: z.union([z.string(), z.array(z.unknown())]),
  notes: z.array(resourceSchema).max(100),
  books: z.array(resourceSchema).max(100),
  pyqs: z.array(resourceSchema).max(100),
  youtubeLinks: z.array(resourceSchema).max(100),
  examYearsCoveredText: z.string(),
  examQuestions: z.array(examNightQuestionSchema).max(300),
  rapidRevision: contentSchema,
  quickSummary: summarySchema,
}).passthrough();

export const subjectEditorSchema = z.object({
  name: z.string().trim().min(2, "Subject name must contain at least 2 characters.").max(120),
  courseCode: z.string().max(80),
  credits: z.union([z.string(), z.number()]),
  track: z.enum(SUBJECT_TRACKS),
  tenantId: z.string(),
  branch: z.string().max(80),
  semester: z.union([z.string(), z.number()]),
  examCategory: z.string(),
  careerBridge: z.record(z.string(), z.unknown()),
  units: z.array(unitSchema).min(1, "Add at least one curriculum unit.").max(100, "A subject can have at most 100 units."),
}).superRefine((data, context) => {
  if (data.track === TRACKS.UNIVERSITY) {
    if (!data.tenantId) context.addIssue({ code: "custom", path: ["tenantId"], message: "Select a university." });
    if (!data.branch.trim()) context.addIssue({ code: "custom", path: ["branch"], message: "Enter a branch." });
    const semester = Number(data.semester);
    if (!Number.isInteger(semester) || semester < 1 || semester > 8) context.addIssue({ code: "custom", path: ["semester"], message: "Semester must be between 1 and 8." });
    const credits = Number(data.credits);
    if (!Number.isFinite(credits) || credits <= 0 || credits > 100) context.addIssue({ code: "custom", path: ["credits"], message: "Course credits must be greater than 0 and at most 100." });
  }
});

export function emptySubjectEditorValues({ universityId = "", editing = false } = {}) {
  return {
    name: "", courseCode: "", credits: "", track: TRACKS.UNIVERSITY,
    tenantId: universityId, branch: "", semester: 1, examCategory: "JEE_MAINS",
    units: [blankSubjectUnit({ editing })], careerBridge: emptyCareerBridge(),
  };
}

export function subjectToEditorValues(subject, editing = false) {
  return {
    name: subject.name || "",
    courseCode: subject.courseCode || "",
    credits: subject.credits ?? "",
    track: subject.track || TRACKS.UNIVERSITY,
    tenantId: subject.tenant?._id || subject.tenant || "",
    branch: subject.branch || "",
    semester: Number(subject.semester) || 1,
    examCategory: subject.examCategory || "JEE_MAINS",
    careerBridge: subject.careerBridge ? {
      ...emptyCareerBridge(),
      ...subject.careerBridge,
      interviewQuestions: (subject.careerBridge.interviewQuestions || []).map((question) => ({
        ...question,
        companies: question.companies?.length ? question.companies : (question.company ? [question.company] : []),
      })),
    } : emptyCareerBridge(),
    units: (subject.units || []).map((unit, index) => ({
      unitNumber: Number(unit.unitNumber) || index + 1,
      unitTitle: unit.unitTitle || "",
      topics: unit.topics ? unit.topics.map((topic) => topic.title).join(", ") : "",
      ...(editing ? { originalTopics: unit.topics || [] } : {}),
      notes: unit.notes?.length ? unit.notes.map((item) => ({ ...blankSubjectResource(), ...item })) : [blankSubjectResource()],
      books: unit.books?.length ? unit.books.map((item) => ({ ...blankSubjectResource(), ...item })) : [blankSubjectResource()],
      pyqs: unit.pyqs?.length ? unit.pyqs.map((item) => ({ ...blankSubjectResource(), ...item })) : [blankSubjectResource()],
      youtubeLinks: unit.youtubeLinks?.length ? unit.youtubeLinks.map((item) => ({ ...blankSubjectResource(), ...item })) : [blankSubjectResource()],
      examYearsCoveredText: (unit.examYearsCovered || []).join(", "),
      examQuestions: (unit.examQuestions || []).map((question) => ({
        question: "", topic: "", year: "", marks: "", sourceLabel: "", sourceUrl: "", ...question,
      })),
      rapidRevision: { ...emptyRapidRevision(), ...(unit.rapidRevision || {}) },
      quickSummary: { ...emptyQuickSummary(), ...(unit.quickSummary || {}) },
    })),
  };
}

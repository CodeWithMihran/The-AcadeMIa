export const emptyRapidRevision = () => ({ formulas: "", derivations: "", diagrams: "", keyPoints: "" });
export const emptyQuickSummary = () => ({ definition: "", diagram: "", workingPrinciple: "", advantages: "", disadvantages: "" });
export const blankExamQuestion = () => ({ question: "", topic: "", year: "", marks: "", sourceLabel: "", sourceUrl: "" });

export function prepareExamNightUnit(unit) {
  const { examYearsCoveredText = "", ...rest } = unit;
  const examYearsCovered = [...new Set(String(examYearsCoveredText).split(/[\s,;]+/).map(Number).filter(year => Number.isInteger(year) && year >= 1980 && year <= 2100))];
  const examQuestions = (unit.examQuestions || [])
    .filter(item => Object.values(item).some(value => String(value ?? "").trim()))
    .map(item => ({
      ...item,
      year: Number(item.year),
      marks: item.marks === "" || item.marks == null ? null : Number(item.marks),
      sourceUrl: item.sourceUrl?.trim() || ""
    }));
  return {
    ...rest,
    examYearsCovered,
    examQuestions,
    rapidRevision: unit.rapidRevision || emptyRapidRevision(),
    quickSummary: unit.quickSummary || emptyQuickSummary()
  };
}

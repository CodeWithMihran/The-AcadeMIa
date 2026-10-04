export const emptyCareerBridge = () => ({
  interviewQuestions: [], codingLinks: [],
  gate: { examCode: "GATE CS", weightageMinMarks: "", weightageMaxMarks: "", weightagePeriod: "", pyqs: [] }
});

export const prepareCareerBridge = (value = {}) => {
  const data = { ...emptyCareerBridge(), ...value, gate: { ...emptyCareerBridge().gate, ...(value.gate || {}) } };
  const cleanRows = rows => rows.filter(row => Object.values(row).some(v => v !== "" && v !== false && v != null));
  const validUrl = url => { try { return ["http:", "https:"].includes(new URL(url).protocol); } catch { return false; } };
  const interviewQuestions = (data.interviewQuestions || []).filter(row =>
    row.question?.trim() || row.answerMarkdown?.trim() || row.companies?.length || row.company?.trim() || row.topic?.trim() || row.isPremium
  );
  const codingLinks = (data.codingLinks || []).filter(row => row.title?.trim() || row.url?.trim() || row.topic?.trim() || row.isPremium);
  const pyqs = cleanRows(data.gate.pyqs || []);
  if (interviewQuestions.some(row => !row.question?.trim())) throw new Error("Complete or remove each interview question before saving.");
  if (codingLinks.some(row => !row.title?.trim() || !validUrl(row.url || ""))) throw new Error("Each coding practice item needs a title and a valid HTTP(S) URL.");
  if (pyqs.some(row => !row.title?.trim() || !validUrl(row.url || ""))) throw new Error("Each GATE PYQ needs a title and a valid HTTP(S) URL.");
  const min = data.gate.weightageMinMarks === "" || data.gate.weightageMinMarks == null ? null : Number(data.gate.weightageMinMarks);
  const max = data.gate.weightageMaxMarks === "" || data.gate.weightageMaxMarks == null ? null : Number(data.gate.weightageMaxMarks);
  if (min != null && max != null && min > max) throw new Error("GATE weightage minimum cannot exceed its maximum.");
  return {
    interviewQuestions: interviewQuestions.map(({ _id, company, ...row }) => ({
      ...row,
      companies: [...new Set([...(Array.isArray(row.companies) ? row.companies : (company ? [company] : String(row.companies || "").split(",")))]
        .map(value => String(value).trim()).filter(Boolean))]
    })),
    codingLinks: codingLinks.map(({ _id, ...row }) => row),
    gate: { ...data.gate, weightageMinMarks: min, weightageMaxMarks: max,
      pyqs: pyqs.map(({ _id, ...row }) => ({ ...row, year: row.year ? Number(row.year) : undefined })) }
  };
};

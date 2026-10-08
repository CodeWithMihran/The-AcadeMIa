export interface AttendanceInput {
  classesHeld: number | string;
  classesAttended: number | string;
  threshold: number | string;
}

export function attendanceForecast(input: AttendanceInput): {
  percent: number | null;
  message: string;
  error?: string;
} {
  if ([input.classesHeld, input.classesAttended, input.threshold].some(value => String(value).trim() === '')) {
    return {percent: null, message: '', error: 'Enter class totals and the required attendance percentage.'};
  }
  const held = Number(input.classesHeld);
  const attended = Number(input.classesAttended);
  const threshold = Number(input.threshold);
  if (!Number.isInteger(held) || held < 0 || held > 100000) {
    return {percent: null, message: '', error: 'Classes held must be a whole number from 0 to 100,000.'};
  }
  if (!Number.isInteger(attended) || attended < 0 || attended > held) {
    return {percent: null, message: '', error: 'Classes attended must be between zero and classes held.'};
  }
  if (!Number.isFinite(threshold) || threshold < 1 || threshold > 100) {
    return {percent: null, message: '', error: 'Required attendance must be between 1% and 100%.'};
  }
  if (held === 0) return {percent: null, message: 'Add your first class to see a forecast.'};

  const percent = (attended / held) * 100;
  if (percent + Number.EPSILON >= threshold) {
    const safeMisses = Math.max(0, Math.floor(attended / (threshold / 100) - held + 1e-9));
    return {
      percent,
      message: safeMisses > 0
        ? `You can miss ${safeMisses} more ${safeMisses === 1 ? 'class' : 'classes'} and stay at or above ${threshold}%.`
        : `Attend the next class; there is no safe miss buffer at ${threshold}%.`,
    };
  }
  if (threshold === 100) {
    return {percent, message: 'A 100% threshold cannot be recovered after a missed class. Attend every remaining class.'};
  }
  const mustAttend = Math.ceil(((threshold / 100) * held - attended) / (1 - threshold / 100));
  return {percent, message: `Attend the next ${mustAttend} ${mustAttend === 1 ? 'class' : 'classes'} in a row to recover to ${threshold}%.`};
}

export function gradePointForPercent(percent: number, gradeScale: Array<{minimumPercent: number; gradePoint: number}>): number | null {
  if (!Number.isFinite(percent) || percent < 0 || percent > 100) return null;
  const sorted = [...gradeScale].sort((a, b) => b.minimumPercent - a.minimumPercent);
  return sorted.find(band => percent >= Number(band.minimumPercent))?.gradePoint ?? null;
}

export function calculateSgpa(
  projections: Array<{credits: number; percent: number | string}>,
  gradeScale: Array<{minimumPercent: number; gradePoint: number}>,
): number | null {
  let weightedGradePoints = 0;
  let totalCredits = 0;
  for (const projection of projections) {
    const credits = Number(projection.credits);
    const percent = Number(projection.percent);
    if (!Number.isFinite(credits) || credits <= 0 || !Number.isFinite(percent)) continue;
    const point = gradePointForPercent(percent, gradeScale);
    if (point === null) continue;
    totalCredits += credits;
    weightedGradePoints += credits * point;
  }
  return totalCredits > 0 ? weightedGradePoints / totalCredits : null;
}

export function calculateCgpa(
  previousCgpa: number | string,
  completedCredits: number | string,
  currentSgpa: number | null,
  currentCredits: number,
): number | null {
  const prior = Number(previousCgpa);
  const priorCredits = Number(completedCredits);
  if (!Number.isFinite(prior) || !Number.isFinite(priorCredits) || prior < 0 || priorCredits < 0) return null;
  if (currentSgpa === null || currentCredits <= 0) return null;
  const totalCredits = priorCredits + currentCredits;
  return totalCredits > 0
    ? (prior * priorCredits + currentSgpa * currentCredits) / totalCredits
    : null;
}

export function requiredExternalMarks(input: {
  internalMaximum: number | string;
  externalMaximum: number | string;
  targetPercent: number | string;
  assessments: Array<{marks: number | string; maxMarks: number | string}>;
}): {needed: number; internalEquivalent: number; achievable: boolean; error?: string} {
  const internalMax = Number(input.internalMaximum);
  const externalMax = Number(input.externalMaximum);
  const target = Number(input.targetPercent);
  if (!Number.isFinite(internalMax) || internalMax <= 0 || !Number.isFinite(externalMax) || externalMax <= 0) {
    return {needed: 0, internalEquivalent: 0, achievable: false, error: 'Internal and external maximum marks must be greater than zero.'};
  }
  if (!Number.isFinite(target) || target < 1 || target > 100) {
    return {needed: 0, internalEquivalent: 0, achievable: false, error: 'Target aggregate must be between 1% and 100%.'};
  }
  let assessmentMax = 0;
  let assessmentScore = 0;
  for (const assessment of input.assessments) {
    const maxMarks = Number(assessment.maxMarks);
    const marks = Number(assessment.marks);
    if (!Number.isFinite(maxMarks) || maxMarks <= 0 || !Number.isFinite(marks) || marks < 0 || marks > maxMarks) {
      return {needed: 0, internalEquivalent: 0, achievable: false, error: 'Each assessment score must be within its maximum marks.'};
    }
    assessmentMax += maxMarks;
    assessmentScore += marks;
  }
  const internalEquivalent = assessmentMax ? (assessmentScore / assessmentMax) * internalMax : 0;
  const needed = Math.max(0, (target / 100) * (internalMax + externalMax) - internalEquivalent);
  return {needed, internalEquivalent, achievable: needed <= externalMax + 1e-9};
}

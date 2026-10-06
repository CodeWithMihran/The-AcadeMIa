import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { studyToolsService } from "../services/api";
import { useStudentSubjects } from "../hooks/useAcademiaQueries";
import {
  Activity,
  BookOpenCheck,
  Calculator,
  Check,
  Plus,
  Trash2,
} from "lucide-react";
import { ASSESSMENT_CATEGORIES, TRACKS } from "../constants";
import {
  AttendanceEntryCard,
  AssessmentEntryRow,
  SaveStudyToolsButton,
  StudyToolField as Field,
  StudyToolMetric as Metric,
  cardClass,
  inputClass,
} from "../components/StudyToolFields";

const DEFAULT_SCALE = [
  { label: "A+", minimumPercent: 90, gradePoint: 10 },
  { label: "A", minimumPercent: 80, gradePoint: 9 },
  { label: "B+", minimumPercent: 70, gradePoint: 8 },
  { label: "B", minimumPercent: 60, gradePoint: 7 },
  { label: "C", minimumPercent: 50, gradePoint: 6 },
  { label: "D", minimumPercent: 40, gradePoint: 5 },
  { label: "F", minimumPercent: 0, gradePoint: 0 },
];

const tabs = [
  { id: "attendance", label: "Attendance", icon: Activity },
  { id: "planner", label: "SGPA / CGPA Planner", icon: Calculator },
  { id: "sessionals", label: "Internal Marks", icon: BookOpenCheck },
];

const recordKey = (entry) =>
  entry.subject?.toString?.() || entry._id || entry.localKey;
const addGradeBand = (scale) => {
  const sorted = [...scale].sort(
    (a, b) => Number(b.minimumPercent) - Number(a.minimumPercent),
  );
  const gaps = sorted
    .slice(0, -1)
    .map((band, index) => ({
      top: Number(band.minimumPercent),
      bottom: Number(sorted[index + 1].minimumPercent),
    }))
    .sort((a, b) => b.top - b.bottom - (a.top - a.bottom));
  const gap = gaps.find((item) => item.top - item.bottom >= 2);
  if (!gap) return scale;
  return [
    ...scale,
    {
      label: "New",
      minimumPercent: Math.floor((gap.top + gap.bottom) / 2),
      gradePoint: 8.5,
    },
  ];
};
const emptyAttendance = (subject) => ({
  subject: subject?._id || null,
  subjectName: subject?.name || "New subject",
  classesHeld: 0,
  classesAttended: 0,
  threshold: 75,
  localKey: crypto.randomUUID(),
});
const emptySessional = (subject) => ({
  subject: subject?._id || null,
  subjectName: subject?.name || "New subject",
  internalMaximum: 40,
  externalMaximum: 60,
  targetPercent: 40,
  assessments: [],
  localKey: crypto.randomUUID(),
});

function attendanceAdvice(item) {
  const held = Number(item.classesHeld) || 0;
  const attended = Number(item.classesAttended) || 0;
  const threshold = Number(item.threshold) || 75;
  const current = held ? (attended / held) * 100 : null;
  if (!held)
    return {
      current,
      message: "Add your first class attendance to get a forecast.",
      safeBunks: 0,
      recovery: 0,
    };
  if (current + 1e-9 >= threshold) {
    const safeBunks = Math.max(
      0,
      Math.floor(attended / (threshold / 100) - held + 1e-9),
    );
    return {
      current,
      safeBunks,
      recovery: 0,
      message: safeBunks
        ? `You can miss up to ${safeBunks} upcoming ${safeBunks === 1 ? "class" : "classes"} and remain at or above ${threshold}%.`
        : `Attend the next class; you have no safe bunk buffer at ${threshold}%.`,
    };
  }
  if (threshold === 100)
    return {
      current,
      safeBunks: 0,
      recovery: Infinity,
      message:
        "A 100% threshold cannot be recovered after a missed class; attend every remaining class.",
    };
  const recovery = Math.ceil(
    ((threshold / 100) * held - attended) / (1 - threshold / 100),
  );
  return {
    current,
    safeBunks: 0,
    recovery,
    message: `Attend the next ${recovery} ${recovery === 1 ? "class" : "classes"} in a row to recover to ${threshold}%.`,
  };
}

function requiredExternal(item) {
  const maxInternal = Number(item.internalMaximum) || 0;
  const maxExternal = Number(item.externalMaximum) || 0;
  const assessments = item.assessments || [];
  const assessedMax = assessments.reduce(
    (sum, item) => sum + (Number(item.maxMarks) || 0),
    0,
  );
  const assessedScore = assessments.reduce(
    (sum, item) => sum + (Number(item.marks) || 0),
    0,
  );
  const internalEquivalent = assessedMax
    ? (assessedScore / assessedMax) * maxInternal
    : 0;
  const totalNeeded =
    ((Number(item.targetPercent) || 0) / 100) * (maxInternal + maxExternal);
  const required = totalNeeded - internalEquivalent;
  return {
    internalEquivalent,
    maxInternal,
    maxExternal,
    required: Math.max(0, required),
    achievable: required <= maxExternal + 1e-9,
  };
}

// ✅ FIXED: Projected Grade now safely rounds the decimal values (e.g., 89.9% -> 90% (A+))
function projectedGrade(percent, scale) {
  if (percent === "" || percent === null || percent === undefined) return null;
  const value = Number(percent);
  if (!Number.isFinite(value)) return null;
  const roundedValue = Math.round(value);
  const bands = [...scale].sort(
    (a, b) => Number(b.minimumPercent) - Number(a.minimumPercent),
  );
  return (
    bands.find((band) => roundedValue >= Number(band.minimumPercent)) || null
  );
}

export const StudyTools = () => {
  const { user } = useAuth();
  const subjectsQuery = useStudentSubjects(user);
  const [activeTab, setActiveTab] = useState("attendance");
  const [subjects, setSubjects] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [sessionals, setSessionals] = useState([]);
  const [planner, setPlanner] = useState({
    previousCgpa: 0,
    completedCredits: 0,
    targetCgpa: 8.5,
    gradeScale: DEFAULT_SCALE,
    projections: [],
  });
  const [projectedMarks, setProjectedMarks] = useState({});
  const [loading, setLoading] = useState(true);
  const [dataReady, setDataReady] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [retryLoad, setRetryLoad] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (subjectsQuery.isLoading) return undefined;
    let alive = true;
    const loadedSubjects = subjectsQuery.data || [];
    setLoading(true);
    setDataReady(false);
    setLoadError("");
    if (subjectsQuery.error) {
      const message = subjectsQuery.error.response?.data?.message || "Could not load your semester subjects.";
      setError(message);
      setLoadError(message);
    } else setError("");
    Promise.allSettled([studyToolsService.getTools()])
      .then(([toolsResult]) => {
        if (!alive) return;
        setSubjects(loadedSubjects);
        if (toolsResult.status === "fulfilled") {
          const data = toolsResult.value.data;
          const savedAttendance = data.attendance || [];
          const savedSessionals = data.sessionals || [];
          const keyForSubject = (subject) => subject._id?.toString();
          const haveAttendance = new Set(
            savedAttendance
              .map((row) => row.subject?.toString())
              .filter(Boolean),
          );
          const haveSessionals = new Set(
            savedSessionals
              .map((row) => row.subject?.toString())
              .filter(Boolean),
          );
          setAttendance([
            ...savedAttendance,
            ...loadedSubjects
              .filter((subject) => !haveAttendance.has(keyForSubject(subject)))
              .map((subject) => emptyAttendance(subject)),
          ]);
          setSessionals([
            ...savedSessionals,
            ...loadedSubjects
              .filter((subject) => !haveSessionals.has(keyForSubject(subject)))
              .map((subject) => emptySessional(subject)),
          ]);
          const savedPlanner = data.planner || {};
          const nextPlanner = {
            previousCgpa: 0,
            completedCredits: 0,
            targetCgpa: 8.5,
            gradeScale: DEFAULT_SCALE,
            ...savedPlanner,
          };
          setPlanner(nextPlanner);
          const savedProjections = Object.fromEntries(
            (nextPlanner.projections || []).map((item) => [
              item.subject?.toString(),
              item.percent,
            ]),
          );
          setProjectedMarks(
            Object.fromEntries(
              loadedSubjects.map((subject) => [
                subject._id.toString(),
                savedProjections[subject._id.toString()] ?? "",
              ]),
            ),
          );
          setDataReady(!subjectsQuery.error);
        } else {
          const message = toolsResult.reason.response?.data?.message || "Could not load saved study tool data.";
          setError((current) => current || message);
          setLoadError((current) => current || message);
          setAttendance(
            loadedSubjects.map((subject) => emptyAttendance(subject)),
          );
          setSessionals(
            loadedSubjects.map((subject) => emptySessional(subject)),
          );
          setProjectedMarks(
            Object.fromEntries(
              loadedSubjects.map((subject) => [subject._id.toString(), ""]),
            ),
          );
        }
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [subjectsQuery.data, subjectsQuery.error, subjectsQuery.isLoading, retryLoad]);

  const retryDataLoad = async () => {
    if (subjectsQuery.error) {
      const result = await subjectsQuery.refetch();
      if (result.isError) setRetryLoad((current) => current + 1);
      return;
    }
    setRetryLoad((current) => current + 1);
  };

  const saveData = useCallback(
    async (kind) => {
      setSaving(true);
      setError("");
      setNotice("");
      try {
        if (kind === "attendance")
          await studyToolsService.saveAttendance(
            attendance.map(({ localKey: _localKey, ...row }) => ({
              ...row,
              classesHeld: Number(row.classesHeld),
              classesAttended: Number(row.classesAttended),
              threshold: Number(row.threshold),
            })),
          );
        if (kind === "sessionals")
          await studyToolsService.saveSessionals(
            sessionals.map(({ localKey: _localKey, ...row }) => ({
              ...row,
              internalMaximum: Number(row.internalMaximum),
              externalMaximum: Number(row.externalMaximum),
              targetPercent: Number(row.targetPercent),
              assessments: row.assessments.map(
                ({ localKey: _assessmentKey, ...assessment }) => ({
                  ...assessment,
                  marks: Number(assessment.marks),
                  maxMarks: Number(assessment.maxMarks),
                }),
              ),
            })),
          );
        if (kind === "planner")
          await studyToolsService.savePlanner({
            previousCgpa: Number(planner.previousCgpa),
            completedCredits: Number(planner.completedCredits),
            targetCgpa: Number(planner.targetCgpa),
            gradeScale: planner.gradeScale.map((band) => ({
              ...band,
              minimumPercent: Number(band.minimumPercent),
              gradePoint: Number(band.gradePoint),
            })),
            projections: subjects
              .filter(
                (subject) => projectedMarks[subject._id.toString()] !== "",
              )
              .map((subject) => ({
                subject: subject._id,
                percent: Number(projectedMarks[subject._id.toString()]),
              })),
          });
        setNotice(
          "Saved. Your entries are available the next time you return.",
        );
      } catch (err) {
        setError(
          err.response?.data?.message ||
            "Could not save your changes. Please check the values and try again.",
        );
      } finally {
        setSaving(false);
      }
    },
    [attendance, sessionals, planner, subjects, projectedMarks],
  );

  const semesterSummary = useMemo(() => {
    const rows = subjects.filter(
      (subject) =>
        Number(subject.credits) > 0 &&
        projectedMarks[subject._id.toString()] !== "",
    );
    const totalCredits = rows.reduce(
      (sum, subject) => sum + Number(subject.credits),
      0,
    );
    const weightedPoints = rows.reduce(
      (sum, subject) =>
        sum +
        Number(subject.credits) *
          Number(
            projectedGrade(
              projectedMarks[subject._id.toString()],
              planner.gradeScale,
            )?.gradePoint || 0,
          ),
      0,
    );
    const sgpa = totalCredits ? weightedPoints / totalCredits : null;
    const priorCredits = Number(planner.completedCredits) || 0;
    const priorCgpa = Number(planner.previousCgpa) || 0;
    const creditBearingSubjects = subjects.filter(
      (subject) => Number(subject.credits) > 0,
    );
    const semesterCredits = creditBearingSubjects.reduce(
      (sum, subject) => sum + Number(subject.credits),
      0,
    );
    const hasCompleteProjection =
      creditBearingSubjects.length > 0 &&
      creditBearingSubjects.every(
        (subject) => projectedMarks[subject._id.toString()] !== "",
      );
    const cgpa =
      sgpa === null || !hasCompleteProjection
        ? null
        : (priorCgpa * priorCredits + sgpa * totalCredits) /
          (priorCredits + totalCredits || 1);
    const needed = semesterCredits
      ? (Number(planner.targetCgpa) * (priorCredits + semesterCredits) -
          priorCgpa * priorCredits) /
        semesterCredits
      : null;
    return {
      sgpa,
      cgpa,
      usedCredits: totalCredits,
      courses: rows.length,
      semesterCredits,
      needed,
    };
  }, [subjects, projectedMarks, planner]);

  const updateEntry = (setter, list, index, field, value) =>
    setter(
      list.map((row, i) => (i === index ? { ...row, [field]: value } : row)),
    );
  const addAttendance = () =>
    setAttendance((rows) => [...rows, emptyAttendance(null)]);
  const addSessional = () =>
    setSessionals((rows) => [...rows, emptySessional(null)]);
  const updateAssessment = (subjectIndex, assessmentIndex, field, value) =>
    setSessionals((rows) =>
      rows.map((row, i) =>
        i !== subjectIndex
          ? row
          : {
              ...row,
              assessments: row.assessments.map((assessment, j) =>
                j === assessmentIndex
                  ? { ...assessment, [field]: value }
                  : assessment,
              ),
            },
      ),
    );

  if (loading)
    return (
      <main className="min-h-screen bg-app px-4 pb-16 pt-28 sm:px-6 lg:px-8"><div role="status" aria-label="Loading study tools" className="mx-auto max-w-7xl animate-pulse space-y-5"><div className="h-36 rounded-3xl border border-line bg-surface"/><div className="h-14 rounded-2xl border border-line bg-surface"/><div className="h-64 rounded-2xl border border-line bg-surface"/></div></main>
    );

  return (
    <main className="min-h-screen bg-app px-4 pb-16 pt-28 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6 sm:space-y-8">
        <header className="flex flex-col justify-between gap-5 rounded-3xl border border-line bg-surface p-5 shadow-sm sm:p-7 md:flex-row md:items-end">
          <div>
            <p className="mb-2 text-[10px] font-black uppercase tracking-[0.3em] text-blue-600">
              Built for your semester
            </p>
            <h1 className="text-3xl font-black tracking-tight text-content md:text-5xl">
              Daily Study Tools
            </h1>
            <p className="mt-3 max-w-2xl text-sm text-content-muted">
              Plan attendance, marks, and semester outcomes. Your entries save
              to your account and stay private.
            </p>
          </div>
          <div className="rounded-2xl border border-line bg-surface-muted px-4 py-3 text-left sm:text-right">
            <p className="text-[9px] font-black uppercase tracking-widest text-content-faint">
              Current curriculum
            </p>
            <p className="mt-1 text-sm font-bold text-content">
              {user?.track === TRACKS.UNIVERSITY
                ? `${user?.tenant?.shortCode || "University"} · ${user?.branch || "Branch"} · Sem ${user?.semester || "—"}`
                : `${user?.targetExam || "Competitive"} track`}
            </p>
          </div>
        </header>

        {error && (
          <div
            role="alert"
            className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800"
          >
            {error}
            {loadError && <button type="button" onClick={retryDataLoad} disabled={loading} className="ml-3 min-h-11 rounded-xl border border-red-200 bg-surface px-4 py-2 text-xs font-black">{loading ? "Retrying…" : "Retry loading"}</button>}
          </div>
        )}
        {!dataReady && !loading && <p className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">Saved study-tool data is not confirmed as loaded. Saving is disabled to protect existing entries. Retry loading before making changes.</p>}
        {notice && (
          <div
            role="status"
            aria-live="polite"
            className="mb-5 flex items-center gap-2 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800"
          >
            <Check className="h-4 w-4" />
            {notice}
          </div>
        )}

        <div role="group" aria-label="Study tool sections" className="flex flex-col gap-2 rounded-2xl border border-line bg-surface p-2 shadow-sm sm:flex-row">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              type="button"
              key={id}
              aria-pressed={activeTab === id}
              onClick={() => {
                setActiveTab(id);
                setError("");
                setNotice("");
              }}
              className={`inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl px-3 py-3 text-xs font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${activeTab === id ? "bg-surface-inverse text-white" : "text-content-muted hover:bg-surface-subtle hover:text-content"}`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>

        {activeTab === "attendance" && (
          <section className="space-y-5">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <h2 className="text-xl font-black text-content">
                  75% Attendance Forecaster
                </h2>
                <p className="mt-1 text-sm text-content-muted">
                  Update classes held and attended after each lecture to see
                  your safe bunk buffer.
                </p>
              </div>
              <button
                type="button"
                onClick={addAttendance}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-line bg-surface px-4 py-3 text-xs font-black uppercase tracking-wider hover:border-blue-300"
              >
                <Plus className="h-4 w-4" /> Add subject
              </button>
            </div>
            {attendance.length === 0 && (
              <div className={cardClass + " text-sm text-content-muted"}>
                No subjects are listed for this semester yet. Add a subject
                manually to start tracking attendance.
              </div>
            )}
            <div className="grid gap-4 lg:grid-cols-2">
              {attendance.map((item, index) => (
                <AttendanceEntryCard
                  key={recordKey(item)}
                  item={item}
                  advice={attendanceAdvice(item)}
                  onChange={(field, value) => updateEntry(setAttendance, attendance, index, field, value)}
                  onRemove={() => setAttendance((rows) => rows.filter((_, rowIndex) => rowIndex !== index))}
                />
              ))}
            </div>
            <SaveStudyToolsButton
              saving={saving}
              disabled={!dataReady}
              onClick={() => saveData("attendance")}
            />
          </section>
        )}

        {activeTab === "planner" && (
          <section className="space-y-5">
            {user?.track !== TRACKS.UNIVERSITY ? (
              <div className={cardClass}>
                <h2 className="text-xl font-black">University grade planner</h2>
                <p className="mt-2 text-sm text-content-muted">
                  Switch to a university track in your profile to import
                  semester subjects and credits here. Attendance and internal
                  marks tools are available for all tracks.
                </p>
              </div>
            ) : (
              <>
                <div className="grid gap-4 lg:grid-cols-3">
                  <Metric
                    label="Projected SGPA · entered courses"
                    value={
                      semesterSummary.sgpa === null
                        ? "Add marks"
                        : semesterSummary.sgpa.toFixed(2)
                    }
                  />
                  <Metric
                    label="Projected CGPA · all courses"
                    value={
                      semesterSummary.cgpa === null
                        ? "Complete marks"
                        : semesterSummary.cgpa.toFixed(2)
                    }
                  />
                  <Metric
                    label="Credits included"
                    value={`${semesterSummary.usedCredits} / ${semesterSummary.semesterCredits}`}
                  />
                </div>
                <div className={cardClass + " space-y-5"}>
                  <div>
                    <h2 className="text-lg font-black">Cumulative target</h2>
                    <p className="mt-1 text-xs text-content-muted">
                      Enter your current transcript values. The required SGPA
                      calculation uses credits from this semester’s subjects.
                    </p>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <Field label="Current CGPA">
                      <input
                        type="number"
                        min="0"
                        max="10"
                        step="0.01"
                        className={inputClass}
                        value={planner.previousCgpa}
                        onChange={(e) =>
                          setPlanner((p) => ({
                            ...p,
                            previousCgpa: e.target.value,
                          }))
                        }
                      />
                    </Field>
                    <Field label="Completed credits">
                      <input
                        type="number"
                        min="0"
                        max="10000"
                        step="0.5"
                        className={inputClass}
                        value={planner.completedCredits}
                        onChange={(e) =>
                          setPlanner((p) => ({
                            ...p,
                            completedCredits: e.target.value,
                          }))
                        }
                      />
                    </Field>
                    <Field label="Target CGPA">
                      <input
                        type="number"
                        min="0"
                        max="10"
                        step="0.1"
                        className={inputClass}
                        value={planner.targetCgpa}
                        onChange={(e) =>
                          setPlanner((p) => ({
                            ...p,
                            targetCgpa: e.target.value,
                          }))
                        }
                      />
                    </Field>
                  </div>
                  <div className="rounded-2xl bg-indigo-50 p-4 text-sm font-bold text-indigo-900">
                    {semesterSummary.needed === null
                      ? "Course credits are needed before calculating the target."
                      : semesterSummary.needed <= 0
                        ? "Your current CGPA already meets this target."
                        : semesterSummary.needed > 10
                          ? `A semester SGPA of ${semesterSummary.needed.toFixed(2)} would be needed; that exceeds the 10-point scale.`
                          : `You need approximately ${semesterSummary.needed.toFixed(2)} SGPA this semester to reach ${planner.targetCgpa} CGPA.`}
                  </div>
                </div>
                <div className={cardClass + " space-y-4"}>
                  <div>
                    <h2 className="text-lg font-black">
                      Semester marks simulation
                    </h2>
                    <p className="mt-1 text-xs text-content-muted">
                      Subjects are imported from your current tenant, branch,
                      and semester. Set the official credits on each subject in
                      the Admin subject editor if they are missing.
                    </p>
                  </div>
                  {subjects.length ? (
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[620px] text-left">
                        <thead>
                          <tr className="border-b border-line text-[9px] font-black uppercase tracking-widest text-content-faint">
                            <th className="py-3 pr-4">Subject</th>
                            <th className="py-3 pr-4">Credits</th>
                            <th className="py-3 pr-4">Projected marks %</th>
                            <th className="py-3 pr-4">Grade band</th>
                            <th className="py-3">Points</th>
                          </tr>
                        </thead>
                        <tbody>
                          {subjects.map((subject) => {
                            const id = subject._id.toString();
                            const band = projectedGrade(
                              projectedMarks[id],
                              planner.gradeScale,
                            );
                            return (
                              <tr key={id} className="border-b border-line">
                                <td className="py-4 pr-4">
                                  <p className="text-sm font-bold text-content">
                                    {subject.name}
                                  </p>
                                  <p className="text-[10px] text-content-faint">
                                    {subject.courseCode || subject.branch}
                                  </p>
                                </td>
                                <td className="py-4 pr-4 text-sm font-bold">
                                  {Number(subject.credits) > 0 ? (
                                    subject.credits
                                  ) : (
                                    <span className="text-amber-600">
                                      Missing
                                    </span>
                                  )}
                                </td>
                                <td className="py-4 pr-4">
                                  <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    step="0.1"
                                    aria-label={`Projected marks for ${subject.name}`}
                                    className="w-32 rounded-lg border border-line px-3 py-2 text-sm"
                                    value={projectedMarks[id] ?? ""}
                                    onChange={(e) =>
                                      setProjectedMarks((scores) => ({
                                        ...scores,
                                        [id]: e.target.value,
                                      }))
                                    }
                                    placeholder="0–100"
                                  />
                                </td>
                                <td className="py-4 pr-4 text-sm font-semibold">
                                  {band?.label || "—"}
                                </td>
                                <td className="py-4 text-sm font-black">
                                  {band?.gradePoint ?? "—"}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="rounded-xl bg-surface-muted p-5 text-sm text-content-muted">
                      No subjects matched your current university, branch, and
                      semester.
                    </p>
                  )}
                  {semesterSummary.courses <
                    subjects.filter((subject) => Number(subject.credits) > 0)
                      .length && (
                    <p className="text-xs text-content-muted">
                      SGPA is provisional and includes {semesterSummary.courses}{" "}
                      of{" "}
                      {
                        subjects.filter(
                          (subject) => Number(subject.credits) > 0,
                        ).length
                      }{" "}
                      credit-bearing courses with a projected mark entered.
                    </p>
                  )}
                </div>
                <div className={cardClass + " space-y-4"}>
                  <div>
                    <h2 className="text-lg font-black">Grading scale</h2>
                    <p className="mt-1 text-xs text-amber-700">
                      This editable starter scale is illustrative, not an
                      official AKTU/UTU rule. Set these bands to match your
                      university’s published grading policy.
                    </p>
                  </div>
                  <div className="space-y-2">
                    {planner.gradeScale.map((band, index) => (
                      <div
                        key={`${index}-${band.label}`}
                        className="grid grid-cols-[1fr_1fr_1fr_auto] items-end gap-2"
                      >
                        <Field label={index === 0 ? "Grade" : ""}>
                          <input
                            className={inputClass}
                            value={band.label}
                            onChange={(e) =>
                              setPlanner((p) => ({
                                ...p,
                                gradeScale: p.gradeScale.map((row, i) =>
                                  i === index
                                    ? { ...row, label: e.target.value }
                                    : row,
                                ),
                              }))
                            }
                          />
                        </Field>
                        <Field label={index === 0 ? "Minimum %" : ""}>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="0.1"
                            disabled={Number(band.minimumPercent) === 0}
                            className={inputClass}
                            value={band.minimumPercent}
                            onChange={(e) =>
                              setPlanner((p) => ({
                                ...p,
                                gradeScale: p.gradeScale.map((row, i) =>
                                  i === index
                                    ? { ...row, minimumPercent: e.target.value }
                                    : row,
                                ),
                              }))
                            }
                          />
                        </Field>
                        <Field label={index === 0 ? "Grade points" : ""}>
                          <input
                            type="number"
                            min="0"
                            max="10"
                            step="0.1"
                            className={inputClass}
                            value={band.gradePoint}
                            onChange={(e) =>
                              setPlanner((p) => ({
                                ...p,
                                gradeScale: p.gradeScale.map((row, i) =>
                                  i === index
                                    ? { ...row, gradePoint: e.target.value }
                                    : row,
                                ),
                              }))
                            }
                          />
                        </Field>
                        <button
                          type="button"
                          aria-label="Remove grade band"
                          disabled={
                            planner.gradeScale.length <= 2 ||
                            Number(band.minimumPercent) === 0
                          }
                          onClick={() =>
                            setPlanner((p) => ({
                              ...p,
                              gradeScale: p.gradeScale.filter(
                                (_, i) => i !== index,
                              ),
                            }))
                          }
                          className="mb-1 rounded-lg p-2 text-content-faint hover:bg-red-50 hover:text-red-500 disabled:opacity-30"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setPlanner((p) => ({
                        ...p,
                        gradeScale: addGradeBand(p.gradeScale),
                      }))
                    }
                    className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold text-blue-700 hover:bg-blue-50"
                  >
                    <Plus className="h-4 w-4" /> Add grade band
                  </button>
                </div>
                <SaveStudyToolsButton
                  saving={saving}
                  disabled={!dataReady}
                  onClick={() => saveData("planner")}
                />
              </>
            )}
          </section>
        )}

        {activeTab === "sessionals" && (
          <section className="space-y-5">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <h2 className="text-xl font-black text-content">
                  Internal / Sessional Marks
                </h2>
                <p className="mt-1 text-sm text-content-muted">
                  Record tests and viva scores; see the external marks needed
                  for your chosen aggregate pass target.
                </p>
              </div>
              <button
                type="button"
                onClick={addSessional}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-line bg-surface px-4 py-3 text-xs font-black uppercase tracking-wider hover:border-blue-300"
              >
                <Plus className="h-4 w-4" /> Add subject
              </button>
            </div>
            {sessionals.length === 0 && (
              <div className={cardClass + " text-sm text-content-muted"}>
                No subjects are listed yet. Add a subject manually to begin
                tracking assessments.
              </div>
            )}
            <div className="space-y-4">
              {sessionals.map((item, index) => {
                const outcome = requiredExternal(item);
                return (
                  <article
                    key={recordKey(item)}
                    className={cardClass + " space-y-5"}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-1">
                        <Field label="Subject">
                          <input
                            className={inputClass}
                            value={item.subjectName}
                            onChange={(e) =>
                              updateEntry(
                                setSessionals,
                                sessionals,
                                index,
                                "subjectName",
                                e.target.value,
                              )
                            }
                            placeholder="e.g. DBMS"
                            maxLength={120}
                          />
                        </Field>
                      </div>
                      <button
                        type="button"
                        aria-label="Remove subject"
                        onClick={() =>
                          setSessionals((rows) =>
                            rows.filter((_, i) => i !== index),
                          )
                        }
                        className="mt-6 rounded-lg p-2 text-content-faint hover:bg-red-50 hover:text-red-500"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-3">
                      <Field label="Internal maximum">
                        <input
                          type="number"
                          min="0.01"
                          className={inputClass}
                          value={item.internalMaximum}
                          onChange={(e) =>
                            updateEntry(
                              setSessionals,
                              sessionals,
                              index,
                              "internalMaximum",
                              e.target.value,
                            )
                          }
                        />
                      </Field>
                      <Field label="External maximum">
                        <input
                          type="number"
                          min="0.01"
                          className={inputClass}
                          value={item.externalMaximum}
                          onChange={(e) =>
                            updateEntry(
                              setSessionals,
                              sessionals,
                              index,
                              "externalMaximum",
                              e.target.value,
                            )
                          }
                        />
                      </Field>
                      <Field label="Target aggregate %">
                        <input
                          type="number"
                          min="1"
                          max="100"
                          className={inputClass}
                          value={item.targetPercent}
                          onChange={(e) =>
                            updateEntry(
                              setSessionals,
                              sessionals,
                              index,
                              "targetPercent",
                              e.target.value,
                            )
                          }
                        />
                      </Field>
                    </div>
                    <div>
                      <div className="mb-3 flex items-center justify-between">
                        <h3 className="text-xs font-black uppercase tracking-widest text-content-muted">
                          Assessments
                        </h3>
                        <button
                          type="button"
                          onClick={() =>
                            setSessionals((rows) =>
                              rows.map((row, i) =>
                                i === index
                                  ? {
                                      ...row,
                                      assessments: [
                                        ...row.assessments,
                                        {
                                          name: "",
                                          category: ASSESSMENT_CATEGORIES[0].value,
                                          marks: 0,
                                          maxMarks: 20,
                                          localKey: crypto.randomUUID(),
                                        },
                                      ],
                                    }
                                  : row,
                              ),
                            )
                          }
                          className="inline-flex items-center gap-1 text-xs font-bold text-blue-700"
                        >
                          <Plus className="h-3.5 w-3.5" /> Add score
                        </button>
                      </div>
                      {item.assessments.length ? (
                        <div className="space-y-2">
                          {item.assessments.map((assessment, assessmentIndex) => (
                            <AssessmentEntryRow
                              key={assessment._id || assessment.localKey || assessmentIndex}
                              assessment={assessment}
                              categories={ASSESSMENT_CATEGORIES}
                              onChange={(field, value) => updateAssessment(index, assessmentIndex, field, value)}
                              onRemove={() => setSessionals((rows) => rows.map((row, rowIndex) => rowIndex === index ? {
                                ...row,
                                assessments: row.assessments.filter((_, itemIndex) => itemIndex !== assessmentIndex),
                              } : row))}
                            />
                          ))}
                        </div>
                      ) : (
                        <p className="rounded-xl bg-surface-muted p-4 text-xs text-content-faint">
                          Add assessment scores to calculate the external marks
                          you need.
                        </p>
                      )}
                    </div>
                    <div
                      className={`rounded-2xl p-4 ${outcome.achievable ? "bg-emerald-50 text-emerald-900" : "bg-red-50 text-red-800"}`}
                    >
                      <p className="text-[9px] font-black uppercase tracking-widest opacity-60">
                        External marks needed
                      </p>
                      <p className="mt-1 text-lg font-black">
                        {outcome.required <= 0
                          ? "0 — target reached from internal marks"
                          : outcome.achievable
                            ? `${outcome.required.toFixed(1)} / ${outcome.maxExternal}`
                            : `Not reachable with the current internal marks (need ${outcome.required.toFixed(1)} / ${outcome.maxExternal})`}
                      </p>
                      <p className="mt-1 text-xs">
                        Your recorded sessionals contribute{" "}
                        {outcome.internalEquivalent.toFixed(1)} of{" "}
                        {outcome.maxInternal} internal marks.
                      </p>
                    </div>
                  </article>
                );
              })}
            </div>
            <SaveStudyToolsButton
              saving={saving}
              disabled={!dataReady}
              onClick={() => saveData("sessionals")}
            />
          </section>
        )}
      </div>
    </main>
  );
};

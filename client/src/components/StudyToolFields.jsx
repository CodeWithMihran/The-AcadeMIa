import React from "react";
import { Save, Trash2 } from "lucide-react";

export const inputClass = "w-full rounded-xl border border-line bg-surface px-3.5 py-3 text-sm font-semibold text-content-strong outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10";
export const cardClass = "rounded-3xl border border-line bg-surface p-5 shadow-sm md:p-6";

export function StudyToolField({ label, children, hint }) {
  return <label className="block space-y-1.5">
    <span className="text-[10px] font-black uppercase tracking-wider text-content-faint">{label}</span>
    {children}
    {hint && <span className="block text-[10px] leading-relaxed text-content-faint">{hint}</span>}
  </label>;
}

export function AttendanceEntryCard({ item, advice, onChange, onRemove }) {
  const belowThreshold = advice.current !== null && advice.current < Number(item.threshold);
  return <article className={`${cardClass} min-w-0 space-y-5`}>
    <div className="flex items-start gap-3">
      <div className="flex-1"><StudyToolField label="Subject"><input className={inputClass} value={item.subjectName} onChange={(event) => onChange("subjectName", event.target.value)} placeholder="e.g. DBMS" maxLength={120} /></StudyToolField></div>
      <button type="button" aria-label="Remove subject" onClick={onRemove} className="mt-6 rounded-lg p-2 text-content-faint hover:bg-red-50 hover:text-red-500"><Trash2 className="h-4 w-4" /></button>
    </div>
    <div className="grid grid-cols-1 gap-3 min-[440px]:grid-cols-3">
      <StudyToolField label="Classes held"><input type="number" inputMode="numeric" min="0" max="100000" step="1" className={inputClass} value={item.classesHeld} onChange={(event) => onChange("classesHeld", event.target.value)} aria-invalid={Boolean(advice.error)} /></StudyToolField>
      <StudyToolField label="Attended"><input type="number" inputMode="numeric" min="0" max={item.classesHeld || 100000} step="1" className={inputClass} value={item.classesAttended} onChange={(event) => onChange("classesAttended", event.target.value)} aria-invalid={Boolean(advice.error)} /></StudyToolField>
      <StudyToolField label="Required %"><input type="number" inputMode="decimal" min="1" max="100" step="0.1" className={inputClass} value={item.threshold} onChange={(event) => onChange("threshold", event.target.value)} aria-invalid={Boolean(advice.error)} /></StudyToolField>
    </div>
    <div role={advice.error ? "alert" : "status"} className={`rounded-2xl p-4 ${advice.error ? "bg-red-50 text-red-900" : belowThreshold ? "bg-amber-50 text-amber-900" : "bg-blue-50 text-blue-900"}`}>
      <div className="flex items-end justify-between gap-4">
        <div><p className="text-[9px] font-black uppercase tracking-widest opacity-60">Current attendance</p><p className="mt-1 text-2xl font-black">{advice.current === null ? "—" : `${advice.current.toFixed(1)}%`}</p></div>
        <p className="max-w-[65%] text-right text-xs font-bold leading-relaxed">{advice.error || advice.message}</p>
      </div>
    </div>
  </article>;
}

export function OverallAttendanceCard({ item, advice, onChange }) {
  const invalid = advice.error;
  return <article className={`${cardClass} space-y-5 border-blue-200 bg-gradient-to-br from-blue-50/70 to-surface`}>
    <div>
      <p className="text-[10px] font-black uppercase tracking-widest text-blue-700">One number for your whole semester</p>
      <h3 className="mt-1 text-lg font-black text-content">Overall attendance</h3>
      <p className="mt-1 text-sm leading-relaxed text-content-muted">Don’t know each subject’s count? Enter your total classes held and total classes attended across all subjects.</p>
    </div>
    <div className="grid gap-3 sm:grid-cols-3">
      <StudyToolField label="Total classes held"><input aria-label="Total classes held across all subjects" type="number" inputMode="numeric" min="0" max="100000" step="1" className={inputClass} value={item.classesHeld} onChange={(event) => onChange("classesHeld", event.target.value)} /></StudyToolField>
      <StudyToolField label="Total classes attended"><input aria-label="Total classes attended across all subjects" type="number" inputMode="numeric" min="0" max={item.classesHeld || 100000} step="1" className={inputClass} value={item.classesAttended} onChange={(event) => onChange("classesAttended", event.target.value)} aria-invalid={Boolean(invalid)} /></StudyToolField>
      <StudyToolField label="Required attendance"><div className="relative"><input aria-label="Required attendance percentage" type="number" inputMode="decimal" min="1" max="100" step="0.1" className={`${inputClass} pr-9`} value={item.threshold} onChange={(event) => onChange("threshold", event.target.value)} aria-invalid={Boolean(invalid)} /><span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-content-faint">%</span></div></StudyToolField>
    </div>
    <div role={invalid ? "alert" : "status"} className={`rounded-2xl p-4 ${invalid ? "bg-amber-50 text-amber-900" : "bg-blue-100/70 text-blue-950"}`}>
      {invalid ? <p className="text-sm font-semibold">{invalid}</p> : <div className="flex flex-wrap items-center justify-between gap-4">
        <div><p className="text-[9px] font-black uppercase tracking-widest opacity-70">Overall attendance</p><p className="mt-1 text-2xl font-black">{advice.current === null ? "—" : `${advice.current.toFixed(1)}%`}</p></div>
        <p className="max-w-xl text-sm font-bold leading-relaxed sm:text-right">{advice.message}</p>
      </div>}
    </div>
  </article>;
}

export function AssessmentEntryRow({ assessment, onChange, onRemove, categories }) {
  return <div className="grid grid-cols-[1.2fr_1fr_0.7fr_0.7fr_auto] gap-2">
    <input className="min-w-0 rounded-lg border border-line px-3 py-2 text-xs" value={assessment.name} onChange={(event) => onChange("name", event.target.value)} placeholder="Mid-term 1" aria-label="Assessment name" />
    <select className="min-w-0 rounded-lg border border-line bg-surface px-2 py-2 text-xs" value={assessment.category} onChange={(event) => onChange("category", event.target.value)} aria-label="Assessment type">
      {categories.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
    </select>
    <input type="number" min="0" max={assessment.maxMarks} step="0.1" className="min-w-0 rounded-lg border border-line px-2 py-2 text-xs" value={assessment.marks} onChange={(event) => onChange("marks", event.target.value)} aria-label="Marks scored" aria-invalid={Number(assessment.marks) > Number(assessment.maxMarks) || Number(assessment.marks) < 0} />
    <input type="number" min="0.1" max="10000" step="0.1" className="min-w-0 rounded-lg border border-line px-2 py-2 text-xs" value={assessment.maxMarks} onChange={(event) => onChange("maxMarks", event.target.value)} aria-label="Maximum marks" aria-invalid={!Number.isFinite(Number(assessment.maxMarks)) || Number(assessment.maxMarks) <= 0 || Number(assessment.maxMarks) > 10000} />
    <button type="button" aria-label="Remove assessment" onClick={onRemove} className="rounded-lg p-2 text-content-faint hover:bg-red-50 hover:text-red-500"><Trash2 className="h-4 w-4" /></button>
  </div>;
}

export function StudyToolMetric({ label, value }) {
  return <div className="rounded-2xl border border-line bg-surface p-5 shadow-sm"><p className="text-[9px] font-black uppercase tracking-widest text-content-faint">{label}</p><p className="mt-2 text-3xl font-black text-content">{value}</p></div>;
}

export function SaveStudyToolsButton({ saving, disabled = false, onClick }) {
    return <button type="button" disabled={saving || disabled} onClick={onClick} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-surface-inverse px-5 py-3.5 text-xs font-black uppercase tracking-widest text-white shadow-lg transition hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-60">
    <Save className="h-4 w-4" />{saving ? "Saving…" : "Save changes"}
  </button>;
}

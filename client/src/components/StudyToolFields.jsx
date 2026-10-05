import React from "react";
import { Save, Trash2 } from "lucide-react";

export const inputClass = "w-full rounded-xl border border-gray-200 bg-white px-3.5 py-3 text-sm font-semibold text-gray-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10";
export const cardClass = "rounded-3xl border border-gray-200 bg-white p-5 shadow-sm md:p-6";

export function StudyToolField({ label, children, hint }) {
  return <label className="block space-y-1.5">
    <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">{label}</span>
    {children}
    {hint && <span className="block text-[10px] leading-relaxed text-gray-400">{hint}</span>}
  </label>;
}

export function AttendanceEntryCard({ item, advice, onChange, onRemove }) {
  const belowThreshold = advice.current !== null && advice.current < Number(item.threshold);
  return <article className={`${cardClass} space-y-5`}>
    <div className="flex items-start gap-3">
      <div className="flex-1"><StudyToolField label="Subject"><input className={inputClass} value={item.subjectName} onChange={(event) => onChange("subjectName", event.target.value)} placeholder="e.g. DBMS" maxLength={120} /></StudyToolField></div>
      <button type="button" aria-label="Remove subject" onClick={onRemove} className="mt-6 rounded-lg p-2 text-gray-300 hover:bg-red-50 hover:text-red-500"><Trash2 className="h-4 w-4" /></button>
    </div>
    <div className="grid grid-cols-3 gap-3">
      <StudyToolField label="Classes held"><input type="number" min="0" max="100000" className={inputClass} value={item.classesHeld} onChange={(event) => onChange("classesHeld", event.target.value)} /></StudyToolField>
      <StudyToolField label="Attended"><input type="number" min="0" max={item.classesHeld || 100000} className={inputClass} value={item.classesAttended} onChange={(event) => onChange("classesAttended", event.target.value)} /></StudyToolField>
      <StudyToolField label="Required %"><input type="number" min="1" max="100" className={inputClass} value={item.threshold} onChange={(event) => onChange("threshold", event.target.value)} /></StudyToolField>
    </div>
    <div className={`rounded-2xl p-4 ${belowThreshold ? "bg-amber-50 text-amber-900" : "bg-blue-50 text-blue-900"}`}>
      <div className="flex items-end justify-between gap-4">
        <div><p className="text-[9px] font-black uppercase tracking-widest opacity-60">Current attendance</p><p className="mt-1 text-2xl font-black">{advice.current === null ? "—" : `${advice.current.toFixed(1)}%`}</p></div>
        <p className="text-right text-xs font-bold leading-relaxed">{advice.message}</p>
      </div>
    </div>
  </article>;
}

export function AssessmentEntryRow({ assessment, onChange, onRemove, categories }) {
  return <div className="grid grid-cols-[1.2fr_1fr_0.7fr_0.7fr_auto] gap-2">
    <input className="min-w-0 rounded-lg border border-gray-200 px-3 py-2 text-xs" value={assessment.name} onChange={(event) => onChange("name", event.target.value)} placeholder="Mid-term 1" aria-label="Assessment name" />
    <select className="min-w-0 rounded-lg border border-gray-200 bg-white px-2 py-2 text-xs" value={assessment.category} onChange={(event) => onChange("category", event.target.value)} aria-label="Assessment type">
      {categories.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
    </select>
    <input type="number" min="0" max={assessment.maxMarks} step="0.1" className="min-w-0 rounded-lg border border-gray-200 px-2 py-2 text-xs" value={assessment.marks} onChange={(event) => onChange("marks", event.target.value)} aria-label="Marks scored" />
    <input type="number" min="0.1" step="0.1" className="min-w-0 rounded-lg border border-gray-200 px-2 py-2 text-xs" value={assessment.maxMarks} onChange={(event) => onChange("maxMarks", event.target.value)} aria-label="Maximum marks" />
    <button type="button" aria-label="Remove assessment" onClick={onRemove} className="rounded-lg p-2 text-gray-300 hover:bg-red-50 hover:text-red-500"><Trash2 className="h-4 w-4" /></button>
  </div>;
}

export function StudyToolMetric({ label, value }) {
  return <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"><p className="text-[9px] font-black uppercase tracking-widest text-gray-400">{label}</p><p className="mt-2 text-3xl font-black text-gray-900">{value}</p></div>;
}

export function SaveStudyToolsButton({ saving, onClick }) {
  return <button type="button" disabled={saving} onClick={onClick} className="inline-flex items-center gap-2 rounded-xl bg-[#0a0a0a] px-5 py-3.5 text-xs font-black uppercase tracking-widest text-white shadow-lg transition hover:bg-blue-600 disabled:cursor-wait disabled:opacity-60">
    <Save className="h-4 w-4" />{saving ? "Saving…" : "Save changes"}
  </button>;
}

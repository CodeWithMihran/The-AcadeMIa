import React from "react";
import { Plus, Trash2 } from "lucide-react";

import { emptyCareerBridge } from "../utils/careerBridge";
import { CODING_PLATFORMS, DIFFICULTY_LEVELS } from "../constants";
const blankQuestion = () => ({ question: "", answerMarkdown: "", companies: [], topic: "", difficulty: "", isPremium: false });
const blankCoding = () => ({ title: "", platform: CODING_PLATFORMS[0], url: "", topic: "", difficulty: "", isPremium: false });
const blankPyq = () => ({ title: "", year: "", topic: "", url: "", isPremium: false });

const fieldClass = "w-full rounded-xl border border-line bg-surface px-3 py-2.5 text-sm";

export default function CareerBridgeEditor({ value = emptyCareerBridge(), onChange }) {
  const data = { ...emptyCareerBridge(), ...value, gate: { ...emptyCareerBridge().gate, ...(value.gate || {}) } };
  const update = (key, next) => onChange({ ...data, [key]: next });
  const updateRow = (key, index, field, next) => update(key, data[key].map((row, i) => i === index ? { ...row, [field]: next } : row));
  const updateGate = (field, next) => onChange({ ...data, gate: { ...data.gate, [field]: next } });
  const updatePyq = (index, field, next) => updateGate("pyqs", data.gate.pyqs.map((row, i) => i === index ? { ...row, [field]: next } : row));
  const renderPremium = (row, setter) => <label className="flex items-center gap-2 text-xs font-semibold text-content-secondary"><input type="checkbox" checked={Boolean(row.isPremium)} onChange={e => setter("isPremium", e.target.checked)} />Premium resource</label>;

  return <div className="space-y-8">
    <section className="rounded-3xl border border-indigo-100 bg-indigo-50/40 p-6 md:p-8">
      <div className="mb-5 flex items-center justify-between gap-4"><div><h3 className="text-lg font-black">Interview preparation</h3><p className="text-sm text-content-muted">Map interview prompts to exact syllabus topics.</p></div><button type="button" onClick={() => update("interviewQuestions", [...data.interviewQuestions, blankQuestion()])} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white"><Plus className="h-4 w-4"/>Add question</button></div>
      {!data.interviewQuestions.length && <p className="rounded-xl bg-surface p-4 text-sm text-content-muted">No interview questions added yet.</p>}
      <div className="space-y-4">{data.interviewQuestions.map((row, i) => <div key={row._id || i} className="grid gap-3 rounded-2xl border border-line bg-surface p-4 md:grid-cols-2">
        <input className={`${fieldClass} md:col-span-2`} placeholder="Interview question" value={row.question || ""} onChange={e => updateRow("interviewQuestions", i, "question", e.target.value)} />
        <input className={fieldClass} placeholder="Companies (comma-separated: Google, Microsoft, Amazon)" value={(row.companies || (row.company ? [row.company] : [])).join(", ")} onChange={e => updateRow("interviewQuestions", i, "companies", e.target.value.split(",").map(company => company.trim()).filter(Boolean))} />
        <input className={fieldClass} placeholder="Related topic (match syllabus topic)" value={row.topic || ""} onChange={e => updateRow("interviewQuestions", i, "topic", e.target.value)} />
        <select className={fieldClass} value={row.difficulty || ""} onChange={e => updateRow("interviewQuestions", i, "difficulty", e.target.value)}><option value="">Difficulty (optional)</option>{DIFFICULTY_LEVELS.map(level => <option key={level} value={level}>{level}</option>)}</select>
        <label className="space-y-2 text-xs font-semibold text-content-secondary md:col-span-2">Answer / explanation <span className="font-normal text-content-muted">(Markdown: **bold**, `code`, lists, fenced code blocks)</span><textarea className={`${fieldClass} min-h-32 font-mono`} maxLength={20000} placeholder={'Explain the approach…\n\n```js\n// code example\n```'} value={row.answerMarkdown || ""} onChange={e => updateRow("interviewQuestions", i, "answerMarkdown", e.target.value)} /></label>
        <div className="flex items-center justify-between">{renderPremium(row, (f,v) => updateRow("interviewQuestions", i, f, v))}<button type="button" aria-label="Remove question" onClick={() => update("interviewQuestions", data.interviewQuestions.filter((_, j) => j !== i))} className="text-red-500"><Trash2 className="h-4 w-4"/></button></div>
      </div>)}</div>
    </section>

    <section className="rounded-3xl border border-emerald-100 bg-emerald-50/40 p-6 md:p-8">
      <div className="mb-5 flex items-center justify-between gap-4"><div><h3 className="text-lg font-black">Coding practice</h3><p className="text-sm text-content-muted">Curate relevant LeetCode, GFG, or HackerRank exercises.</p></div><button type="button" onClick={() => update("codingLinks", [...data.codingLinks, blankCoding()])} className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2 text-xs font-bold text-white"><Plus className="h-4 w-4"/>Add problem</button></div>
      {!data.codingLinks.length && <p className="rounded-xl bg-surface p-4 text-sm text-content-muted">No practice links added yet.</p>}
      <div className="space-y-4">{data.codingLinks.map((row, i) => <div key={row._id || i} className="grid gap-3 rounded-2xl border border-line bg-surface p-4 md:grid-cols-2">
        <input className={fieldClass} placeholder="Problem title" value={row.title || ""} onChange={e => updateRow("codingLinks", i, "title", e.target.value)} />
        <select className={fieldClass} value={row.platform || CODING_PLATFORMS.at(-1)} onChange={e => updateRow("codingLinks", i, "platform", e.target.value)}>{CODING_PLATFORMS.map(platform => <option key={platform} value={platform}>{platform}</option>)}</select>
        <input className={fieldClass} type="url" placeholder="https://…" value={row.url || ""} onChange={e => updateRow("codingLinks", i, "url", e.target.value)} />
        <input className={fieldClass} placeholder="Related topic (match syllabus topic)" value={row.topic || ""} onChange={e => updateRow("codingLinks", i, "topic", e.target.value)} />
        <select className={fieldClass} value={row.difficulty || ""} onChange={e => updateRow("codingLinks", i, "difficulty", e.target.value)}><option value="">Difficulty (optional)</option>{DIFFICULTY_LEVELS.map(level => <option key={level} value={level}>{level}</option>)}</select>
        <div className="flex items-center justify-between">{renderPremium(row, (f,v) => updateRow("codingLinks", i, f, v))}<button type="button" aria-label="Remove problem" onClick={() => update("codingLinks", data.codingLinks.filter((_, j) => j !== i))} className="text-red-500"><Trash2 className="h-4 w-4"/></button></div>
      </div>)}</div>
    </section>

    <section className="rounded-3xl border border-amber-100 bg-amber-50/40 p-6 md:p-8">
      <div className="mb-5"><h3 className="text-lg font-black">GATE weightage & PYQs</h3><p className="text-sm text-content-muted">Use an approximate range with its source period; avoid presenting estimates as guaranteed.</p></div>
      <div className="grid gap-3 md:grid-cols-2"><input className={fieldClass} placeholder="Exam (e.g. GATE CS)" value={data.gate.examCode || ""} onChange={e => updateGate("examCode", e.target.value)} /><input className={fieldClass} placeholder="Weightage period (e.g. 2019–2024)" value={data.gate.weightagePeriod || ""} onChange={e => updateGate("weightagePeriod", e.target.value)} /><input className={fieldClass} type="number" min="0" max="100" step="0.5" placeholder="Average marks, from" value={data.gate.weightageMinMarks ?? ""} onChange={e => updateGate("weightageMinMarks", e.target.value)} /><input className={fieldClass} type="number" min="0" max="100" step="0.5" placeholder="Average marks, to" value={data.gate.weightageMaxMarks ?? ""} onChange={e => updateGate("weightageMaxMarks", e.target.value)} /></div>
      <div className="mt-6 flex items-center justify-between"><h4 className="font-bold">Previous year questions</h4><button type="button" onClick={() => updateGate("pyqs", [...data.gate.pyqs, blankPyq()])} className="inline-flex items-center gap-2 rounded-xl bg-amber-600 px-4 py-2 text-xs font-bold text-white"><Plus className="h-4 w-4"/>Add GATE PYQ</button></div>
      <div className="mt-4 space-y-3">{data.gate.pyqs.map((row, i) => <div key={row._id || i} className="grid gap-3 rounded-2xl border border-line bg-surface p-4 md:grid-cols-2"><input className={fieldClass} placeholder="Question title / number" value={row.title || ""} onChange={e => updatePyq(i,"title",e.target.value)} /><input className={fieldClass} type="number" min="1980" max="2100" placeholder="Year" value={row.year || ""} onChange={e => updatePyq(i,"year",e.target.value)} /><input className={fieldClass} placeholder="Topic" value={row.topic || ""} onChange={e => updatePyq(i,"topic",e.target.value)} /><input className={fieldClass} type="url" placeholder="https://…" value={row.url || ""} onChange={e => updatePyq(i,"url",e.target.value)} /><div className="flex items-center justify-between">{renderPremium(row,(f,v)=>updatePyq(i,f,v))}<button type="button" aria-label="Remove GATE PYQ" onClick={() => updateGate("pyqs",data.gate.pyqs.filter((_,j)=>j!==i))} className="text-red-500"><Trash2 className="h-4 w-4"/></button></div></div>)}</div>
    </section>
  </div>;
}

import React, { useMemo, useState } from "react";
import { BookOpenCheck, FileText, Flame, Printer, ScrollText } from "lucide-react";
import MarkdownAnswer from "./MarkdownAnswer";
import StudyMaterialViewer from "./StudyMaterialViewer";

const sections = [
  ["definition", "Definition"], ["diagram", "Diagram / illustration"],
  ["workingPrinciple", "Working principle"], ["advantages", "Advantages"],
  ["disadvantages", "Disadvantages / limitations"]
];
const revisionSections = [["formulas", "Formulas"], ["derivations", "Core derivations"], ["diagrams", "Diagrams"], ["keyPoints", "Key points"]];

function getTopicScores(unit) {
  const years = [...new Set((unit.examYearsCovered || []).map(Number).filter(Number.isInteger))].sort((a, b) => b - a).slice(0, 5);
  const covered = new Set(years);
  const counts = new Map();
  for (const item of unit.examQuestions || []) {
    const topic = String(item.topic || "").trim();
    const year = Number(item.year);
    if (!topic || !covered.has(year)) continue;
    const key = topic.toLocaleLowerCase();
    if (!counts.has(key)) counts.set(key, { topic, years: new Set(), questions: [] });
    const record = counts.get(key);
    record.years.add(year);
    record.questions.push(item);
  }
  return { years, topics: [...counts.values()].map(record => ({ ...record, count: record.years.size, highYield: years.length >= 2 && record.years.size >= 2 && record.years.size / years.length >= 0.5 })) };
}

export default function ExamNightKit({ units = [] }) {
  const [highYieldOnly, setHighYieldOnly] = useState(false);
  const [activeTabs, setActiveTabs] = useState({});
  const [material, setMaterial] = useState(null);
  const stats = useMemo(() => units.map(unit => getTopicScores(unit)), [units]);
  const rows = units.map((unit, index) => ({ unit, index, ...stats[index] }));
  const populatedRows = rows.filter(({ unit, topics }) => topics.length || revisionSections.some(([key]) => unit.rapidRevision?.[key]?.trim()) || sections.some(([key]) => unit.quickSummary?.[key]?.trim()));
  const visibleRows = populatedRows.filter(({ topics }) => !highYieldOnly || topics.some(item => item.highYield));

  if (!populatedRows.length) return <section className="space-y-4 rounded-3xl border border-line bg-surface p-5 md:p-7" aria-labelledby="exam-night-title">
    <div><p className="flex items-center gap-2 text-xs font-black uppercase tracking-[.2em] text-amber-700"><Flame className="h-4 w-4"/>Exam Night toolkit</p><h2 id="exam-night-title" className="mt-2 text-xl font-black text-content md:text-2xl">Rapid revision resources</h2></div>
    <div className="rounded-2xl border border-dashed border-line-strong bg-surface-muted p-5 text-sm text-content-secondary"><p className="font-bold text-content">No Exam Night resources have been added yet.</p><p className="mt-1">When available, this area will show past-paper recurrence, rapid revision sheets, and exam answer outlines for each unit.</p></div>
  </section>;

  return <section className="space-y-5" aria-labelledby="exam-night-title">
    <header className="flex flex-wrap items-end justify-between gap-4 rounded-3xl bg-gradient-to-br from-amber-950 via-orange-900 to-rose-900 p-6 text-white shadow-lg md:p-8">
      <div><p className="flex items-center gap-2 text-xs font-black uppercase tracking-[.2em] text-amber-300"><Flame className="h-4 w-4"/>Exam Night toolkit</p><h2 id="exam-night-title" className="mt-2 text-2xl font-black md:text-3xl">Revise what matters, unit by unit</h2><p className="mt-2 max-w-2xl text-sm text-orange-100/80">Past-paper frequency is historical evidence from the years listed. It cannot guarantee what will appear next.</p></div>
      <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-xs font-bold"><input type="checkbox" checked={highYieldOnly} onChange={event => setHighYieldOnly(event.target.checked)} className="h-4 w-4 accent-amber-400"/>High-yield units only</label>
    </header>
    {!visibleRows.length ? <p className="rounded-2xl border border-dashed border-amber-300 bg-amber-50 p-6 text-sm text-amber-900">No unit currently meets the high-yield threshold. Add verified questions from at least two covered exam years to calculate recurrence.</p> : <div className="space-y-4">
      {visibleRows.map(({ unit, index, years, topics }) => {
        const tab = activeTabs[unit._id || index] || "pyqs";
        const key = unit._id || index;
        return <article key={key} className="overflow-hidden rounded-3xl border border-line bg-surface shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line p-5 md:p-6"><div><h3 className="text-lg font-black text-content">Unit {unit.unitNumber || index + 1}: {unit.unitTitle}</h3><p className="mt-1 text-xs text-content-muted">{years.length ? `Frequency uses ${years.length} covered exam year${years.length === 1 ? "" : "s"}: ${years.join(", ")}` : "Exam coverage years have not been recorded yet"}</p></div><button type="button" onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-lg border border-line px-3 py-2 text-xs font-bold text-content-secondary print:hidden"><Printer className="h-4 w-4"/>Print toolkit</button></div>
          <div className="flex flex-wrap gap-2 px-4 pt-4" role="tablist" aria-label={`Exam Night materials for ${unit.unitTitle}`}>
            {[["pyqs", "PYQ Heatmap", Flame], ["revision", "10-minute Revision", BookOpenCheck], ["summary", "10-mark Outline", ScrollText]].map(([id, label, Icon]) => <button key={id} type="button" role="tab" aria-selected={tab === id} onClick={() => setActiveTabs(current => ({ ...current, [key]: id }))} className={`inline-flex items-center gap-2 rounded-xl px-3 py-2.5 text-xs font-black ${tab === id ? "bg-amber-100 text-amber-950" : "text-content-muted hover:bg-surface-muted"}`}><Icon className="h-4 w-4"/>{label}</button>)}
          </div>
          <div className="p-4 md:p-6" role="tabpanel">
            {tab === "pyqs" && <div className="space-y-5">
              {topics.length ? [...topics].sort((a, b) => b.count - a.count || a.topic.localeCompare(b.topic)).map(({ topic, count, highYield, years: askedYears, questions: records }) => <section key={topic} className={`rounded-2xl border p-4 ${highYield ? "border-amber-200 bg-amber-50/70" : "border-line bg-surface-muted/70"}`}>
                <div className="mb-3 flex flex-wrap items-center gap-2"><h4 className="font-black text-content">{topic}</h4><span className={`rounded-full px-2.5 py-1 text-[10px] font-black ${highYield ? "bg-amber-200 text-amber-950" : "bg-surface-hover text-content-secondary"}`}>Asked in {count} of {years.length} covered years</span>{highYield && <span className="text-[10px] font-black uppercase tracking-wide text-amber-800">High yield</span>}<div className="flex flex-wrap gap-1.5" aria-label={`Past-paper recurrence for ${topic}`}>{years.map(year => <span key={year} title={`${year}: ${askedYears.has(year) ? "question recorded" : "no question recorded"}`} className={`rounded-md px-2 py-1 text-[9px] font-bold ${askedYears.has(year) ? "bg-amber-500 text-white" : "bg-surface-hover text-content-secondary"}`}>{year}</span>)}</div></div>
                <ul className="space-y-2">{records.sort((a, b) => Number(b.year) - Number(a.year)).map((item, itemIndex) => <li key={item._id || `${item.year}-${itemIndex}`} className="rounded-xl bg-surface p-3"><p className="text-sm font-semibold text-content">{item.question}</p><div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-content-muted"><span>{item.year}{item.marks ? ` · ${item.marks} marks` : ""}</span><span>Source: {item.sourceLabel}</span>{item.sourceUrl && <button type="button" onClick={() => setMaterial({ title: `${item.sourceLabel} · ${item.year}`, url: item.sourceUrl, kind: "pdf" })} className="inline-flex items-center gap-1 font-bold text-blue-700 hover:underline"><FileText className="h-3.5 w-3.5"/>View source</button>}</div></li>)}</ul>
              </section>) : <p className="rounded-xl border border-dashed border-line p-5 text-sm text-content-muted">No topic-mapped past-paper questions yet.</p>}
              <p className="text-[11px] text-content-muted">High-yield means a topic appears in at least two and at least half of the unit’s latest five covered years. It describes the recorded papers only; it is not a prediction or marks guarantee.</p>
            </div>}
            {tab === "revision" && <ContentSections entries={revisionSections} data={unit.rapidRevision} empty="No rapid revision sheet has been added for this unit yet."/>}
            {tab === "summary" && <ContentSections entries={sections} data={unit.quickSummary} empty="No exam answer outline has been added for this unit yet."/>}
          </div>
        </article>;
      })}
    </div>}
    <StudyMaterialViewer material={material} onClose={() => setMaterial(null)}/>
  </section>;
}

function ContentSections({ entries, data = {}, empty }) {
  const content = entries.filter(([key]) => data[key]?.trim());
  return content.length ? <div className="grid gap-4 md:grid-cols-2">{content.map(([key, title]) => <section key={key} className="rounded-2xl border border-line bg-surface-muted p-4"><h4 className="mb-2 font-black text-content">{title}</h4><MarkdownAnswer value={data[key]}/></section>)}</div> : <p className="rounded-xl border border-dashed border-line p-5 text-sm text-content-muted">{empty}</p>;
}

import React from "react";
import { useFieldArray, useFormContext } from "react-hook-form";
import { Plus, Trash2 } from "lucide-react";

const fieldClass = "w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm";
const markdownField = `${fieldClass} min-h-24 resize-y`;

export default function ExamNightEditor({ unit, unitPath }) {
  const { register, control } = useFormContext();
  const { fields: questions, append: appendQuestion, remove: removeQuestion } = useFieldArray({ control, name: `${unitPath}.examQuestions` });

  return <section className="space-y-6 rounded-2xl border border-amber-200 bg-amber-50/50 p-5" aria-label={`Exam Night content for ${unit.unitTitle || "unit"}`}>
    <div><p className="text-xs font-black uppercase tracking-widest text-amber-800">Exam Night toolkit</p><p className="mt-1 text-xs text-gray-600">Add sourced university PYQs, then write original revision material aligned to this unit.</p></div>

    <div className="space-y-3 rounded-2xl border border-white bg-white p-4">
      <div><h4 className="font-black text-gray-900">PYQ recurrence evidence</h4><p className="text-xs text-gray-500">List years for which this unit’s exam papers have been reviewed. The student score only uses these covered years.</p></div>
      <label className="block space-y-1 text-xs font-bold text-gray-700">Covered exam years <span className="font-normal text-gray-500">(comma separated, such as 2021, 2022, 2023)</span>
        <input {...register(`${unitPath}.examYearsCoveredText`)} className={fieldClass} inputMode="numeric" placeholder="2021, 2022, 2023, 2024, 2025" />
      </label>
      <div className="flex flex-wrap items-center justify-between gap-2"><h5 className="text-sm font-bold">Question records</h5><button type="button" onClick={() => appendQuestion({ question: "", topic: "", year: "", marks: "", sourceLabel: "", sourceUrl: "" })} className="inline-flex items-center gap-1 rounded-lg bg-gray-900 px-3 py-2 text-xs font-bold text-white"><Plus className="h-3.5 w-3.5"/>Add PYQ</button></div>
      {questions.map((item, index) => <div key={item.id} className="grid gap-2 rounded-xl border border-gray-100 bg-gray-50 p-3 sm:grid-cols-2">
        <textarea aria-label="Past exam question" {...register(`${unitPath}.examQuestions.${index}.question`)} className={`${fieldClass} sm:col-span-2`} rows={2} maxLength={2000} placeholder="Question text" />
        <input aria-label="Mapped topic" {...register(`${unitPath}.examQuestions.${index}.topic`)} className={fieldClass} maxLength={160} placeholder="Mapped topic (e.g. Normalization)" />
        <input aria-label="Exam year" {...register(`${unitPath}.examQuestions.${index}.year`)} className={fieldClass} type="number" min="1980" max="2100" placeholder="Exam year" />
        <input aria-label="Question marks" {...register(`${unitPath}.examQuestions.${index}.marks`)} className={fieldClass} type="number" min="0.5" max="100" step="0.5" placeholder="Marks (optional)" />
        <input aria-label="PYQ source" {...register(`${unitPath}.examQuestions.${index}.sourceLabel`)} className={fieldClass} maxLength={160} placeholder="Source (e.g. AKTU end-sem paper)" />
        <input aria-label="PYQ source URL" {...register(`${unitPath}.examQuestions.${index}.sourceUrl`)} className={`${fieldClass} sm:col-span-2`} type="url" placeholder="https://… (optional source link)" />
        <button type="button" onClick={() => removeQuestion(index)} className="inline-flex items-center gap-1 justify-self-start px-1 py-1 text-xs font-bold text-red-700"><Trash2 className="h-3.5 w-3.5"/>Remove question</button>
      </div>)}
      {!questions.length && <p className="rounded-xl border border-dashed border-gray-200 p-4 text-xs text-gray-500">No structured question records yet. Existing linked PYQ files remain available separately.</p>}
    </div>

    <div className="grid gap-4 lg:grid-cols-2">
      <div className="space-y-3 rounded-2xl border border-white bg-white p-4"><div><h4 className="font-black text-gray-900">10-minute rapid revision</h4><p className="text-xs text-gray-500">Markdown supported: headings, bullets, inline code, and fenced code blocks.</p></div>
        {[ ["formulas", "Formulas"], ["derivations", "Core derivations"], ["diagrams", "Diagrams and block diagrams"], ["keyPoints", "Key points"] ].map(([key, label]) => <label key={key} className="block space-y-1 text-xs font-bold text-gray-700">{label}<textarea {...register(`${unitPath}.rapidRevision.${key}`)} className={markdownField} maxLength={12000} rows={3} placeholder={`Add concise ${label.toLowerCase()} for rapid recall…`} /></label>)}
      </div>
      <div className="space-y-3 rounded-2xl border border-white bg-white p-4"><div><h4 className="font-black text-gray-900">Original 10-mark answer outline</h4><p className="text-xs text-gray-500">Write syllabus-aligned material in your own words; don’t reproduce commercial guidebooks.</p></div>
        {[ ["definition", "Definition"], ["diagram", "Diagram / illustration"], ["workingPrinciple", "Working principle"], ["advantages", "Advantages"], ["disadvantages", "Disadvantages / limitations"] ].map(([key, label]) => <label key={key} className="block space-y-1 text-xs font-bold text-gray-700">{label}<textarea {...register(`${unitPath}.quickSummary.${key}`)} className={markdownField} maxLength={12000} rows={3} placeholder={`Write the ${label.toLowerCase()} section…`} /></label>)}
      </div>
    </div>
  </section>;
}

import React from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { ShieldCheck, Trash2 } from "lucide-react";
import ExamNightEditor from "./ExamNightEditor";

const unitResourceConfig = [
  { key: "notes", title: "Study Notes", theme: "bg-blue-50/30 border-blue-100/50 text-blue-600" },
  { key: "books", title: "Reference Books", theme: "bg-purple-50/30 border-purple-100/50 text-purple-600" },
  { key: "pyqs", title: "University PYQs", theme: "bg-emerald-50/30 border-emerald-100/50 text-emerald-600" },
  { key: "youtubeLinks", title: "Video Tutorials", theme: "bg-gray-900 border-gray-900 text-red-400 dark:text-red-400" },
];

export default function SubjectUnitEditor({ index, editing = false, removable, onRemove }) {
  const { control, register } = useFormContext();
  const unitPath = `units.${index}`;
  const unit = useWatch({ control, name: unitPath });

  if (!unit) return null;

  return (
    <article className={`space-y-8 rounded-[2rem] border border-gray-200 border-l-4 ${editing ? "border-l-blue-500 md:p-12" : "border-l-black md:p-10"} bg-white p-8 shadow-sm`}>
      <header className={`flex items-center justify-between ${editing ? "border-b border-gray-100 pb-6" : ""}`}>
        <h3 className={`${editing ? "text-2xl tracking-tighter" : "text-lg"} font-black italic`}>Unit {String(index + 1).padStart(2, "0")}</h3>
        <div className="flex items-center gap-4">
          {removable && <button type="button" onClick={onRemove} className="flex items-center gap-1 rounded-xl border border-gray-100 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-red-400 transition-colors hover:bg-red-50 hover:text-red-600"><Trash2 className="h-3 w-3" />Remove Unit</button>}
          {editing && <span className="flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-blue-600"><ShieldCheck className="h-3 w-3" />Active Module</span>}
        </div>
      </header>

      <div className="grid gap-8 md:grid-cols-2">
        <label className="space-y-2"><span className="text-[10px] font-black uppercase tracking-wider text-gray-500">{editing ? "Module Title" : "Unit Title"}</span><input {...register(`${unitPath}.unitTitle`)} className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm font-medium focus:border-blue-500 focus:outline-none" placeholder="Unit Title" maxLength={160} /></label>
        <label className="space-y-2"><span className="text-[10px] font-black uppercase tracking-wider text-gray-500">{editing ? "Topic Index" : "Topics (comma separated)"}</span><input {...register(`${unitPath}.topics`)} className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm font-medium focus:border-blue-500 focus:outline-none" placeholder="Topic 1, Topic 2..." /></label>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {unitResourceConfig.map(({ key, title, theme }) => (
          <section key={key} className={`space-y-3 rounded-3xl border p-6 ${theme}`}>
            <h4 className="text-[10px] font-black uppercase tracking-wider">{title}</h4>
            {["title", "link"].map((field) => (
              <input key={field} {...register(`${unitPath}.${key}.0.${field}`)} aria-label={`${title} ${field}`} className={`w-full rounded-lg border px-3 py-2 text-xs ${key === "youtubeLinks" ? "border-white/10 bg-white/5 text-white" : "border-gray-200 bg-white"}`} placeholder={field === "title" ? "Title" : "URL"} maxLength={field === "title" ? 300 : 2048} />
            ))}
          </section>
        ))}
      </div>

      <ExamNightEditor
        unit={unit}
        unitPath={unitPath}
      />
    </article>
  );
}

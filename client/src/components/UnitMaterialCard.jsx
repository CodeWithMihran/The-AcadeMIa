import React from "react";
import { BookOpen, Eye, FileText, PlayCircle } from "lucide-react";

const resourceGroups = [
  { key: "notes", label: "Notes", icon: FileText, kind: "pdf" },
  { key: "books", label: "Books", icon: BookOpen, kind: "pdf" },
  { key: "pyqs", label: "Previous year papers", icon: FileText, kind: "pdf" },
  { key: "youtubeLinks", label: "Video lessons", icon: PlayCircle, kind: "video" },
];

export default function UnitMaterialCard({ unit, index, onOpenMaterial }) {
  const topics = unit.topics || [];
  const groupData = resourceGroups.map((group) => ({ ...group, resources: unit[group.key] || [] })).filter((group) => group.resources.length);
  const resourceCount = groupData.reduce((count, group) => count + group.resources.length, 0);
  const unitTitle = unit.unitTitle || unit.name || `Unit ${index + 1}`;

  return (
    <article className="min-w-0 rounded-2xl border border-line bg-surface p-4 shadow-sm transition hover:border-line-strong sm:p-5">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-xs font-black text-blue-800">{String(unit.unitNumber || index + 1).padStart(2, "0")}</span>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[.14em] text-content-faint">Unit {unit.unitNumber || index + 1}</p>
            <h3 className="mt-0.5 break-words text-base font-black leading-snug text-content sm:text-lg">{unitTitle}</h3>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 pl-[3.25rem] sm:pl-0">
          <span className="rounded-lg bg-surface-muted px-2.5 py-1.5 text-[10px] font-semibold text-content-muted">{topics.length} {topics.length === 1 ? "topic" : "topics"}</span>
          <span className="rounded-lg bg-surface-muted px-2.5 py-1.5 text-[10px] font-semibold text-content-muted">{resourceCount} {resourceCount === 1 ? "resource" : "resources"}</span>
        </div>
      </header>

      {topics.length > 0 && <section className="mt-4" aria-label={`Topics in ${unitTitle}`}>
        <h4 className="mb-2 text-[10px] font-bold uppercase tracking-wider text-content-faint">Topics in this unit</h4>
        <ul className="flex flex-wrap gap-2">
          {topics.map((topic, topicIndex) => <li key={topic._id || topicIndex} className="rounded-full border border-line bg-surface-muted px-3 py-1.5 text-xs font-medium text-content-secondary">{topic.title || topic.name || topic}</li>)}
        </ul>
      </section>}

      {groupData.length > 0 ? (
        <div className="mt-5 grid min-w-0 gap-4 border-t border-line pt-4 sm:grid-cols-2">
          {groupData.map(({ key, label, icon: Icon, kind, resources }) => <section key={key} className="min-w-0" aria-label={label}>
            <h4 className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-content-muted"><Icon className="h-3.5 w-3.5" />{label}<span className="text-content-faint">{resources.length}</span></h4>
            <ul className="space-y-1.5">
              {resources.map((resource, resourceIndex) => {
                const title = resource.title || resource.name || label;
                const url = resource.link || resource.url;
                return <li key={resource._id || resourceIndex}>
                  <button type="button" onClick={() => onOpenMaterial({ title, url, kind })} disabled={!url}
                    className="group/resource flex min-h-10 w-full items-center justify-between gap-3 rounded-xl border border-transparent px-3 py-2 text-left text-sm font-semibold text-blue-700 transition hover:border-line hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:text-content-faint">
                    <span className="min-w-0 truncate">{title}</span><span className="flex shrink-0 items-center gap-1 text-[10px] font-bold text-content-muted group-hover/resource:text-blue-700">{url ? "Open" : "Unavailable"}{url ? <><Eye className="h-3.5 w-3.5" /><span className="sr-only"> {title}</span></> : null}</span>
                  </button>
                </li>;
              })}
            </ul>
          </section>)}
        </div>
      ) : <p className="mt-4 rounded-xl border border-dashed border-line bg-surface-muted px-4 py-3 text-sm text-content-muted">{topics.length ? "No study materials have been added for this unit yet." : "Topics and study resources haven’t been added to this unit yet."}</p>}
    </article>
  );
}

import React from "react";
import { BookOpen, Eye, FileText, PlayCircle } from "lucide-react";

const resourceGroups = [
  { key: "notes", label: "Notes", icon: FileText },
  { key: "books", label: "Books", icon: BookOpen },
  { key: "pyqs", label: "Previous year papers", icon: FileText },
  { key: "youtubeLinks", label: "Video lessons", icon: PlayCircle },
];

export default function UnitMaterialCard({ unit, index, onOpenMaterial }) {
  const hasMaterials = resourceGroups.some(({ key }) => unit[key]?.length);

  return (
    <article className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm md:p-8">
      <h3 className="text-lg font-black text-gray-900">Unit {unit.unitNumber || index + 1}: {unit.unitTitle || unit.name || `Unit ${index + 1}`}</h3>
      {unit.topics?.length > 0 && <div className="mt-4 flex flex-wrap gap-2">{unit.topics.map((topic, topicIndex) => <span key={topic._id || topicIndex} className="rounded-full bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-700">{topic.title || topic.name || topic}</span>)}</div>}
      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        {resourceGroups.map(({ key, label, icon: Icon }) => {
          const resources = unit[key] || [];
          if (!resources.length) return null;
          return <div key={key}>
            <h4 className="mb-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400"><Icon className="h-3.5 w-3.5" />{label}</h4>
            <ul className="space-y-2">{resources.map((resource, resourceIndex) => <li key={resource._id || resourceIndex}>
              <button type="button" onClick={() => onOpenMaterial({ title: resource.title || resource.name || label, url: resource.link || resource.url, kind: key === "youtubeLinks" ? "video" : "pdf" })}
                disabled={!resource.link && !resource.url}
                className="inline-flex items-center gap-2 text-left text-sm font-semibold text-blue-700 hover:underline disabled:cursor-not-allowed disabled:text-gray-400">
                {resource.title || resource.name || label}<Eye className="h-3.5 w-3.5" />
              </button>
            </li>)}</ul>
          </div>;
        })}
      </div>
      {!unit.topics?.length && !hasMaterials && <p className="mt-4 text-sm text-gray-400">No materials have been added to this unit yet.</p>}
    </article>
  );
}

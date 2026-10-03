import React, { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ArrowUpRight, BookOpen, FileText, PlayCircle } from "lucide-react";
import API from "../services/api";

const resourceGroups = [
  { key: "notes", label: "Notes", icon: FileText },
  { key: "books", label: "Books", icon: BookOpen },
  { key: "pyqs", label: "Previous year papers", icon: FileText },
  { key: "youtubeLinks", label: "Video lessons", icon: PlayCircle },
];

export default function SubjectVault() {
  const { id } = useParams();
  const [subject, setSubject] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const loadSubject = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await API.get(`/subjects/${id}`);
      if (!response.data.success) throw new Error(response.data.message || "Could not load this subject.");
      setSubject(response.data.subject);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Could not load this subject.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { loadSubject(); }, [loadSubject]);

  if (loading) return <div className="p-24 text-center text-xs font-bold uppercase tracking-widest text-gray-400">Loading Subject Vault…</div>;
  if (!subject) return <div className="p-24 text-center"><p className="font-bold text-red-500">{error || "Subject not found."}</p><button onClick={loadSubject} className="mt-4 text-sm font-bold text-blue-600 hover:underline">Try again</button></div>;

  return (
    <main className="min-h-screen bg-[#fbfbfa] px-6 pb-20 pt-32">
      <div className="mx-auto max-w-6xl space-y-8">
        <Link to="/dashboard" className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gray-500 hover:text-black"><ArrowLeft className="h-4 w-4"/> Back to Dashboard</Link>
        <header className="flex flex-col justify-between gap-6 rounded-[2rem] bg-[#0a0a0a] p-8 text-white shadow-xl md:flex-row md:items-end md:p-12">
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-blue-400">{subject.courseCode || subject.track || "Subject"}</p>
            <h1 className="mt-3 text-3xl font-black tracking-tight md:text-5xl">{subject.name}</h1>
            <p className="mt-3 text-sm text-gray-400">{subject.tenant?.shortCode ? `${subject.tenant.shortCode} · ` : ""}{subject.branch || subject.examCategory || "Curriculum"}{subject.semester ? ` · Semester ${subject.semester}` : ""}</p>
          </div>
          <Link to={`/progress/${subject._id}`} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-xs font-black uppercase tracking-wider text-black hover:bg-blue-500 hover:text-white">View Subject Progress <ArrowUpRight className="h-4 w-4"/></Link>
        </header>

        <section className="space-y-5">
          <div><h2 className="text-xl font-black text-gray-900">Course materials</h2><p className="mt-1 text-sm text-gray-500">Unit topics and resources for this subject.</p></div>
          {subject.units?.length ? subject.units.map((unit, index) => (
            <article key={unit._id || index} className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm md:p-8">
              <h3 className="text-lg font-black text-gray-900">Unit {unit.unitNumber || index + 1}: {unit.unitTitle || unit.name || `Unit ${index + 1}`}</h3>
              {unit.topics?.length > 0 && <div className="mt-4 flex flex-wrap gap-2">{unit.topics.map((topic, i) => <span key={topic._id || i} className="rounded-full bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-700">{topic.title || topic.name || topic}</span>)}</div>}
              <div className="mt-6 grid gap-5 sm:grid-cols-2">
                {resourceGroups.map(({ key, label, icon: Icon }) => {
                  const resources = unit[key] || [];
                  if (!resources.length) return null;
                  return <div key={key}><h4 className="mb-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400"><Icon className="h-3.5 w-3.5"/>{label}</h4><ul className="space-y-2">{resources.map((resource, i) => <li key={resource._id || i}><a href={resource.link || resource.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm font-semibold text-blue-700 hover:underline">{resource.title || resource.name || label}<ArrowUpRight className="h-3.5 w-3.5"/></a></li>)}</ul></div>;
                })}
              </div>
              {!unit.topics?.length && !resourceGroups.some(({ key }) => unit[key]?.length) && <p className="mt-4 text-sm text-gray-400">No materials have been added to this unit yet.</p>}
            </article>
          )) : <div className="rounded-3xl border border-dashed border-gray-300 bg-white p-12 text-center text-sm text-gray-500">No course units are available yet.</div>}
        </section>
      </div>
    </main>
  );
}

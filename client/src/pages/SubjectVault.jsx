import React, { useCallback, useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft, ArrowUpRight, BookOpen, BriefcaseBusiness } from "lucide-react";
import API from "../services/api";
import StudyMaterialViewer from "../components/StudyMaterialViewer";
import { CommunityNotes } from "../components/CommunityNotes";
import ExamNightKit from "../components/ExamNightKit";
import SubjectCareerResources from "../components/SubjectCareerResources";
import UnitMaterialCard from "../components/UnitMaterialCard";
import { TRACKS } from "../constants";

export default function SubjectVault() {
  const { id } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const viewMode = searchParams.get("mode") === "career" ? "career" : "academic";
  const [subject, setSubject] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [activeMaterial, setActiveMaterial] = useState(null);
  const closeViewer = useCallback(() => setActiveMaterial(null), []);

  const loadSubject = useCallback(async () => {
    setLoading(true);
    setError("");
    setSubject(null);
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

  const gate = subject.careerBridge?.gate || {};
  const gateRange = gate.weightageMinMarks != null || gate.weightageMaxMarks != null
    ? `${gate.weightageMinMarks ?? "?"}${gate.weightageMaxMarks != null && gate.weightageMaxMarks !== gate.weightageMinMarks ? `–${gate.weightageMaxMarks}` : ""} marks`
    : "Weightage not added";
  return (
    <main className="min-h-screen bg-[#fbfbfa] px-6 pb-20 pt-32">
      <div className="mx-auto max-w-6xl space-y-8">
        <Link to="/dashboard" className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gray-500 hover:text-black"><ArrowLeft className="h-4 w-4"/> Back to Dashboard</Link>
        <header className="flex flex-col justify-between gap-6 rounded-[2rem] bg-[#0a0a0a] p-8 text-white shadow-xl md:flex-row md:items-end md:p-12">
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-blue-400">{subject.courseCode || subject.track || "Subject"}</p>
            <h1 className="mt-3 text-3xl font-black tracking-tight md:text-5xl">{subject.name}</h1>
            <p className="mt-3 text-sm text-gray-400">{subject.tenant?.shortCode ? `${subject.tenant.shortCode} · ` : ""}{subject.branch || subject.examCategory || "Curriculum"}{subject.semester ? ` · Semester ${subject.semester}` : ""}</p>
            {(gate.weightageMinMarks != null || gate.weightageMaxMarks != null) && <p className="mt-4 inline-flex items-center gap-2 rounded-full border border-blue-300/30 bg-blue-400/10 px-3 py-1.5 text-xs font-bold text-blue-200">{gate.examCode || "GATE"}: {gateRange}{gate.weightagePeriod ? ` · ${gate.weightagePeriod}` : ""}</p>}
          </div>
          <Link to={`/progress/${subject._id}`} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-xs font-black uppercase tracking-wider text-black hover:bg-blue-500 hover:text-white">View Subject Progress <ArrowUpRight className="h-4 w-4"/></Link>
        </header>

        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-gray-200 bg-white p-3">
          <p className="px-3 text-sm font-bold text-gray-700">Choose your study focus</p>
          <div className="flex gap-2" role="tablist" aria-label="Subject study mode">
            {[['academic','Academic Mode',BookOpen],['career','Career Mode',BriefcaseBusiness]].map(([mode,label,Icon]) => <button key={mode} type="button" role="tab" aria-selected={viewMode === mode} onClick={() => setSearchParams(mode === 'career' ? { mode: 'career' } : {})} className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-black transition ${viewMode === mode ? 'bg-gray-900 text-white' : 'text-gray-500 hover:bg-gray-100'}`}><Icon className="h-4 w-4"/>{label}</button>)}
          </div>
        </div>

        {viewMode === 'academic' ? <>
        <section className="space-y-5">
          <div><h2 className="text-xl font-black text-gray-900">Course materials</h2><p className="mt-1 text-sm text-gray-500">Unit topics and resources for this subject.</p></div>
          {subject.units?.length ? subject.units.map((unit, index) => <UnitMaterialCard key={unit._id || index} unit={unit} index={index} onOpenMaterial={setActiveMaterial} />) : <div className="rounded-3xl border border-dashed border-gray-300 bg-white p-12 text-center text-sm text-gray-500">No course units are available yet.</div>}
        </section>
        <ExamNightKit units={subject.units || []} />
        {subject.track === TRACKS.UNIVERSITY && <CommunityNotes subject={subject} />}
        </> : <SubjectCareerResources subject={subject} subjectId={id} />}
      </div>
      <StudyMaterialViewer material={activeMaterial} onClose={closeViewer} />
    </main>
  );
}

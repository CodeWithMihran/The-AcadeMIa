import React, { useCallback, useEffect, useRef, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowUpRight,
  BookOpen,
  BriefcaseBusiness,
  CheckCircle2,
  Layers3,
  RefreshCw,
} from "lucide-react";
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
  const requestSequence = useRef(0);
  const closeViewer = useCallback(() => setActiveMaterial(null), []);

  const loadSubject = useCallback(async () => {
    const requestId = ++requestSequence.current;
    setLoading(true);
    setError("");
    setSubject(null);
    try {
      const response = await API.get(`/subjects/${id}`);
      if (!response.data.success) throw new Error(response.data.message || "Could not load this subject.");
      if (requestId === requestSequence.current) setSubject(response.data.subject);
    } catch (err) {
      if (requestId === requestSequence.current) setError(err.response?.data?.message || err.message || "Could not load this subject.");
    } finally {
      if (requestId === requestSequence.current) setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadSubject();
    return () => { requestSequence.current += 1; };
  }, [loadSubject]);

  if (loading) return <VaultLoadingState />;
  if (!subject) return <VaultErrorState error={error} onRetry={loadSubject} />;

  const gate = subject.careerBridge?.gate || {};
  const gateHasWeightage = gate.weightageMinMarks != null || gate.weightageMaxMarks != null;
  const gateRange = gateHasWeightage
    ? `${gate.weightageMinMarks ?? "?"}${gate.weightageMaxMarks != null && gate.weightageMaxMarks !== gate.weightageMinMarks ? `–${gate.weightageMaxMarks}` : ""} marks`
    : "Weightage not added";
  const units = subject.units || [];
  const topicCount = units.reduce((total, unit) => total + (unit.topics?.length || 0), 0);
  const career = subject.careerBridge || {};
  const careerResourceCount = (career.interviewQuestions?.length || 0) + (career.codingLinks?.length || 0) + (gate.pyqs?.length || 0);

  return (
    <main className="min-h-screen bg-app px-4 pb-16 pt-28 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6 sm:space-y-8">
        <Link to="/subjects" className="inline-flex min-h-10 items-center gap-2 rounded-lg text-sm font-semibold text-content-muted transition hover:text-content focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"><ArrowLeft className="h-4 w-4" /> Subject catalog</Link>

        <header className="grid gap-4 rounded-3xl border border-line bg-surface p-5 shadow-sm sm:p-7 lg:grid-cols-[1fr_auto] lg:items-center lg:p-8">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-lg bg-blue-50 px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wide text-blue-800">{subject.courseCode || subject.track || "Subject"}</span>
              {subject.tenant?.shortCode && <span className="rounded-lg bg-surface-muted px-2.5 py-1.5 text-[10px] font-semibold text-content-muted">{subject.tenant.shortCode}</span>}
              {(subject.branch || subject.examCategory) && <span className="rounded-lg bg-surface-muted px-2.5 py-1.5 text-[10px] font-semibold text-content-muted">{subject.branch || subject.examCategory}</span>}
              {subject.semester && <span className="rounded-lg bg-surface-muted px-2.5 py-1.5 text-[10px] font-semibold text-content-muted">Semester {subject.semester}</span>}
            </div>
            <h1 className="mt-3 break-words text-3xl font-black tracking-tight text-content sm:text-4xl">{subject.name}</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-content-muted">Your subject workspace for syllabus units, study material, exam revision, and related career practice.</p>
          </div>
          <Link to={`/progress/${subject._id}`} className="inline-flex min-h-11 items-center justify-center gap-2 self-start rounded-xl border border-line bg-surface-muted px-4 py-3 text-xs font-bold text-content-secondary transition hover:bg-surface-inverse hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 lg:self-center">Track subject progress <ArrowUpRight className="h-4 w-4" /></Link>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:col-span-2">
            <VaultStat icon={Layers3} label="Units" value={units.length} />
            <VaultStat icon={CheckCircle2} label="Topics" value={topicCount} />
            <VaultStat icon={BriefcaseBusiness} label="Career resources" value={careerResourceCount} />
          </div>
          {gateHasWeightage && <p className="inline-flex items-center gap-2 rounded-xl border border-indigo-100 bg-indigo-50 px-3 py-2 text-xs font-bold text-indigo-800 sm:col-span-2 lg:col-span-2">{gate.examCode || "GATE"} subject weightage: {gateRange}{gate.weightagePeriod ? ` · ${gate.weightagePeriod}` : ""}</p>}
        </header>

        <section className="space-y-4" aria-labelledby="study-focus-title">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div><h2 id="study-focus-title" className="text-lg font-black text-content">Choose your study focus</h2><p className="mt-1 text-sm text-content-muted">Switch between your academic materials and career practice.</p></div>
            <Link to={`/progress/${subject._id}`} className="inline-flex min-h-9 items-center gap-1.5 self-start text-xs font-bold text-blue-700 hover:text-blue-900 sm:self-auto">View topic progress <ArrowUpRight className="h-3.5 w-3.5" /></Link>
          </div>
          <div className="grid gap-2 rounded-2xl border border-line bg-surface p-2 sm:grid-cols-2" role="group" aria-label="Subject study mode">
            <ModeTab mode="academic" current={viewMode} icon={BookOpen} title="Academic mode" description="Units, notes, videos, PYQs, revision" onSelect={() => setSearchParams({})} />
            <ModeTab mode="career" current={viewMode} icon={BriefcaseBusiness} title="Career mode" description={`${careerResourceCount} mapped practice resources`} onSelect={() => setSearchParams({ mode: "career" })} />
          </div>
        </section>

        {viewMode === "academic" ? (
          <div id="academic-content" className="space-y-8">
            <section className="space-y-4" aria-labelledby="unit-resources-title">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div><p className="text-xs font-bold uppercase tracking-[.14em] text-content-faint">Your syllabus</p><h2 id="unit-resources-title" className="mt-1 text-xl font-black text-content">Units and study material</h2></div>
                {units.length > 0 && <span className="text-xs font-semibold text-content-muted">{units.length} {units.length === 1 ? "unit" : "units"} · {topicCount} topics</span>}
              </div>
              {units.length ? <div className="space-y-3">{units.map((unit, index) => <UnitMaterialCard key={unit._id || index} unit={unit} index={index} onOpenMaterial={setActiveMaterial} />)}</div> : <div className="rounded-2xl border border-dashed border-line-strong bg-surface p-7 text-center sm:p-10"><BookOpen className="mx-auto h-8 w-8 text-content-faint" /><p className="mt-3 font-bold text-content">Units haven’t been added yet</p><p className="mt-1 text-sm text-content-muted">Check back later, or contact your campus admin if you expected this syllabus here.</p></div>}
            </section>

            <section id="exam-night" aria-label="Exam Night revision resources"><ExamNightKit units={units} /></section>
            {subject.track === TRACKS.UNIVERSITY && <section id="community-notes" aria-label="Community notes"><CommunityNotes subject={subject} /></section>}
          </div>
        ) : (
          <div id="career-content"><SubjectCareerResources subject={subject} subjectId={id} /></div>
        )}
      </div>
      <StudyMaterialViewer material={activeMaterial} onClose={closeViewer} />
    </main>
  );
}

function VaultStat({ icon: Icon, label, value }) {
  return <div className="flex items-center gap-3 rounded-xl border border-line bg-surface-muted p-3.5"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface text-content-secondary"><Icon className="h-4 w-4" /></span><div><p className="text-[11px] font-semibold text-content-muted">{label}</p><p className="text-lg font-black text-content">{value}</p></div></div>;
}

function ModeTab({ mode, current, icon: Icon, title, description, onSelect }) {
  const selected = mode === current;
  return <button type="button" aria-pressed={selected} onClick={onSelect} className={`flex min-h-[4.25rem] items-center gap-3 rounded-xl border px-4 py-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${selected ? "border-line-strong bg-surface-muted text-content shadow-sm" : "border-transparent bg-surface text-content-secondary hover:bg-surface-muted"}`}>
    <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${selected ? "bg-blue-50 text-blue-700" : "bg-surface-muted text-content-muted"}`}><Icon className="h-5 w-5" /></span>
    <span className="min-w-0 flex-1"><span className="block text-sm font-black">{title}</span><span className="mt-0.5 block truncate text-xs font-medium text-content-muted">{description}</span></span>
    {selected && <CheckCircle2 className="h-4 w-4 shrink-0 text-blue-700" />}
  </button>;
}

function VaultLoadingState() {
  return <main className="min-h-screen bg-app px-4 pb-16 pt-28 sm:px-6 lg:px-8"><div className="mx-auto max-w-7xl animate-pulse space-y-5" role="status" aria-label="Loading subject vault"><div className="h-5 w-36 rounded bg-surface-subtle" /><div className="h-52 rounded-3xl border border-line bg-surface" /><div className="h-24 rounded-2xl border border-line bg-surface" /><div className="h-48 rounded-2xl border border-line bg-surface" /></div></main>;
}

function VaultErrorState({ error, onRetry }) {
  return <main className="min-h-screen bg-app px-4 pb-16 pt-28 sm:px-6 lg:px-8"><div role="alert" className="mx-auto max-w-2xl rounded-2xl border border-red-200 bg-red-50 p-6 text-center sm:p-8"><p className="font-black text-red-900">This subject vault couldn’t load.</p><p className="mt-2 text-sm text-red-800">{error || "Subject not found."}</p><button type="button" onClick={onRetry} className="mt-5 inline-flex min-h-10 items-center gap-2 rounded-xl bg-surface px-4 py-2.5 text-xs font-bold text-content shadow-sm hover:bg-surface-muted"><RefreshCw className="h-3.5 w-3.5" />Try again</button><Link to="/subjects" className="mt-3 block text-xs font-bold text-blue-700 hover:underline">Return to subject catalog</Link></div></main>;
}

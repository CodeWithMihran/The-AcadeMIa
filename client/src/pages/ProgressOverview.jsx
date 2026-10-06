import { TRACKS } from "../constants";
import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ArrowRight, Award, BookOpen, RefreshCw } from "lucide-react";
import { useGlobalProgress, useStudentSubjects } from "../hooks/useAcademiaQueries";

export const ProgressOverview = () => {
  const { user } = useAuth();
  const subjectsQuery = useStudentSubjects(user);
  const progressQuery = useGlobalProgress(user);
  const subjects = subjectsQuery.data || [];
  const progressMap = progressQuery.data?.subjectProgressMap || {};
  const overallProgress = progressQuery.data?.averageReadiness || 0;
  const loading = subjectsQuery.isLoading || progressQuery.isLoading;
  const queryError = subjectsQuery.error || progressQuery.error;
  const error = queryError?.response?.data?.message || (queryError ? "Could not load your progress. Please try again." : "");

  return (
    <main className="min-h-screen bg-app px-4 pb-16 pt-28 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-7 sm:space-y-9">
        <header className="flex flex-col gap-4 rounded-3xl border border-line bg-surface p-5 shadow-sm sm:p-7 sm:flex-row sm:items-end sm:justify-between">
          <div><p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[.16em] text-blue-700"><Award className="h-4 w-4" />Learning progress</p><h1 className="mt-2 text-3xl font-black tracking-tight text-content sm:text-4xl">Your progress</h1><p className="mt-2 text-sm leading-6 text-content-muted">See how your subject readiness is growing and continue where you left off.</p></div>
          <Link to="/dashboard" className="inline-flex min-h-10 items-center gap-2 self-start rounded-xl border border-line bg-surface-muted px-4 py-2.5 text-xs font-bold text-content-secondary hover:bg-surface-inverse hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 sm:self-auto">Back to dashboard <ArrowRight className="h-4 w-4" /></Link>
        </header>

        {error && <div role="alert" className="flex flex-col gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 sm:flex-row sm:items-center sm:justify-between"><span>{error}</span><button type="button" onClick={() => { subjectsQuery.refetch(); progressQuery.refetch(); }} disabled={loading} className="inline-flex min-h-10 items-center justify-center gap-2 self-start rounded-xl bg-surface px-4 py-2.5 text-xs font-bold text-content shadow-sm disabled:opacity-60"><RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />{loading ? "Retrying…" : "Try again"}</button></div>}

        <section className="grid gap-3 sm:grid-cols-2" aria-label="Progress summary">
          <SummaryCard icon={Award} label="Overall readiness" value={loading ? "—" : `${overallProgress}%`} detail="Average completion across your subjects" />
          <SummaryCard icon={BookOpen} label="Subjects in your track" value={loading ? "—" : subjects.length} detail="Subjects matched to your current study profile" />
        </section>

        <section aria-labelledby="subject-progress-title">
          <div className="mb-4"><p className="text-xs font-bold uppercase tracking-[.14em] text-content-faint">By subject</p><h2 id="subject-progress-title" className="mt-1 text-xl font-black text-content">Keep your momentum</h2></div>
          {loading ? <div role="status" aria-label="Loading progress" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{[1, 2, 3].map((item) => <div key={item} className="h-48 animate-pulse rounded-2xl border border-line bg-surface p-5"><div className="h-4 w-20 rounded bg-surface-subtle" /><div className="mt-5 h-6 w-3/4 rounded bg-surface-subtle" /><div className="mt-8 h-2 rounded-full bg-surface-subtle" /><div className="mt-5 h-8 rounded-xl bg-surface-subtle" /></div>)}</div>
            : subjects.length === 0 && error ? <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-800">Your subject list could not be confirmed. Retry the request above before treating this as an empty catalog.</div>
              : subjects.length === 0 ? <div className="rounded-2xl border border-dashed border-line-strong bg-surface p-8 text-center sm:p-10"><BookOpen className="mx-auto h-8 w-8 text-content-faint" /><h3 className="mt-3 font-bold text-content">No subjects to track yet</h3><p className="mt-1 text-sm text-content-muted">Once subjects are matched to your profile, your unit progress will appear here.</p><Link to="/subjects" className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-xl bg-surface-inverse px-4 py-2.5 text-xs font-bold text-white">Browse subjects <ArrowRight className="h-4 w-4" /></Link></div>
              : <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{subjects.map((subject) => <ProgressSubjectCard key={subject._id} subject={subject} percent={Number(progressMap[subject._id]) || 0} />)}</div>}
        </section>
      </div>
    </main>
  );
};

function SummaryCard({ icon: Icon, label, value, detail }) {
  return <article className="flex items-center gap-4 rounded-2xl border border-line bg-surface p-5 sm:p-6"><span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-700"><Icon className="h-6 w-6" /></span><div><p className="text-xs font-semibold text-content-muted">{label}</p><p className="text-2xl font-black text-content">{value}</p><p className="mt-0.5 text-xs text-content-faint">{detail}</p></div></article>;
}

function ProgressSubjectCard({ subject, percent }) {
  const context = subject.track === TRACKS.UNIVERSITY ? `${subject.branch || "Branch"} · Semester ${subject.semester || "—"}` : subject.examCategory || subject.track;
  return <article className="rounded-2xl border border-line bg-surface p-5 shadow-sm transition hover:border-line-strong hover:shadow-md sm:p-6">
    <div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="truncate text-[10px] font-bold uppercase tracking-wider text-content-faint">{subject.courseCode || subject.tenant?.shortCode || subject.track}</p><h3 className="mt-1 break-words text-lg font-black text-content">{subject.name}</h3><p className="mt-1 text-xs text-content-muted">{context}</p></div><span className="shrink-0 rounded-lg bg-blue-50 px-2.5 py-1.5 text-sm font-black text-blue-800">{percent}%</span></div>
    <div className="mt-4 h-2 overflow-hidden rounded-full bg-surface-subtle" role="progressbar" aria-label={`${subject.name} progress`} aria-valuemin="0" aria-valuemax="100" aria-valuenow={percent}><div className="h-full rounded-full bg-blue-600 transition-all" style={{ width: `${percent}%` }} /></div>
    <p className="mt-2 text-xs text-content-muted">{subject.units?.length || 0} units in this subject</p>
    <Link to={`/progress/${subject._id}`} className="mt-4 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl border border-line bg-surface-muted px-4 py-2.5 text-xs font-bold text-content-secondary hover:bg-surface-inverse hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2">Continue tracker <ArrowRight className="h-4 w-4" /></Link>
  </article>;
}

import { TRACKS } from "../constants";
import React, { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useStudentSubjects, useGlobalProgress, queryKeys } from "../hooks/useAcademiaQueries";
import { OnboardingModal } from "../components/OnboardingModal";
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Calculator,
  CheckCircle2,
  GraduationCap,
  Layers3,
  RefreshCw,
  Settings2,
} from "lucide-react";
import SkillRadarCard from "../components/SkillRadarCard";

export const Dashboard = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const enabled = Boolean(user?.onboardingCompleted);
  const subjectsQuery = useStudentSubjects(user, enabled);
  const progressQuery = useGlobalProgress(user, enabled);
  const subjects = subjectsQuery.data || [];
  const progressMap = progressQuery.data?.subjectProgressMap || {};
  const skillRadar = progressQuery.data?.skillRadar || [];
  const loading = enabled && (subjectsQuery.isLoading || progressQuery.isLoading);
  const dataError = subjectsQuery.error || progressQuery.error;
  const error = dataError?.response?.data?.message || (dataError ? "Could not load all dashboard data." : "");
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    if (user && !user.onboardingCompleted) setShowOnboarding(true);
  }, [user]);

  const loadDashboardData = () => Promise.all([
    queryClient.invalidateQueries({ queryKey: queryKeys.studentSubjects(user) }),
    queryClient.invalidateQueries({ queryKey: queryKeys.globalProgress(user) }),
  ]);

  const totalUnits = subjects.reduce((total, subject) => total + (subject.units?.length || 0), 0);
  const averageReadiness = subjects.length
    ? Math.round(subjects.reduce((total, subject) => total + (Number(progressMap[subject._id]) || 0), 0) / subjects.length)
    : 0;
  const universityTrack = user?.track === TRACKS.UNIVERSITY;
  const trackLabel = universityTrack ? "University curriculum" : `${user?.targetExam || "Competitive exam"} track`;

  return (
    <main className="min-h-screen bg-app px-4 pb-16 pt-28 sm:px-6 lg:px-8">
      <OnboardingModal
        isOpen={showOnboarding}
        onClose={() => {
          setShowOnboarding(false);
          loadDashboardData();
        }}
      />

      <div className="mx-auto max-w-7xl space-y-8 sm:space-y-10">
        <header className="grid gap-5 rounded-3xl border border-line bg-surface p-5 shadow-sm sm:p-7 lg:grid-cols-[1.4fr_.8fr] lg:p-8">
          <div className="flex flex-col items-start justify-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-line bg-surface-muted px-3 py-1.5 text-[11px] font-bold text-content-secondary">
              <GraduationCap className="h-4 w-4 text-blue-600" />{trackLabel}
            </span>
            <h1 className="mt-4 text-3xl font-black tracking-tight text-content sm:text-4xl">
              Welcome back, {user?.name?.split(" ")[0] || "student"}.
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-content-muted">
              {universityTrack
                ? `${user?.tenant?.shortCode || "Your university"} · ${user?.college || "Campus"} · ${user?.branch || "Branch"}, semester ${user?.semester || "—"}`
                : `Preparing for ${user?.targetExam || "your exam"} · target ${user?.targetYear || "year not set"}`}
            </p>
            <div className="mt-6 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
              <Link to="/subjects" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-surface-inverse px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2">
                Browse subjects <ArrowRight className="h-4 w-4" />
              </Link>
              <button type="button" onClick={() => setShowOnboarding(true)} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-line bg-surface px-4 py-3 text-sm font-semibold text-content-secondary transition hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2">
                <Settings2 className="h-4 w-4" />Update study track
              </button>
            </div>
          </div>

          <div className="flex flex-col justify-between gap-5 rounded-2xl border border-line bg-surface-muted p-5 sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold text-content-muted">Your semester snapshot</p>
                <p className="mt-1 text-lg font-black text-content">A little progress adds up.</p>
              </div>
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700"><CheckCircle2 className="h-5 w-5" /></span>
            </div>
            <div>
              <div className="mb-2 flex items-center justify-between gap-3 text-xs">
                <span className="font-semibold text-content-secondary">Average subject readiness</span>
                <span className="font-black text-content">{loading ? "—" : `${averageReadiness}%`}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-surface-hover" role="progressbar" aria-label="Average subject readiness" aria-valuemin="0" aria-valuemax="100" aria-valuenow={loading ? 0 : averageReadiness}>
                <div className="h-full rounded-full bg-blue-600 transition-all duration-500" style={{ width: `${loading ? 0 : averageReadiness}%` }} />
              </div>
            </div>
            <Link to="/progress" className="inline-flex min-h-10 items-center gap-2 self-start text-xs font-bold text-blue-700 hover:text-blue-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2">
              See your progress <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        </header>

        <section className="grid gap-3 sm:grid-cols-3" aria-label="Study overview">
          <OverviewStat icon={BookOpen} label="Subjects" value={loading ? "—" : subjects.length} />
          <OverviewStat icon={Layers3} label="Course units" value={loading ? "—" : totalUnits} />
          <OverviewStat icon={CheckCircle2} label="Average readiness" value={loading ? "—" : `${averageReadiness}%`} />
        </section>

        <Link to="/study-tools" className="group flex flex-col gap-4 rounded-2xl border border-blue-100 bg-blue-50/70 p-4 transition hover:border-blue-200 hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div className="flex items-center gap-4">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-surface text-blue-700 shadow-sm"><Calculator className="h-5 w-5" /></span>
            <div>
              <p className="text-sm font-black text-content">Daily study tools</p>
              <p className="mt-1 text-xs leading-5 text-content-muted">Attendance forecaster · SGPA planner · Internal marks tracker</p>
            </div>
          </div>
          <span className="inline-flex items-center gap-2 pl-[3.75rem] text-xs font-bold text-blue-700 sm:pl-0">Open study tools <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" /></span>
        </Link>

        <SkillRadarCard data={skillRadar} />

        <section aria-labelledby="dashboard-subjects-title">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[.16em] text-content-faint">Your learning space</p>
              <h2 id="dashboard-subjects-title" className="mt-1 text-2xl font-black tracking-tight text-content">Pick up a subject</h2>
              <p className="mt-1 text-sm text-content-muted">Open a vault to continue with units, resources, and progress.</p>
            </div>
            <div className="flex items-center gap-4">
              {subjectsQuery.isFetching || progressQuery.isFetching ? <span role="status" className="inline-flex items-center gap-1.5 text-xs text-content-muted"><RefreshCw className="h-3.5 w-3.5 animate-spin" />Updating</span> : null}
              <Link to="/subjects" className="inline-flex min-h-10 items-center gap-1.5 text-xs font-bold text-blue-700 hover:text-blue-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2">All subjects <ArrowRight className="h-3.5 w-3.5" /></Link>
            </div>
          </div>

          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3" aria-label="Loading subjects">
              {[1, 2, 3].map((item) => <div key={item} className="h-56 animate-pulse rounded-2xl border border-line bg-surface p-6"><div className="h-4 w-20 rounded bg-surface-subtle" /><div className="mt-5 h-6 w-3/4 rounded bg-surface-subtle" /><div className="mt-3 h-3 w-1/2 rounded bg-surface-subtle" /><div className="mt-8 h-2 rounded-full bg-surface-subtle" /><div className="mt-5 h-10 rounded-xl bg-surface-subtle" /></div>)}
            </div>
          ) : error ? (
            <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-6 sm:p-8">
              <p className="text-sm font-bold text-red-800">We couldn’t load your dashboard.</p>
              <p className="mt-1 text-sm text-red-700">{error}</p>
              <button type="button" onClick={loadDashboardData} className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-xl bg-surface px-4 py-2.5 text-xs font-bold text-content shadow-sm transition hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"><RefreshCw className="h-3.5 w-3.5" />Try again</button>
            </div>
          ) : subjects.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-line-strong bg-surface p-8 text-center sm:p-12">
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-muted text-content-muted"><BookOpen className="h-6 w-6" /></span>
              <h3 className="mt-4 text-lg font-black text-content">No subjects in this workspace yet</h3>
              <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-content-muted">We couldn’t find subjects for {user?.branch || user?.targetExam || "your study track"}. Check your study profile or browse the available catalog.</p>
              <div className="mt-5 flex flex-col justify-center gap-2 sm:flex-row">
                <button type="button" onClick={() => setShowOnboarding(true)} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-surface-inverse px-4 py-2.5 text-xs font-bold text-white hover:bg-blue-700">Check my study profile</button>
                <Link to="/subjects" className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-line bg-surface px-4 py-2.5 text-xs font-bold text-content-secondary hover:bg-surface-muted">Browse subject catalog</Link>
              </div>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {subjects.map((subject) => <SubjectCard key={subject._id} subject={subject} progress={Number(progressMap[subject._id]) || 0} />)}
            </div>
          )}
        </section>
      </div>
    </main>
  );
};

function OverviewStat({ icon: Icon, label, value }) {
  return <div className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-4 sm:p-5">
    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface-muted text-content-secondary"><Icon className="h-5 w-5" /></span>
    <div><p className="text-xs font-semibold text-content-muted">{label}</p><p className="mt-0.5 text-xl font-black text-content">{value}</p></div>
  </div>;
}

function SubjectCard({ subject, progress }) {
  return <article className="group flex min-h-56 flex-col rounded-2xl border border-line bg-surface p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-line-strong hover:shadow-md sm:p-6">
    <div className="flex items-start justify-between gap-3">
      <span className="max-w-[70%] truncate rounded-lg bg-surface-muted px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wide text-content-muted">{subject.courseCode || `Semester ${subject.semester || 1}`}</span>
      <span className="shrink-0 text-xs font-semibold text-content-muted">{subject.units?.length || 0} units</span>
    </div>
    <div className="mt-4 flex-1">
      <h3 className="text-lg font-black leading-snug text-content transition-colors group-hover:text-blue-700">{subject.name}</h3>
      <p className="mt-1.5 text-xs text-content-muted">{subject.tenant?.shortCode || "Study track"} · {subject.branch || subject.examCategory || "General"}</p>
    </div>
    <div className="mt-5">
      <div className="mb-2 flex items-center justify-between gap-3 text-xs"><span className="font-semibold text-content-muted">Topic readiness</span><span className="font-black text-content">{progress}%</span></div>
      <div className="h-1.5 overflow-hidden rounded-full bg-surface-subtle" role="progressbar" aria-label={`${subject.name} readiness`} aria-valuemin="0" aria-valuemax="100" aria-valuenow={progress}><div className="h-full rounded-full bg-blue-600 transition-all duration-500" style={{ width: `${progress}%` }} /></div>
      <Link to={`/subjects/${subject._id}`} className="mt-4 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl border border-line bg-surface-muted px-4 py-2.5 text-xs font-bold text-content transition hover:border-line-strong hover:bg-surface-inverse hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2">Open subject vault <ArrowUpRight className="h-4 w-4" /></Link>
    </div>
  </article>;
}

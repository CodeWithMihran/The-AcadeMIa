import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { TRACKS } from "../constants";
import { useAuth } from "../context/AuthContext";
import { useStudentSubjects } from "../hooks/useAcademiaQueries";
import { useDebouncedValue } from "../hooks/useDebouncedValue";
import {
  ArrowRight,
  BookOpen,
  ChevronRight,
  GraduationCap,
  Layers3,
  RefreshCw,
  Search,
  X,
} from "lucide-react";

export const SubjectCatalog = () => {
  const { user } = useAuth();
  const { data: subjects = [], isLoading, isFetching, error: queryError, refetch } = useStudentSubjects(user);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 300);
  const error = queryError?.response?.data?.message || (queryError ? "Could not load your subject catalog." : "");

  const isUniversity = user?.track === TRACKS.UNIVERSITY;
  const filteredSubjects = useMemo(() => {
    const query = debouncedSearch.trim().toLocaleLowerCase();
    if (!query) return subjects;
    return subjects.filter((subject) => [subject.name, subject.courseCode, subject.branch, subject.examCategory, subject.tenant?.shortCode]
      .some((value) => String(value || "").toLocaleLowerCase().includes(query)));
  }, [subjects, debouncedSearch]);

  const totalUnits = subjects.reduce((total, subject) => total + (subject.units?.length || 0), 0);
  const totalTopics = subjects.reduce((total, subject) => total + (subject.units || []).reduce((unitTotal, unit) => unitTotal + (unit.topics?.length || 0), 0), 0);

  if (!user) return null;

  return (
    <main className="min-h-screen bg-app px-4 pb-16 pt-28 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-8 sm:space-y-10">
        <header className="flex flex-col gap-5 rounded-3xl border border-line bg-surface p-5 shadow-sm sm:p-7 lg:flex-row lg:items-end lg:justify-between lg:p-8">
          <div className="min-w-0">
            <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[.16em] text-blue-700"><BookOpen className="h-4 w-4" />Your learning space</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-content sm:text-4xl">Subject catalog</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-content-muted">Find a subject to open its units, study material, exam revision, and progress.</p>
            <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
              <span className="rounded-full bg-surface-muted px-3 py-1.5 font-bold text-content-secondary">{isUniversity ? user.branch || "University track" : user.targetExam || "Competitive track"}</span>
              <span className="rounded-full bg-surface-muted px-3 py-1.5 font-semibold text-content-muted">{isUniversity ? `Semester ${user.semester || "—"}` : `Target ${user.targetYear || "year not set"}`}</span>
              {isUniversity && user.tenant?.shortCode && <span className="rounded-full bg-surface-muted px-3 py-1.5 font-semibold text-content-muted">{user.tenant.shortCode}</span>}
            </div>
          </div>
          <Link to="/profile" className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 self-start rounded-xl border border-line bg-surface px-4 py-2.5 text-xs font-bold text-content-secondary transition hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 lg:self-auto">
            <GraduationCap className="h-4 w-4" />Study profile <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </header>

        <section className="grid gap-3 sm:grid-cols-3" aria-label="Catalog overview">
          <CatalogStat label="Subjects available" value={isLoading ? "—" : subjects.length} icon={BookOpen} />
          <CatalogStat label="Course units" value={isLoading ? "—" : totalUnits} icon={Layers3} />
          <CatalogStat label="Topics to explore" value={isLoading ? "—" : totalTopics} icon={GraduationCap} />
        </section>

        <section aria-labelledby="available-subjects-title">
          <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 id="available-subjects-title" className="text-xl font-black tracking-tight text-content">Available subjects</h2>
              <p className="mt-1 text-sm text-content-muted">{isLoading ? "Loading your subjects…" : `${filteredSubjects.length} of ${subjects.length} subjects`}</p>
            </div>
            <label className="relative block w-full sm:max-w-sm">
              <span className="sr-only">Search subjects</span>
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-content-faint" />
              <input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by subject or course code" className="min-h-11 w-full rounded-xl border border-line bg-surface py-2.5 pl-10 pr-10 text-sm text-content placeholder:text-content-faint focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
              {search && <button type="button" aria-label="Clear subject search" onClick={() => setSearch("")} className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-content-muted hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"><X className="h-4 w-4" /></button>}
            </label>
          </div>

          {isLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3" aria-label="Loading subject catalog">
              {[1, 2, 3].map((item) => <div key={item} className="h-64 animate-pulse rounded-2xl border border-line bg-surface p-5"><div className="h-10 w-10 rounded-xl bg-surface-subtle" /><div className="mt-5 h-5 w-3/4 rounded bg-surface-subtle" /><div className="mt-3 h-3 w-1/2 rounded bg-surface-subtle" /><div className="mt-8 h-10 rounded-xl bg-surface-subtle" /></div>)}
            </div>
          ) : error ? (
            <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-6 sm:p-8">
              <p className="text-sm font-bold text-red-800">Your subject catalog couldn’t load.</p>
              <p className="mt-1 text-sm text-red-700">{error}</p>
              <button type="button" onClick={() => refetch()} disabled={isFetching} className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-xl bg-surface px-4 py-2.5 text-xs font-bold text-content shadow-sm disabled:opacity-60"><RefreshCw className={`h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`} />Try again</button>
            </div>
          ) : subjects.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-line-strong bg-surface p-8 text-center sm:p-12">
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-muted text-content-muted"><BookOpen className="h-6 w-6" /></span>
              <h3 className="mt-4 text-lg font-black text-content">No subjects are available yet</h3>
              <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-content-muted">There are no subjects for {isUniversity ? `${user.branch || "your branch"}, semester ${user.semester || "—"}` : user.targetExam || "your exam track"} right now. Check your study profile or try again later.</p>
              <Link to="/profile" className="mt-5 inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-surface-inverse px-4 py-2.5 text-xs font-bold text-white hover:bg-blue-700">Review study profile <ArrowRight className="h-4 w-4" /></Link>
            </div>
          ) : filteredSubjects.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-line-strong bg-surface p-8 text-center sm:p-10">
              <Search className="mx-auto h-8 w-8 text-content-faint" />
              <h3 className="mt-3 font-bold text-content">No subjects match “{debouncedSearch}”</h3>
              <p className="mt-1 text-sm text-content-muted">Try another name or course code.</p>
              <button type="button" onClick={() => setSearch("")} className="mt-4 min-h-10 rounded-xl border border-line px-4 py-2 text-xs font-bold text-content-secondary hover:bg-surface-muted">Clear search</button>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {filteredSubjects.map((subject) => <CatalogSubjectCard key={subject._id} subject={subject} isUniversity={isUniversity} />)}
            </div>
          )}
        </section>

        {subjects.length > 0 && <aside className="flex flex-col gap-3 rounded-2xl border border-line bg-surface-muted p-4 sm:flex-row sm:items-center sm:p-5">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface text-blue-700"><GraduationCap className="h-5 w-5" /></span>
          <p className="text-sm leading-6 text-content-secondary"><span className="font-bold text-content">Start with one unit.</span> Open a subject vault to find its notes, books, videos, PYQs, exam revision resources, and related career practice.</p>
        </aside>}
      </div>
    </main>
  );
};

function CatalogStat({ label, value, icon: Icon }) {
  return <div className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-4 sm:p-5">
    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface-muted text-content-secondary"><Icon className="h-5 w-5" /></span>
    <div><p className="text-xs font-semibold text-content-muted">{label}</p><p className="mt-0.5 text-xl font-black text-content">{value}</p></div>
  </div>;
}

function CatalogSubjectCard({ subject, isUniversity }) {
  const units = subject.units || [];
  const topicCount = units.reduce((total, unit) => total + (unit.topics?.length || 0), 0);
  return <article className="group flex min-h-64 flex-col rounded-2xl border border-line bg-surface p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-line-strong hover:shadow-md sm:p-6">
    <div className="flex items-start justify-between gap-3">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700"><BookOpen className="h-5 w-5" /></span>
      {subject.courseCode && <span className="max-w-[60%] truncate rounded-lg bg-surface-muted px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wide text-content-muted">{subject.courseCode}</span>}
    </div>
    <div className="mt-4 flex-1">
      <h3 className="text-lg font-black leading-snug text-content transition-colors group-hover:text-blue-700">{subject.name}</h3>
      <p className="mt-1.5 text-xs text-content-muted">{subject.tenant?.shortCode || (isUniversity ? subject.branch : subject.examCategory) || "Core subject"}</p>
      <div className="mt-4 flex flex-wrap gap-2 text-xs">
        <span className="rounded-lg bg-surface-muted px-2.5 py-1.5 font-semibold text-content-secondary">{units.length} {units.length === 1 ? "unit" : "units"}</span>
        <span className="rounded-lg bg-surface-muted px-2.5 py-1.5 font-semibold text-content-secondary">{topicCount} {topicCount === 1 ? "topic" : "topics"}</span>
      </div>
    </div>
    <div className="mt-5 grid gap-2 sm:grid-cols-[1fr_auto]">
      <Link to={`/subjects/${subject._id}`} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-surface-inverse px-4 py-3 text-xs font-bold text-white transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2">Open subject vault <ArrowRight className="h-4 w-4" /></Link>
      <Link to={`/progress/${subject._id}`} className="inline-flex min-h-11 items-center justify-center rounded-xl border border-line bg-surface px-4 py-3 text-xs font-bold text-content-secondary transition hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2">Progress</Link>
    </div>
  </article>;
}

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Award, BookOpen, RotateCw } from 'lucide-react';
import { progressService, subjectService } from '../services/api';

export const ProgressOverview = () => {
  const [subjects, setSubjects] = useState([]);
  const [progressMap, setProgressMap] = useState({});
  const [overallProgress, setOverallProgress] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    const loadProgress = async () => {
      setLoading(true);
      setError('');
      try {
        const [subjectsResponse, progressResponse] = await Promise.all([
          subjectService.getSubjects(),
          progressService.getGlobalProgress()
        ]);
        if (cancelled) return;
        setSubjects(subjectsResponse.data.subjects || []);
        setProgressMap(progressResponse.data.subjectProgressMap || {});
        setOverallProgress(progressResponse.data.averageReadiness || 0);
      } catch (err) {
        if (!cancelled) setError(err.response?.data?.message || 'Could not load your progress. Please try again.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    loadProgress();
    return () => { cancelled = true; };
  }, []);

  return (
    <main className="min-h-screen bg-[#fbfbfa] px-6 pb-20 pt-32">
      <div className="mx-auto max-w-6xl space-y-8">
        <header className="flex flex-col gap-4 border-b border-gray-200 pb-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-2 text-xs font-black uppercase tracking-[0.25em] text-blue-600">Learning progress</p>
            <h1 className="text-4xl font-black tracking-tight text-gray-900">Progress Tracker</h1>
            <p className="mt-2 text-sm text-gray-500">Review your overall readiness and continue any subject.</p>
          </div>
          <Link to="/dashboard" className="text-sm font-bold text-blue-600 hover:text-blue-800">Back to dashboard</Link>
        </header>

        {error && <div role="alert" className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</div>}

        <section className="grid gap-5 md:grid-cols-2">
          <div className="flex items-center gap-4 rounded-3xl border border-gray-200 bg-white p-7 shadow-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600"><Award className="h-6 w-6" /></div>
            <div><p className="text-xs font-bold uppercase tracking-wider text-gray-400">Overall readiness</p><p className="text-3xl font-black text-gray-900">{loading ? '—' : `${overallProgress}%`}</p></div>
          </div>
          <div className="flex items-center gap-4 rounded-3xl border border-gray-200 bg-white p-7 shadow-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600"><BookOpen className="h-6 w-6" /></div>
            <div><p className="text-xs font-bold uppercase tracking-wider text-gray-400">Your subjects</p><p className="text-3xl font-black text-gray-900">{loading ? '—' : subjects.length}</p></div>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-sm font-black uppercase tracking-widest text-gray-500">Subject progress</h2>
          {loading ? (
            <div className="rounded-2xl bg-white p-8 text-sm text-gray-500">Loading your subject progress…</div>
          ) : subjects.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center text-sm text-gray-500">No subjects are assigned to your academic profile yet.</div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {subjects.map(subject => {
                const percent = progressMap[subject._id] || 0;
                return (
                  <article key={subject._id} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">{subject.courseCode || subject.tenant?.shortCode || subject.track}</p>
                        <h3 className="mt-1 text-lg font-black text-gray-900">{subject.name}</h3>
                        <p className="mt-1 text-xs text-gray-500">{subject.track === 'UNIVERSITY' ? `${subject.branch || 'Branch'} · Semester ${subject.semester || '—'}` : subject.examCategory || subject.track}</p>
                      </div>
                      <span className="text-lg font-black text-blue-600">{percent}%</span>
                    </div>
                    <div className="mt-4 h-2 overflow-hidden rounded-full bg-gray-100"><div className="h-full rounded-full bg-blue-600 transition-all" style={{ width: `${percent}%` }} /></div>
                    <Link to={`/progress/${subject._id}`} className="mt-5 inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider text-gray-700 hover:text-blue-600">
                      Open subject tracker <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </article>
                );
              })}
            </div>
          )}
          {error && <button onClick={() => window.location.reload()} className="inline-flex items-center gap-2 text-xs font-bold text-blue-600"><RotateCw className="h-3.5 w-3.5" /> Reload progress</button>}
        </section>
      </div>
    </main>
  );
};

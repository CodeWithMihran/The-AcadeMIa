import React, { useState, useEffect, useCallback, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import API from "../services/api";
import {
  ArrowLeft,
  ArrowRight,
  Award,
  BookOpen,
  CheckCircle2,
  Circle,
  Eye,
  FileText,
  LoaderCircle,
  RefreshCw,
  Video,
} from "lucide-react";
import StudyMaterialViewer from "../components/StudyMaterialViewer";

export default function SubjectDetail() {
  const queryClient = useQueryClient();
  const { id, subjectId } = useParams();
  const subjectIdToLoad = id || subjectId;
  const [subject, setSubject] = useState(null);
  const [completedTopics, setCompletedTopics] = useState(new Set());
  const [progress, setProgress] = useState(0);
  const [unitProgress, setUnitProgress] = useState([]);
  const [completedTopicCount, setCompletedTopicCount] = useState(0);
  const [totalTopicCount, setTotalTopicCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [progressError, setProgressError] = useState("");
  const [progressMessage, setProgressMessage] = useState("");
  const [busyTopicId, setBusyTopicId] = useState("");
  const [activeMaterial, setActiveMaterial] = useState(null);
  const [careerNotice, setCareerNotice] = useState(null);
  const requestSequence = useRef(0);
  const progressUpdateInFlight = useRef(false);
  const closeViewer = useCallback(() => setActiveMaterial(null), []);

  const fetchSubjectAndProgress = useCallback(async () => {
    const requestId = ++requestSequence.current;
    setLoading(true);
    setError("");
    setProgressError("");
    setSubject(null);
    setCompletedTopics(new Set());
    setProgress(0);
    setUnitProgress([]);
    setCompletedTopicCount(0);
    setTotalTopicCount(0);
    try {
      const [subjectResult, progressResult] = await Promise.allSettled([
        API.get(`/subjects/${subjectIdToLoad}`),
        API.get(`/progress/${subjectIdToLoad}`),
      ]);
      if (requestId !== requestSequence.current) return;

      if (subjectResult.status === "fulfilled" && subjectResult.value.data.success) {
        setSubject(subjectResult.value.data.subject);
      } else {
        setError(subjectResult.reason?.response?.data?.message || "Could not load this subject.");
      }
      if (progressResult.status === "fulfilled" && progressResult.value.data.success) {
        const progressData = progressResult.value.data;
        setCompletedTopics(new Set(progressData.completedTopicIds || []));
        setProgress(progressData.subjectProgress || 0);
        setUnitProgress(progressData.unitProgress || []);
        setCompletedTopicCount(progressData.completedTopics || 0);
        setTotalTopicCount(progressData.totalTopics || 0);
      } else {
        setProgressError(progressResult.reason?.response?.data?.message || "Could not load subject progress.");
      }
    } catch (err) {
      if (requestId !== requestSequence.current) return;
      console.error("Error loading subject details:", err);
      setError(err.response?.data?.message || "Could not load this subject.");
    } finally {
      if (requestId === requestSequence.current) setLoading(false);
    }
  }, [subjectIdToLoad]);

  useEffect(() => {
    if (subjectIdToLoad) fetchSubjectAndProgress();
    return () => { requestSequence.current += 1; };
  }, [subjectIdToLoad, fetchSubjectAndProgress]);

  useEffect(() => {
    if (!careerNotice) return undefined;
    const timer = window.setTimeout(() => setCareerNotice(null), 8000);
    return () => window.clearTimeout(timer);
  }, [careerNotice]);

  const handleTopicToggle = async (topicId) => {
    if (progressUpdateInFlight.current) return;
    progressUpdateInFlight.current = true;
    setBusyTopicId(String(topicId));
    setProgressError("");
    setProgressMessage("");
    const updated = new Set(completedTopics);
    if (updated.has(topicId)) updated.delete(topicId);
    else updated.add(topicId);
    setCompletedTopics(updated);

    try {
      const res = await API.post("/progress/toggle", { subjectId: subjectIdToLoad, topicId });
      if (!res.data.success) throw new Error(res.data.message || "Could not update topic progress.");

      const completed = new Set(updated);
      if (res.data.completed) completed.add(topicId);
      else completed.delete(topicId);
      setCompletedTopics(completed);
      const units = subject?.units || [];
      const topicKey = (topic) => String(topic._id || topic.id || "");
      let total = 0;
      let done = 0;
      const nextUnitProgress = units.map((unit) => {
        const topics = unit.topics || [];
        const unitDone = topics.filter((topic) => completed.has(topicKey(topic))).length;
        total += topics.length;
        done += unitDone;
        return topics.length ? Math.round((unitDone / topics.length) * 100) : 0;
      });
      setProgress(total ? Math.round((done / total) * 100) : 0);
      setUnitProgress(nextUnitProgress);
      setCompletedTopicCount(done);
      setTotalTopicCount(total);
      setProgressMessage("Progress saved.");
      queryClient.invalidateQueries({ queryKey: ["globalProgress"] });

      if (res.data.completed) {
        const topic = units.flatMap((unit) => unit.topics || []).find((item) => topicKey(item) === String(topicId));
        const topicName = topic?.title || topic?.name || "this topic";
        const normalize = (value) => String(value || "").trim().toLocaleLowerCase();
        const bridge = subject?.careerBridge || {};
        const questionCount = (bridge.interviewQuestions || []).filter((item) => normalize(item.topic) === normalize(topicName)).length;
        const codingCount = (bridge.codingLinks || []).filter((item) => normalize(item.topic) === normalize(topicName)).length;
        if (questionCount + codingCount > 0) setCareerNotice({ topicName, questionCount, codingCount });
      }
    } catch (err) {
      console.error("Failed to toggle topic:", err);
      await fetchSubjectAndProgress();
      setProgressError(err.response?.data?.message || err.message || "Could not save topic progress. Your saved progress has been reloaded.");
    } finally {
      progressUpdateInFlight.current = false;
      setBusyTopicId("");
    }
  };

  if (loading) return <ProgressLoadingState />;
  if (!subject) return <ProgressErrorState error={error} onRetry={fetchSubjectAndProgress} />;

  const units = subject.units || [];

  return (
    <main className="min-h-screen bg-app px-4 pb-16 pt-28 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6 sm:space-y-8">
        <Link to={`/subjects/${subjectIdToLoad}`} className="inline-flex min-h-10 items-center gap-2 rounded-lg text-sm font-semibold text-content-muted transition hover:text-content focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"><ArrowLeft className="h-4 w-4" /> Back to subject vault</Link>

        <header className="grid gap-5 rounded-3xl border border-line bg-surface p-5 shadow-sm sm:p-7 lg:grid-cols-[1fr_auto] lg:items-center lg:p-8">
          <div className="min-w-0">
            <span className="inline-flex items-center gap-2 rounded-lg bg-blue-50 px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wide text-blue-800"><Award className="h-3.5 w-3.5" />Subject progress</span>
            <h1 className="mt-3 break-words text-3xl font-black tracking-tight text-content sm:text-4xl">{subject.name}</h1>
            <p className="mt-2 text-sm text-content-muted">Mark topics as you finish them. Your unit and subject readiness updates as you go.</p>
          </div>
          <div className="min-w-0 rounded-2xl border border-line bg-surface-muted p-4 sm:min-w-64 sm:p-5">
            <div className="flex items-center justify-between gap-3"><p className="text-xs font-bold text-content-secondary">Subject readiness</p><span className="text-2xl font-black text-content">{progress}%</span></div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-surface-hover" role="progressbar" aria-label="Subject readiness" aria-valuemin="0" aria-valuemax="100" aria-valuenow={progress}><div className="h-full rounded-full bg-blue-600 transition-all duration-500" style={{ width: `${progress}%` }} /></div>
            <p className="mt-2 text-xs text-content-muted">{completedTopicCount} of {totalTopicCount} topics complete</p>
          </div>
          <div className="grid grid-cols-2 gap-2 lg:col-span-2">
            <div className="rounded-xl border border-line bg-surface-muted px-3 py-2.5"><p className="text-[10px] font-semibold text-content-muted">Units</p><p className="text-base font-black text-content">{units.length}</p></div>
            <div className="rounded-xl border border-line bg-surface-muted px-3 py-2.5"><p className="text-[10px] font-semibold text-content-muted">Topics completed</p><p className="text-base font-black text-content">{completedTopicCount} / {totalTopicCount}</p></div>
          </div>
        </header>

        {progressError && <div role="alert" className="flex flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 sm:flex-row sm:items-center sm:justify-between"><span>{progressError}</span><button type="button" onClick={fetchSubjectAndProgress} className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 self-start rounded-lg bg-surface px-3 py-2 text-xs font-bold text-content hover:bg-surface-subtle"><RefreshCw className="h-3.5 w-3.5" />Retry</button></div>}
        {progressMessage && <p role="status" aria-live="polite" className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-700"><CheckCircle2 className="h-4 w-4" />{progressMessage}</p>}

        <section aria-labelledby="topic-checklist-title">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[.14em] text-content-faint">Your checklist</p><h2 id="topic-checklist-title" className="mt-1 text-xl font-black text-content">Topics by unit</h2></div><p className="text-xs font-medium text-content-muted">Select a topic to update its completion</p></div>
          {units.length ? <div className="space-y-4">
            {units.map((unit, unitIndex) => {
              const percent = unitProgress[unitIndex] || 0;
              const topics = unit.topics || [];
              return <article key={unit._id || unitIndex} className="rounded-2xl border border-line bg-surface p-4 shadow-sm sm:p-5">
                <header className="flex flex-wrap items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-xs font-black text-blue-800">{String(unit.unitNumber || unitIndex + 1).padStart(2, "0")}</span>
                  <div className="min-w-0 flex-1"><p className="text-[10px] font-bold uppercase tracking-wider text-content-faint">Unit {unit.unitNumber || unitIndex + 1}</p><h3 className="break-words text-base font-black text-content">{unit.name || unit.unitTitle || `Unit ${unitIndex + 1}`}</h3></div>
                  <span className="rounded-lg bg-surface-muted px-2.5 py-1.5 text-xs font-bold text-content-secondary">{percent}%</span>
                </header>
                <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-surface-subtle" role="progressbar" aria-label={`${unit.name || unit.unitTitle || `Unit ${unitIndex + 1}`} progress`} aria-valuemin="0" aria-valuemax="100" aria-valuenow={percent}><div className="h-full rounded-full bg-blue-600 transition-all duration-500" style={{ width: `${percent}%` }} /></div>

                {topics.length ? <ul className="mt-4 divide-y divide-line rounded-xl border border-line">
                  {topics.map((topic) => {
                    const topicIdStr = topic._id ? topic._id.toString() : topic.toString();
                    const topicName = topic.name || topic.title || "Untitled topic";
                    const isDone = completedTopics.has(topicIdStr);
                    const isSaving = busyTopicId === topicIdStr;
                    return <li key={topicIdStr} className={`p-3 transition sm:p-4 ${isDone ? "bg-emerald-50/40" : "bg-surface"}`}>
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                        <button type="button" aria-pressed={isDone} aria-label={`${isDone ? "Mark incomplete" : "Mark complete"}: ${topicName}`} aria-busy={isSaving} disabled={Boolean(busyTopicId)} onClick={() => handleTopicToggle(topicIdStr)} className="flex min-h-11 min-w-0 flex-1 items-center gap-3 rounded-lg text-left text-sm font-semibold text-content transition hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-70">
                          {isSaving ? <LoaderCircle className="h-5 w-5 shrink-0 animate-spin text-blue-700" /> : isDone ? <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" /> : <Circle className="h-5 w-5 shrink-0 text-content-faint" />}
                          <span className={isDone ? "text-content-muted" : "text-content"}>{topicName}</span>
                          {isSaving && <span className="text-xs font-medium text-content-muted">Saving…</span>}
                        </button>
                        {topic.importance && <span className={`self-start rounded-lg border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide sm:self-auto ${topic.importance === "HIGH" ? "border-red-100 bg-red-50 text-red-700" : topic.importance === "MEDIUM" ? "border-amber-100 bg-amber-50 text-amber-800" : "border-line bg-surface-muted text-content-muted"}`}>{topic.importance} priority</span>}
                      </div>
                      {topic.resources?.length > 0 && <ul className="mt-3 flex flex-wrap gap-2 border-t border-line pt-3 sm:ml-8">
                        {topic.resources.map((resource, resourceIndex) => {
                          const Icon = resource.type === "VIDEO" ? Video : resource.type === "PYQ" ? BookOpen : resource.type === "PDF" ? FileText : Eye;
                          const resourceColor = resource.type === "VIDEO" ? "text-red-700 hover:bg-red-50" : resource.type === "PYQ" ? "text-amber-800 hover:bg-amber-50" : "text-blue-700 hover:bg-blue-50";
                          const resourceTitle = resource.title || topicName;
                          return <li key={resource._id || resourceIndex}><button type="button" aria-label={`Open ${resource.type || "study"} material: ${resourceTitle}`} onClick={() => setActiveMaterial({ title: resourceTitle, url: resource.url || resource.link, kind: resource.type === "VIDEO" ? "video" : "pdf" })} disabled={!resource.url && !resource.link} className={`inline-flex min-h-10 items-center gap-2 rounded-xl border border-line bg-surface px-3 py-2 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:text-content-faint ${resourceColor}`}><Icon className="h-4 w-4" />{resourceTitle}<Eye className="h-3.5 w-3.5 opacity-60" /></button></li>;
                        })}
                      </ul>}
                    </li>;
                  })}
                </ul> : <p className="mt-4 rounded-xl border border-dashed border-line bg-surface-muted px-4 py-3 text-sm text-content-muted">No topics have been added to this unit yet.</p>}
              </article>;
            })}
          </div> : <div className="rounded-2xl border border-dashed border-line-strong bg-surface p-8 text-center text-sm text-content-muted">No units or topics are available for this subject yet. You can return to the vault and explore its resources.</div>}
        </section>

        {careerNotice && <div role="status" aria-live="polite" className="flex flex-col gap-3 rounded-2xl border border-blue-200 bg-blue-50 p-4 text-blue-950 shadow-sm sm:flex-row sm:items-center sm:justify-between"><p className="text-sm font-semibold">Nice work finishing {careerNotice.topicName}. Explore {careerNotice.questionCount ? `${careerNotice.questionCount} interview question${careerNotice.questionCount === 1 ? "" : "s"}` : ""}{careerNotice.questionCount && careerNotice.codingCount ? " and " : ""}{careerNotice.codingCount ? `${careerNotice.codingCount} coding problem${careerNotice.codingCount === 1 ? "" : "s"}` : ""} linked to this topic.</p><Link to={`/subjects/${subjectIdToLoad}?mode=career`} className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-xl bg-blue-700 px-4 py-2.5 text-xs font-black text-white hover:bg-blue-800">Explore Career Bridge <ArrowRight className="h-3.5 w-3.5" /></Link></div>}
      </div>
      <StudyMaterialViewer material={activeMaterial} onClose={closeViewer} />
    </main>
  );
}

function ProgressLoadingState() {
  return <main className="min-h-screen bg-app px-4 pb-16 pt-28 sm:px-6 lg:px-8"><div className="mx-auto max-w-7xl animate-pulse space-y-5" role="status" aria-label="Loading subject progress"><div className="h-5 w-40 rounded bg-surface-subtle" /><div className="h-52 rounded-3xl border border-line bg-surface" /><div className="h-64 rounded-2xl border border-line bg-surface" /></div></main>;
}

function ProgressErrorState({ error, onRetry }) {
  return <main className="min-h-screen bg-app px-4 pb-16 pt-28 sm:px-6 lg:px-8"><div role="alert" className="mx-auto max-w-2xl rounded-2xl border border-red-200 bg-red-50 p-6 text-center sm:p-8"><p className="font-black text-red-900">Subject progress couldn’t load.</p><p className="mt-2 text-sm text-red-800">{error || "Subject not found."}</p><button type="button" onClick={onRetry} className="mt-5 inline-flex min-h-10 items-center gap-2 rounded-xl bg-surface px-4 py-2.5 text-xs font-bold text-content shadow-sm hover:bg-surface-muted"><RefreshCw className="h-3.5 w-3.5" />Try again</button><Link to="/subjects" className="mt-3 block text-xs font-bold text-blue-700 hover:underline">Back to subject catalog</Link></div></main>;
}

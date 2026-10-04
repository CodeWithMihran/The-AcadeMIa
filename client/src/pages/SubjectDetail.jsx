import React, { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import API from "../services/api";
import {
  CheckCircle2,
  Circle,
  BookOpen,
  FileText,
  Video,
  ArrowLeft,
  Award,
  Eye
} from "lucide-react";
import StudyMaterialViewer from "../components/StudyMaterialViewer";

export default function SubjectDetail() {
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
  const [activeMaterial, setActiveMaterial] = useState(null);
  const [careerNotice, setCareerNotice] = useState(null);
  const closeViewer = useCallback(() => setActiveMaterial(null), []);

  const fetchSubjectAndProgress = useCallback(async () => {
    setLoading(true);
    setError("");
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
        setError(current => current || progressResult.reason?.response?.data?.message || "Could not load subject progress.");
      }
    } catch (err) {
      console.error("Error loading subject details:", err);
      setError(err.response?.data?.message || "Could not load this subject.");
    } finally {
      setLoading(false);
    }
  }, [subjectIdToLoad]);

  useEffect(() => {
    if (subjectIdToLoad) fetchSubjectAndProgress();
  }, [subjectIdToLoad, fetchSubjectAndProgress]);

  useEffect(() => {
    if (!careerNotice) return undefined;
    const timer = window.setTimeout(() => setCareerNotice(null), 8000);
    return () => window.clearTimeout(timer);
  }, [careerNotice]);

  const handleTopicToggle = async (topicId) => {
    const updated = new Set(completedTopics);
    if (updated.has(topicId)) {
      updated.delete(topicId);
    } else {
      updated.add(topicId);
    }
    setCompletedTopics(updated);

    try {
      const res = await API.post("/progress/toggle", {
        subjectId: subjectIdToLoad,
        topicId,
      });
      if (res.data.success) {
        setCompletedTopics(current => {
          const next = new Set(current);
          if (res.data.completed) next.add(topicId);
        else next.delete(topicId);
          return next;
        });
        if (res.data.completed) {
          const topic = subject?.units?.flatMap(unit => unit.topics || []).find(item => String(item._id || item.id) === String(topicId));
          const topicName = topic?.title || topic?.name || "this topic";
          const normalize = value => String(value || "").trim().toLocaleLowerCase();
          const bridge = subject?.careerBridge || {};
          const questionCount = (bridge.interviewQuestions || []).filter(item => normalize(item.topic) === normalize(topicName)).length;
          const codingCount = (bridge.codingLinks || []).filter(item => normalize(item.topic) === normalize(topicName)).length;
          if (questionCount + codingCount > 0) setCareerNotice({ topicName, questionCount, codingCount });
        }
        const progRes = await API.get(`/progress/${subjectIdToLoad}`);
        if (progRes.data.success) {
          setProgress(progRes.data.subjectProgress);
          setUnitProgress(progRes.data.unitProgress || []);
          setCompletedTopicCount(progRes.data.completedTopics || 0);
          setTotalTopicCount(progRes.data.totalTopics || 0);
        }
      }
    } catch (err) {
      console.error("Failed to toggle topic:", err);
      fetchSubjectAndProgress();
    }
  };

  if (loading)
    return (
      <div className="p-24 text-center font-bold text-gray-400 uppercase tracking-widest text-xs">
        Loading Vault...
      </div>
    );
  if (!subject)
    return (
      <div className="p-24 text-center">
        <p className="font-bold text-red-500 text-sm">{error || "Subject not found."}</p>
        <button type="button" onClick={fetchSubjectAndProgress} className="mt-4 text-sm font-bold text-blue-600 hover:underline">Try again</button>
      </div>
    );

  return (
    <div className="max-w-6xl mx-auto p-6 pt-32 space-y-8 min-h-screen bg-[#fbfbfa]">
      <Link
        to="/dashboard"
        className="inline-flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-black uppercase tracking-widest transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
      </Link>

      {/* Header Banner */}
      <div className="bg-[#0a0a0a] text-white rounded-[2.5rem] p-8 md:p-12 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-2xl">
        <div>
          <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-400 text-[10px] font-black uppercase tracking-widest">
            {subject.courseCode || "CORE MODULE"}
          </span>
          <h1 className="text-3xl md:text-5xl font-black mt-4 tracking-tighter italic">{subject.name}</h1>
          <p className="text-gray-400 text-xs mt-2 font-medium tracking-tight">
            {subject.tenant?.shortCode ? `${subject.tenant.shortCode} • ` : ""}
            {subject.units?.length || 0} Units Total
          </p>
        </div>

        <div className="bg-white/5 p-6 rounded-3xl border border-white/10 min-w-[220px] text-center backdrop-blur-md">
          <div className="flex items-center justify-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
            <Award className="w-4 h-4 text-blue-400" /> Vault Mastery
          </div>
          <div className="text-5xl font-black text-white">{progress}%</div>
          <p className="mt-2 text-xs text-gray-400">{completedTopicCount} of {totalTopicCount} topics completed</p>
          <div className="w-full bg-gray-800 h-2.5 rounded-full mt-4 overflow-hidden">
            <div
              className="bg-blue-500 h-full transition-all duration-700 rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Units & Topics List */}
      <div className="space-y-6 pb-20">
        {subject.units?.map((unit, uIdx) => (
          <div
            key={unit._id || uIdx}
            className="bg-white rounded-[2.5rem] border border-gray-200 p-8 md:p-10 shadow-sm"
          >
            <h2 className="text-xl font-black text-gray-900 mb-6 flex items-center gap-4 tracking-tight">
              <span className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 font-black text-xs flex items-center justify-center shrink-0 border border-blue-100">
                U{uIdx + 1}
              </span>
              {unit.name || unit.unitTitle}
              <span className="ml-auto text-xs font-bold text-blue-600">{unitProgress[uIdx] || 0}%</span>
            </h2>
            <div className="-mt-3 mb-6 h-1.5 overflow-hidden rounded-full bg-gray-100">
              <div className="h-full rounded-full bg-blue-500 transition-all" style={{ width: `${unitProgress[uIdx] || 0}%` }} />
            </div>

            <div className="space-y-4">
              {unit.topics?.map((topic) => {
                const topicIdStr = topic._id ? topic._id.toString() : topic.toString();
                const isDone = completedTopics.has(topicIdStr);
                
                return (
                  <div
                    key={topicIdStr}
                    onClick={(e) => {
                      if (e.target.closest('a, button')) return;
                      handleTopicToggle(topicIdStr);
                    }}
                    className={`p-5 rounded-2xl border transition-all cursor-pointer ${
                      isDone
                        ? "bg-emerald-50/30 border-emerald-200"
                        : "bg-gray-50/50 border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-start md:items-center justify-between gap-4">
                      <div className="flex items-center gap-3 flex-1">
                        {isDone ? (
                          <CheckCircle2 className="w-6 h-6 text-emerald-500 shrink-0" />
                        ) : (
                          <Circle className="w-6 h-6 text-gray-300 shrink-0" />
                        )}
                        <span
                          className={`text-sm font-bold ${
                            isDone ? "line-through text-gray-400" : "text-gray-900"
                          }`}
                        >
                          {topic.name || topic.title}
                        </span>
                      </div>

                      {topic.importance && (
                        <span
                          className={`text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg shrink-0 ${
                            topic.importance === "HIGH"
                              ? "bg-red-50 text-red-600 border border-red-100"
                              : topic.importance === "MEDIUM"
                              ? "bg-amber-50 text-amber-600 border border-amber-100"
                              : "bg-gray-100 text-gray-500 border border-gray-200"
                          }`}
                        >
                          {topic.importance}
                        </span>
                      )}
                    </div>

                    {topic.resources && topic.resources.length > 0 && (
                      <div className="mt-4 ml-9 flex flex-wrap gap-2">
                        {topic.resources.map((res, rIdx) => {
                          let Icon = Eye;
                          let colorClass = "text-gray-600 hover:text-gray-900 border-gray-200";
                          
                          if (res.type === 'PDF') {
                            Icon = FileText;
                            colorClass = "text-blue-600 hover:text-blue-700 bg-blue-50/50 border-blue-100";
                          } else if (res.type === 'VIDEO') {
                            Icon = Video;
                            colorClass = "text-red-600 hover:text-red-700 bg-red-50/50 border-red-100";
                          } else if (res.type === 'PYQ') {
                            Icon = BookOpen;
                            colorClass = "text-amber-600 hover:text-amber-700 bg-amber-50/50 border-amber-100";
                          }

                          return (
                            <button
                              key={rIdx}
                              type="button"
                              onClick={(e) => { e.stopPropagation(); setActiveMaterial({ title: res.title || topic.title || "Study Material", url: res.url || res.link, kind: res.type === "VIDEO" ? "video" : "pdf" }); }}
                              disabled={!res.url && !res.link}
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[11px] font-bold transition-all shadow-sm disabled:cursor-not-allowed ${colorClass}`}
                            >
                              <Icon className="w-3.5 h-3.5" />
                              {res.title}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {careerNotice && <div role="status" aria-live="polite" className="flex flex-col gap-3 rounded-2xl border border-blue-200 bg-blue-50 p-4 text-blue-950 shadow-sm sm:flex-row sm:items-center sm:justify-between"><p className="text-sm font-semibold">Nice work finishing {careerNotice.topicName}. Explore {careerNotice.questionCount ? `${careerNotice.questionCount} interview question${careerNotice.questionCount === 1 ? "" : "s"}` : ""}{careerNotice.questionCount && careerNotice.codingCount ? " and " : ""}{careerNotice.codingCount ? `${careerNotice.codingCount} coding problem${careerNotice.codingCount === 1 ? "" : "s"}` : ""} linked to this topic.</p><Link to={`/subjects/${subjectIdToLoad}?mode=career`} className="shrink-0 rounded-xl bg-blue-700 px-4 py-2.5 text-center text-xs font-black text-white hover:bg-blue-800">Explore Career Bridge</Link></div>}
      <StudyMaterialViewer material={activeMaterial} onClose={closeViewer} />
    </div>
  );
}

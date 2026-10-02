import React, { useState, useEffect } from "react";
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
} from "lucide-react";

export default function SubjectDetail() {
  const { id } = useParams();
  const [subject, setSubject] = useState(null);
  const [completedTopics, setCompletedTopics] = useState(new Set());
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSubjectAndProgress();
  }, [id]);

  const fetchSubjectAndProgress = async () => {
    try {
      const [subRes, progRes] = await Promise.all([
        API.get(`/subjects/${id}`),
        API.get(`/progress/subject/${id}`),
      ]);

      if (subRes.data.success) setSubject(subRes.data.subject);
      if (progRes.data.success) {
        setCompletedTopics(new Set(progRes.data.completedTopicIds));
        setProgress(progRes.data.subjectProgress);
      }
    } catch (err) {
      console.error("Error loading subject details:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleTopicToggle = async (topicId) => {
    // Optimistic UI Update
    const updated = new Set(completedTopics);
    if (updated.has(topicId)) {
      updated.delete(topicId);
    } else {
      updated.add(topicId);
    }
    setCompletedTopics(updated);

    try {
      const res = await API.post("/progress/toggle", {
        subjectId: id,
        topicId,
      });
      if (res.data.success) {
        // Refresh progress stats
        const progRes = await API.get(`/progress/subject/${id}`);
        if (progRes.data.success) {
          setProgress(progRes.data.subjectProgress);
        }
      }
    } catch (err) {
      console.error("Failed to toggle topic:", err);
      // Revert on error
      fetchSubjectAndProgress();
    }
  };

  if (loading)
    return (
      <div className="p-8 text-center text-gray-500 font-bold">
        Loading Syllabus...
      </div>
    );
  if (!subject)
    return (
      <div className="p-8 text-center text-red-500 font-bold">
        Subject not found.
      </div>
    );

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <Link
        to="/dashboard"
        className="inline-flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-gray-800"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
      </Link>

      {/* Header Banner */}
      <div className="bg-slate-900 text-white rounded-3xl p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-xl">
        <div>
          <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-400 text-xs font-black uppercase tracking-wider">
            {subject.code || "CORE"}
          </span>
          <h1 className="text-3xl font-black mt-2">{subject.name}</h1>
          <p className="text-slate-400 text-sm mt-1">
            {subject.tenant?.name ? `${subject.tenant.name} • ` : ""}
            {subject.units?.length || 0} Units Total
          </p>
        </div>

        <div className="bg-slate-800/80 p-5 rounded-2xl border border-slate-700/50 min-w-[200px] text-center">
          <div className="flex items-center justify-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
            <Award className="w-4 h-4 text-blue-400" /> Subject Mastery
          </div>
          <div className="text-4xl font-black text-white">{progress}%</div>
          <div className="w-full bg-slate-700 h-2 rounded-full mt-3 overflow-hidden">
            <div
              className="bg-blue-500 h-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Units & Topics List */}
      <div className="space-y-6">
        {subject.units?.map((unit, uIdx) => (
          <div
            key={unit._id || uIdx}
            className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm"
          >
            <h2 className="text-lg font-black text-gray-900 mb-4 flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 font-bold text-sm flex items-center justify-center">
                U{uIdx + 1}
              </span>
              {unit.name}
            </h2>

            <div className="space-y-3">
              {unit.topics?.map((topic) => {
                const isDone = completedTopics.has(topic._id.toString());
                return (
                  <div
                    key={topic._id}
                    onClick={() => handleTopicToggle(topic._id.toString())}
                    className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                      isDone
                        ? "bg-emerald-50/50 border-emerald-200"
                        : "bg-gray-50/50 border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {isDone ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                      ) : (
                        <Circle className="w-5 h-5 text-gray-400 shrink-0" />
                      )}
                      <span
                        className={`text-sm font-semibold ${isDone ? "line-through text-gray-500" : "text-gray-800"}`}
                      >
                        {topic.name}
                      </span>
                    </div>

                    {topic.importance && (
                      <span
                        className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                          topic.importance === "HIGH"
                            ? "bg-red-100 text-red-700"
                            : topic.importance === "MEDIUM"
                              ? "bg-amber-100 text-amber-700"
                              : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {topic.importance}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

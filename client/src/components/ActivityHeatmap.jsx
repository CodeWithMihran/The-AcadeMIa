import React, { useEffect, useMemo, useState } from "react";
import { Flame, LoaderCircle } from "lucide-react";
import { progressService } from "../services/api";

const dateKey = date => date.toISOString().slice(0, 10);
const utcDate = key => new Date(`${key}T00:00:00.000Z`);

export default function ActivityHeatmap() {
  const [activity, setActivity] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => {
    let alive = true;
    progressService.getActivity().then(response => { if (alive) setActivity(response.data); })
      .catch(requestError => { if (alive) setError(requestError.response?.data?.message || "Could not load your activity history."); });
    return () => { alive = false; };
  }, []);

  const weeks = useMemo(() => {
    if (!activity) return [];
    const totals = new Map((activity.days || []).map(day => [day.date, day]));
    const today = utcDate(activity.today);
    const first = utcDate(activity.startDate);
    const days = Array.from({ length: 371 }, (_, index) => {
      const date = new Date(first);
      date.setUTCDate(date.getUTCDate() + index);
      const key = dateKey(date);
      return { key, value: totals.get(key)?.total || 0, future: date > today };
    });
    return Array.from({ length: 53 }, (_, index) => days.slice(index * 7, index * 7 + 7));
  }, [activity]);

  if (error) return <section role="status" className="rounded-3xl border border-gray-200 bg-white p-6 text-sm text-gray-500">{error}</section>;
  if (!activity) return <section className="flex items-center gap-2 rounded-3xl border border-gray-200 bg-white p-6 text-sm text-gray-500"><LoaderCircle className="h-4 w-4 animate-spin"/>Loading your practice activity…</section>;

  return <section className="space-y-4 rounded-3xl border border-gray-200 bg-white p-5 shadow-sm md:p-6" aria-labelledby="activity-heatmap-title">
    <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-emerald-700"><Flame className="h-4 w-4"/>Career practice activity</p><h2 id="activity-heatmap-title" className="mt-1 text-xl font-black text-gray-900">Your learning streak</h2></div><div className="flex gap-5 text-xs"><p><strong className="text-gray-900">{activity.currentStreak}</strong><span className="ml-1 text-gray-500">day streak</span></p><p><strong className="text-gray-900">{activity.longestStreak}</strong><span className="ml-1 text-gray-500">best streak</span></p><p><strong className="text-gray-900">{activity.activeDays}</strong><span className="ml-1 text-gray-500">active days</span></p></div></div>
    <div className="overflow-x-auto pb-2" role="img" aria-label="GitHub-style calendar showing daily interview questions understood and coding problems solved for the last year">
      <div className="flex min-w-max gap-1.5">
        <div className="grid grid-rows-7 gap-1 pr-1 text-[9px] text-gray-400"><span></span><span>Mon</span><span></span><span>Wed</span><span></span><span>Fri</span><span></span></div>
        {weeks.map((week, weekIndex) => <div key={weekIndex} className="grid grid-rows-7 gap-1">{week.map(day => {
          const level = day.value === 0 ? 0 : day.value === 1 ? 1 : day.value <= 3 ? 2 : day.value <= 6 ? 3 : 4;
          const colors = ["bg-gray-100", "bg-emerald-200", "bg-emerald-400", "bg-emerald-600", "bg-emerald-800"];
          const description = day.future ? "No activity recorded" : `${day.value} career practice ${day.value === 1 ? "activity" : "activities"}`;
          return <span key={day.key} title={`${day.key}: ${description}`} aria-label={`${day.key}: ${description}`} className={`h-3 w-3 rounded-[3px] ${day.future ? "bg-transparent" : colors[level]}`} />;
        })}</div>)}
      </div>
    </div>
    <div className="flex flex-wrap items-center justify-between gap-3 text-[10px] text-gray-500"><p>Each square counts an interview question marked understood or coding problem marked solved.</p><div className="flex items-center gap-1.5" aria-label="Less to more activity"><span>Less</span>{["bg-gray-100", "bg-emerald-200", "bg-emerald-400", "bg-emerald-600", "bg-emerald-800"].map(color => <span key={color} className={`h-3 w-3 rounded-[3px] ${color}`}/>)}<span>More</span></div></div>
  </section>;
}

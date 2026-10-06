import React, { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ArrowUpRight, Medal, ShieldCheck, Trophy } from "lucide-react";
import { progressService } from "../services/api";

export default function Rankings() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const requestSequence = useRef(0);
  const loadRankings = useCallback(() => {
    const requestId = ++requestSequence.current;
    progressService.getLeaderboard().then(response => {
      if (requestId === requestSequence.current) { setData(response.data); setError(""); }
    }).catch(requestError => {
      if (requestId === requestSequence.current) setError(requestError.response?.data?.message || "Could not load cohort rankings.");
    }).finally(() => { if (requestId === requestSequence.current) setLoading(false); });
  }, []);
  const refresh = () => { setLoading(true); setError(""); loadRankings(); };
  useEffect(() => {
    loadRankings();
    return () => { requestSequence.current += 1; };
  }, [loadRankings]);

  return <main className="min-h-screen bg-app px-5 pb-20 pt-32 md:px-8">
    <div className="mx-auto max-w-7xl space-y-6">
      <Link to="/dashboard" className="inline-flex min-h-11 items-center gap-2 rounded-xl pr-3 text-xs font-bold uppercase tracking-widest text-content-muted hover:text-content focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"><ArrowLeft className="h-4 w-4"/>Dashboard</Link>
      <header className="rounded-3xl bg-gradient-to-br from-indigo-950 via-slate-900 to-blue-950 p-7 text-white shadow-lg md:p-10"><p className="flex items-center gap-2 text-xs font-black uppercase tracking-[.2em] text-indigo-300"><Trophy className="h-4 w-4"/>Global Insights</p><h1 className="mt-2 text-3xl font-black md:text-4xl">Campus rankings</h1><p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-300">See the top 10% of opted-in students in your university, campus, branch, and semester by syllabus readiness. Names and contact details stay private.</p></header>
      {error && <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-700"><span>{error}{data ? " Showing the last loaded results." : ""}</span><button type="button" onClick={refresh} disabled={loading} className="min-h-11 rounded-xl border border-red-200 bg-surface px-4 py-2 text-xs font-black disabled:opacity-60">{loading ? "Retrying…" : "Retry"}</button></div>}
      {loading && !data ? <div role="status" className="space-y-4 rounded-3xl border border-line bg-surface p-6"><p className="flex items-center gap-2 text-sm text-content-muted"><span className="h-4 w-4 animate-spin rounded-full border-2 border-line-strong border-t-indigo-700"/>Loading your cohort…</p><div className="grid gap-3 sm:grid-cols-3">{[1,2,3].map((item) => <div key={item} className="h-24 animate-pulse rounded-2xl bg-surface-muted"/> )}</div><div className="h-56 animate-pulse rounded-2xl bg-surface-muted"/></div> : error && !data ? null : data?.available ? <>
        <section className="grid gap-4 sm:grid-cols-3">
          <Metric label="Your rank" value={data.participating ? `#${data.yourRank}` : "Join to rank"}/>
          <Metric label="Readiness" value={data.participating ? `${data.yourReadiness}%` : "—"}/>
          <Metric label="Opted-in cohort" value={data.cohortSize}/>
        </section>
        {data.cohort && <p className="text-xs font-semibold text-content-muted">{data.cohort.college} · {data.cohort.branch} · Semester {data.cohort.semester}</p>}
        {!data.participating && <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-indigo-100 bg-indigo-50 p-4"><p className="text-sm text-indigo-950">You can browse the anonymous top 10%, but your score is hidden until you opt in.</p><Link to="/profile" className="inline-flex items-center gap-2 rounded-xl bg-indigo-700 px-4 py-2.5 text-xs font-black text-white">Join from Profile <ArrowUpRight className="h-4 w-4"/></Link></div>}
        {data.participating && data.topTenPercent && <p className="flex items-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-bold text-amber-900"><Medal className="h-5 w-5"/>You are currently in your cohort’s top 10%.</p>}
        <section className="overflow-hidden rounded-3xl border border-line bg-surface shadow-sm"><div className="flex flex-wrap items-center justify-between gap-3 border-b border-line p-5"><div><h2 className="text-lg font-black text-content">Top readiness scores</h2><p className="mt-1 text-xs text-content-muted">Ties share rank; extra rows can appear at the 10% cutoff.</p></div><span className="inline-flex items-center gap-1 rounded-full bg-surface-subtle px-3 py-1.5 text-[10px] font-bold text-content-secondary"><ShieldCheck className="h-3.5 w-3.5"/>Anonymous peers</span></div>
          {data.topTen.length ? <ol aria-label="Top cohort readiness rankings" className="divide-y divide-line">{data.topTen.map((item, index) => <li key={`${item.rank}-${index}`} className={`flex items-center justify-between gap-3 px-5 py-4 ${item.label === "You" ? "bg-indigo-50/70" : ""}`}><div className="flex items-center gap-4"><span className={`flex h-9 w-9 items-center justify-center rounded-xl text-xs font-black ${item.rank <= 3 ? "bg-amber-100 text-amber-900" : "bg-surface-subtle text-content-secondary"}`}>#{item.rank}</span><span className="text-sm font-bold text-content">{item.label}</span></div><span className="text-lg font-black text-indigo-700">{item.averageReadiness}%</span></li>)}</ol> : <p className="p-6 text-sm text-content-muted">No opted-in students are listed in this cohort yet.</p>}
        </section>
      </> : <section className="rounded-3xl border border-line bg-surface p-7 shadow-sm"><h2 className="text-lg font-black text-content">Rankings are not available yet</h2><p className="mt-2 text-sm text-content-secondary">{data?.message || "Complete your university profile to view your cohort."}</p>{data?.minimumCohortSize && <p className="mt-2 text-xs text-content-muted">At least {data.minimumCohortSize} students in the same cohort must opt in. Current opted-in count: {data.cohortSize || 0}.</p>}<Link to="/profile" className="mt-4 inline-flex items-center gap-2 rounded-xl bg-surface-inverse px-4 py-3 text-xs font-bold text-white">Review privacy and participation settings <ArrowUpRight className="h-4 w-4"/></Link></section>}
      <p className="flex items-start gap-2 text-[11px] leading-relaxed text-content-muted"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0"/>Readiness compares completed syllabus topics with the current semester’s catalog. Only students who opt in are counted; names, emails, and account IDs are never returned to the browser.</p>
    </div>
  </main>;
}

function Metric({ label, value }) { return <div className="rounded-2xl border border-line bg-surface p-5 shadow-sm"><p className="text-[10px] font-black uppercase tracking-widest text-content-faint">{label}</p><p className="mt-2 text-2xl font-black text-content">{value}</p></div>; }

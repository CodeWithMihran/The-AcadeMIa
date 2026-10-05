import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ArrowUpRight, Medal, ShieldCheck, Trophy } from "lucide-react";
import { progressService } from "../services/api";

export default function Rankings() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    let alive = true;
    progressService.getLeaderboard().then(response => { if (alive) setData(response.data); })
      .catch(requestError => { if (alive) setError(requestError.response?.data?.message || "Could not load cohort rankings."); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);

  return <main className="min-h-screen bg-[#fbfbfa] px-5 pb-20 pt-32 md:px-8">
    <div className="mx-auto max-w-5xl space-y-7">
      <Link to="/dashboard" className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gray-500 hover:text-black"><ArrowLeft className="h-4 w-4"/>Dashboard</Link>
      <header className="rounded-3xl bg-gradient-to-br from-indigo-950 via-slate-900 to-blue-950 p-7 text-white shadow-lg md:p-10"><p className="flex items-center gap-2 text-xs font-black uppercase tracking-[.2em] text-indigo-300"><Trophy className="h-4 w-4"/>Global Insights</p><h1 className="mt-2 text-3xl font-black md:text-4xl">Campus rankings</h1><p className="mt-2 max-w-2xl text-sm text-slate-300">See the top 10% of opted-in students in your university, campus, branch, and semester by syllabus readiness. Names and contact details stay private.</p></header>
      {error && <p role="alert" className="rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</p>}
      {loading ? <div className="rounded-3xl border border-gray-200 bg-white p-8 text-sm text-gray-500">Loading your cohort…</div> : data?.available ? <>
        <section className="grid gap-4 sm:grid-cols-3">
          <Metric label="Your rank" value={data.participating ? `#${data.yourRank}` : "Join to rank"}/>
          <Metric label="Readiness" value={data.participating ? `${data.yourReadiness}%` : "—"}/>
          <Metric label="Opted-in cohort" value={data.cohortSize}/>
        </section>
        {data.cohort && <p className="text-xs font-semibold text-gray-500">{data.cohort.college} · {data.cohort.branch} · Semester {data.cohort.semester}</p>}
        {!data.participating && <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-indigo-100 bg-indigo-50 p-4"><p className="text-sm text-indigo-950">You can browse the anonymous top 10%, but your score is hidden until you opt in.</p><Link to="/profile" className="inline-flex items-center gap-2 rounded-xl bg-indigo-700 px-4 py-2.5 text-xs font-black text-white">Join from Profile <ArrowUpRight className="h-4 w-4"/></Link></div>}
        {data.participating && data.topTenPercent && <p className="flex items-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-bold text-amber-900"><Medal className="h-5 w-5"/>You are currently in your cohort’s top 10%.</p>}
        <section className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm"><div className="flex items-center justify-between border-b border-gray-100 p-5"><div><h2 className="text-lg font-black text-gray-900">Top readiness scores</h2><p className="mt-1 text-xs text-gray-500">Ties share rank; extra rows can appear at the 10% cutoff.</p></div><span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1.5 text-[10px] font-bold text-gray-600"><ShieldCheck className="h-3.5 w-3.5"/>Anonymous peers</span></div>
          <ol className="divide-y divide-gray-100">{data.topTen.map((item, index) => <li key={`${item.rank}-${index}`} className={`flex items-center justify-between gap-3 px-5 py-4 ${item.label === "You" ? "bg-indigo-50/70" : ""}`}><div className="flex items-center gap-4"><span className={`flex h-9 w-9 items-center justify-center rounded-xl text-xs font-black ${item.rank <= 3 ? "bg-amber-100 text-amber-900" : "bg-gray-100 text-gray-700"}`}>#{item.rank}</span><span className="text-sm font-bold text-gray-900">{item.label}</span></div><span className="text-lg font-black text-indigo-700">{item.averageReadiness}%</span></li>)}</ol>
        </section>
      </> : <section className="rounded-3xl border border-gray-200 bg-white p-7 shadow-sm"><h2 className="text-lg font-black text-gray-900">Rankings are not available yet</h2><p className="mt-2 text-sm text-gray-600">{data?.message || "Complete your university profile to view your cohort."}</p>{data?.minimumCohortSize && <p className="mt-2 text-xs text-gray-500">At least {data.minimumCohortSize} students in the same cohort must opt in. Current opted-in count: {data.cohortSize || 0}.</p>}<Link to="/profile" className="mt-4 inline-flex items-center gap-2 rounded-xl bg-gray-900 px-4 py-3 text-xs font-bold text-white">Review privacy and participation settings <ArrowUpRight className="h-4 w-4"/></Link></section>}
      <p className="flex items-start gap-2 text-[11px] leading-relaxed text-gray-500"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0"/>Readiness compares completed syllabus topics with the current semester’s catalog. Only students who opt in are counted; names, emails, and account IDs are never returned to the browser.</p>
    </div>
  </main>;
}

function Metric({ label, value }) { return <div className="rounded-2xl border border-gray-200 bg-white p-5"><p className="text-[10px] font-black uppercase tracking-widest text-gray-400">{label}</p><p className="mt-2 text-2xl font-black text-gray-900">{value}</p></div>; }

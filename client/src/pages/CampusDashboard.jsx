import { TRACKS } from "../constants";
import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Award, Coins, ExternalLink, LoaderCircle, ShieldCheck } from "lucide-react";
import { adminService, communityService, tenantService } from "../services/api";
import { useAuth } from "../context/AuthContext";

export function CampusDashboard() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [queue, setQueue] = useState({ notes: [], bounties: [] });
  const [wallet, setWallet] = useState({ credits: 0, approvedNotes: 0, badges: [], ambassador: null, ledger: [] });
  const [users, setUsers] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [tenantId, setTenantId] = useState("");
  const [college, setCollege] = useState("");
  const [branches, setBranches] = useState("");
  const [semesters, setSemesters] = useState([]);
  const [creditDelta, setCreditDelta] = useState("");
  const [creditReason, setCreditReason] = useState("");
  const [creditRequestId, setCreditRequestId] = useState("");
  const [reviewNotes, setReviewNotes] = useState({});
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);
  const [preview, setPreview] = useState(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [queueResponse, walletResponse] = await Promise.all([communityService.getModerationQueue(), communityService.getWallet()]);
      setQueue(queueResponse.data); setWallet(walletResponse.data); setError("");
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Could not load the campus dashboard.");
    } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    refresh();
    if (isAdmin) {
      Promise.all([adminService.getUsers({}), tenantService.getTenants()]).then(([userResponse, tenantResponse]) => {
        setUsers(userResponse.data.users || []);
        setTenants((tenantResponse.data.tenants || []).filter((tenant) => tenant.type === TRACKS.UNIVERSITY));
      }).catch(() => setError("Could not load users and universities for ambassador management."));
    }
  }, [isAdmin, refresh]);

  const review = async (note, decision, fulfillBounty = false) => {
    setBusyId(note._id); setError(""); setNotice("");
    try {
      const response = await communityService.reviewNote(note._id, { decision, fulfillBounty, reviewNote: reviewNotes[note._id] || "" });
      setNotice(response.data.message); await refresh();
    } catch (requestError) { setError(requestError.response?.data?.message || "Could not review this contribution."); }
    finally { setBusyId(""); }
  };

  const openSubmission = async (note) => {
    try {
      const response = await communityService.noteFile(note._id);
      if (preview?.url) URL.revokeObjectURL(preview.url);
      setPreview({ title: note.title, url: URL.createObjectURL(response.data) });
    } catch (requestError) { setError(requestError.response?.data?.message || "Could not open this upload."); }
  };

  const grantAmbassador = async (event) => {
    event.preventDefault();
    if (!selectedUserId || !tenantId) return setError("Select a student and university first.");
    setBusyId("ambassador"); setError("");
    try {
      const response = await communityService.grantAmbassador(selectedUserId, { active: true, tenantId, college, branches: branches.split(",").map((item) => item.trim()).filter(Boolean), semesters });
      setNotice(response.data.message);
      const userResponse = await adminService.getUsers({}); setUsers(userResponse.data.users || []);
    } catch (requestError) { setError(requestError.response?.data?.message || "Could not grant ambassador access."); }
    finally { setBusyId(""); }
  };

  const revokeAmbassador = async (target) => {
    try {
      const response = await communityService.grantAmbassador(target._id, { active: false, branches: [], semesters: [] });
      setNotice(response.data.message); const userResponse = await adminService.getUsers({}); setUsers(userResponse.data.users || []);
    } catch (requestError) { setError(requestError.response?.data?.message || "Could not revoke ambassador access."); }
  };

  const grantCredits = async (event) => {
    event.preventDefault();
    if (!selectedUserId) return setError("Select a student first.");
    const requestId = creditRequestId || window.crypto.randomUUID();
    setCreditRequestId(requestId); setBusyId("credits"); setError("");
    try {
      const response = await communityService.adjustCredits(selectedUserId, { delta: Number(creditDelta), description: creditReason, requestId });
      setNotice(response.data.message); setCreditDelta(""); setCreditReason(""); setCreditRequestId("");
    } catch (requestError) { setError(requestError.response?.data?.message || "Could not adjust credits."); }
    finally { setBusyId(""); }
  };

  if (loading) return <main className="min-h-screen pt-40 text-center text-sm text-gray-500"><LoaderCircle className="mx-auto mb-2 h-5 w-5 animate-spin"/>Loading campus dashboard…</main>;
  if (!isAdmin && !(wallet.ambassador?.active && user?.role === "moderator")) return <main className="min-h-screen px-6 pt-40 text-center"><h1 className="text-2xl font-black">Campus moderation access required</h1><p className="mt-2 text-sm text-gray-500">You can still contribute and review notes from a subject vault.</p><Link to="/subjects" className="mt-4 inline-block font-bold text-blue-700">Browse subjects</Link>{error && <p role="alert" className="mt-4 text-red-600">{error}</p>}</main>;

  const selectedTenant = tenants.find((tenant) => tenant._id === tenantId);
  return <main className="min-h-screen bg-[#fbfbfa] px-5 pb-20 pt-32 md:px-8">
    <div className="mx-auto max-w-6xl space-y-7">
      <header className="flex flex-wrap items-end justify-between gap-4 border-b border-gray-200 pb-6"><div><p className="text-xs font-black uppercase tracking-[.2em] text-emerald-700">Campus Contributor Marketplace</p><h1 className="mt-1 text-3xl font-black text-gray-900">{isAdmin ? "Community Administration" : "Ambassador Review Desk"}</h1><p className="mt-2 text-sm text-gray-500">Review submissions in your assigned campus scope. Only approved notes are visible to students.</p></div><div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-3"><p className="text-[9px] font-black uppercase tracking-widest text-amber-800">Your contributor credits</p><p className="mt-1 flex items-center gap-2 text-2xl font-black text-amber-950"><Coins className="h-5 w-5"/>{wallet.credits}</p></div></header>
      {(error || notice) && <p role={error ? "alert" : "status"} className={`rounded-xl px-4 py-3 text-sm ${error ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-800"}`}>{error || notice}</p>}
      <div className="grid gap-3 sm:grid-cols-3"><Metric label="Pending notes" value={queue.notes.length}/><Metric label="Open bounties" value={queue.bounties.length}/><Metric label="Your approved notes" value={wallet.approvedNotes}/></div>
      {wallet.badges.length > 0 && <div className="flex flex-wrap gap-2">{wallet.badges.map((badge) => <span key={badge} className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-bold text-emerald-800"><Award className="h-4 w-4"/>{badge}</span>)}</div>}

      {isAdmin && <section className="grid gap-5 lg:grid-cols-2">
        <form onSubmit={grantAmbassador} className="space-y-3 rounded-3xl border border-gray-200 bg-white p-5 shadow-sm"><h2 className="flex items-center gap-2 text-lg font-black"><ShieldCheck className="h-5 w-5 text-blue-700"/>Assign a campus ambassador</h2><select required value={selectedUserId} onChange={(event) => setSelectedUserId(event.target.value)} className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm"><option value="">Choose a student</option>{users.filter((item) => item.role !== "admin").map((item) => <option key={item._id} value={item._id}>{item.name} · {item.email}</option>)}</select><select required value={tenantId} onChange={(event) => { setTenantId(event.target.value); setCollege(""); }} className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm"><option value="">Choose a university</option>{tenants.map((tenant) => <option key={tenant._id} value={tenant._id}>{tenant.shortCode} · {tenant.name}</option>)}</select><select value={college} onChange={(event) => setCollege(event.target.value)} className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm"><option value="">All affiliated colleges</option>{(selectedTenant?.affiliatedColleges || []).map((campus) => <option key={campus._id || campus.code} value={campus.name}>{campus.name}</option>)}</select><input value={branches} onChange={(event) => setBranches(event.target.value)} placeholder="Branch scope, comma-separated; blank = all" className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm"/><div className="flex flex-wrap gap-2">{[1,2,3,4,5,6,7,8].map((semester) => <label key={semester} className="flex items-center gap-1 text-xs"><input type="checkbox" checked={semesters.includes(semester)} onChange={(event) => setSemesters((current) => event.target.checked ? [...current, semester].sort() : current.filter((item) => item !== semester))}/>{semester}</label>)}<span className="text-[10px] text-gray-400">No selection means all semesters</span></div><button disabled={busyId === "ambassador"} className="rounded-xl bg-gray-900 px-4 py-3 text-xs font-black uppercase text-white disabled:opacity-50">{busyId === "ambassador" ? "Saving…" : "Grant scoped access"}</button></form>
        <form onSubmit={grantCredits} className="space-y-3 rounded-3xl border border-gray-200 bg-white p-5 shadow-sm"><h2 className="flex items-center gap-2 text-lg font-black"><Coins className="h-5 w-5 text-amber-700"/>Pilot credit adjustment</h2><p className="text-xs text-gray-500">Admin adjustments are written to the permanent credit ledger with a required reason.</p><select required value={selectedUserId} onChange={(event) => setSelectedUserId(event.target.value)} className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm"><option value="">Choose a student</option>{users.filter((item) => item.role !== "admin").map((item) => <option key={item._id} value={item._id}>{item.name} · {item.email}</option>)}</select><input required type="number" step="1" min="-1000" max="1000" value={creditDelta} onChange={(event) => setCreditDelta(event.target.value)} placeholder="Positive grant or negative correction" className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm"/><input required maxLength={200} value={creditReason} onChange={(event) => setCreditReason(event.target.value)} placeholder="Reason for audit ledger" className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm"/><button disabled={busyId === "credits"} className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-xs font-black uppercase text-amber-900 disabled:opacity-50">{busyId === "credits" ? "Recording…" : "Record adjustment"}</button></form>
        <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm lg:col-span-2"><h2 className="mb-3 text-lg font-black">Current ambassadors</h2>{users.filter((item) => item.campusAmbassador?.active).length ? <div className="space-y-2">{users.filter((item) => item.campusAmbassador?.active).map((item) => <div key={item._id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-gray-50 p-3"><div><p className="text-sm font-bold">{item.name} · {item.email}</p><p className="text-xs text-gray-500">{item.campusAmbassador.tenant?.shortCode || item.tenant?.shortCode} · {item.campusAmbassador.college || "All colleges"} · {item.campusAmbassador.branches?.join(", ") || "All branches"} · {item.campusAmbassador.semesters?.length ? `Semesters ${item.campusAmbassador.semesters.join(", ")}` : "All semesters"}</p></div><button type="button" onClick={() => revokeAmbassador(item)} className="text-xs font-bold text-red-600">Revoke</button></div>)}</div> : <p className="text-sm text-gray-500">No campus ambassadors assigned.</p>}</div>
      </section>}

      <section className="space-y-4"><h2 className="text-xl font-black">Notes awaiting review <span className="text-sm text-gray-400">({queue.notes.length})</span></h2>{queue.notes.length ? queue.notes.map((note) => <article key={note._id} className="space-y-4 rounded-3xl border border-gray-200 bg-white p-5 shadow-sm"><div className="flex flex-wrap items-start justify-between gap-3"><div><div className="flex items-center gap-2"><h3 className="text-lg font-black">{note.title}</h3><span className="rounded-full bg-amber-100 px-2 py-1 text-[9px] font-black text-amber-800">{note.status}</span></div><p className="mt-1 text-xs text-gray-500">{note.subject?.name} · {note.unitTitle} · {note.branch || "Campus"} · Sem {note.semester || "—"} · {note.college || "All colleges"}</p><p className="mt-1 text-xs text-gray-500">Submitted by {note.contributor?.name} ({note.contributor?.email})</p><p className="mt-2 text-sm text-gray-700">{note.description || "No description provided."}</p></div><button type="button" onClick={() => openSubmission(note)} className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2 text-xs font-bold"><ExternalLink className="h-4 w-4"/>Review upload</button></div>{note.bounty && <p className="rounded-xl bg-amber-50 p-3 text-xs text-amber-900">Bounty claim: {note.bounty.title} · {note.bounty.reward} credits · {note.bounty.status}</p>}<input maxLength={500} value={reviewNotes[note._id] || ""} onChange={(event) => setReviewNotes((current) => ({ ...current, [note._id]: event.target.value }))} placeholder="Optional feedback for the contributor" className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm"/><div className="flex flex-wrap gap-2"><button disabled={busyId === note._id} onClick={() => review(note, "APPROVE")} className="rounded-xl bg-emerald-700 px-4 py-2.5 text-xs font-black text-white disabled:opacity-50">Approve · award 5 credits</button>{["OPEN", "FULFILLING"].includes(note.bounty?.status) && <button disabled={busyId === note._id} onClick={() => review(note, "APPROVE", true)} className="rounded-xl bg-amber-700 px-4 py-2.5 text-xs font-black text-white disabled:opacity-50">Approve & fulfill bounty (+{note.bounty.reward})</button>}<button disabled={busyId === note._id} onClick={() => review(note, "REJECT")} className="rounded-xl border border-red-200 px-4 py-2.5 text-xs font-black text-red-700 disabled:opacity-50">Reject</button></div></article>) : <p className="rounded-2xl border border-dashed border-gray-300 bg-white p-8 text-sm text-gray-500">No notes are waiting in your review scope.</p>}</section>

      {queue.bounties.length > 0 && <section className="space-y-3"><h2 className="text-xl font-black">Open bounties in your scope</h2>{queue.bounties.map((item) => <article key={item._id} className="flex flex-wrap justify-between gap-3 rounded-2xl border border-amber-200 bg-white p-4"><div><h3 className="font-black">{item.title}</h3><p className="text-xs text-gray-500">{item.subject?.name} · {item.unitTitle} · requested by {item.creator?.name}</p><p className="mt-1 text-sm text-gray-600">{item.description}</p></div><span className="flex items-center gap-1 text-sm font-black text-amber-800"><Coins className="h-4 w-4"/>{item.reward}</span></article>)}</section>}

      <section className="rounded-3xl border border-gray-200 bg-white p-5"><h2 className="mb-3 text-lg font-black">Recent credit activity</h2>{wallet.ledger.length ? <div className="space-y-2">{wallet.ledger.map((entry) => <div key={entry._id} className="flex justify-between gap-3 border-b border-gray-100 py-2 text-xs"><span className="text-gray-600">{entry.description}</span><span className={`font-black ${entry.delta > 0 ? "text-emerald-700" : "text-amber-800"}`}>{entry.delta > 0 ? "+" : ""}{entry.delta} · balance {entry.balanceAfter}</span></div>)}</div> : <p className="text-sm text-gray-500">No credits yet. Approved contributions earn credits.</p>}</section>
      {preview && <div role="dialog" aria-modal="true" aria-label={preview.title} className="fixed inset-0 z-[130] flex items-center justify-center bg-black/80 p-4" onClick={(event) => { if (event.target === event.currentTarget) { URL.revokeObjectURL(preview.url); setPreview(null); } }}><div className="flex h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white"><header className="flex items-center justify-between border-b p-4"><h3 className="font-black">{preview.title}</h3><button type="button" onClick={() => { URL.revokeObjectURL(preview.url); setPreview(null); }} className="text-sm font-bold">Close</button></header><iframe title={preview.title} src={preview.url} className="h-full w-full"/></div></div>}
    </div>
  </main>;
}

function Metric({ label, value }) { return <div className="rounded-2xl border border-gray-200 bg-white p-4"><p className="text-[9px] font-black uppercase tracking-widest text-gray-400">{label}</p><p className="mt-2 text-2xl font-black">{value}</p></div>; }

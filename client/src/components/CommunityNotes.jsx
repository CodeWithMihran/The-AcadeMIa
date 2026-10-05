import React, { useCallback, useEffect, useState } from "react";
import { Award, BadgeCheck, Coins, Download, Flag, LoaderCircle, ThumbsUp, UploadCloud } from "lucide-react";
import { communityService } from "../services/api";
import { useAuth } from "../context/AuthContext";

const initialBounty = { unitTitle: "", title: "", description: "", reward: 10 };

export function CommunityNotes({ subject }) {
  const { user } = useAuth();
  const [data, setData] = useState({ notes: [], bounties: [], bountyLimits: { min: 10, max: 500 } });
  const [wallet, setWallet] = useState({ credits: 0, approvedNotes: 0, badges: [] });
  const [myNotes, setMyNotes] = useState([]);
  const [form, setForm] = useState({ unitId: "", title: "", description: "", file: null, bountyId: "" });
  const [bounty, setBounty] = useState(initialBounty);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [preview, setPreview] = useState(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    const results = await Promise.allSettled([
      communityService.getSubjectNotes(subject._id),
      communityService.getWallet(),
      communityService.getMyNotes(),
    ]);
    const [notesResult, walletResult, myNotesResult] = results;
    if (notesResult.status === "fulfilled") setData(notesResult.value.data);
    if (walletResult.status === "fulfilled") setWallet(walletResult.value.data);
    if (myNotesResult.status === "fulfilled") setMyNotes(myNotesResult.value.data.notes || []);

    const failure = results.find((result) => result.status === "rejected");
    if (failure) {
      const requestError = failure.reason;
      setError(requestError.response?.data?.message || "Could not load campus contributor data.");
    } else setError("");
    setLoading(false);
  }, [subject._id]);

  useEffect(() => { refresh(); }, [refresh]);
  useEffect(() => () => { if (preview?.url) URL.revokeObjectURL(preview.url); }, [preview]);

  const submitNote = async (event) => {
    event.preventDefault();
    const formElement = event.currentTarget;
    if (!form.file) return setError("Choose a PDF, JPEG, or PNG note file first.");
    const payload = new FormData();
    payload.append("subjectId", subject._id);
    payload.append("unitId", form.unitId);
    payload.append("unitTitle", form.unitId ? subject.units.find((unit) => unit._id === form.unitId)?.unitTitle || "Selected unit" : "General notes");
    payload.append("title", form.title);
    payload.append("description", form.description);
    payload.append("bountyId", form.bountyId);
    payload.append("file", form.file);
    setBusy(true); setError(""); setMessage("");
    try {
      const response = await communityService.submitNote(payload);
      setMessage(response.data.message);
      setForm({ unitId: "", title: "", description: "", file: null, bountyId: "" });
      formElement.reset();
      // Refresh errors are shown separately by refresh; they must not turn an
      // already accepted upload into a misleading submission failure.
      await refresh();
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Could not submit your notes.");
    } finally { setBusy(false); }
  };

  const vote = async (noteId) => {
    try { await communityService.upvoteNote(noteId); await refresh(); }
    catch (requestError) { setError(requestError.response?.data?.message || "Could not update your upvote."); }
  };

  const openNote = async (note) => {
    try {
      const response = await communityService.noteFile(note._id);
      if (preview?.url) URL.revokeObjectURL(preview.url);
      setPreview({ title: note.title, url: URL.createObjectURL(response.data) });
    } catch (requestError) { setError(requestError.response?.data?.message || "Could not open that note."); }
  };

  const placeBounty = async (event) => {
    event.preventDefault(); setBusy(true); setError(""); setMessage("");
    try {
      const response = await communityService.createBounty({ ...bounty, subjectId: subject._id });
      setMessage(response.data.message); setBounty(initialBounty); await refresh();
    } catch (requestError) { setError(requestError.response?.data?.message || "Could not post this bounty."); }
    finally { setBusy(false); }
  };

  const cancelBounty = async (id) => {
    try { const response = await communityService.cancelBounty(id); setMessage(response.data.message); await refresh(); }
    catch (requestError) { setError(requestError.response?.data?.message || "Could not cancel that bounty."); }
  };

  return (
    <section className="mt-10 space-y-6" aria-labelledby="community-notes-title">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div><p className="text-xs font-black uppercase tracking-[.2em] text-emerald-700">Campus contributors</p><h2 id="community-notes-title" className="mt-1 text-2xl font-black text-gray-900">Peer notes for {subject.name}</h2><p className="mt-1 text-sm text-gray-500">Campus-reviewed notes are published after an ambassador or admin approves them.</p></div>
        <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-black text-amber-900"><Coins className="h-4 w-4"/>{wallet.credits} credits</div>
      </header>
      {(error || message) && <p role={error ? "alert" : "status"} className={`rounded-xl px-4 py-3 text-sm ${error ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-800"}`}>{error || message}</p>}

      <div className="grid gap-5 lg:grid-cols-[1.2fr_.8fr]">
        <form onSubmit={submitNote} className="space-y-3 rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
          <h3 className="flex items-center gap-2 text-lg font-black text-gray-900"><UploadCloud className="h-5 w-5 text-emerald-700"/>Contribute your notes</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <select aria-label="Unit" value={form.unitId} onChange={(event) => setForm({ ...form, unitId: event.target.value })} className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm"><option value="">General notes</option>{(subject.units || []).map((unit) => <option key={unit._id} value={unit._id}>Unit {unit.unitNumber}: {unit.unitTitle}</option>)}</select>
            <input aria-label="Note title" required maxLength={120} value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="Title, e.g. Unit 2 handwritten notes" className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm"/>
          </div>
          <textarea aria-label="Description" maxLength={1000} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="What topics do these notes cover?" rows={2} className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm"/>
          <div className="flex flex-wrap items-center gap-3"><input aria-label="PDF or image notes" required type="file" accept="application/pdf,image/jpeg,image/png,.pdf,.jpg,.jpeg,.png" onChange={(event) => setForm({ ...form, file: event.target.files?.[0] || null })} className="min-w-0 flex-1 text-xs"/><span className="text-[10px] text-gray-400">PDF/JPG/PNG · up to 8 MB</span></div>
          {data.bounties.length > 0 && <select aria-label="Fulfill a bounty" value={form.bountyId} onChange={(event) => setForm({ ...form, bountyId: event.target.value })} className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm"><option value="">No bounty</option>{data.bounties.map((item) => <option key={item._id} value={item._id}>{item.title} · {item.reward} credits</option>)}</select>}
          <button disabled={busy} className="inline-flex items-center gap-2 rounded-xl bg-gray-900 px-4 py-3 text-xs font-black uppercase tracking-wider text-white hover:bg-emerald-700 disabled:opacity-50"><UploadCloud className="h-4 w-4"/>{busy ? "Submitting…" : "Submit for review"}</button>
          <p className="text-[11px] text-gray-500">Approved original notes earn {5} credits. Do not upload copyrighted books or materials you do not have permission to share.</p>
        </form>

        <form onSubmit={placeBounty} className="space-y-3 rounded-3xl border border-amber-200 bg-amber-50/60 p-5">
          <h3 className="flex items-center gap-2 text-lg font-black text-gray-900"><Flag className="h-5 w-5 text-amber-700"/>Request missing notes</h3>
          <p className="text-xs text-gray-600">Credits are held until a moderator approves a submission fulfilling your request. Open bounties can be cancelled for a refund.</p>
          <select required value={bounty.unitTitle} onChange={(event) => setBounty({ ...bounty, unitTitle: event.target.value })} className="w-full rounded-xl border border-amber-200 bg-white px-3 py-2.5 text-sm"><option value="">Choose the unit these notes should cover</option><option value="General notes">General notes</option>{(subject.units || []).map((unit) => <option key={unit._id} value={unit.unitTitle}>{unit.unitTitle}</option>)}</select>
          <input required maxLength={120} value={bounty.title} onChange={(event) => setBounty({ ...bounty, title: event.target.value })} placeholder="What notes are needed?" className="w-full rounded-xl border border-amber-200 bg-white px-3 py-2.5 text-sm"/>
          <textarea required maxLength={1000} value={bounty.description} onChange={(event) => setBounty({ ...bounty, description: event.target.value })} placeholder="Describe what a complete solution should include" rows={2} className="w-full rounded-xl border border-amber-200 bg-white px-3 py-2.5 text-sm"/>
          <div className="flex gap-2"><input required type="number" min={data.bountyLimits.min} max={data.bountyLimits.max} step="1" value={bounty.reward} onChange={(event) => setBounty({ ...bounty, reward: event.target.value })} aria-label="Bounty credits" className="w-32 rounded-xl border border-amber-200 bg-white px-3 py-2.5 text-sm"/><button disabled={busy || wallet.credits < Number(bounty.reward)} className="rounded-xl bg-amber-700 px-4 py-3 text-xs font-black uppercase tracking-wider text-white disabled:opacity-50">Post bounty</button></div>
          {wallet.credits < Number(bounty.reward) && <p className="text-[11px] font-semibold text-amber-900">You need {bounty.reward} credits. Earn credits by contributing approved notes.</p>}
          {wallet.badges?.length > 0 && <div className="flex flex-wrap gap-2">{wallet.badges.map((badge) => <span key={badge} className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-[10px] font-bold text-emerald-800"><Award className="h-3 w-3"/>{badge}</span>)}</div>}
        </form>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.2fr_.8fr]">
        <div className="space-y-3">
          <h3 className="text-lg font-black text-gray-900">Approved campus notes</h3>
          {loading ? <p className="flex items-center gap-2 text-sm text-gray-500"><LoaderCircle className="h-4 w-4 animate-spin"/>Loading…</p> : data.notes.length ? data.notes.map((note) => <article key={note._id} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3"><div><div className="flex flex-wrap items-center gap-2"><h4 className="font-black text-gray-900">{note.title}</h4>{note.batchRecommended && <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-1 text-[9px] font-black uppercase text-emerald-800"><BadgeCheck className="h-3 w-3"/>Batch recommended</span>}</div><p className="mt-1 text-xs text-gray-500">{note.unitTitle} · by {note.contributor?.name || "Campus contributor"}{note.contributor?.year ? ` · Year ${note.contributor.year}` : ""}</p><p className="mt-2 text-sm text-gray-700">{note.description}</p></div>
              <div className="flex gap-2"><button type="button" onClick={() => openNote(note)} className="inline-flex items-center gap-1 rounded-lg bg-gray-900 px-3 py-2 text-xs font-bold text-white"><Download className="h-3.5 w-3.5"/>Open</button><button type="button" onClick={() => vote(note._id)} aria-pressed={note.upvotedByMe} className={`inline-flex items-center gap-1 rounded-lg border px-3 py-2 text-xs font-bold ${note.upvotedByMe ? "border-emerald-300 bg-emerald-50 text-emerald-800" : "border-gray-200 text-gray-600"}`}><ThumbsUp className="h-3.5 w-3.5"/>{note.upvotes}</button></div>
            </div>
          </article>) : <p className="rounded-2xl border border-dashed border-gray-300 p-6 text-sm text-gray-500">No approved notes yet. Be the first contributor.</p>}
        </div>
        <div className="space-y-3"><h3 className="text-lg font-black text-gray-900">Open campus requests</h3>{data.bounties.length ? data.bounties.map((item) => <article key={item._id} className="rounded-2xl border border-amber-200 bg-white p-4"><div className="flex items-center justify-between gap-2"><h4 className="font-black text-gray-900">{item.title}</h4><span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-black text-amber-900"><Coins className="h-3.5 w-3.5"/>{item.reward}</span></div><p className="mt-1 text-xs font-semibold text-amber-800">{item.unitTitle} · requested by {item.creator?.name || "student"}</p><p className="mt-2 text-sm text-gray-600">{item.description}</p>{(item.creator?._id === user?.id || item.creator?._id === user?._id) && <button type="button" onClick={() => cancelBounty(item._id)} className="mt-3 text-xs font-bold text-red-600 hover:underline">Cancel and refund escrow</button>}</article>) : <p className="rounded-2xl border border-dashed border-gray-300 p-6 text-sm text-gray-500">No open bounties for this subject.</p>}</div>
      </div>

      {myNotes.some((note) => note.subject?._id === subject._id || note.subject === subject._id) && <section className="space-y-3"><h3 className="text-lg font-black text-gray-900">Your submissions for this subject</h3>{myNotes.filter((note) => note.subject?._id === subject._id || note.subject === subject._id).map((note) => <article key={note._id} className="flex flex-wrap items-start justify-between gap-3 rounded-2xl border border-gray-200 bg-white p-4"><div><h4 className="font-bold text-gray-900">{note.title}</h4><p className="mt-1 text-xs text-gray-500">{note.unitTitle} · submitted {new Date(note.createdAt).toLocaleDateString()}</p>{note.reviewNote && <p className="mt-2 text-sm text-gray-600">Moderator feedback: {note.reviewNote}</p>}</div><span className={`rounded-full px-2.5 py-1 text-[10px] font-black ${note.status === "APPROVED" ? "bg-emerald-100 text-emerald-800" : note.status === "REJECTED" ? "bg-red-100 text-red-800" : "bg-amber-100 text-amber-800"}`}>{note.status}</span></article>)}</section>}

      {preview && <div role="dialog" aria-modal="true" aria-label={preview.title} className="fixed inset-0 z-[130] flex items-center justify-center bg-black/80 p-4" onClick={(event) => { if (event.target === event.currentTarget) { URL.revokeObjectURL(preview.url); setPreview(null); } }}><div className="flex h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white"><header className="flex items-center justify-between border-b p-4"><h3 className="font-black">{preview.title}</h3><button type="button" onClick={() => { URL.revokeObjectURL(preview.url); setPreview(null); }} className="text-sm font-bold">Close</button></header>{preview.url && <iframe title={preview.title} src={preview.url} className="h-full w-full"/>}</div></div>}
    </section>
  );
}

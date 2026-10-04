import React, { useCallback, useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft, ArrowUpRight, BookOpen, BriefcaseBusiness, Check, Code2, ExternalLink, Eye, FileText, Flag, PlayCircle } from "lucide-react";
import API from "../services/api";
import StudyMaterialViewer from "../components/StudyMaterialViewer";
import MarkdownAnswer from "../components/MarkdownAnswer";

const resourceGroups = [
  { key: "notes", label: "Notes", icon: FileText },
  { key: "books", label: "Books", icon: BookOpen },
  { key: "pyqs", label: "Previous year papers", icon: FileText },
  { key: "youtubeLinks", label: "Video lessons", icon: PlayCircle },
];

export default function SubjectVault() {
  const { id } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const viewMode = searchParams.get("mode") === "career" ? "career" : "academic";
  const [subject, setSubject] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [activeMaterial, setActiveMaterial] = useState(null);
  const [difficultyFilter, setDifficultyFilter] = useState("ALL");
  const [companyFilter, setCompanyFilter] = useState("ALL");
  const [questionSort, setQuestionSort] = useState("TOPIC");
  const [gateYearFilter, setGateYearFilter] = useState("ALL");
  const [linkReportStates, setLinkReportStates] = useState({});
  const closeViewer = useCallback(() => setActiveMaterial(null), []);

  const loadSubject = useCallback(async () => {
    setLoading(true);
    setError("");
    setSubject(null);
    try {
      const response = await API.get(`/subjects/${id}`);
      if (!response.data.success) throw new Error(response.data.message || "Could not load this subject.");
      setSubject(response.data.subject);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Could not load this subject.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { loadSubject(); }, [loadSubject]);


  if (loading) return <div className="p-24 text-center text-xs font-bold uppercase tracking-widest text-gray-400">Loading Subject Vault…</div>;
  if (!subject) return <div className="p-24 text-center"><p className="font-bold text-red-500">{error || "Subject not found."}</p><button onClick={loadSubject} className="mt-4 text-sm font-bold text-blue-600 hover:underline">Try again</button></div>;

  const career = subject.careerBridge || {};
  const questions = career.interviewQuestions || [];
  const codingLinks = career.codingLinks || [];
  const gate = career.gate || {};
  const gateRange = gate.weightageMinMarks != null || gate.weightageMaxMarks != null
    ? `${gate.weightageMinMarks ?? "?"}${gate.weightageMaxMarks != null && gate.weightageMaxMarks !== gate.weightageMinMarks ? `–${gate.weightageMaxMarks}` : ""} marks`
    : "Weightage not added";
  const normalizeTopic = value => String(value || "").trim().toLocaleLowerCase();
  const premiumBadge = isPremium => isPremium ? <span className="rounded-full bg-violet-100 px-2 py-1 text-[10px] font-bold text-violet-700">Premium</span> : null;
  const questionCompanies = item => [...new Set([...(item.companies || []), ...(item.company ? [item.company] : [])])];
  const availableCompanies = [...new Set(questions.flatMap(questionCompanies).filter(Boolean))].sort((a, b) => a.localeCompare(b));
  const availableGateYears = [...new Set((gate.pyqs || []).map(item => item.year).filter(Boolean))].sort((a, b) => Number(b) - Number(a));
  const filteredQuestions = questions.filter(item =>
    (difficultyFilter === "ALL" || item.difficulty === difficultyFilter) &&
    (companyFilter === "ALL" || questionCompanies(item).includes(companyFilter))
  ).sort((a, b) => {
    if (questionSort === "COMPANY") return (questionCompanies(a)[0] || "").localeCompare(questionCompanies(b)[0] || "");
    if (questionSort === "EASY_FIRST" || questionSort === "HARD_FIRST") {
      const rank = { Easy: 1, Medium: 2, Hard: 3 };
      const delta = (rank[a.difficulty] || 4) - (rank[b.difficulty] || 4);
      return questionSort === "HARD_FIRST" ? -delta : delta;
    }
    return 0;
  });
  const filteredGatePyqs = (gate.pyqs || []).filter(item => gateYearFilter === "ALL" || String(item.year || "") === gateYearFilter);

  const reportLink = async (resourceType, resource) => {
    const key = `${resourceType}:${resource._id}`;
    setLinkReportStates(previous => ({ ...previous, [key]: { status: "sending", message: "" } }));
    try {
      const response = await API.post(`/subjects/${id}/link-reports`, { resourceType, resourceId: resource._id });
      setLinkReportStates(previous => ({ ...previous, [key]: { status: "sent", message: response.data.message || "Report sent to admins." } }));
    } catch (err) {
      setLinkReportStates(previous => ({ ...previous, [key]: { status: "error", message: err.response?.data?.message || "Could not send report. Try again." } }));
    }
  };

  const renderReportButton = (resourceType, resource) => {
    const key = `${resourceType}:${resource._id}`;
    const state = linkReportStates[key];
    return <span className="inline-flex flex-col items-start gap-1"><button type="button" onClick={() => reportLink(resourceType, resource)} disabled={state?.status === "sending" || state?.status === "sent"} aria-label={`Report broken link: ${resource.title}`} className="inline-flex shrink-0 items-center gap-1 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-bold text-gray-600 hover:border-amber-300 hover:text-amber-800 disabled:cursor-default disabled:opacity-70">{state?.status === "sent" ? <Check className="h-3.5 w-3.5"/> : <Flag className="h-3.5 w-3.5"/>}{state?.status === "sending" ? "Sending…" : state?.status === "sent" ? "Reported" : "Report broken link"}</button>{state?.message && <span role="status" className={`max-w-52 text-[10px] ${state.status === "error" ? "text-red-600" : "text-gray-500"}`}>{state.message}</span>}</span>;
  };

  return (
    <main className="min-h-screen bg-[#fbfbfa] px-6 pb-20 pt-32">
      <div className="mx-auto max-w-6xl space-y-8">
        <Link to="/dashboard" className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gray-500 hover:text-black"><ArrowLeft className="h-4 w-4"/> Back to Dashboard</Link>
        <header className="flex flex-col justify-between gap-6 rounded-[2rem] bg-[#0a0a0a] p-8 text-white shadow-xl md:flex-row md:items-end md:p-12">
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-blue-400">{subject.courseCode || subject.track || "Subject"}</p>
            <h1 className="mt-3 text-3xl font-black tracking-tight md:text-5xl">{subject.name}</h1>
            <p className="mt-3 text-sm text-gray-400">{subject.tenant?.shortCode ? `${subject.tenant.shortCode} · ` : ""}{subject.branch || subject.examCategory || "Curriculum"}{subject.semester ? ` · Semester ${subject.semester}` : ""}</p>
            {(gate.weightageMinMarks != null || gate.weightageMaxMarks != null) && <p className="mt-4 inline-flex items-center gap-2 rounded-full border border-blue-300/30 bg-blue-400/10 px-3 py-1.5 text-xs font-bold text-blue-200">{gate.examCode || "GATE"}: {gateRange}{gate.weightagePeriod ? ` · ${gate.weightagePeriod}` : ""}</p>}
          </div>
          <Link to={`/progress/${subject._id}`} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-xs font-black uppercase tracking-wider text-black hover:bg-blue-500 hover:text-white">View Subject Progress <ArrowUpRight className="h-4 w-4"/></Link>
        </header>

        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-gray-200 bg-white p-3">
          <p className="px-3 text-sm font-bold text-gray-700">Choose your study focus</p>
          <div className="flex gap-2" role="tablist" aria-label="Subject study mode">
            {[['academic','Academic Mode',BookOpen],['career','Career Mode',BriefcaseBusiness]].map(([mode,label,Icon]) => <button key={mode} type="button" role="tab" aria-selected={viewMode === mode} onClick={() => setSearchParams(mode === 'career' ? { mode: 'career' } : {})} className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-black transition ${viewMode === mode ? 'bg-gray-900 text-white' : 'text-gray-500 hover:bg-gray-100'}`}><Icon className="h-4 w-4"/>{label}</button>)}
          </div>
        </div>

        {viewMode === 'academic' ? <section className="space-y-5">
          <div><h2 className="text-xl font-black text-gray-900">Course materials</h2><p className="mt-1 text-sm text-gray-500">Unit topics and resources for this subject.</p></div>
          {subject.units?.length ? subject.units.map((unit, index) => (
            <article key={unit._id || index} className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm md:p-8">
              <h3 className="text-lg font-black text-gray-900">Unit {unit.unitNumber || index + 1}: {unit.unitTitle || unit.name || `Unit ${index + 1}`}</h3>
              {unit.topics?.length > 0 && <div className="mt-4 flex flex-wrap gap-2">{unit.topics.map((topic, i) => <span key={topic._id || i} className="rounded-full bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-700">{topic.title || topic.name || topic}</span>)}</div>}
              <div className="mt-6 grid gap-5 sm:grid-cols-2">
                {resourceGroups.map(({ key, label, icon: Icon }) => {
                  const resources = unit[key] || [];
                  if (!resources.length) return null;
                  return <div key={key}><h4 className="mb-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400"><Icon className="h-3.5 w-3.5"/>{label}</h4><ul className="space-y-2">{resources.map((resource, i) => <li key={resource._id || i}><button type="button" onClick={() => setActiveMaterial({ title: resource.title || resource.name || label, url: resource.link || resource.url, kind: key === "youtubeLinks" ? "video" : "pdf" })} disabled={!resource.link && !resource.url} className="inline-flex items-center gap-2 text-left text-sm font-semibold text-blue-700 hover:underline disabled:cursor-not-allowed disabled:text-gray-400">{resource.title || resource.name || label}<Eye className="h-3.5 w-3.5"/></button></li>)}</ul></div>;
                })}
              </div>
              {!unit.topics?.length && !resourceGroups.some(({ key }) => unit[key]?.length) && <p className="mt-4 text-sm text-gray-400">No materials have been added to this unit yet.</p>}
            </article>
          )) : <div className="rounded-3xl border border-dashed border-gray-300 bg-white p-12 text-center text-sm text-gray-500">No course units are available yet.</div>}
        </section> : <section className="space-y-6">
          <div><p className="text-xs font-black uppercase tracking-widest text-blue-700">Beyond the syllabus</p><h2 className="mt-1 text-2xl font-black text-gray-900">Turn {subject.name} into career skills</h2><p className="mt-1 text-sm text-gray-500">Interview prep and practice matched to your syllabus topics.</p></div>
          <div className="grid gap-3 rounded-2xl border border-gray-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-4">
            <label className="space-y-1 text-[10px] font-black uppercase tracking-wider text-gray-500">Question difficulty<select value={difficultyFilter} onChange={e => setDifficultyFilter(e.target.value)} className="block w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-xs font-semibold normal-case tracking-normal text-gray-800"><option value="ALL">All difficulties</option><option value="Easy">Easy</option><option value="Medium">Medium</option><option value="Hard">Hard</option></select></label>
            <label className="space-y-1 text-[10px] font-black uppercase tracking-wider text-gray-500">Company tag<select value={companyFilter} onChange={e => setCompanyFilter(e.target.value)} className="block w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-xs font-semibold normal-case tracking-normal text-gray-800"><option value="ALL">All companies</option>{availableCompanies.map(company => <option key={company} value={company}>{company}</option>)}</select></label>
            <label className="space-y-1 text-[10px] font-black uppercase tracking-wider text-gray-500">Sort interview questions<select value={questionSort} onChange={e => setQuestionSort(e.target.value)} className="block w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-xs font-semibold normal-case tracking-normal text-gray-800"><option value="TOPIC">Default order</option><option value="EASY_FIRST">Easy to hard</option><option value="HARD_FIRST">Hard to easy</option><option value="COMPANY">Company A to Z</option></select></label>
            <label className="space-y-1 text-[10px] font-black uppercase tracking-wider text-gray-500">GATE PYQ year<select value={gateYearFilter} onChange={e => setGateYearFilter(e.target.value)} className="block w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-xs font-semibold normal-case tracking-normal text-gray-800"><option value="ALL">All years</option>{availableGateYears.map(year => <option key={year} value={year}>{year}</option>)}</select></label>
            <div className="flex items-end justify-between gap-3 text-xs text-gray-500 sm:col-span-2 lg:col-span-4"><span>Showing {filteredQuestions.length} of {questions.length} interview questions · {filteredGatePyqs.length} of {(gate.pyqs || []).length} GATE PYQs</span><button type="button" onClick={() => { setDifficultyFilter("ALL"); setCompanyFilter("ALL"); setQuestionSort("TOPIC"); setGateYearFilter("ALL"); }} className="font-bold text-blue-700 hover:underline">Clear filters</button></div>
          </div>
          {(questions.length > 0 || codingLinks.length > 0) ? <div className="space-y-6">{[...new Set([...filteredQuestions.map(item => item.topic), ...codingLinks.map(item => item.topic)].filter(Boolean))].map(topic => {
            const topicQuestions = filteredQuestions.filter(item => normalizeTopic(item.topic) === normalizeTopic(topic));
            const topicLinks = codingLinks.filter(item => normalizeTopic(item.topic) === normalizeTopic(topic));
            if (!topicQuestions.length && !topicLinks.length) return null;
            return <article key={topic} className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm md:p-8"><h3 className="mb-5 text-lg font-black text-gray-900">{topic}</h3><div className="grid gap-5 md:grid-cols-2">
              {topicQuestions.length > 0 && <div><h4 className="mb-3 flex items-center gap-2 text-xs font-black uppercase tracking-wider text-indigo-700"><BriefcaseBusiness className="h-4 w-4"/>Interview questions</h4><ul className="space-y-3">{topicQuestions.map((item, i) => { const companies = [...new Set([...(item.companies || []), ...(item.company ? [item.company] : [])])]; return <li key={item._id || i} className="rounded-2xl bg-indigo-50/70 p-4"><p className="text-sm font-semibold text-gray-900">{item.question || "Premium interview question"}</p><div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-gray-500">{companies.map(company => <span key={company} className="rounded-full bg-white px-2.5 py-1 font-semibold text-indigo-700">{company}</span>)}{item.difficulty && <span>{companies.length ? "· " : ""}{item.difficulty}</span>}{premiumBadge(item.isPremium)}</div>{item.answerMarkdown && <details className="mt-4 rounded-xl border border-indigo-100 bg-white"><summary className="cursor-pointer px-4 py-3 text-xs font-black text-indigo-800">View answer & explanation</summary><div className="border-t border-indigo-100 px-4 py-4"><MarkdownAnswer value={item.answerMarkdown}/></div></details>}</li>; })}</ul></div>}
              {topicLinks.length > 0 && <div><h4 className="mb-3 flex items-center gap-2 text-xs font-black uppercase tracking-wider text-emerald-700"><Code2 className="h-4 w-4"/>Coding practice</h4><ul className="space-y-3">{topicLinks.map((item, i) => <li key={item._id || i} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-emerald-50/70 p-4"><div><p className="text-sm font-bold text-gray-900">{item.title}</p><p className="mt-1 text-xs text-gray-500">{item.platform}{item.difficulty ? ` · ${item.difficulty}` : ""}</p>{premiumBadge(item.isPremium)}</div>{item.url ? <div className="flex flex-wrap items-center gap-2"><a href={item.url} target="_blank" rel="noopener noreferrer" className="inline-flex shrink-0 items-center gap-1 rounded-xl bg-white px-3 py-2 text-xs font-bold text-emerald-800 shadow-sm hover:bg-emerald-100">Practice <ExternalLink className="h-3.5 w-3.5"/><span className="sr-only"> (opens in a new tab)</span></a>{renderReportButton("CODING_LINK", item)}</div> : <span className="text-xs font-bold text-violet-700">Unlock to practice</span>}</li>)}</ul></div>}
            </div></article>;
          })}{[...filteredQuestions, ...codingLinks].some(item => !item.topic?.trim()) && <article className="rounded-3xl border border-gray-200 bg-white p-6"><h3 className="mb-4 text-lg font-black">General practice</h3><div className="grid gap-4 md:grid-cols-2">{[...filteredQuestions.filter(item => !item.topic?.trim()).map(item => ({...item, kind:"question"})), ...codingLinks.filter(item => !item.topic?.trim()).map(item => ({...item, kind:"coding"}))].map((item,i) => item.kind === 'question' ? <p key={item._id || i} className="rounded-xl bg-indigo-50 p-4 text-sm font-semibold">{item.question || "Premium interview question"} {premiumBadge(item.isPremium)}</p> : item.url ? <div key={item._id || i} className="flex flex-wrap items-center gap-2 rounded-xl bg-emerald-50 p-4"><a href={item.url} target="_blank" rel="noopener noreferrer" className="text-sm font-bold text-emerald-800">{item.title} · {item.platform} <ExternalLink className="inline h-3.5 w-3.5"/>{premiumBadge(item.isPremium)}</a>{renderReportButton("CODING_LINK", item)}</div> : <div key={item._id || i} className="rounded-xl bg-emerald-50 p-4 text-sm font-bold text-emerald-800">{item.title} · {item.platform} · Unlock to practice {premiumBadge(item.isPremium)}</div>)}</div></article>}</div> : <div className="rounded-3xl border border-dashed border-gray-300 bg-white p-12 text-center"><BriefcaseBusiness className="mx-auto h-8 w-8 text-gray-400"/><p className="mt-3 font-bold text-gray-700">Career resources are on the way</p><p className="mt-1 text-sm text-gray-500">Your admin can add interview questions and practice links for this subject.</p></div>}
          <article className="rounded-3xl border border-amber-200 bg-amber-50 p-6 md:p-8"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-widest text-amber-800">{gate.examCode || "GATE CS"} insights</p><h3 className="mt-2 text-2xl font-black text-gray-900">{gateRange}</h3><p className="mt-1 text-sm text-gray-600">Approximate subject weightage{gate.weightagePeriod ? ` · based on ${gate.weightagePeriod}` : ""}. Use it as a planning guide.</p></div><span className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-amber-300 bg-white text-center text-[10px] font-black uppercase text-amber-800">GATE<br/>INSIGHT</span></div>{filteredGatePyqs.length > 0 && <div className="mt-6"><h4 className="mb-3 font-black text-gray-900">Previous year questions</h4><div className="grid gap-3 md:grid-cols-2">{filteredGatePyqs.map((item,i)=>item.url ? <div key={item._id || i} className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-white p-4 text-sm font-semibold text-gray-800 shadow-sm"><a href={item.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2">{item.title}{item.year ? ` · ${item.year}` : ""}{item.topic ? ` · ${item.topic}` : ""} {premiumBadge(item.isPremium)}<ExternalLink className="h-4 w-4 shrink-0 text-amber-700"/></a>{renderReportButton("GATE_PYQ", item)}</div> : <div key={item._id || i} className="flex items-center justify-between gap-3 rounded-2xl bg-white p-4 text-sm font-semibold text-gray-800 shadow-sm"><span>{item.title}{item.year ? ` · ${item.year}` : ""}{item.topic ? ` · ${item.topic}` : ""} {premiumBadge(item.isPremium)}</span><span className="text-xs text-violet-700">Unlock PYQ</span></div>)}</div></div>}</article>
        </section>}
      </div>
      <StudyMaterialViewer material={activeMaterial} onClose={closeViewer} />
    </main>
  );
}

import React, { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { BriefcaseBusiness, Check, Code2, ExternalLink, Flag, Radar } from "lucide-react";
import API, { progressService } from "../services/api";
import { DIFFICULTY_LEVELS, DIFFICULTY_RANK } from "../constants";
import MarkdownAnswer from "./MarkdownAnswer";

const selectClass = "block w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-xs font-semibold normal-case tracking-normal text-gray-800";
const EMPTY_LIST = Object.freeze([]);
const EMPTY_GATE = Object.freeze({});

function questionCompanies(question) {
  return [...new Set([...(question.companies || []), ...(question.company ? [question.company] : [])])];
}

function PremiumBadge({ premium }) {
  return premium ? <span className="rounded-full bg-violet-100 px-2 py-1 text-[10px] font-bold text-violet-700">Premium</span> : null;
}

function CareerFilters({
  difficulty, company, sort, gateYear, companies, gateYears, questionCount, filteredQuestionCount,
  gateCount, filteredGateCount, onChange, onClear,
}) {
  const filters = [
    { label: "Question difficulty", value: difficulty, key: "difficulty", options: [["ALL", "All difficulties"], ...DIFFICULTY_LEVELS.map((level) => [level, level])] },
    { label: "Company tag", value: company, key: "company", options: [["ALL", "All companies"], ...companies.map((item) => [item, item])] },
    { label: "Sort interview questions", value: sort, key: "sort", options: [["TOPIC", "Default order"], ["EASY_FIRST", "Easy to hard"], ["HARD_FIRST", "Hard to easy"], ["COMPANY", "Company A to Z"]] },
    { label: "GATE PYQ year", value: gateYear, key: "gateYear", options: [["ALL", "All years"], ...gateYears.map((year) => [String(year), String(year)])] },
  ];

  return (
    <div className="grid gap-3 rounded-2xl border border-gray-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-4">
      {filters.map((filter) => (
        <label key={filter.key} className="space-y-1 text-[10px] font-black uppercase tracking-wider text-gray-500">
          {filter.label}
          <select value={filter.value} onChange={(event) => onChange(filter.key, event.target.value)} className={selectClass}>
            {filter.options.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </label>
      ))}
      <div className="flex items-end justify-between gap-3 text-xs text-gray-500 sm:col-span-2 lg:col-span-4">
        <span>Showing {filteredQuestionCount} of {questionCount} interview questions · {filteredGateCount} of {gateCount} GATE PYQs</span>
        <button type="button" onClick={onClear} className="font-bold text-blue-700 hover:underline">Clear filters</button>
      </div>
    </div>
  );
}

function CareerActionButton({ completed, busy, completedLabel, onClick }) {
  return (
    <button type="button" onClick={onClick} disabled={busy} aria-pressed={completed}
      className={`rounded-lg border px-3 py-2 text-[11px] font-bold transition disabled:opacity-60 ${completed ? "border-emerald-300 bg-emerald-100 text-emerald-900" : "border-gray-200 bg-white text-gray-700 hover:border-emerald-300 hover:text-emerald-800"}`}>
      {busy ? "Saving…" : completed ? `✓ ${completedLabel}` : `Mark ${completedLabel.toLowerCase()}`}
    </button>
  );
}

function BrokenLinkReport({ resource, resourceType, state, onReport }) {
  return (
    <span className="inline-flex flex-col items-start gap-1">
      <button type="button" onClick={() => onReport(resourceType, resource)} disabled={state?.status === "sending" || state?.status === "sent"}
        aria-label={`Report broken link: ${resource.title}`}
        className="inline-flex shrink-0 items-center gap-1 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-bold text-gray-600 hover:border-amber-300 hover:text-amber-800 disabled:cursor-default disabled:opacity-70">
        {state?.status === "sent" ? <Check className="h-3.5 w-3.5" /> : <Flag className="h-3.5 w-3.5" />}
        {state?.status === "sending" ? "Sending…" : state?.status === "sent" ? "Reported" : "Report broken link"}
      </button>
      {state?.message && <span role="status" className={`max-w-52 text-[10px] ${state.status === "error" ? "text-red-600" : "text-gray-500"}`}>{state.message}</span>}
    </span>
  );
}

function InterviewQuestion({ question, index, completion, busy, onToggle }) {
  const companies = questionCompanies(question);
  return (
    <li key={question._id || index} className="rounded-2xl bg-indigo-50/70 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <p className="text-sm font-semibold text-gray-900">{question.question || "Premium interview question"}</p>
        {question.question && <CareerActionButton completed={completion} busy={busy} completedLabel="Understood" onClick={onToggle} />}
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-gray-500">
        {companies.map((name) => <span key={name} className="rounded-full bg-white px-2.5 py-1 font-semibold text-indigo-700">{name}</span>)}
        {question.difficulty && <span>{companies.length ? "· " : ""}{question.difficulty}</span>}
        <PremiumBadge premium={question.isPremium} />
      </div>
      {question.answerMarkdown && (
        <details className="mt-4 rounded-xl border border-indigo-100 bg-white">
          <summary className="cursor-pointer px-4 py-3 text-xs font-black text-indigo-800">View answer &amp; explanation</summary>
          <div className="border-t border-indigo-100 px-4 py-4"><MarkdownAnswer value={question.answerMarkdown} /></div>
        </details>
      )}
    </li>
  );
}

function CodingLink({ item, completion, busy, reportState, onToggle, onReport }) {
  return (
    <li className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-emerald-50/70 p-4">
      <div><p className="text-sm font-bold text-gray-900">{item.title}</p><p className="mt-1 text-xs text-gray-500">{item.platform}{item.difficulty ? ` · ${item.difficulty}` : ""}</p><PremiumBadge premium={item.isPremium} /></div>
      {item.url ? (
        <div className="flex flex-wrap items-center gap-2">
          <a href={item.url} target="_blank" rel="noopener noreferrer" className="inline-flex shrink-0 items-center gap-1 rounded-xl bg-white px-3 py-2 text-xs font-bold text-emerald-800 shadow-sm hover:bg-emerald-100">Practice <ExternalLink className="h-3.5 w-3.5" /><span className="sr-only"> (opens in a new tab)</span></a>
          <CareerActionButton completed={completion} busy={busy} completedLabel="Solved" onClick={onToggle} />
          <BrokenLinkReport resource={item} resourceType="CODING_LINK" state={reportState} onReport={onReport} />
        </div>
      ) : <span className="text-xs font-bold text-violet-700">Unlock to practice</span>}
    </li>
  );
}

function GateInsights({ gate, pyqs, gateRange, reportState, onReport }) {
  return (
    <article className="rounded-3xl border border-amber-200 bg-amber-50 p-6 md:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div><p className="text-xs font-black uppercase tracking-widest text-amber-800">{gate.examCode || "GATE CS"} insights</p><h3 className="mt-2 text-2xl font-black text-gray-900">{gateRange}</h3><p className="mt-1 text-sm text-gray-600">Approximate subject weightage{gate.weightagePeriod ? ` · based on ${gate.weightagePeriod}` : ""}. Use it as a planning guide.</p></div>
        <span className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-amber-300 bg-white text-center text-[10px] font-black uppercase text-amber-800">GATE<br />INSIGHT</span>
      </div>
      {pyqs.length > 0 && <div className="mt-6"><h4 className="mb-3 font-black text-gray-900">Previous year questions</h4><div className="grid gap-3 md:grid-cols-2">
        {pyqs.map((item, index) => item.url ? (
          <div key={item._id || index} className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-white p-4 text-sm font-semibold text-gray-800 shadow-sm">
            <a href={item.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2">{item.title}{item.year ? ` · ${item.year}` : ""}{item.topic ? ` · ${item.topic}` : ""}<PremiumBadge premium={item.isPremium} /><ExternalLink className="h-4 w-4 shrink-0 text-amber-700" /></a>
            <BrokenLinkReport resource={item} resourceType="GATE_PYQ" state={reportState(item)} onReport={onReport} />
          </div>
        ) : <div key={item._id || index} className="flex items-center justify-between gap-3 rounded-2xl bg-white p-4 text-sm font-semibold text-gray-800 shadow-sm"><span>{item.title}{item.year ? ` · ${item.year}` : ""}{item.topic ? ` · ${item.topic}` : ""} <PremiumBadge premium={item.isPremium} /></span><span className="text-xs text-violet-700">Unlock PYQ</span></div>)}
      </div></div>}
    </article>
  );
}

export default function SubjectCareerResources({ subject, subjectId }) {
  const queryClient = useQueryClient();
  const career = subject.careerBridge || {};
  const questions = career.interviewQuestions || EMPTY_LIST;
  const codingLinks = career.codingLinks || EMPTY_LIST;
  const gate = career.gate || EMPTY_GATE;
  const gatePyqs = gate.pyqs || EMPTY_LIST;
  const [difficulty, setDifficulty] = useState("ALL");
  const [company, setCompany] = useState("ALL");
  const [sort, setSort] = useState("TOPIC");
  const [gateYear, setGateYear] = useState("ALL");
  const [completionState, setCompletionState] = useState({ subjectId: null, values: {} });
  const [busyKey, setBusyKey] = useState("");
  const [actionMessage, setActionMessage] = useState("");
  const [reportStates, setReportStates] = useState({});

  useEffect(() => {
    let active = true;
    progressService.getCareerProgress(subjectId).then((response) => {
      if (active) setCompletionState({ subjectId, values: Object.fromEntries((response.data.completed || []).map((item) => [`${item.resourceType}:${item.resourceId}`, true])) });
    }).catch(() => { if (active) setCompletionState({ subjectId, values: {} }); });
    return () => { active = false; };
  }, [subjectId]);

  const completions = completionState.subjectId === subjectId ? completionState.values : EMPTY_LIST;

  const companies = useMemo(() => [...new Set(questions.flatMap(questionCompanies).filter(Boolean))].sort((a, b) => a.localeCompare(b)), [questions]);
  const gateYears = useMemo(() => [...new Set(gatePyqs.map((item) => item.year).filter(Boolean))].sort((a, b) => Number(b) - Number(a)), [gatePyqs]);
  const filteredQuestions = useMemo(() => questions.filter((item) =>
    (difficulty === "ALL" || item.difficulty === difficulty) &&
    (company === "ALL" || questionCompanies(item).includes(company))
  ).sort((a, b) => {
    if (sort === "COMPANY") return (questionCompanies(a)[0] || "").localeCompare(questionCompanies(b)[0] || "");
    if (sort === "EASY_FIRST" || sort === "HARD_FIRST") {
      const delta = (DIFFICULTY_RANK[a.difficulty] || 4) - (DIFFICULTY_RANK[b.difficulty] || 4);
      return sort === "HARD_FIRST" ? -delta : delta;
    }
    return 0;
  }), [questions, difficulty, company, sort]);
  const filteredPyqs = useMemo(() => gatePyqs.filter((item) => gateYear === "ALL" || String(item.year || "") === gateYear), [gatePyqs, gateYear]);
  const gateRange = gate.weightageMinMarks != null || gate.weightageMaxMarks != null
    ? `${gate.weightageMinMarks ?? "?"}${gate.weightageMaxMarks != null && gate.weightageMaxMarks !== gate.weightageMinMarks ? `–${gate.weightageMaxMarks}` : ""} marks`
    : "Weightage not added";
  const topics = useMemo(() => [...new Set([...filteredQuestions.map((item) => item.topic), ...codingLinks.map((item) => item.topic)].filter(Boolean))], [filteredQuestions, codingLinks]);

  const changeFilter = (key, value) => ({ difficulty: setDifficulty, company: setCompany, sort: setSort, gateYear: setGateYear })[key](value);
  const reportLink = async (resourceType, resource) => {
    const key = `${resourceType}:${resource._id}`;
    setReportStates((previous) => ({ ...previous, [key]: { status: "sending", message: "" } }));
    try {
      const response = await API.post(`/subjects/${subjectId}/link-reports`, { resourceType, resourceId: resource._id });
      setReportStates((previous) => ({ ...previous, [key]: { status: "sent", message: response.data.message || "Report sent to admins." } }));
    } catch (error) {
      setReportStates((previous) => ({ ...previous, [key]: { status: "error", message: error.response?.data?.message || "Could not send report. Try again." } }));
    }
  };
  const toggleResource = async (resourceType, resource) => {
    const key = `${resourceType}:${resource._id}`;
    const completed = !completions[key];
    setBusyKey(key);
    setActionMessage("");
    try {
      const response = await progressService.setCareerCompletion({ subjectId, resourceType, resourceId: resource._id, completed });
      queryClient.invalidateQueries({ queryKey: ["globalProgress"] });
      setCompletionState((current) => ({ subjectId, values: { ...(current.subjectId === subjectId ? current.values : {}), [key]: response.data.completed } }));
      setActionMessage(completed ? "Progress saved. Keep up the practice!" : "Marked as in progress.");
    } catch (error) {
      setActionMessage(error.response?.data?.message || "Could not save this progress. Please try again.");
    } finally { setBusyKey(""); }
  };
  const reportState = (type, item) => reportStates[`${type}:${item._id}`];

  return (
    <section className="space-y-6">
      {actionMessage && <p role="status" className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-800">{actionMessage}</p>}
      <div><p className="text-xs font-black uppercase tracking-widest text-blue-700">Beyond the syllabus</p><h2 className="mt-1 text-2xl font-black text-gray-900">Turn {subject.name} into career skills</h2><p className="mt-1 text-sm text-gray-500">Interview prep and practice matched to your syllabus topics.</p></div>
      <CareerFilters difficulty={difficulty} company={company} sort={sort} gateYear={gateYear} companies={companies} gateYears={gateYears} questionCount={questions.length} filteredQuestionCount={filteredQuestions.length} gateCount={gatePyqs.length} filteredGateCount={filteredPyqs.length} onChange={changeFilter} onClear={() => { setDifficulty("ALL"); setCompany("ALL"); setSort("TOPIC"); setGateYear("ALL"); }} />

      {(questions.length > 0 || codingLinks.length > 0) ? <div className="space-y-6">
        {topics.map((topic) => {
          const normalizedTopic = topic.trim().toLocaleLowerCase();
          const topicQuestions = filteredQuestions.filter((item) => String(item.topic || "").trim().toLocaleLowerCase() === normalizedTopic);
          const topicLinks = codingLinks.filter((item) => String(item.topic || "").trim().toLocaleLowerCase() === normalizedTopic);
          if (!topicQuestions.length && !topicLinks.length) return null;
          return <article key={topic} className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm md:p-8">
            <h3 className="mb-5 text-lg font-black text-gray-900">{topic}</h3>
            <div className="grid gap-5 md:grid-cols-2">
              {topicQuestions.length > 0 && <div><h4 className="mb-3 flex items-center gap-2 text-xs font-black uppercase tracking-wider text-indigo-700"><BriefcaseBusiness className="h-4 w-4" />Interview questions</h4><ul className="space-y-3">{topicQuestions.map((item, index) => <InterviewQuestion key={item._id || index} question={item} index={index} completion={completions[`INTERVIEW_QUESTION:${item._id}`] === true} busy={busyKey === `INTERVIEW_QUESTION:${item._id}`} onToggle={() => toggleResource("INTERVIEW_QUESTION", item)} />)}</ul></div>}
              {topicLinks.length > 0 && <div><h4 className="mb-3 flex items-center gap-2 text-xs font-black uppercase tracking-wider text-emerald-700"><Code2 className="h-4 w-4" />Coding practice</h4><ul className="space-y-3">{topicLinks.map((item, index) => <CodingLink key={item._id || index} item={item} completion={completions[`CODING_LINK:${item._id}`] === true} busy={busyKey === `CODING_LINK:${item._id}`} reportState={reportState("CODING_LINK", item)} onToggle={() => toggleResource("CODING_LINK", item)} onReport={reportLink} />)}</ul></div>}
            </div>
          </article>;
        })}
        {[...filteredQuestions, ...codingLinks].some((item) => !item.topic?.trim()) && <GeneralPractice questions={filteredQuestions.filter((item) => !item.topic?.trim())} codingLinks={codingLinks.filter((item) => !item.topic?.trim())} completions={completions} busyKey={busyKey} reportState={reportState} onToggle={toggleResource} onReport={reportLink} />}
      </div> : <div className="rounded-3xl border border-dashed border-gray-300 bg-white p-12 text-center"><Radar className="mx-auto h-8 w-8 text-gray-400" /><p className="mt-3 font-bold text-gray-700">Career resources are on the way</p><p className="mt-1 text-sm text-gray-500">Your admin can add interview questions and practice links for this subject.</p></div>}

      <GateInsights gate={gate} pyqs={filteredPyqs} gateRange={gateRange} reportState={(item) => reportState("GATE_PYQ", item)} onReport={reportLink} />
    </section>
  );
}

function GeneralPractice({ questions, codingLinks, completions, busyKey, reportState, onToggle, onReport }) {
  return <article className="rounded-3xl border border-gray-200 bg-white p-6"><h3 className="mb-4 text-lg font-black">General practice</h3><div className="grid gap-4 md:grid-cols-2">
    {questions.map((item, index) => <div key={item._id || index} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-indigo-50 p-4 text-sm font-semibold"><span>{item.question || "Premium interview question"} <PremiumBadge premium={item.isPremium} /></span>{item.question && <CareerActionButton completed={completions[`INTERVIEW_QUESTION:${item._id}`] === true} busy={busyKey === `INTERVIEW_QUESTION:${item._id}`} completedLabel="Understood" onClick={() => onToggle("INTERVIEW_QUESTION", item)} />}</div>)}
    {codingLinks.map((item, index) => item.url ? <div key={item._id || index} className="flex flex-wrap items-center gap-2 rounded-xl bg-emerald-50 p-4"><a href={item.url} target="_blank" rel="noopener noreferrer" className="text-sm font-bold text-emerald-800">{item.title} · {item.platform} <ExternalLink className="inline h-3.5 w-3.5" /><span className="sr-only"> (opens in a new tab)</span><PremiumBadge premium={item.isPremium} /></a><CareerActionButton completed={completions[`CODING_LINK:${item._id}`] === true} busy={busyKey === `CODING_LINK:${item._id}`} completedLabel="Solved" onClick={() => onToggle("CODING_LINK", item)} /><BrokenLinkReport resource={item} resourceType="CODING_LINK" state={reportState("CODING_LINK", item)} onReport={onReport} /></div> : <div key={item._id || index} className="rounded-xl bg-emerald-50 p-4 text-sm font-bold text-emerald-800">{item.title} · {item.platform} · Unlock to practice <PremiumBadge premium={item.isPremium} /></div>)}
  </div></article>;
}

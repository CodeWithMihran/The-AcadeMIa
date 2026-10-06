import React from "react";
import { Radar } from "lucide-react";

const polarPoint = (centerX, centerY, radius, index, count) => {
  const angle = -Math.PI / 2 + (2 * Math.PI * index) / count;
  return [centerX + Math.cos(angle) * radius, centerY + Math.sin(angle) * radius];
};

export default function SkillRadarCard({ data = [] }) {
  const subjects = [...data].sort((a, b) => b.total - a.total || a.subjectName.localeCompare(b.subjectName)).slice(0, 8);
  return <section className="mb-8 rounded-3xl border border-line bg-surface p-5 shadow-sm md:p-6" aria-labelledby="skill-radar-title">
    <header className="mb-4"><p className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-indigo-700"><Radar className="h-4 w-4"/>Career readiness</p><h2 id="skill-radar-title" className="mt-1 text-xl font-black text-content">Your subject skill radar</h2><p className="mt-1 text-xs text-content-muted">Based on interview questions you marked understood and coding problems you marked solved.</p></header>
    {subjects.length < 3 ? <div className="rounded-2xl border border-dashed border-line bg-surface-muted p-6 text-sm text-content-secondary">{subjects.length ? "Add career resources to at least three subjects to build a useful skill radar." : "Your skill radar will appear after your subjects have interview questions or coding practice. Mark those resources complete in Career Mode to build your scores."}</div> : <>
      <div className="overflow-x-auto"><svg viewBox="0 0 600 360" className="mx-auto block min-w-[520px] max-w-3xl" role="img" aria-labelledby="skill-radar-svg-title skill-radar-svg-desc">
        <title id="skill-radar-svg-title">Career skill readiness by subject</title><desc id="skill-radar-svg-desc">Radar chart of completion percentages across {subjects.length} subjects. These scores use career resources available to your account.</desc>
        {(() => {
          const cx = 300, cy = 175, radius = 112, count = subjects.length;
          const polygon = level => subjects.map((_, index) => polarPoint(cx, cy, radius * level, index, count).join(",")).join(" ");
          const fullPoints = subjects.map((_, index) => polarPoint(cx, cy, radius, index, count));
          const values = subjects.map((item, index) => polarPoint(cx, cy, radius * (Math.max(0, Math.min(100, item.score)) / 100), index, count));
          return <g>
            {[0.25, 0.5, 0.75, 1].map(level => <polygon key={level} points={polygon(level)} fill="none" stroke="rgb(var(--line-strong))" strokeWidth="1"/>)}
            {fullPoints.map(([x, y], index) => <line key={index} x1={cx} y1={cy} x2={x} y2={y} stroke="rgb(var(--line-strong))" strokeWidth="1"/>)}
            <polygon points={values.map(point => point.join(",")).join(" ")} fill="rgb(var(--indigo-500) / .20)" stroke="rgb(var(--indigo-500))" strokeWidth="2.5"/>
            {values.map(([x, y], index) => <circle key={index} cx={x} cy={y} r="4" fill="rgb(var(--indigo-500))"><title>{subjects[index].subjectName}: {subjects[index].score}% ({subjects[index].completed}/{subjects[index].total})</title></circle>)}
            {subjects.map((subject, index) => {
              const [x, y] = polarPoint(cx, cy, radius + 28, index, count);
              const shortName = subject.subjectName.length > 17 ? `${subject.subjectName.slice(0, 16)}…` : subject.subjectName;
              return <text key={subject.subjectId} x={x} y={y} textAnchor={x < cx - 10 ? "end" : x > cx + 10 ? "start" : "middle"} dominantBaseline="middle" fill="rgb(var(--content-secondary))" fontSize="10" fontWeight="700"><title>{subject.subjectName}: {subject.score}% ({subject.completed}/{subject.total})</title>{shortName}</text>;
            })}
          </g>;
        })()}
      </svg></div>
      <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">{subjects.map(subject => <div key={subject.subjectId} className="flex items-center justify-between gap-3 rounded-xl bg-surface-muted px-3 py-2 text-xs"><span className="min-w-0 truncate font-semibold text-content-secondary" title={subject.subjectName}>{subject.subjectName}</span><span className="shrink-0 font-black text-indigo-700">{subject.score}% <span className="font-medium text-content-faint">({subject.completed}/{subject.total})</span></span></div>)}</div>
    </>}
  </section>;
}

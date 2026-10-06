import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { tenantService } from "../services/api";
import {
  Activity,
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  BookOpenCheck,
  Building2,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleHelp,
  ClipboardCheck,
  Code2,
  Compass,
  FileText,
  Flame,
  GraduationCap,
  Layers3,
  LockKeyhole,
  Medal,
  Play,
  Sparkles,
  Target,
  Trophy,
  Users,
} from "lucide-react";

const tracks = [
  {
    icon: GraduationCap,
    title: "University semesters",
    description: "Keep your university subjects, units, notes, PYQs, and topic progress together.",
    tags: ["AKTU", "VMSB UTU", "Campus-specific"],
    tone: "blue",
  },
  {
    icon: Target,
    title: "JEE & NEET preparation",
    description: "Organize your exam track around the subjects and study resources that matter to you.",
    tags: ["JEE Main", "JEE Advanced", "NEET UG"],
    tone: "indigo",
  },
];

const featureCards = [
  {
    icon: Flame,
    eyebrow: "Before the exam",
    title: "Know what to revise next.",
    description: "Explore past-paper recurrence, rapid revision sheets, and exam-answer outlines by unit when your subject has them.",
    footer: "Exam Night toolkit",
    tone: "amber",
  },
  {
    icon: Activity,
    eyebrow: "Between lectures",
    title: "Stay on top of the semester.",
    description: "Forecast attendance, record internal marks, and model SGPA or CGPA with your subjects and credits.",
    footer: "Attendance · marks · planner",
    tone: "emerald",
  },
  {
    icon: Code2,
    eyebrow: "Beyond the syllabus",
    title: "Connect subjects to careers.",
    description: "Map university topics to interview questions, coding practice, and GATE resources from the same vault.",
    footer: "Interview · coding · GATE",
    tone: "indigo",
  },
  {
    icon: Users,
    eyebrow: "Learn together",
    title: "Share notes with your campus.",
    description: "Contribute original notes, discover peer-approved resources, and support missing materials through campus requests.",
    footer: "Peer-reviewed contributions",
    tone: "blue",
  },
  {
    icon: Trophy,
    eyebrow: "See your progress",
    title: "Make learning visible.",
    description: "Track syllabus completion, build a career-practice streak, and compare readiness with opted-in campus peers.",
    footer: "Private by default · opt-in rankings",
    tone: "amber",
  },
  {
    icon: LockKeyhole,
    eyebrow: "Your workspace",
    title: "Keep your study flow in one place.",
    description: "Move between embedded study material, topic progress, planning tools, and career resources without losing context.",
    footer: "A calmer academic workspace",
    tone: "emerald",
  },
];

const toneClasses = {
  blue: "bg-blue-50 text-blue-700 border-blue-100",
  indigo: "bg-indigo-50 text-indigo-700 border-indigo-100",
  amber: "bg-amber-50 text-amber-800 border-amber-100",
  emerald: "bg-emerald-50 text-emerald-800 border-emerald-100",
};

export const Home = () => {
  const { login, register, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [isLoginTab, setIsLoginTab] = useState(true);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [detectedTenant, setDetectedTenant] = useState(null);

  useEffect(() => {
    if (isAuthenticated) navigate("/dashboard");
  }, [isAuthenticated, navigate]);

  // Resolve a campus email while a student fills in the existing auth form.
  useEffect(() => {
    let active = true;
    const timer = setTimeout(async () => {
      if (!formData.email || !formData.email.includes("@")) {
        setDetectedTenant(null);
        return;
      }
      try {
        const response = await tenantService.resolveDomain(formData.email);
        if (!active) return;
        setDetectedTenant(response.data.success && response.data.matched ? response.data : null);
      } catch {
        if (active) setDetectedTenant(null);
      }
    }, 400);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [formData.email]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (isLoginTab) await login(formData.email, formData.password);
      else await register(formData);
      navigate("/dashboard");
    } catch (requestError) {
      setError(requestError.response?.data?.message || requestError.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = () => {
    const configuredApiUrl = import.meta.env.VITE_API_BASE_URL;
    const apiUrl = configuredApiUrl
      ? configuredApiUrl.replace(/\/api\/?$/, "")
      : `${window.location.protocol}//${window.location.hostname}:3000`;
    window.location.href = `${apiUrl}/auth/google`;
  };

  return (
    <div className="min-h-screen overflow-hidden bg-app text-content">
      <section id="home" className="relative px-5 pb-16 pt-32 md:px-8 md:pb-24 md:pt-40">
        <div className="pointer-events-none absolute inset-x-0 top-20 -z-0 mx-auto h-[32rem] max-w-6xl rounded-full bg-blue-500/[0.04] blur-3xl" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[1fr_1.02fr] lg:gap-16">
          <div className="mx-auto max-w-2xl text-center lg:mx-0 lg:text-left">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3.5 py-2 text-[10px] font-black uppercase tracking-[.16em] text-content-secondary shadow-sm md:text-xs">
              <Sparkles className="h-3.5 w-3.5 text-blue-600" />
              The workspace for your academic life
            </div>
            <h1 className="text-[2.7rem] font-black leading-[1.04] tracking-[-.055em] text-content sm:text-5xl md:text-6xl lg:text-[4.4rem]">
              Your studies,<br className="hidden sm:block" />
              <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-800 bg-clip-text text-transparent"> in their place.</span>
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-base leading-7 text-content-secondary md:text-lg md:leading-8 lg:mx-0">
              The AcadeMIa brings your syllabus, study material, exam prep, and progress into one clear workspace—built for university semesters and competitive exam journeys.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row lg:justify-start">
              <a href="#auth" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-surface-inverse px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-950/10 transition hover:-translate-y-0.5 hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2">
                Create your free workspace <ArrowRight className="h-4 w-4" />
              </a>
              <a href="#features" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-line bg-surface px-6 py-3.5 text-sm font-bold text-content-secondary transition hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2">
                Explore the platform <ArrowDown className="h-4 w-4" />
              </a>
            </div>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs font-medium text-content-muted lg:justify-start">
              <span className="inline-flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-emerald-600" />Free to get started</span>
              <span className="inline-flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-emerald-600" />Your progress stays yours</span>
            </div>
          </div>

          <WorkspacePreview />
        </div>

        <div id="universities" className="relative mx-auto mt-16 max-w-7xl border-t border-line pt-7 md:mt-24">
          <p className="mb-4 text-center text-[10px] font-black uppercase tracking-[.2em] text-content-faint">Made for the tracks our students follow</p>
          <div className="flex flex-wrap justify-center gap-2.5">
            {["AKTU", "VMSB Uttarakhand Technical University", "JEE Main & Advanced", "NEET UG"].map((item) => (
              <span key={item} className="rounded-full border border-line bg-surface px-4 py-2 text-xs font-semibold text-content-secondary">{item}</span>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 py-16 md:px-8 md:py-24">
        <div className="mx-auto max-w-7xl">
          <SectionHeading eyebrow="One platform, your path" title="Built around how you study." description="Start with your academic track. Your workspace brings the right subjects, tools, and progress into view." />
          <div className="mt-10 grid gap-4 md:grid-cols-2">
            {tracks.map(({ icon: Icon, title, description, tags, tone }) => (
              <article key={title} className="group rounded-3xl border border-line bg-surface p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-xl md:p-8">
                <div className={`mb-5 flex h-12 w-12 items-center justify-center rounded-2xl border ${toneClasses[tone]}`}><Icon className="h-6 w-6" /></div>
                <h3 className="text-xl font-black tracking-tight text-content md:text-2xl">{title}</h3>
                <p className="mt-2 max-w-xl text-sm leading-6 text-content-secondary">{description}</p>
                <div className="mt-5 flex flex-wrap gap-2">{tags.map(tag => <span key={tag} className="rounded-lg bg-surface-muted px-2.5 py-1.5 text-[11px] font-bold text-content-muted">{tag}</span>)}</div>
                <a href="#auth" className="mt-6 inline-flex min-h-11 items-center gap-2 text-sm font-bold text-blue-700">Find your starting point <ArrowUpRight className="h-4 w-4 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" /></a>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="features" className="scroll-mt-24 border-y border-line bg-surface px-5 py-16 md:px-8 md:py-24">
        <div className="mx-auto max-w-7xl">
          <SectionHeading eyebrow="More than a resource folder" title="From first lecture to final revision." description="Keep the everyday work of learning connected—from opening a unit to seeing how far you’ve come." />

          <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {featureCards.map(({ icon: Icon, eyebrow, title, description, footer, tone }) => (
              <article key={title} className="flex min-h-[17rem] flex-col rounded-3xl border border-line bg-app p-6 transition hover:border-line-strong hover:shadow-lg md:p-7">
                <div className="flex items-center justify-between gap-3">
                  <span className={`inline-flex h-10 w-10 items-center justify-center rounded-xl border ${toneClasses[tone]}`}><Icon className="h-5 w-5" /></span>
                  <span className="text-[10px] font-black uppercase tracking-[.16em] text-content-faint">{eyebrow}</span>
                </div>
                <h3 className="mt-6 text-xl font-black tracking-tight text-content">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-content-secondary">{description}</p>
                <div className="mt-auto flex items-center gap-2 pt-6 text-[11px] font-bold text-content-muted"><CheckCircle2 className="h-4 w-4 text-blue-600" />{footer}</div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 py-16 md:px-8 md:py-24">
        <div className="mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-[.9fr_1.1fr] lg:gap-16">
          <div>
            <SectionHeading eyebrow="Inside the subject vault" title="Open a subject. See the whole picture." description="Each subject gives you a home for its units, study resources, and learning progress, so the next step is easy to find." align="left" />
            <ul className="mt-7 space-y-3">
              {["Unit-wise notes, books, videos, and PYQs", "Embedded materials that stay inside the vault", "Topic completion and subject readiness", "Exam Night and career resources alongside your syllabus"].map(item => <li key={item} className="flex items-start gap-3 text-sm text-content-secondary"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />{item}</li>)}
            </ul>
            <a href="#auth" className="mt-7 inline-flex min-h-11 items-center gap-2 rounded-xl bg-surface-inverse px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-700">Explore your vault <ArrowRight className="h-4 w-4" /></a>
          </div>
          <VaultPreview />
        </div>
      </section>

      <section className="border-y border-line bg-surface px-5 py-16 md:px-8 md:py-24">
        <div className="mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <div className="order-2 lg:order-1"><ExamNightPreview /></div>
          <div className="order-1 lg:order-2">
            <SectionHeading eyebrow="When the exam gets close" title="Spend less time searching. More time revising." description="The Exam Night toolkit organizes the material students need for a focused final review—right inside the relevant subject." align="left" />
            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              <MiniFeature icon={Flame} title="PYQ recurrence" text="See the recorded years and topic patterns." />
              <MiniFeature icon={BookOpenCheck} title="Rapid revision" text="Open unit-level formulas and key points." />
              <MiniFeature icon={FileText} title="Answer outlines" text="Review structured 10-mark summaries." />
              <MiniFeature icon={ClipboardCheck} title="Source context" text="Use historical papers as guidance, not guarantees." />
            </div>
          </div>
        </div>
      </section>

      <section className="px-5 py-16 md:px-8 md:py-24">
        <div className="mx-auto max-w-7xl">
          <SectionHeading eyebrow="Useful all semester" title="Small tools for the questions on your mind." description="Check your standing, plan what you need, and keep a record as the semester moves along." />
          <div className="mt-10 grid gap-4 lg:grid-cols-3">
            <ToolCard icon={Activity} title="Attendance forecaster" label="Can I miss another class?" answer="See your current percentage and how much room you have against your target." tone="blue" />
            <ToolCard icon={GraduationCap} title="SGPA & CGPA planner" label="What grades am I aiming for?" answer="Use subject credits and your grade scale to model semester outcomes." tone="indigo" />
            <ToolCard icon={ClipboardCheck} title="Internal marks tracker" label="What do I need on the final?" answer="Record sessionals and estimate the external marks needed for your target." tone="emerald" />
          </div>
          <p className="mt-4 text-center text-xs text-content-faint">Calculations use the values and grading scale in your profile; verify institution-specific rules with your university.</p>
        </div>
      </section>

      <section className="border-y border-line bg-surface px-5 py-16 md:px-8 md:py-24">
        <div className="mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-[1.05fr_.95fr] lg:gap-16">
          <div>
            <SectionHeading eyebrow="From college to career" title="Let your subjects lead somewhere." description="Connect what you’re learning in class with a path toward interviews, coding practice, and GATE preparation." align="left" />
            <div className="mt-7 space-y-3">
              <BridgeRow icon={BookOpen} title="Understand the concept" text="Finish a topic in your university syllabus." />
              <BridgeRow icon={Code2} title="Practice the skill" text="Open mapped questions and external coding practice." />
              <BridgeRow icon={Trophy} title="Build your track record" text="Mark progress and see your subject-level readiness." />
            </div>
          </div>
          <CareerPreview />
        </div>
      </section>

      <section className="px-5 py-16 md:px-8 md:py-24">
        <div className="mx-auto max-w-7xl">
          <SectionHeading eyebrow="A campus learning loop" title="Good notes get better when they’re shared." description="Contribute original material, let campus moderators review it, and help your batch find useful resources." />
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            <CommunityStep number="01" icon={FileText} title="Share original notes" text="Upload a useful set of notes and choose the subject or unit it supports." />
            <CommunityStep number="02" icon={Users} title="Review with your campus" text="Students can discover, rate, and request materials; moderators review submissions." />
            <CommunityStep number="03" icon={Medal} title="Earn campus credits" text="Approved contributions can earn credits and badges for your work." />
          </div>
        </div>
      </section>

      <section id="workflow" className="scroll-mt-24 border-y border-line bg-surface px-5 py-16 md:px-8 md:py-24">
        <div className="mx-auto max-w-7xl">
          <SectionHeading eyebrow="A clear starting point" title="Set up once. Find your next step every day." description="A simple flow to move from your academic context to focused study." />
          <div className="mt-11 grid gap-4 md:grid-cols-3">
            <WorkflowStep number="1" icon={Compass} title="Choose your track" text="Set up a university profile or choose your competitive exam path." />
            <WorkflowStep number="2" icon={Layers3} title="Open your subjects" text="Find unit-wise material, practice resources, and tools in one workspace." />
            <WorkflowStep number="3" icon={Activity} title="Keep your progress" text="Mark topics complete, plan your workload, and return to what’s next." />
          </div>
        </div>
      </section>

      <section className="px-5 py-16 md:px-8 md:py-24">
        <div className="mx-auto max-w-7xl overflow-hidden rounded-[2rem] border border-line bg-surface-inverse px-6 py-10 text-white shadow-xl md:px-12 md:py-14">
          <div className="grid items-center gap-8 md:grid-cols-[1fr_auto]">
            <div><p className="text-xs font-black uppercase tracking-[.2em] text-blue-300">Your next semester starts here</p><h2 className="mt-3 max-w-2xl text-3xl font-black tracking-tight md:text-4xl">Give everything you’re studying a place to live.</h2><p className="mt-3 max-w-2xl text-sm leading-6 text-content-muted">Start a focused academic workspace and shape it around your subjects, your campus, and your goals.</p></div>
            <a href="#auth" className="inline-flex min-h-12 items-center justify-center gap-2 self-start rounded-xl bg-white px-6 py-3.5 text-sm font-bold text-content shadow-lg transition hover:bg-blue-50 md:self-center">Get started <ArrowRight className="h-4 w-4" /></a>
          </div>
        </div>
      </section>

      <section id="auth" className="scroll-mt-24 border-t border-line bg-surface px-5 py-16 md:px-8 md:py-24">
        <div className="mx-auto grid max-w-6xl items-start gap-10 lg:grid-cols-[.85fr_1.15fr] lg:gap-16">
          <div className="pt-2">
            <p className="inline-flex items-center gap-2 rounded-full border border-line bg-surface-muted px-3 py-1.5 text-[10px] font-black uppercase tracking-[.18em] text-content-muted"><LockKeyhole className="h-3.5 w-3.5 text-blue-600" />Your workspace starts here</p>
            <h2 className="mt-5 text-3xl font-black tracking-tight text-content md:text-4xl">Pick up where your learning begins.</h2>
            <p className="mt-3 max-w-lg text-sm leading-6 text-content-secondary">Sign in to your workspace or create an account to set up your academic track and get started.</p>
            <div className="mt-7 space-y-3 text-sm text-content-secondary">
              <p className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-600" />One place for subjects and resources</p>
              <p className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-600" />Tools for semester planning and revision</p>
              <p className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-600" />A progress view you can return to</p>
            </div>
          </div>

          <div className="rounded-3xl border border-line bg-app p-5 shadow-sm sm:p-8">
            <div className="mb-6 flex gap-1 rounded-xl border border-line bg-surface-subtle p-1.5" role="tablist" aria-label="Account access">
              <button type="button" role="tab" aria-selected={isLoginTab} onClick={() => { setIsLoginTab(true); setError(""); }} className={`min-h-11 flex-1 rounded-lg px-3 py-2.5 text-xs font-black uppercase tracking-wider transition ${isLoginTab ? "bg-surface text-content shadow-sm" : "text-content-muted hover:text-content"}`}>Sign in</button>
              <button type="button" role="tab" aria-selected={!isLoginTab} onClick={() => { setIsLoginTab(false); setError(""); }} className={`min-h-11 flex-1 rounded-lg px-3 py-2.5 text-xs font-black uppercase tracking-wider transition ${!isLoginTab ? "bg-surface text-content shadow-sm" : "text-content-muted hover:text-content"}`}>Create account</button>
            </div>

            {error && <div role="alert" className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-800">{error}</div>}

            <button onClick={handleGoogleAuth} type="button" className="inline-flex min-h-11 w-full items-center justify-center gap-3 rounded-xl border border-line bg-surface py-3 text-sm font-bold text-content-secondary transition hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="h-4 w-4" alt="" />Continue with Google
            </button>
            <div className="my-6 flex items-center gap-3 text-[10px] font-black uppercase tracking-[.18em] text-content-faint"><span className="h-px flex-1 bg-line" />Or use email<span className="h-px flex-1 bg-line" /></div>

            {detectedTenant && <div role="status" className="mb-4 flex items-start gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 text-xs text-emerald-900"><Building2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" /><div><p className="font-bold">Affiliated institution detected</p><p className="mt-0.5">{detectedTenant.college} · {detectedTenant.tenant.shortCode}</p></div></div>}

            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLoginTab && <Field label="Full name" id="account-name"><input id="account-name" type="text" autoComplete="name" required placeholder="Your name" value={formData.name} onChange={event => setFormData({ ...formData, name: event.target.value })} className={inputClass} /></Field>}
              <Field label="Email address" id="account-email"><input id="account-email" type="email" autoComplete="email" required placeholder="student@college.edu or gmail" value={formData.email} onChange={event => setFormData({ ...formData, email: event.target.value })} className={inputClass} /></Field>
              <Field label="Password" id="account-password"><input id="account-password" type="password" autoComplete={isLoginTab ? "current-password" : "new-password"} required placeholder="Enter your password" value={formData.password} onChange={event => setFormData({ ...formData, password: event.target.value })} className={inputClass} /></Field>
              {!isLoginTab && <Field label="Confirm password" id="confirm-password"><input id="confirm-password" type="password" autoComplete="new-password" required placeholder="Re-enter your password" value={formData.confirmPassword} onChange={event => setFormData({ ...formData, confirmPassword: event.target.value })} className={inputClass} /></Field>}
              <button type="submit" disabled={loading} className="mt-2 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-surface-inverse px-5 py-3.5 text-xs font-black uppercase tracking-[.14em] text-white shadow-md transition hover:bg-blue-700 disabled:cursor-wait disabled:opacity-60">
                {loading ? "Please wait…" : isLoginTab ? "Sign in to your workspace" : "Create your account"}{!loading && <ArrowRight className="h-4 w-4" />}
              </button>
            </form>
            <p className="mt-4 flex items-start gap-2 text-[11px] leading-relaxed text-content-faint"><CircleHelp className="mt-0.5 h-3.5 w-3.5 shrink-0" />After signing up, you’ll choose the university or exam track for your workspace.</p>
          </div>
        </div>
      </section>
    </div>
  );
};

const inputClass = "min-h-11 w-full rounded-xl border border-line-strong bg-surface px-3.5 py-3 text-sm font-medium text-content outline-none transition placeholder:text-content-faint focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20";

function Field({ label, id, children }) {
  return <div><label htmlFor={id} className="mb-1.5 block text-[10px] font-black uppercase tracking-wider text-content-muted">{label}</label>{children}</div>;
}

function SectionHeading({ eyebrow, title, description, align = "center" }) {
  return <header className={align === "left" ? "max-w-2xl" : "mx-auto max-w-3xl text-center"}>
    <p className="text-[10px] font-black uppercase tracking-[.2em] text-blue-700">{eyebrow}</p>
    <h2 className="mt-3 text-3xl font-black leading-tight tracking-[-.035em] text-content sm:text-4xl md:text-[2.75rem]">{title}</h2>
    <p className="mt-4 text-sm leading-6 text-content-secondary md:text-base md:leading-7">{description}</p>
  </header>;
}

function WorkspacePreview() {
  const subjects = [
    { name: "Operating Systems", detail: "5 units · 3 in progress", progress: "62%", width: "62%", icon: Layers3 },
    { name: "Database Systems", detail: "5 units · next up: Normalization", progress: "48%", width: "48%", icon: BookOpen },
    { name: "Computer Networks", detail: "4 units · 2 topics complete", progress: "31%", width: "31%", icon: Compass },
  ];
  return <div className="relative mx-auto w-full max-w-[38rem] lg:ml-auto">
    <div className="absolute -inset-5 -z-10 rounded-[2.5rem] bg-gradient-to-br from-blue-500/10 via-indigo-500/[0.06] to-transparent blur-xl" />
    <div className="overflow-hidden rounded-[1.6rem] border border-line bg-surface shadow-2xl shadow-black/10">
      <div className="flex items-center justify-between border-b border-line px-4 py-3.5 sm:px-5">
        <div className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-red-400"/><span className="h-2.5 w-2.5 rounded-full bg-amber-400"/><span className="h-2.5 w-2.5 rounded-full bg-emerald-400"/><span className="ml-2 text-[10px] font-bold text-content-faint">YOUR ACADEMIC WORKSPACE</span></div>
        <span className="rounded-full border border-line bg-surface-muted px-2.5 py-1 text-[9px] font-bold text-content-muted">Sample preview</span>
      </div>
      <div className="grid min-h-[25rem] sm:grid-cols-[10.5rem_1fr]">
        <aside className="hidden border-r border-line bg-surface-muted/60 p-4 sm:block">
          <p className="mb-4 flex items-center gap-2 text-[11px] font-black text-content"><span className="flex h-6 w-6 items-center justify-center rounded-lg bg-blue-600 text-white"><BookOpen className="h-3.5 w-3.5" /></span>My workspace</p>
          <p className="mb-2 text-[9px] font-black uppercase tracking-widest text-content-faint">Study</p>
          <div className="space-y-1 text-[11px]"><div className="rounded-lg bg-blue-50 px-2.5 py-2 font-bold text-blue-800">◈ Subjects</div><div className="px-2.5 py-2 text-content-muted">▤ Exam Night</div><div className="px-2.5 py-2 text-content-muted">◷ Study tools</div><div className="px-2.5 py-2 text-content-muted">↗ Career bridge</div></div>
          <div className="mt-6 rounded-xl border border-line bg-surface p-3"><p className="text-[9px] font-black uppercase tracking-wide text-content-faint">Your track</p><p className="mt-1 text-[11px] font-bold text-content">University · CSE</p><p className="mt-1 text-[10px] text-content-muted">Semester 4</p></div>
        </aside>
        <div className="min-w-0 p-4 sm:p-5">
          <div className="flex items-start justify-between gap-2"><div><p className="text-[10px] font-bold text-content-faint">Monday, your workspace</p><h3 className="mt-1 text-xl font-black tracking-tight text-content">Good to see you.</h3><p className="mt-1 text-xs text-content-muted">Pick up your subjects where you left off.</p></div><div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700"><GraduationCap className="h-4 w-4"/></div></div>
          <div className="mt-5 rounded-2xl border border-line bg-surface-muted p-4">
            <div className="flex items-center justify-between gap-3"><div><p className="text-[9px] font-black uppercase tracking-wider text-content-faint">Semester overview</p><p className="mt-1 text-sm font-black text-content">A steady step at a time</p></div><span className="rounded-full bg-blue-100 px-2.5 py-1 text-[9px] font-black text-blue-800">Progress view</span></div>
            <div className="mt-4 flex items-center gap-3"><div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-hover"><div className="h-full w-[46%] rounded-full bg-blue-600" /></div><span className="text-xs font-black text-content-secondary">Your subjects</span></div>
          </div>
          <div className="mt-5 flex items-center justify-between"><h4 className="text-xs font-black text-content">Continue learning</h4><span className="text-[10px] font-semibold text-content-faint">Subject vaults</span></div>
          <div className="mt-2 space-y-2">
            {subjects.map(({ name, detail, progress, width, icon: Icon }) => <div key={name} className="flex items-center gap-3 rounded-xl border border-line bg-surface p-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700"><Icon className="h-4 w-4"/></span><div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-2"><p className="truncate text-[11px] font-bold text-content">{name}</p><span className="text-[10px] font-black text-content-muted">{progress}</span></div><p className="mt-1 truncate text-[9px] text-content-faint">{detail}</p><div className="mt-2 h-1 overflow-hidden rounded-full bg-surface-subtle"><div className="h-full rounded-full bg-indigo-500" style={{ width }} /></div></div><ChevronRight className="h-4 w-4 shrink-0 text-content-faint"/></div>)}
          </div>
        </div>
      </div>
    </div>
    <div className="absolute -bottom-5 -left-2 hidden items-center gap-2 rounded-xl border border-line bg-surface px-3 py-2.5 shadow-lg sm:flex md:-left-6"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700"><CheckCircle2 className="h-4 w-4"/></span><span><span className="block text-[9px] font-bold uppercase tracking-wide text-content-faint">Your next step</span><span className="block text-xs font-black text-content">Finish a topic</span></span></div>
  </div>;
}

function VaultPreview() {
  return <div className="rounded-3xl border border-line bg-surface p-4 shadow-xl sm:p-6">
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4"><div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700"><BookOpen className="h-5 w-5"/></span><div><p className="text-[9px] font-black uppercase tracking-widest text-content-faint">Subject vault</p><p className="mt-0.5 text-sm font-black text-content">Database Management Systems</p></div></div><span className="rounded-full border border-line px-2.5 py-1 text-[9px] font-bold text-content-muted">University syllabus</span></div>
    <div className="mt-4 space-y-2.5">
      {[{ n: "01", title: "Database fundamentals", state: "Complete", done: true }, { n: "02", title: "Relational model & SQL", state: "In progress", done: false }, { n: "03", title: "Normalization", state: "Study next", done: false }].map(item => <div key={item.n} className={`flex items-center gap-3 rounded-xl border p-3 ${item.done ? "border-emerald-200 bg-emerald-50/50" : "border-line bg-surface-muted/50"}`}><span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[10px] font-black ${item.done ? "bg-emerald-100 text-emerald-800" : "bg-surface-subtle text-content-muted"}`}>{item.done ? <Check className="h-4 w-4"/> : item.n}</span><div className="min-w-0 flex-1"><p className="truncate text-xs font-bold text-content">{item.title}</p><p className="mt-0.5 text-[10px] text-content-muted">Unit {item.n} · notes, videos & PYQs</p></div><span className="hidden rounded-full bg-surface px-2 py-1 text-[9px] font-semibold text-content-muted sm:inline">{item.state}</span></div>)}
    </div>
    <div className="mt-4 grid grid-cols-3 gap-2"><PreviewPill icon={FileText} label="Notes"/><PreviewPill icon={Play} label="Lectures"/><PreviewPill icon={BookOpenCheck} label="PYQs"/></div>
  </div>;
}

function ExamNightPreview() {
  const years = ["2021", "2022", "2023", "2024", "2025"];
  return <div className="rounded-3xl border border-line bg-app p-4 shadow-xl sm:p-6">
    <div className="flex items-center justify-between gap-3"><div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-800"><Flame className="h-5 w-5"/></span><div><p className="text-[9px] font-black uppercase tracking-widest text-content-faint">Exam Night · Unit 3</p><p className="mt-0.5 text-sm font-black text-content">Data structures</p></div></div><span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[9px] font-bold text-amber-900">Past-paper view</span></div>
    <div className="mt-5 rounded-2xl border border-line bg-surface p-4"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-[10px] font-bold text-content-muted">Topic recurrence</p><p className="mt-1 text-sm font-black text-content">Tree traversals</p></div><span className="rounded-full bg-amber-100 px-3 py-1.5 text-[10px] font-black text-amber-900">Seen in 3 recorded years</span></div><div className="mt-4 grid grid-cols-5 gap-2">{years.map((year, index) => <div key={year} className={`rounded-lg border p-2 text-center ${[0, 2, 3].includes(index) ? "border-amber-200 bg-amber-50" : "border-line bg-surface-muted"}`}><p className="text-[9px] font-bold text-content-faint">{year}</p><span className={`mx-auto mt-2 block h-2 w-2 rounded-sm ${[0, 2, 3].includes(index) ? "bg-amber-500" : "bg-surface-hover"}`} /></div>)}</div></div>
    <div className="mt-3 grid gap-2 sm:grid-cols-2"><div className="rounded-xl border border-line bg-surface p-3"><p className="text-[9px] font-black uppercase tracking-widest text-content-faint">10-minute revision</p><p className="mt-1 text-xs font-bold text-content">Formulas & key points</p></div><div className="rounded-xl border border-line bg-surface p-3"><p className="text-[9px] font-black uppercase tracking-widest text-content-faint">Exam answer outline</p><p className="mt-1 text-xs font-bold text-content">Definition · diagram · working</p></div></div>
    <p className="mt-3 text-[10px] leading-relaxed text-content-faint">Illustrative preview. Recurrence reflects entered past papers and does not predict or guarantee future marks.</p>
  </div>;
}

function CareerPreview() {
  return <div className="rounded-3xl border border-line bg-app p-5 shadow-xl sm:p-7">
    <div className="flex items-center justify-between gap-3"><div><p className="text-[9px] font-black uppercase tracking-[.18em] text-indigo-700">Career bridge</p><h3 className="mt-1 text-lg font-black text-content">Database Systems</h3></div><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700"><Code2 className="h-5 w-5"/></span></div>
    <div className="mt-5 rounded-2xl border border-line bg-surface p-4"><div className="flex items-center gap-2 text-xs font-black text-content"><CheckCircle2 className="h-4 w-4 text-emerald-600"/>Normalization</div><p className="ml-6 mt-1 text-[11px] leading-5 text-content-muted">University topic complete · career practice connected</p></div>
    <div className="mt-3 space-y-2">
      <div className="flex items-center gap-3 rounded-xl border border-line bg-surface p-3"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-700"><CircleHelp className="h-4 w-4"/></span><div className="min-w-0 flex-1"><p className="text-xs font-bold text-content">Interview questions</p><p className="text-[10px] text-content-muted">Filter by difficulty and company</p></div><ArrowUpRight className="h-4 w-4 text-content-faint"/></div>
      <div className="flex items-center gap-3 rounded-xl border border-line bg-surface p-3"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-700"><Code2 className="h-4 w-4"/></span><div className="min-w-0 flex-1"><p className="text-xs font-bold text-content">Practice links</p><p className="text-[10px] text-content-muted">Coding platforms & GATE PYQs</p></div><ArrowUpRight className="h-4 w-4 text-content-faint"/></div>
    </div>
    <div className="mt-4 flex items-center gap-2 rounded-xl bg-indigo-50/70 px-3 py-2.5 text-[10px] font-semibold text-indigo-900"><Activity className="h-4 w-4"/>Practice progress contributes to your career activity.</div>
  </div>;
}

function ToolCard({ icon: Icon, title, label, answer, tone }) {
  return <article className="rounded-3xl border border-line bg-surface p-5 shadow-sm sm:p-6"><span className={`flex h-11 w-11 items-center justify-center rounded-xl border ${toneClasses[tone]}`}><Icon className="h-5 w-5"/></span><h3 className="mt-5 text-base font-black text-content">{title}</h3><p className="mt-3 rounded-xl bg-surface-muted px-3 py-2 text-xs font-bold text-content-secondary">“{label}”</p><p className="mt-3 text-sm leading-6 text-content-muted">{answer}</p></article>;
}

function MiniFeature({ icon: Icon, title, text }) {
  return <div className="rounded-2xl border border-line bg-surface p-4"><Icon className="h-4 w-4 text-blue-700"/><p className="mt-3 text-xs font-black text-content">{title}</p><p className="mt-1 text-[11px] leading-5 text-content-muted">{text}</p></div>;
}

function BridgeRow({ icon: Icon, title, text }) {
  return <div className="flex gap-3 rounded-xl border border-line bg-surface p-3.5"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-700"><Icon className="h-4 w-4"/></span><div><p className="text-xs font-black text-content">{title}</p><p className="mt-1 text-[11px] leading-5 text-content-muted">{text}</p></div></div>;
}

function CommunityStep({ number, icon: Icon, title, text }) {
  return <article className="rounded-3xl border border-line bg-surface p-5 sm:p-6"><div className="flex items-center justify-between"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-800"><Icon className="h-5 w-5"/></span><span className="text-xs font-black tracking-widest text-content-faint">{number}</span></div><h3 className="mt-5 text-base font-black text-content">{title}</h3><p className="mt-2 text-sm leading-6 text-content-secondary">{text}</p></article>;
}

function WorkflowStep({ number, icon: Icon, title, text }) {
  return <article className="relative rounded-3xl border border-line bg-app p-5 sm:p-6"><div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface text-blue-700 shadow-sm"><Icon className="h-5 w-5"/></span><span className="text-[10px] font-black uppercase tracking-widest text-content-faint">Step {number}</span></div><h3 className="mt-5 text-base font-black text-content">{title}</h3><p className="mt-2 text-sm leading-6 text-content-secondary">{text}</p></article>;
}

function PreviewPill({ icon: Icon, label }) {
  return <div className="flex items-center justify-center gap-1.5 rounded-lg border border-line bg-surface-muted px-2 py-2 text-[10px] font-bold text-content-secondary"><Icon className="h-3.5 w-3.5 text-blue-700" />{label}</div>;
}

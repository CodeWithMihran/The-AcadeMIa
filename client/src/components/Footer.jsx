import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, BookOpen, BriefcaseBusiness, Code2, Mail } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const CURRENT_YEAR = new Date().getFullYear();
const DEVELOPER_URL = 'https://github.com/CodeWithMihran';
const CONTACT_EMAIL = 'sohail.mihran@gmail.com';

const SocialLinks = () => (
  <div className="flex items-center gap-2.5">
    <a
      href={DEVELOPER_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Visit the developer on GitHub (opens in a new tab)"
      className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-content-muted transition duration-200 hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
    >
      <Code2 aria-hidden="true" className="h-4 w-4" />
    </a>
    <a
      href="https://www.linkedin.com/in/md-mihran-sohail-321b12384/"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Visit the developer on LinkedIn (opens in a new tab)"
      className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-content-muted transition duration-200 hover:-translate-y-0.5 hover:border-sky-400/40 hover:bg-sky-600 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
    >
      <BriefcaseBusiness aria-hidden="true" className="h-4 w-4" />
    </a>
  </div>
);

const Brand = ({ compact = false, to = '/' }) => (
  <Link to={to} className="group inline-flex w-fit items-center gap-3 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400">
    <span className={`inline-flex shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/15 transition-transform duration-200 group-hover:scale-105 ${compact ? 'h-9 w-9' : 'h-11 w-11'}`}>
      <BookOpen aria-hidden="true" className={compact ? 'h-4 w-4' : 'h-5 w-5'} />
    </span>
    <span className="flex flex-col">
      <span className={`whitespace-nowrap font-black uppercase italic tracking-tight text-white ${compact ? 'text-base' : 'text-lg'}`}>
        The <span className="bg-gradient-to-r from-blue-400 via-indigo-200 to-white bg-clip-text text-transparent">AcadeMIa</span>
      </span>
      {!compact && <span className="mt-0.5 text-[9px] font-bold uppercase tracking-[0.2em] text-content-faint">Academic OS</span>}
    </span>
  </Link>
);

const ExternalLink = ({ href, children }) => (
  <a href={href} className="inline-flex items-center gap-1.5 rounded-sm transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400">
    {children}
  </a>
);

export const Footer = () => {
  const { user, isAuthenticated } = useAuth();
  const isAdmin = user?.role === 'admin';

  if (!isAuthenticated) {
    return (
      <footer className="relative mt-16 overflow-hidden border-t border-white/10 bg-surface-inverse pb-6 pt-12 text-white sm:pt-16">
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-500/60 to-transparent" />
        <div className="mx-auto max-w-7xl px-5 sm:px-6">
          <div className="grid gap-10 pb-10 sm:grid-cols-2 sm:gap-12 lg:grid-cols-12 lg:gap-8">
            <div className="sm:col-span-2 lg:col-span-5">
              <Brand />
              <p className="mt-5 max-w-md text-sm leading-7 text-content-muted">
                A focused academic workspace for discovering course materials, organizing progress, and preparing for what comes next.
              </p>
              <div className="mt-5 flex flex-wrap items-center gap-4">
                <SocialLinks />
                <a href={`mailto:${CONTACT_EMAIL}`} className="inline-flex min-h-10 items-center gap-2 rounded-lg px-2 text-xs font-medium text-content-muted transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400">
                  <Mail aria-hidden="true" className="h-4 w-4" />
                  Contact the team
                </a>
              </div>
            </div>

            <div className="lg:col-span-2">
              <h2 className="mb-4 text-xs font-bold uppercase tracking-[0.16em] text-white">Explore</h2>
              <ul className="space-y-3 text-sm text-content-muted">
                <li><ExternalLink href="#home">Home</ExternalLink></li>
                <li><ExternalLink href="#features">Features</ExternalLink></li>
                <li><ExternalLink href="#workflow">How it works</ExternalLink></li>
                <li><ExternalLink href="#auth">Get started</ExternalLink></li>
              </ul>
            </div>

            <div className="lg:col-span-2">
              <h2 className="mb-4 text-xs font-bold uppercase tracking-[0.16em] text-white">Study workspace</h2>
              <ul className="space-y-3 text-sm text-content-muted">
                <li>Unit-wise resources</li>
                <li>Past question papers</li>
                <li>Progress tracking</li>
                <li>Study planning tools</li>
              </ul>
            </div>

            <div className="sm:col-span-2 lg:col-span-3">
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 sm:p-6">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-blue-300">Built for students</p>
                <p className="mt-2 text-base font-semibold text-white">Make your next study session count.</p>
                <p className="mt-2 text-sm leading-6 text-content-muted">Keep your syllabus, resources, and progress together in one calm workspace.</p>
                <a href="#auth" className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-xl bg-white px-4 text-xs font-bold text-gray-900 transition duration-200 hover:-translate-y-0.5 hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400">
                  Explore the platform <ArrowUpRight aria-hidden="true" className="h-4 w-4" />
                </a>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 border-t border-white/10 pt-5 text-xs text-content-muted sm:flex-row sm:items-center sm:justify-between">
            <p>© {CURRENT_YEAR} The AcadeMIa. All rights reserved.</p>
            <p>Designed for focused learning.</p>
          </div>
        </div>
      </footer>
    );
  }

  if (isAdmin) {
    return (
      <footer className="mt-auto border-t border-line bg-app py-6 sm:py-7">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 text-center sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:text-left">
          <div className="flex flex-col items-center gap-2 sm:flex-row sm:gap-4">
            <Link to="/admin" className="rounded-sm text-sm font-bold tracking-tight text-content transition-colors hover:text-blue-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">The AcadeMIa <span className="font-medium text-content-muted">Admin Console</span></Link>
            <span className="hidden h-4 w-px bg-line-strong sm:block" aria-hidden="true" />
            <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-content-faint">Management workspace</span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-content-muted sm:justify-end">
            <span>© {CURRENT_YEAR} The AcadeMIa</span>
            <a href={`mailto:${CONTACT_EMAIL}`} className="rounded-sm font-medium transition-colors hover:text-content focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">Report a problem</a>
          </div>
        </div>
      </footer>
    );
  }

  return (
    <footer className="mt-16 border-t border-white/10 bg-surface-inverse pb-6 pt-9 text-white sm:pt-10">
      <div className="mx-auto max-w-7xl px-5 sm:px-6">
        <div className="grid gap-8 sm:grid-cols-2 sm:items-center lg:grid-cols-3">
          <div>
            <Brand compact to="/dashboard" />
            <p className="mt-3 max-w-sm text-xs leading-6 text-content-muted">Your courses, resources, and study progress in one place.</p>
          </div>
          <nav aria-label="Footer navigation" className="grid grid-cols-2 gap-x-5 gap-y-2 text-xs font-semibold text-content-muted sm:justify-self-center">
            <Link to="/dashboard" className="rounded-sm py-1 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400">Dashboard</Link>
            <Link to="/subjects" className="rounded-sm py-1 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400">Subjects</Link>
            <Link to="/study-tools" className="rounded-sm py-1 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400">Study tools</Link>
            <Link to="/profile" className="rounded-sm py-1 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400">Profile</Link>
          </nav>
          <div className="flex items-center justify-between gap-4 lg:justify-self-end">
            <a href={`mailto:${CONTACT_EMAIL}`} className="inline-flex min-h-10 items-center gap-2 rounded-lg px-2 text-xs font-medium text-content-muted transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400">
              <Mail aria-hidden="true" className="h-4 w-4" /> Support
            </a>
            <SocialLinks />
          </div>
        </div>
        <div className="mt-7 flex flex-col gap-2 border-t border-white/10 pt-5 text-[10px] text-content-muted sm:flex-row sm:items-center sm:justify-between">
          <p>© {CURRENT_YEAR} The AcadeMIa. All rights reserved.</p>
          <p>Developed by <a href={DEVELOPER_URL} target="_blank" rel="noopener noreferrer" className="rounded-sm font-semibold text-content-faint underline decoration-white/20 underline-offset-4 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400">Mihran Sohail</a></p>
        </div>
      </div>
    </footer>
  );
};

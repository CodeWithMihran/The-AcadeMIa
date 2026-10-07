import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  BarChart3,
  Calculator,
  ChevronDown,
  Library,
  LogOut,
  Menu,
  Moon,
  PlusCircle,
  ShieldCheck,
  Sun,
  Trophy,
  UserCircle,
  Users,
  X,
} from 'lucide-react';
import { TRACKS } from '../constants';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { AcademiaLogo } from './AcademiaLogo';

const studentLinks = [
  { label: 'Dashboard', to: '/dashboard', icon: BarChart3 },
  { label: 'Subjects', to: '/subjects', icon: Library },
  { label: 'Study Tools', to: '/study-tools', icon: Calculator },
  { label: 'Profile', to: '/profile', icon: UserCircle },
];

const studentMoreLinks = [
  { label: 'Progress', to: '/progress', icon: BarChart3 },
  { label: 'Rankings', to: '/rankings', icon: Trophy, activeClass: 'text-amber-300' },
];

const adminLinks = [
  { label: 'Dashboard', to: '/admin', icon: ShieldCheck, activeClass: 'text-purple-300' },
  { label: 'Manage Users', to: '/admin/users', icon: Users, activeClass: 'text-purple-300' },
  { label: 'Campus', to: '/campus', icon: Users, activeClass: 'text-emerald-300' },
  { label: 'Add Subject', to: '/subjects/add', icon: PlusCircle, activeClass: 'text-blue-300' },
];

const publicLinks = [
  { label: 'Home', href: '#home' },
  { label: 'Features', href: '#features' },
  { label: 'Workflow', href: '#workflow' },
];

const ThemeButton = ({ theme, toggleTheme }) => (
  <button
    type="button"
    onClick={toggleTheme}
    aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
    title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
    className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-content-faint transition-all duration-200 hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 active:scale-95"
  >
    {theme === 'dark' ? <Sun aria-hidden="true" className="h-4 w-4" /> : <Moon aria-hidden="true" className="h-4 w-4" />}
    <span className="sr-only">{theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}</span>
  </button>
);

const isRouteActive = (pathname, path) => (
  path === '/dashboard' || path === '/admin'
    ? pathname === path
    : pathname === path || pathname.startsWith(`${path}/`)
);

export const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const [mobileMenuState, setMobileMenuState] = useState({ open: false, pathname: location.pathname });
  const mobileMenuOpen = mobileMenuState.open && mobileMenuState.pathname === location.pathname;

  const setMobileMenuOpen = (nextValue) => {
    setMobileMenuState((current) => ({
      open: typeof nextValue === 'function' ? nextValue(current.open && current.pathname === location.pathname) : nextValue,
      pathname: location.pathname,
    }));
  };

  const [moreMenuState, setMoreMenuState] = useState({ open: false, pathname: location.pathname });
  const moreMenuOpen = moreMenuState.open && moreMenuState.pathname === location.pathname;
  const moreMenuRef = useRef(null);
  const [isScrolled, setIsScrolled] = useState(false);

  const isAdmin = user?.role === 'admin';
  const links = isAdmin ? adminLinks : studentLinks;
  const mobileLinks = isAdmin ? adminLinks : [...studentLinks, ...studentMoreLinks];
  const canAccessCampus = user?.role === 'moderator' && user?.campusAmbassador?.active;
  const desktopMoreLinks = !isAdmin
    ? [...studentMoreLinks, ...(canAccessCampus ? [{ label: 'Campus Desk', to: '/campus', icon: Users, activeClass: 'text-emerald-300' }] : [])]
    : [];
  const brandPath = isAuthenticated ? (isAdmin ? '/admin' : '/dashboard') : '/';

  const closeMobileMenu = () => setMobileMenuOpen(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 12);
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (!mobileMenuOpen && !moreMenuOpen) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setMobileMenuState((current) => ({ ...current, open: false }));
        setMoreMenuState((current) => ({ ...current, open: false }));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileMenuOpen, moreMenuOpen]);

  useEffect(() => {
    if (!moreMenuOpen) return undefined;
    const handleOutsidePointer = (event) => {
      if (!moreMenuRef.current?.contains(event.target)) {
        setMoreMenuState((current) => ({ ...current, open: false }));
      }
    };
    document.addEventListener('pointerdown', handleOutsidePointer);
    return () => document.removeEventListener('pointerdown', handleOutsidePointer);
  }, [moreMenuOpen]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (!mobileMenuOpen) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [mobileMenuOpen]);

  const renderLink = (item, mobile = false) => {
    const Icon = item.icon;
    const active = isRouteActive(location.pathname, item.to);
    const activeColor = item.activeClass || 'text-blue-300';
    const baseClass = mobile
      ? 'flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium transition-all duration-200 hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 active:scale-[0.98]'
      : 'flex min-h-10 shrink-0 items-center gap-2 rounded-xl px-2.5 text-[11px] font-bold uppercase tracking-wide transition-all duration-200 hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 active:scale-95 xl:px-3 xl:text-xs';

    return (
      <Link
        key={item.to}
        to={item.to}
        onClick={mobile ? closeMobileMenu : undefined}
        aria-current={active ? 'page' : undefined}
        className={`${baseClass} ${active ? `${activeColor} bg-white/10` : 'text-content-faint'}`}
      >
        {Icon && <Icon aria-hidden="true" className={mobile ? 'h-4.5 w-4.5 opacity-80' : 'h-4 w-4 opacity-80'} />}
        <span>{mobile && item.label === 'Progress' ? 'Global Mastery' : mobile && item.label === 'Rankings' ? 'Campus Rankings' : mobile && item.label === 'Profile' ? 'My Profile' : item.label}</span>
      </Link>
    );
  };

  return (
    <nav
      aria-label="Main navigation"
      className={`fixed inset-x-0 top-0 z-50 border-b border-white/10 text-white transition-[background-color,backdrop-filter,box-shadow] duration-300 ${
        isScrolled || mobileMenuOpen ? 'bg-surface-inverse/95 shadow-xl shadow-black/20 backdrop-blur-xl' : 'bg-surface-inverse/80 backdrop-blur-lg'
      }`}
    >
      {/*
        FIX: Semi-transparent backdrop overlay for mobile.
        Rendered securely behind the header content using negative z-index inside the nav's stacking context
      */}
      <div
        className={`fixed inset-0 h-screen w-screen bg-black/60 backdrop-blur-sm transition-opacity duration-300 xl:hidden ${
          mobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        style={{ zIndex: -1 }}
        onClick={closeMobileMenu}
        aria-hidden="true"
      />

      {/* Main Header Bar */}
      <div className="mx-auto max-w-[1440px] px-4 sm:px-6">
        <div className="flex min-h-[72px] items-center gap-3 xl:min-h-[76px]">
          <Link
            to={brandPath}
            aria-label={isAdmin ? 'The AcadeMIa admin console home' : 'The AcadeMIa home'}
            className="group flex min-w-0 shrink-0 items-center gap-2 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 min-[375px]:gap-2.5 sm:gap-3"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/70 bg-gradient-to-br from-white to-slate-100 shadow-lg shadow-black/15 transition-transform duration-300 group-active:scale-95 min-[375px]:h-10 min-[375px]:w-10 sm:h-11 sm:w-11">
              <AcademiaLogo className="h-8 w-8 min-[375px]:h-9 min-[375px]:w-9 sm:h-10 sm:w-10" />
            </span>
            <span className="flex min-w-0 flex-col">
              <span className="whitespace-nowrap text-[15px] font-extrabold leading-none tracking-tight min-[375px]:text-[17px] sm:text-xl">
                The <span className="bg-gradient-to-r from-blue-400 via-indigo-200 to-white bg-clip-text text-transparent">AcadeMIa</span>
              </span>
              <span className="mt-1.5 text-[8px] font-bold uppercase tracking-[0.22em] text-content-faint sm:text-[9px]">
                {isAdmin ? 'Admin Console' : 'Academic OS'}
              </span>
            </span>
          </Link>

          {isAuthenticated && !isAdmin && (
            <div className="hidden 2xl:flex max-w-[190px] shrink-0 items-center gap-2 truncate rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-medium text-content-faint backdrop-blur-sm">
              <span aria-hidden="true" className="h-2 w-2 shrink-0 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
              <span className="truncate">
                {user.track === 'COMPETITIVE' || user.track === TRACKS.JEE || user.track === TRACKS.NEET
                  ? `${user.targetExam || user.track} Track`
                  : `${user.tenant?.shortCode || 'University'}${user.college && user.college !== 'Not Set' ? ` · ${user.college}` : ''}`}
              </span>
            </div>
          )}

          {isAuthenticated ? (
            <div className="hidden min-w-0 flex-1 items-center justify-center gap-1.5 xl:flex">
              {links.map((item) => renderLink(item))}
              {!isAdmin && desktopMoreLinks.length > 0 && (
                <div ref={moreMenuRef} className="relative shrink-0">
                  <button
                    type="button"
                    aria-expanded={moreMenuOpen}
                    aria-controls="student-more-navigation"
                    aria-label="More student pages"
                    onClick={() => setMoreMenuState({ open: !moreMenuOpen, pathname: location.pathname })}
                    className={`flex min-h-10 items-center gap-1.5 rounded-xl px-2.5 text-[11px] font-bold uppercase tracking-wide transition-all duration-200 hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 active:scale-95 xl:px-3 xl:text-xs ${
                      desktopMoreLinks.some((item) => isRouteActive(location.pathname, item.to)) ? 'bg-white/10 text-blue-300' : 'text-content-faint'
                    }`}
                  >
                    More <ChevronDown aria-hidden="true" className={`h-3.5 w-3.5 transition-transform duration-300 ease-out ${moreMenuOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {moreMenuOpen && (
                    <div
                      id="student-more-navigation"
                      className="nav-dropdown-enter absolute right-0 top-full z-[70] mt-2 w-64 rounded-2xl border border-white/10 bg-surface-inverse/95 p-2 backdrop-blur-xl shadow-2xl shadow-black/40"
                    >
                      {desktopMoreLinks.map((item) => {
                        const Icon = item.icon;
                        const active = isRouteActive(location.pathname, item.to);
                        return (
                          <Link
                            key={item.to}
                            to={item.to}
                            onClick={() => setMoreMenuState({ open: false, pathname: location.pathname })}
                            aria-current={active ? 'page' : undefined}
                            className={`flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium transition-all duration-200 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 active:scale-[0.98] ${
                              active ? `bg-white/5 ${item.activeClass || 'text-blue-300'}` : 'text-content-faint hover:text-white'
                            }`}
                          >
                            <Icon aria-hidden="true" className="h-4.5 w-4.5 opacity-80" />{item.label}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="hidden min-w-0 flex-1 items-center justify-center gap-1.5 xl:flex">
              {publicLinks.map((item) => (
                <a key={item.href} href={item.href} className="rounded-xl px-3 py-2.5 text-xs font-semibold text-content-faint transition-all duration-200 hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 active:scale-95">
                  {item.label}
                </a>
              ))}
              <a href="#auth" className="ml-3 rounded-xl px-3 py-2.5 text-xs font-semibold text-content-faint transition-all duration-200 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 active:scale-95">Log in</a>
              <a href="#auth" className="theme-always-light ml-1 inline-flex min-h-10 items-center rounded-xl px-4 text-[11px] font-bold uppercase tracking-wider shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 active:scale-[0.98]">Get Started</a>
            </div>
          )}

          {isAuthenticated && (
            <div className="hidden shrink-0 items-center gap-2 border-l border-white/10 pl-2 xl:flex 2xl:pl-3">
              <div className="hidden max-w-[130px] text-right 2xl:block">
                <p className="truncate text-xs font-bold leading-tight text-white">{user?.name}</p>
                <p className="truncate text-[10px] font-medium capitalize text-content-faint">{user?.branch !== 'Not Set' ? user?.branch : user?.role}</p>
              </div>
              <button
                type="button"
                onClick={logout}
                aria-label="Sign out"
                title="Sign out"
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-red-300 transition-all duration-200 hover:border-red-500/50 hover:bg-red-500/20 hover:text-red-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 active:scale-95"
              >
                <LogOut aria-hidden="true" className="h-4.5 w-4.5 opacity-90" />
              </button>
            </div>
          )}

          <div className="ml-auto flex shrink-0 items-center gap-1 min-[375px]:gap-2 xl:ml-0">
            <ThemeButton theme={theme} toggleTheme={toggleTheme} />
            <button
              type="button"
              onClick={() => setMobileMenuOpen((open) => !open)}
              aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-navigation"
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white transition-all duration-200 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 active:scale-95 xl:hidden"
            >
              {mobileMenuOpen ? <X aria-hidden="true" className="h-5 w-5" /> : <Menu aria-hidden="true" className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      <div
        id="mobile-navigation"
        aria-hidden={!mobileMenuOpen}
        className={`absolute inset-x-0 top-full z-[60] overflow-hidden border-b border-white/10 bg-surface-inverse/95 backdrop-blur-xl shadow-2xl transition-all duration-300 ease-out motion-reduce:transition-none xl:hidden ${
          mobileMenuOpen ? 'visible max-h-[85vh] opacity-100' : 'invisible max-h-0 opacity-0'
        }`}
      >
        <div className="mx-auto max-w-[1440px] max-h-[80vh] overflow-y-auto space-y-4 px-4 py-4 sm:px-6 sm:py-5">
          {isAuthenticated ? (
            <>
              {/* Profile Card Summary for Mobile */}
              <div className="flex flex-col rounded-2xl border border-white/10 bg-white/[0.03] p-4 shadow-sm backdrop-blur-md">
                <p className="truncate text-[15px] font-bold text-white">{user?.name}</p>
                <p className="truncate text-xs font-medium text-content-faint">{user?.email}</p>
                {!isAdmin && (
                  <div className="mt-2.5 inline-flex w-fit items-center gap-1.5 rounded-lg bg-blue-500/10 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-blue-300">
                    <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-blue-400" />
                    {user?.track === 'COMPETITIVE' || user?.track === TRACKS.JEE || user?.track === TRACKS.NEET
                      ? `${user?.targetExam || user.track} Track`
                      : `${user?.tenant?.shortCode || 'University'}${user?.college && user.college !== 'Not Set' ? ` · ${user.college}` : ''}`}
                  </div>
                )}
              </div>

              <div className="grid gap-1.5 sm:grid-cols-2">
                {mobileLinks.map((item) => renderLink(item, true))}
                {!isAdmin && canAccessCampus && renderLink({ label: 'Campus Review Desk', to: '/campus', icon: Users, activeClass: 'text-emerald-300' }, true)}
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => { logout(); closeMobileMenu(); }}
                  className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-3 text-sm font-bold text-red-300 transition-colors hover:bg-red-500/20 hover:text-red-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 active:scale-[0.98]"
                >
                  <LogOut aria-hidden="true" className="h-4.5 w-4.5" />
                  Sign out securely
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="grid gap-1 sm:grid-cols-3">
                {publicLinks.map((item) => (
                  <a key={item.href} href={item.href} onClick={closeMobileMenu} className="flex min-h-12 items-center rounded-xl px-4 text-sm font-medium text-content-faint transition-all hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 active:scale-[0.98]">
                    {item.label}
                  </a>
                ))}
              </div>
              <div className="pt-2">
                <a href="#auth" onClick={closeMobileMenu} className="theme-always-light flex min-h-12 w-full items-center justify-center rounded-xl px-4 text-sm font-bold shadow-md transition-all hover:-translate-y-0.5 active:scale-[0.98]">
                  Sign in or get started
                </a>
              </div>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

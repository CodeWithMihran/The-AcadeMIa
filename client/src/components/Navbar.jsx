import { TRACKS } from "../constants";
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  BookOpen, 
  BarChart3, 
  LogOut, 
  ShieldCheck, 
  Menu, 
  X, 
  Library,
  UserCircle,
  Users,
  PlusCircle,
  Calculator,
  Trophy
} from 'lucide-react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  
  const location = useLocation();

  const isAdmin = user?.role === 'admin';
  const isActive = (path) => location.pathname === path;

  // Add a premium shadow when scrolling down
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`fixed w-full top-0 z-50 transition-all duration-300 backdrop-blur-md border-b border-white/10 text-white ${isScrolled ? 'bg-[#0a0a0a]/98 shadow-2xl py-0' : 'bg-[#0a0a0a]/90 py-1'}`}>
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-20">
          
          {/* Logo & Brand */}
          <Link to={isAuthenticated ? (isAdmin ? "/admin" : "/dashboard") : "/"} className="flex items-center gap-3.5 group">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform">
              <BookOpen className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-black tracking-tight uppercase italic leading-none">
                The <span className="bg-gradient-to-r from-blue-400 via-indigo-200 to-white bg-clip-text text-transparent">AcadeMIa</span>
              </span>
              <span className="text-[9px] font-bold text-gray-400 uppercase tracking-[0.25em] mt-1">
                {isAdmin ? <span className="text-blue-500">Admin Console</span> : "Academic OS"}
              </span>
            </div>
          </Link>

          {/* Institution / Track Pill (Only for Students) */}
          {user && !isAdmin && (
            <div className="hidden lg:flex items-center gap-2 bg-white/5 border border-white/10 px-3.5 py-1.5 rounded-full text-xs font-medium text-gray-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              {user.track === 'COMPETITIVE' || user.track === TRACKS.JEE || user.track === TRACKS.NEET ? (
                <span className="font-semibold text-amber-300">
                  {user.targetExam || user.track} Track
                </span>
              ) : (
                <span>
                  <strong className="text-white">{user.tenant?.shortCode || "University"}</strong>
                  {user.college && user.college !== "Not Set" && ` • ${user.college}`}
                </span>
              )}
            </div>
          )}

          {/* Desktop Navigation */}
          {isAuthenticated ? (
            <div className="hidden md:flex items-center gap-8 text-xs font-bold uppercase tracking-wider text-gray-400">
              
              {/* STUDENT LINKS */}
              {!isAdmin && (
                <>
                  <Link to="/dashboard" className={`transition-colors hover:text-white ${isActive('/dashboard') ? 'text-white' : ''}`}>
                    Dashboard
                  </Link>
                  <Link to="/subjects" className={`flex items-center gap-1.5 transition-colors hover:text-white ${isActive('/subjects') ? 'text-blue-400' : ''}`}>
                    <Library className="w-3.5 h-3.5" /> Subjects
                  </Link>
                  <Link to="/progress" className={`flex items-center gap-1.5 transition-colors hover:text-white ${isActive('/progress') ? 'text-blue-400' : ''}`}>
                    <BarChart3 className="w-3.5 h-3.5" /> Progress
                  </Link>
                  <Link to="/rankings" className={`flex items-center gap-1.5 transition-colors hover:text-white ${isActive('/rankings') ? 'text-amber-300' : ''}`}>
                    <Trophy className="w-3.5 h-3.5" /> Rankings
                  </Link>
                  <Link to="/study-tools" className={`flex items-center gap-1.5 transition-colors hover:text-white ${isActive('/study-tools') ? 'text-blue-400' : ''}`}>
                    <Calculator className="w-3.5 h-3.5" /> Study Tools
                  </Link>
                  {(user?.role === 'moderator' && user?.campusAmbassador?.active) && <Link to="/campus" className={`flex items-center gap-1.5 transition-colors hover:text-white ${isActive('/campus') ? 'text-emerald-400' : ''}`}><Users className="w-3.5 h-3.5"/>Campus Desk</Link>}
                  <Link to="/profile" className={`flex items-center gap-1.5 transition-colors hover:text-white ${isActive('/profile') ? 'text-blue-400' : ''}`}>
                    <UserCircle className="w-4 h-4" /> Profile
                  </Link>
                </>
              )}

              {/* ADMIN LINKS */}
              {isAdmin && (
                <>
                  <Link to="/admin" className={`flex items-center gap-1.5 transition-colors hover:text-white ${isActive('/admin') ? 'text-purple-400 font-black' : ''}`}>
                    <ShieldCheck className="w-3.5 h-3.5" /> Dashboard
                  </Link>
                  <Link to="/admin/users" className={`flex items-center gap-1.5 transition-colors hover:text-white ${isActive('/admin/users') ? 'text-purple-400 font-black' : ''}`}>
                    <Users className="w-3.5 h-3.5" /> Manage Users
                  </Link>
                  <Link to="/campus" className={`flex items-center gap-1.5 transition-colors hover:text-white ${isActive('/campus') ? 'text-emerald-400' : ''}`}><Users className="w-3.5 h-3.5"/>Campus</Link>
                  <Link to="/subjects/add" className="flex items-center gap-1.5 bg-white/10 text-white px-4 py-2 rounded-lg hover:bg-white/20 transition-colors">
                    <PlusCircle className="w-3.5 h-3.5" /> Add Subject
                  </Link>
                </>
              )}

              <div className="h-5 w-[1px] bg-white/15"></div>

              {/* User Dropdown / Logout */}
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-xs font-bold text-white leading-tight">{user?.name}</p>
                  <p className="text-[10px] text-gray-400 font-medium">{user?.branch !== 'Not Set' ? user?.branch : user?.role}</p>
                </div>

                <button 
                  onClick={logout}
                  title="Sign Out"
                  className="p-2 rounded-xl bg-white/5 border border-white/10 text-red-400 hover:bg-red-500 hover:text-white hover:border-red-500 transition-all duration-200"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            /* UNAUTHENTICATED PUBLIC LINKS */
            <div className="hidden md:flex items-center gap-8">
              <div className="flex gap-8 text-[13px] font-semibold uppercase tracking-widest text-gray-400">
                <a href="#home" className="hover:text-white transition-colors">Home</a>
                <a href="#features" className="hover:text-white transition-colors">Features</a>
                <a href="#workflow" className="hover:text-white transition-colors">Workflow</a>
              </div>
              <div className="flex items-center gap-4 ml-2">
                <a href="#auth" className="text-[13px] font-medium text-white/70 hover:text-white transition-colors">Log in</a>
                <a href="#auth" className="theme-always-light bg-white text-black px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-gray-100 transition-all shadow-md active:scale-95">
                  Get Started
                </a>
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            className="ml-auto mr-2 inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 text-gray-200 transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 md:ml-0 md:mr-0"
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            <span className="hidden text-[10px] font-bold uppercase tracking-wider lg:inline">{theme === 'dark' ? 'Light' : 'Dark'}</span>
          </button>

          {/* Mobile Menu Toggle */}
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>

        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#0d0d0d] border-t border-white/10 px-6 py-6 space-y-4 shadow-2xl">
          {isAuthenticated ? (
            <>
              <div className="pb-3 border-b border-white/10">
                <p className="font-bold text-sm text-white">{user?.name}</p>
                <p className="text-xs text-gray-400">{user?.email}</p>
                {!isAdmin && (
                  <p className="text-[10px] font-bold text-blue-400 uppercase mt-1">
                    {user?.tenant?.shortCode || "University"} • {user?.college}
                  </p>
                )}
              </div>
              
              {!isAdmin ? (
                <>
                  <Link to="/dashboard" onClick={() => setMobileMenuOpen(false)} className="block text-sm font-semibold text-gray-300 hover:text-white">Dashboard</Link>
                  <Link to="/subjects" onClick={() => setMobileMenuOpen(false)} className="block text-sm font-semibold text-gray-300 hover:text-white">Subjects Catalog</Link>
                  <Link to="/progress" onClick={() => setMobileMenuOpen(false)} className="block text-sm font-semibold text-gray-300 hover:text-white">Global Mastery</Link>
                  <Link to="/rankings" onClick={() => setMobileMenuOpen(false)} className="block text-sm font-semibold text-amber-300 hover:text-amber-200">Campus Rankings</Link>
                  <Link to="/study-tools" onClick={() => setMobileMenuOpen(false)} className="block text-sm font-semibold text-gray-300 hover:text-white">Study Tools</Link>
                  {user?.role === 'moderator' && user?.campusAmbassador?.active && <Link to="/campus" onClick={() => setMobileMenuOpen(false)} className="block text-sm font-semibold text-emerald-400 hover:text-emerald-300">Campus Review Desk</Link>}
                  <Link to="/profile" onClick={() => setMobileMenuOpen(false)} className="block text-sm font-semibold text-gray-300 hover:text-white">My Profile</Link>
                </>
              ) : (
                <>
                  <Link to="/admin" onClick={() => setMobileMenuOpen(false)} className="block text-sm font-semibold text-purple-400 hover:text-purple-300">Admin Dashboard</Link>
                  <Link to="/admin/users" onClick={() => setMobileMenuOpen(false)} className="block text-sm font-semibold text-gray-300 hover:text-white">Manage Users</Link>
                  <Link to="/campus" onClick={() => setMobileMenuOpen(false)} className="block text-sm font-semibold text-emerald-400 hover:text-emerald-300">Campus Marketplace</Link>
                  <Link to="/subjects/add" onClick={() => setMobileMenuOpen(false)} className="block text-sm font-semibold text-gray-300 hover:text-white">+ Add Subject</Link>
                </>
              )}

              <button 
                onClick={() => { logout(); setMobileMenuOpen(false); }}
                className="w-full text-left text-sm font-semibold text-red-400 pt-2 border-t border-white/10"
              >
                Log Out
              </button>
            </>
          ) : (
            <div className="flex flex-col gap-4 text-center">
              <a href="#features" onClick={() => setMobileMenuOpen(false)} className="text-sm font-medium text-gray-400">Features</a>
              <a href="#workflow" onClick={() => setMobileMenuOpen(false)} className="text-sm font-medium text-gray-400">Workflow</a>
              <div className="h-[1px] bg-white/10 w-full"></div>
              <a href="#auth" onClick={() => setMobileMenuOpen(false)} className="bg-white text-black py-3 rounded-xl font-bold text-sm">
                Sign In
              </a>
            </div>
          )}
        </div>
      )}
    </nav>
  );
};

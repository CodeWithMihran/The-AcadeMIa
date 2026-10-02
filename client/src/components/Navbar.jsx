import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  BookOpen, 
  BarChart3, 
  User, 
  LogOut, 
  ShieldCheck, 
  Menu, 
  X, 
  Layers,
  Sparkles
} from 'lucide-react';

export const Navbar = () => {
  const { user, logout, isAuthenticated, isAdmin } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="fixed w-full top-0 z-50 bg-[#0a0a0a]/95 backdrop-blur-md border-b border-white/10 text-white">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-20">
          
          {/* Logo & Brand */}
          <Link to={isAuthenticated ? "/dashboard" : "/"} className="flex items-center gap-3.5 group">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform">
              <BookOpen className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-black tracking-tight uppercase italic leading-none">
                The <span className="bg-gradient-to-r from-blue-400 via-indigo-200 to-white bg-clip-text text-transparent">AcadeMIa</span>
              </span>
              <span className="text-[9px] font-bold text-gray-400 uppercase tracking-[0.25em] mt-1">
                Academic OS
              </span>
            </div>
          </Link>

          {/* Institution / Track Pill */}
          {user && (
            <div className="hidden lg:flex items-center gap-2 bg-white/5 border border-white/10 px-3.5 py-1.5 rounded-full text-xs font-medium text-gray-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              {user.track === 'COMPETITIVE' || user.track === 'JEE' || user.track === 'NEET' ? (
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
              <Link 
                to="/dashboard" 
                className={`transition-colors hover:text-white ${isActive('/dashboard') ? 'text-white' : ''}`}
              >
                Dashboard
              </Link>
              
              <Link 
                to="/progress" 
                className={`flex items-center gap-1.5 transition-colors hover:text-white ${isActive('/progress') ? 'text-blue-400' : ''}`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                Global Mastery
              </Link>

              {isAdmin && (
                <Link 
                  to="/admin" 
                  className={`flex items-center gap-1.5 text-purple-400 hover:text-purple-300 transition-colors ${isActive('/admin') ? 'font-black' : ''}`}
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Admin Console
                </Link>
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
            <div className="hidden md:flex items-center gap-4">
              <a 
                href="#auth" 
                className="bg-white text-black px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-gray-100 transition-all shadow-md active:scale-95"
              >
                Sign In
              </a>
            </div>
          )}

          {/* Mobile Menu Toggle */}
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-white hover:bg-white/10 rounded-lg"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>

        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#0d0d0d] border-t border-white/10 px-6 py-6 space-y-4 animate-in fade-in duration-200">
          {isAuthenticated ? (
            <>
              <div className="pb-3 border-b border-white/10">
                <p className="font-bold text-sm text-white">{user?.name}</p>
                <p className="text-xs text-gray-400">{user?.email}</p>
                <p className="text-[10px] font-bold text-blue-400 uppercase mt-1">
                  {user?.tenant?.shortCode || "University"} • {user?.college}
                </p>
              </div>
              <Link 
                to="/dashboard" 
                onClick={() => setMobileMenuOpen(false)}
                className="block text-sm font-semibold text-gray-300 hover:text-white"
              >
                Dashboard
              </Link>
              <Link 
                to="/progress" 
                onClick={() => setMobileMenuOpen(false)}
                className="block text-sm font-semibold text-gray-300 hover:text-white"
              >
                Global Mastery
              </Link>
              {isAdmin && (
                <Link 
                  to="/admin" 
                  onClick={() => setMobileMenuOpen(false)}
                  className="block text-sm font-semibold text-purple-400 hover:text-purple-300"
                >
                  Admin Console
                </Link>
              )}
              <button 
                onClick={logout}
                className="w-full text-left text-sm font-semibold text-red-400 pt-2 border-t border-white/10"
              >
                Log Out
              </button>
            </>
          ) : (
            <a 
              href="#auth" 
              onClick={() => setMobileMenuOpen(false)}
              className="block text-center bg-white text-black py-3 rounded-xl font-bold text-sm"
            >
              Sign In
            </a>
          )}
        </div>
      )}
    </nav>
  );
};

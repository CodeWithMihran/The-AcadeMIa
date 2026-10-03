import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Code2, BriefcaseBusiness } from 'lucide-react';

export const Footer = () => {
  const { user, isAuthenticated } = useAuth();
  
  const isAdmin = user?.role === 'admin';
  const currentYear = new Date().getFullYear();
  const currentDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

  // --------------------------------------------------------
  // SUB-COMPONENTS FOR DIFFERENT STATES
  // --------------------------------------------------------

  // 1. PUBLIC HOME FOOTER (Massive, informative, dark)
  if (!isAuthenticated) {
    return (
      <footer className="bg-[#0a0a0a] text-white pt-20 pb-10 border-t border-white/10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-12 gap-12 lg:gap-16">
            
            <div className="md:col-span-5 lg:col-span-4">
              <div className="flex items-center gap-4 mb-6 group">
                <img src="/images/logo1.png" alt="RIT" className="h-10 w-auto" />
                <div className="flex items-baseline">
                  <span className="text-xl font-black text-white tracking-tighter uppercase italic">RIT</span>
                  <span className="text-xl font-extralight tracking-tight ml-1.5 text-gray-400">Acade<span className="font-bold text-white">MI</span>a</span>
                </div>
              </div>
              <p className="text-gray-500 text-sm leading-relaxed mb-6 max-w-sm">
                A centralized academic ecosystem for RIT students. We transform scattered resources into a structured learning path, helping you master your syllabus one unit at a time.
              </p>
              <div className="flex gap-4">
                <a href="https://github.com/CodeWithMihran" target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white hover:text-black transition-all duration-300">
                  <Code2 className="w-5 h-5" />
                </a>
                <a href="https://www.linkedin.com/in/md-mihran-sohail-321b12384/" target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-[#0077b5] hover:text-white transition-all duration-300">
                  <BriefcaseBusiness className="w-5 h-5" />
                </a>
              </div>
            </div>

            <div className="md:col-span-2 lg:col-span-2">
              <h3 className="text-white font-bold text-sm uppercase tracking-widest mb-6">Platform</h3>
              <ul className="space-y-4 text-gray-500 text-sm">
                <li><a href="#home" className="hover:text-white transition-colors duration-200">Home</a></li>
                <li><a href="#features" className="hover:text-white transition-colors duration-200">Features</a></li>
                <li><a href="#workflow" className="hover:text-white transition-colors duration-200">Workflow</a></li>
                <li><a href="#auth" className="text-white/80 hover:text-white font-medium underline underline-offset-8 decoration-blue-500">Get Started</a></li>
              </ul>
            </div>

            <div className="md:col-span-2 lg:col-span-3">
              <h3 className="text-white font-bold text-sm uppercase tracking-widest mb-6">Academic</h3>
              <ul className="space-y-4 text-gray-500 text-sm">
                <li className="flex items-center gap-2"><span className="w-1 h-1 rounded-full bg-blue-500"></span><span>Unit-wise Notes</span></li>
                <li className="flex items-center gap-2"><span className="w-1 h-1 rounded-full bg-blue-500"></span><span>Video Repository</span></li>
                <li className="flex items-center gap-2"><span className="w-1 h-1 rounded-full bg-blue-500"></span><span>PYQ Database</span></li>
                <li className="flex items-center gap-2"><span className="w-1 h-1 rounded-full bg-blue-500"></span><span>Syllabus Tracker</span></li>
              </ul>
            </div>

            <div className="md:col-span-3 lg:col-span-3">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <h3 className="text-white font-bold text-sm uppercase tracking-widest mb-4">Developed By</h3>
                <p className="text-white font-semibold text-base mb-1">Md Mihran Sohail</p>
                <p className="text-gray-500 text-xs mb-4">Roorkee Institute of Technology</p>
                <a href="mailto:sohail.mihran@gmail.com" className="text-blue-400 text-xs font-medium hover:text-blue-300 transition-colors break-all">
                  sohail.mihran@gmail.com
                </a>
              </div>
            </div>
          </div>

          <div className="border-t border-white/10 mt-16 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-600 text-[13px]">
              &copy; {currentYear} <span className="text-gray-400 font-medium">RIT AcadeMIA</span>. All rights reserved.
            </p>
            <div className="flex gap-6 text-gray-600 text-[13px]">
              <span className="hover:text-gray-400 cursor-default">Student-Led Initiative</span>
              <span className="hover:text-gray-400 cursor-default">Privacy Policy</span>
            </div>
          </div>
        </div>
      </footer>
    );
  }

  // 2. ADMIN FOOTER (Minimalist, light theme)
  if (isAdmin) {
    return (
      <footer className="bg-[#fbfbfa] border-t border-gray-100 py-10 mt-auto">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            
            <div className="flex items-center gap-4">
              <div className="flex items-baseline gap-1">
                <span className="text-sm font-black text-[#1a1a1a] tracking-tighter italic">RIT AcadeMIa</span>
                <span className="text-sm font-light tracking-tight text-gray-400 uppercase">Console</span>
              </div>
              <div className="h-4 w-[1px] bg-gray-200"></div>
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-500"></span>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">v2.0.1 Stable</span>
              </div>
            </div>

            <div className="text-center">
              <p className="text-[10px] font-bold text-gray-300 uppercase tracking-[0.3em]">
                Infrastructure by <a href="https://github.com/CodeWithMihran" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-black transition-colors">Md Mihran Sohail</a>
              </p>
            </div>

            <div className="flex items-center gap-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">
              <span>{currentDate}</span>
              <a href="mailto:sohail.mihran@gmail.com" className="bg-gray-100 px-3 py-1 rounded-md hover:bg-black hover:text-white transition-all">Report Bug</a>
            </div>
          </div>
        </div>
      </footer>
    );
  }

  // 3. STUDENT FOOTER (Compact, dark theme)
  return (
    <footer className="bg-[#0a0a0a] text-white pt-12 pb-8 border-t border-white/10 mt-auto">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-8">
          
          <div className="flex items-center gap-3 group opacity-80 hover:opacity-100 transition-opacity">
            <img src="/images/logo1.png" alt="RIT" className="h-8 w-auto" />
            <div className="flex items-baseline">
              <span className="text-lg font-black text-white tracking-tighter uppercase italic">RIT</span>
              <span className="text-lg font-extralight tracking-tight ml-1 text-gray-400">Acade<span className="font-bold text-white">MI</span>a</span>
            </div>
          </div>

          <div className="flex gap-6 text-[11px] font-black uppercase tracking-widest text-gray-500">
            <Link to="/dashboard" className="hover:text-white transition-colors">Dashboard</Link>
            <Link to="/profile" className="hover:text-white transition-colors">Settings</Link>
            <a href="mailto:sohail.mihran@gmail.com" className="hover:text-white transition-colors">Support</a>
          </div>

          <div className="text-right">
            <p className="text-[10px] text-gray-600 font-bold uppercase tracking-[0.2em]">
              Developed by <a href="https://github.com/CodeWithMihran" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-all underline underline-offset-4 decoration-gray-800">Mihran Sohail</a>
            </p>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-[10px] text-gray-600 font-medium">
            &copy; {currentYear} RIT AcadeMIA. All rights reserved.
          </p>
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]"></span>
            <span className="text-[10px] text-gray-600 font-bold uppercase tracking-tighter">Academic Portal v2.0</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

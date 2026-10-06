import { TRACKS } from "../constants";
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { subjectService } from '../services/api';
import { 
  Database, 
  Cloud, 
  ShieldCheck, 
  FolderOpen,
  ArrowRight,
  BookOpen,
  PlayCircle,
  FileText
} from 'lucide-react';

export const SubjectCatalog = () => {
  const { user } = useAuth();
  
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchCatalog = async () => {
      try {
        const res = await subjectService.getSubjects();
        if (res.data.success) {
          setSubjects(res.data.subjects);
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load curriculum vault.');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchCatalog();
    }
  }, [user]);

  // Array of icons to cycle through for subject cards
  const courseIcons = ['📓', '⚙️', '💻', '📐', '🔬'];

  if (!user) return null;

  const isUniversity = user.track === TRACKS.UNIVERSITY;

  return (
    <div className="min-h-screen bg-app pt-32 pb-20 px-6 animate-in fade-in duration-500">
      <div className="max-w-7xl mx-auto">
        
        {/* Header Section */}
        <div className="mb-16 flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
          <div>
            <h1 className="text-5xl font-black tracking-tighter text-content mb-4 italic">
              The <span className="text-content-faint font-light not-italic">Curriculum</span> Vault
            </h1>
            
            <div className="flex flex-wrap items-center gap-4">
              <span className="bg-surface-subtle px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest text-content-muted">
                {isUniversity ? user.branch : user.targetExam}
              </span>
              <span className="h-1 w-1 bg-line-strong rounded-full"></span>
              <span className="text-xs font-bold text-content-faint">
                {isUniversity ? `Semester ${user.semester}` : `Target ${user.targetYear}`}
              </span>
              {!isUniversity && (
                <>
                  <span className="h-1 w-1 bg-line-strong rounded-full"></span>
                  <span className="text-xs font-bold text-emerald-500">Competitive Track</span>
                </>
              )}
            </div>
          </div>
          
          <div className="bg-surface-inverse text-white px-8 py-4 rounded-3xl shadow-2xl shadow-gray-200 border border-white/10">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-content-faint mb-1 flex items-center gap-1.5">
              <ShieldCheck className="w-3 h-3" /> Authenticated Access
            </p>
            <p className="text-xl font-black tracking-tighter">
              {loading ? '...' : subjects.length} Active Modules
            </p>
          </div>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
          <div className="bg-surface/60 backdrop-blur-md border border-line p-8 rounded-[2rem] shadow-sm">
            <p className="text-[9px] font-black text-content-faint uppercase tracking-widest mb-1 flex items-center gap-1.5">
              <Database className="w-3 h-3" /> Study Load
            </p>
            <p className="text-2xl font-black italic tracking-tighter text-content">Full Capacity</p>
          </div>
          
          <div className="bg-blue-50/50 backdrop-blur-md border border-blue-100/50 p-8 rounded-[2rem] shadow-sm">
            <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest mb-1 flex items-center gap-1.5">
              <Cloud className="w-3 h-3" /> Resources
            </p>
            <p className="text-2xl font-black italic tracking-tighter text-blue-600">Cloud Synced</p>
          </div>

          <div className="bg-surface-inverse border border-white/10 p-8 rounded-[2rem] relative overflow-hidden shadow-xl">
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/20 blur-3xl rounded-full"></div>
            <p className="text-[9px] font-black text-content-muted uppercase tracking-widest mb-1 relative z-10">System Status</p>
            <div className="flex items-center gap-3 relative z-10">
              <span className="h-2 w-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_12px_rgba(16,185,129,0.8)]"></span>
              <p className="text-xl font-bold italic tracking-tight text-white">Vault Secured</p>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-4 mb-10">
          <h2 className="text-xs font-black tracking-[0.4em] text-content-faint uppercase">Available Courses</h2>
          <div className="h-[1px] flex-grow bg-surface-hover"></div>
        </div>

        {/* Content Area */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-surface rounded-[2.5rem] border border-line h-96 animate-pulse p-10 flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="w-14 h-14 bg-surface-subtle rounded-2xl"></div>
                  <div className="w-3/4 h-8 bg-surface-subtle rounded-lg"></div>
                  <div className="w-full h-4 bg-surface-subtle rounded-md"></div>
                  <div className="w-5/6 h-4 bg-surface-subtle rounded-md"></div>
                </div>
                <div className="w-full h-12 bg-surface-subtle rounded-2xl"></div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-100 p-12 rounded-[3rem] text-center">
            <p className="text-red-500 font-bold text-sm">⚠️ {error}</p>
          </div>
        ) : subjects.length === 0 ? (
          <div className="bg-surface border-2 border-dashed border-line p-24 rounded-[3rem] text-center flex flex-col items-center justify-center">
            <FolderOpen className="w-12 h-12 text-content-faint mb-4" />
            <p className="text-content-faint font-bold text-lg mb-2">No curriculum data found.</p>
            <p className="text-content-faint text-xs">Update your profile settings to load the correct subjects.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
            {subjects.map((subject, index) => (
              <div 
                key={subject._id}
                className="bg-surface border border-line rounded-[2.5rem] p-10 flex flex-col justify-between group hover:border-line-strong hover:-translate-y-2 hover:shadow-2xl hover:shadow-gray-200/50 transition-all duration-400"
              >
                <div>
                  <div className="flex justify-between items-start mb-10">
                    <div className="h-14 w-14 bg-surface-muted rounded-2xl flex items-center justify-center text-3xl shadow-sm border border-line group-hover:scale-110 transition-transform duration-300">
                      {courseIcons[index % courseIcons.length]}
                    </div>
                    <span className="text-[10px] font-black text-content-faint border border-line px-3 py-1.5 rounded-xl uppercase tracking-tighter bg-surface-muted">
                      {subject.courseCode || `Course 0${index + 1}`}
                    </span>
                  </div>

                  <h2 className="text-2xl font-black text-content mb-4 leading-tight tracking-tighter group-hover:text-blue-600 transition-colors">
                    {subject.name}
                  </h2>
                  
                  <p className="text-sm text-content-muted font-medium mb-8 line-clamp-2 italic">
                    Organized resources including unit-wise notes, textbooks, and previous year papers for {isUniversity ? subject.branch : subject.examCategory}.
                  </p>

                  <div className="flex gap-4 mb-10">
                    <div className="flex flex-col">
                      <span className="text-[9px] font-black text-content-faint uppercase tracking-widest">Syllabus</span>
                      <span className="text-sm font-bold text-content-strong">{subject.units?.length || 0} Units</span>
                    </div>
                    <div className="w-[1px] h-8 bg-surface-subtle self-center"></div>
                    <div className="flex flex-col">
                      <span className="text-[9px] font-black text-content-faint uppercase tracking-widest">Type</span>
                      <span className="text-[10px] font-bold text-blue-500 uppercase italic mt-0.5">Core Subject</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <Link 
                    to={`/subjects/${subject._id}`}
                    className="flex items-center justify-center gap-2 w-full bg-surface-inverse text-white py-4 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-blue-600 transition-all shadow-xl shadow-gray-200/50 active:scale-95"
                  >
                    Enter Subject Vault <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                  <Link 
                    to={`/progress/${subject._id}`}
                    className="flex items-center justify-center gap-2 w-full bg-surface border border-line text-content-muted py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-surface-muted hover:text-content transition-all"
                  >
                    Progress Tracker
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer Info Section */}
        <div className="mt-32 grid md:grid-cols-2 gap-12 items-center mb-10">
          <div className="bg-surface-subtle/50 rounded-[3rem] p-12 border border-line/50">
            <h3 className="text-xs font-black tracking-[0.4em] text-blue-500 uppercase mb-4">Pro Tip</h3>
            <p className="text-2xl font-black italic tracking-tighter mb-6 leading-tight text-content">
              Mastery comes from repetition and solving PYQs.
            </p>
            <p className="text-content-muted text-sm leading-relaxed mb-8">
              Don't just read the notes. Watch the curated video lectures and immediately try to solve at least 2 questions from the Previous Year section of that unit.
            </p>
            <div className="flex gap-2">
              <span className="w-8 h-1.5 bg-surface-inverse rounded-full"></span>
              <span className="w-2 h-1.5 bg-line-strong rounded-full"></span>
              <span className="w-2 h-1.5 bg-line-strong rounded-full"></span>
            </div>
          </div>
          
          <div className="p-8">
            <h3 className="text-xs font-black tracking-[0.4em] text-content-faint uppercase mb-8">Resources Overview</h3>
            <ul className="space-y-8">
              <li className="flex items-start gap-4">
                <div className="bg-blue-50 p-3 rounded-xl text-blue-500">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-widest text-content-strong">Handwritten Notes</p>
                  <p className="text-[11px] text-content-muted italic mt-1">Curated by top-performing seniors and faculty.</p>
                </div>
              </li>
              <li className="flex items-start gap-4">
                <div className="bg-red-50 p-3 rounded-xl text-red-500">
                  <PlayCircle className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-widest text-content-strong">Video Tutorials</p>
                  <p className="text-[11px] text-content-muted italic mt-1">YouTube links specifically mapped to your syllabus.</p>
                </div>
              </li>
              <li className="flex items-start gap-4">
                <div className="bg-amber-50 p-3 rounded-xl text-amber-500">
                  <BookOpen className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-widest text-content-strong">Exam Archives</p>
                  <p className="text-[11px] text-content-muted italic mt-1">5+ years of PYQs organized unit-wise.</p>
                </div>
              </li>
            </ul>
          </div>
        </div>

      </div>
    </div>
  );
};

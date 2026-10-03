import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { subjectService, progressService } from '../services/api';
import { OnboardingModal } from '../components/OnboardingModal';
import { 
  ArrowUpRight, 
  Settings2,
  FolderOpen,
  Layers
} from 'lucide-react';

export const Dashboard = () => {
  const { user } = useAuth();
  
  const [subjects, setSubjects] = useState([]);
  const [progressMap, setProgressMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showOnboarding, setShowOnboarding] = useState(false);

  // 1. Check Onboarding Status
  useEffect(() => {
    if (user && !user.onboardingCompleted) {
      setShowOnboarding(true);
    }
  }, [user]);

  // 2. Fetch Dashboard Data
  const loadDashboardData = async () => {
    setLoading(true);
    setError('');
    try {
      const [subjectsRes, progressRes] = await Promise.all([
        subjectService.getSubjects(),
        // Catch progress errors silently so the dashboard still loads if progress is empty
        progressService.getGlobalProgress().catch(() => ({ data: { subjectProgressMap: {} } }))
      ]);

      if (subjectsRes.data.success) {
        setSubjects(subjectsRes.data.subjects);
      }
      if (progressRes.data?.success) {
        setProgressMap(progressRes.data.subjectProgressMap || {});
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load curriculum data.');
    } finally {
      setLoading(false);
    }
  };

  // 3. Auto-load data when user session is confirmed
  useEffect(() => {
    if (user && user.onboardingCompleted) {
      loadDashboardData();
    } else {
      setLoading(false); // Stop loading spinner if we are just waiting for onboarding
    }
  }, [user]);

  return (
    <div className="min-h-screen bg-[#fbfbfa] pt-28 pb-20 px-6">
      
      {/* Onboarding Dialog (Forced if incomplete, or triggered manually by Settings) */}
      <OnboardingModal 
        isOpen={showOnboarding} 
        onClose={() => {
          setShowOnboarding(false);
          loadDashboardData(); // Instantly refresh the curriculum when they pick a new semester
        }} 
      />

      <div className="max-w-7xl mx-auto">
        
        {/* Welcome Header */}
        <div className="mb-12 flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-gray-200 pb-10">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-xs font-bold uppercase tracking-wider">
                {user?.track === 'UNIVERSITY' ? 'University Curriculum' : `${user?.targetExam || 'Competitive'} Track`}
              </span>
              <button 
                onClick={() => setShowOnboarding(true)}
                className="text-xs text-gray-400 hover:text-black font-semibold flex items-center gap-1 transition-colors"
              >
                <Settings2 className="w-3.5 h-3.5" />
                Change Track / Semester
              </button>
            </div>

            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-[#1a1a1a]">
              Dashboard <span className="text-gray-300 font-light">/</span> {user?.name}
            </h1>

            <p className="text-gray-500 font-medium text-sm mt-2">
              {user?.track === 'UNIVERSITY' ? (
                <span>
                  Current Enrollment: <strong className="text-black">{user?.tenant?.shortCode || "University"}</strong> &bull; {user?.college} &bull; <span className="text-blue-600 font-bold">{user?.branch} (Sem {user?.semester})</span>
                </span>
              ) : (
                <span>
                  Target Exam: <strong className="text-black">{user?.targetExam}</strong> &bull; Target Year: <span className="text-blue-600 font-bold">{user?.targetYear || 'Upcoming'}</span>
                </span>
              )}
            </p>
          </div>

          <div className="bg-[#0a0a0a] text-white px-6 py-3.5 rounded-2xl shadow-lg flex items-center gap-3">
            <span className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-pulse"></span>
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">Vault Status</p>
              <p className="text-xs font-bold">Academic Session Active</p>
            </div>
          </div>
        </div>

        {/* Section Title */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Layers className="w-4 h-4 text-gray-400" />
            <h2 className="text-xs font-black uppercase tracking-[0.3em] text-gray-400">
              Enrolled Curriculum Modules ({subjects.length})
            </h2>
          </div>

          <Link
            to="/progress"
            className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 transition-colors"
          >
            <span>View Global Mastery</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Content Body */}
        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-3xl p-8 border border-gray-200 animate-pulse h-64"></div>
            ))}
          </div>
        ) : error ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-red-100 text-red-600 text-sm font-medium">
            ⚠️ {error}
          </div>
        ) : subjects.length === 0 ? (
          <div className="bg-white rounded-3xl p-16 text-center border-2 border-dashed border-gray-200">
            <FolderOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-gray-800 mb-1">No Subjects Synchronized Yet</h3>
            <p className="text-gray-500 text-xs max-w-md mx-auto mb-6">
              We couldn't find registered subjects matching {user?.branch} (Semester {user?.semester}) under {user?.tenant?.shortCode || "your university"}.
            </p>
            <button
              onClick={() => setShowOnboarding(true)}
              className="px-6 py-3 rounded-xl bg-black text-white text-xs font-bold uppercase tracking-wider hover:bg-blue-600 transition-all"
            >
              Update Academic Profile
            </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {subjects.map((subject) => {
              const progressPct = progressMap[subject._id] || 0;

              return (
                <div 
                  key={subject._id}
                  className="bg-white rounded-[2rem] border border-gray-100 p-8 flex flex-col justify-between group relative overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300"
                >
                  <div>
                    {/* Header: Course Code & Units */}
                    <div className="flex justify-between items-start mb-6">
                      <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-lg bg-gray-100 text-gray-600">
                        {subject.courseCode || `Sem ${subject.semester || 1}`}
                      </span>

                      <span className="text-[10px] font-bold text-gray-400">
                        {subject.units?.length || 0} Units
                      </span>
                    </div>

                    {/* Subject Name */}
                    <h3 className="text-2xl font-black tracking-tight text-[#1a1a1a] mb-2 leading-snug group-hover:text-blue-600 transition-colors">
                      {subject.name}
                    </h3>
                    <p className="text-xs text-gray-400 font-medium mb-6">
                      {subject.tenant?.shortCode || "University"} &bull; {subject.branch || subject.examCategory || "General"}
                    </p>
                  </div>

                  {/* Mastery Progress Bar */}
                  <div className="space-y-4 pt-6 border-t border-gray-100">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">
                        Topic Readiness
                      </span>
                      <span className="font-bold text-black">{progressPct}%</span>
                    </div>

                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full transition-all duration-500"
                        style={{ width: `${progressPct}%` }}
                      ></div>
                    </div>

                    {/* Action Links */}
                    <div className="pt-2">
                      <Link
                        to={`/subjects/${subject._id}`}
                        className="w-full py-3 rounded-xl bg-gray-50 hover:bg-[#0a0a0a] hover:text-white text-xs font-bold text-gray-800 transition-all border border-gray-200 flex items-center justify-center gap-1.5 shadow-sm"
                      >
                        <span>Open Vault</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
};
import React, { useState, useEffect } from 'react';
import { tenantService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { GraduationCap, Target, Sparkles, CheckCircle, ArrowRight } from 'lucide-react';

export const OnboardingModal = ({ isOpen, onClose }) => {
  const { user, refreshUser } = useAuth();
  const [track, setTrack] = useState('UNIVERSITY');
  const [tenants, setTenants] = useState([]);
  const [selectedTenantId, setSelectedTenantId] = useState('');
  const [college, setCollege] = useState('');
  const [branch, setBranch] = useState('');
  const [year, setYear] = useState('1');
  const [semester, setSemester] = useState('1');
  const [targetExam, setTargetExam] = useState('JEE_MAINS');
  const [targetYear, setTargetYear] = useState('2027');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchTenants = async () => {
      try {
        const res = await tenantService.getTenants();
        if (res.data.success) {
          // Filter university tenants
          const uniTenants = res.data.tenants.filter(t => t.type === 'UNIVERSITY');
          setTenants(uniTenants);

          // If user already had a detected tenant, auto-select
          if (user?.tenant) {
            const currentTenantId = typeof user.tenant === 'object' ? user.tenant._id : user.tenant;
            setSelectedTenantId(currentTenantId);
          } else if (uniTenants.length > 0) {
            setSelectedTenantId(uniTenants[0]._id);
          }

          if (user?.college && user.college !== "Not Set") {
            setCollege(user.college);
          }
        }
      } catch (err) {
        console.error("Failed to load institutions:", err);
      }
    };

    if (isOpen) {
      fetchTenants();
    }
  }, [isOpen, user]);

  // Dynamic affiliated colleges for chosen university
  const selectedTenant = tenants.find(t => t._id === selectedTenantId);
  const affiliatedColleges = selectedTenant?.affiliatedColleges || [];

  const handleYearChange = (e) => {
    const y = parseInt(e.target.value);
    setYear(y);
    // Auto set semester to start of that year
    setSemester((y * 2) - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const payload = {
        track,
        tenantId: track === 'UNIVERSITY' ? selectedTenantId : undefined,
        college: track === 'UNIVERSITY' ? college : undefined,
        branch: track === 'UNIVERSITY' ? branch : undefined,
        year: track === 'UNIVERSITY' ? parseInt(year) : undefined,
        semester: track === 'UNIVERSITY' ? parseInt(semester) : undefined,
        targetExam: track !== 'UNIVERSITY' ? targetExam : undefined,
        targetYear: track !== 'UNIVERSITY' ? parseInt(targetYear) : undefined
      };

      const res = await tenantService.completeOnboarding(payload);
      if (res.data.success) {
        await refreshUser();
        onClose();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update academic profile.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-xl rounded-3xl p-8 md:p-10 shadow-2xl border border-gray-100 modal-animate max-h-[90vh] overflow-y-auto">
        
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-xs font-bold uppercase tracking-wider mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            Set Up Your Academic Profile
          </div>
          <h2 className="text-2xl md:text-3xl font-black text-[#1a1a1a] tracking-tight">
            Configure Your Vault
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            Choose your academic track so we can personalize your curriculum and syllabus.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-100 text-red-600 text-xs font-bold">
            ⚠️ {error}
          </div>
        )}

        {/* Track Selector Tabs */}
        <div className="grid grid-cols-2 gap-3 mb-8">
          <button
            type="button"
            onClick={() => setTrack('UNIVERSITY')}
            className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all ${
              track === 'UNIVERSITY'
                ? 'border-blue-600 bg-blue-50/50 text-blue-700 shadow-sm'
                : 'border-gray-200 hover:border-gray-300 text-gray-600'
            }`}
          >
            <GraduationCap className="w-6 h-6" />
            <span className="text-xs font-black uppercase tracking-wider">University Degree</span>
            <span className="text-[10px] text-gray-400 font-medium">B.Tech / Semester Syllabus</span>
          </button>

          <button
            type="button"
            onClick={() => setTrack('JEE')}
            className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all ${
              track !== 'UNIVERSITY'
                ? 'border-blue-600 bg-blue-50/50 text-blue-700 shadow-sm'
                : 'border-gray-200 hover:border-gray-300 text-gray-600'
            }`}
          >
            <Target className="w-6 h-6" />
            <span className="text-xs font-black uppercase tracking-wider">Competitive Exam</span>
            <span className="text-[10px] text-gray-400 font-medium">JEE Mains / Advanced / NEET</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {track === 'UNIVERSITY' ? (
            <>
              {/* University Picker */}
              <div>
                <label className="block text-[11px] font-black uppercase tracking-wider text-gray-400 mb-2">
                  Affiliated University
                </label>
                <select
                  value={selectedTenantId}
                  onChange={(e) => {
                    setSelectedTenantId(e.target.value);
                    setCollege('');
                  }}
                  required
                  className="w-full px-4 py-3.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-800 bg-white focus:outline-none focus:border-blue-500"
                >
                  {tenants.map(t => (
                    <option key={t._id} value={t._id}>
                      {t.name} ({t.shortCode}) — {t.state}
                    </option>
                  ))}
                </select>
              </div>

              {/* College Picker or Input */}
              <div>
                <label className="block text-[11px] font-black uppercase tracking-wider text-gray-400 mb-2">
                  College / Campus Name
                </label>
                {affiliatedColleges.length > 0 ? (
                  <div className="space-y-2">
                    <select
                      value={college}
                      onChange={(e) => setCollege(e.target.value)}
                      required
                      className="w-full px-4 py-3.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-800 bg-white focus:outline-none focus:border-blue-500"
                    >
                      <option value="">Select your affiliated college...</option>
                      {affiliatedColleges.map((c, i) => (
                        <option key={i} value={c.name}>
                          {c.name} {c.city ? `(${c.city})` : ''}
                        </option>
                      ))}
                      <option value="Other">Other / Main Campus</option>
                    </select>
                    {college === "Other" && (
                      <input
                        type="text"
                        placeholder="Type your exact college name..."
                        onChange={(e) => setCollege(e.target.value)}
                        required
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-blue-500"
                      />
                    )}
                  </div>
                ) : (
                  <input
                    type="text"
                    placeholder="e.g. Roorkee Institute of Technology"
                    value={college}
                    onChange={(e) => setCollege(e.target.value)}
                    required
                    className="w-full px-4 py-3.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-800 focus:outline-none focus:border-blue-500"
                  />
                )}
              </div>

              {/* Branch, Year, Semester */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[11px] font-black uppercase tracking-wider text-gray-400 mb-2">
                    Branch
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. CSE / AIML"
                    value={branch}
                    onChange={(e) => setBranch(e.target.value)}
                    required
                    className="w-full px-4 py-3.5 rounded-xl border border-gray-200 text-sm font-semibold uppercase focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-black uppercase tracking-wider text-gray-400 mb-2">
                    Year
                  </label>
                  <select
                    value={year}
                    onChange={handleYearChange}
                    className="w-full px-4 py-3.5 rounded-xl border border-gray-200 text-sm font-semibold bg-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="1">1st Year</option>
                    <option value="2">2nd Year</option>
                    <option value="3">3rd Year</option>
                    <option value="4">4th Year</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-black uppercase tracking-wider text-gray-400 mb-2">
                    Semester
                  </label>
                  <select
                    value={semester}
                    onChange={(e) => setSemester(e.target.value)}
                    className="w-full px-4 py-3.5 rounded-xl border border-gray-200 text-sm font-semibold bg-white focus:outline-none focus:border-blue-500"
                  >
                    <option value={(parseInt(year) * 2) - 1}>Sem {(parseInt(year) * 2) - 1}</option>
                    <option value={parseInt(year) * 2}>Sem {parseInt(year) * 2}</option>
                  </select>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Competitive Track */}
              <div>
                <label className="block text-[11px] font-black uppercase tracking-wider text-gray-400 mb-2">
                  Target Competitive Exam
                </label>
                <select
                  value={targetExam}
                  onChange={(e) => {
                    setTargetExam(e.target.value);
                    setTrack(e.target.value.includes('JEE') ? 'JEE' : 'NEET');
                  }}
                  className="w-full px-4 py-3.5 rounded-xl border border-gray-200 text-sm font-semibold bg-white focus:outline-none focus:border-blue-500"
                >
                  <option value="JEE_MAINS">JEE Mains</option>
                  <option value="JEE_ADVANCED">JEE Advanced</option>
                  <option value="NEET">NEET (UG)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-black uppercase tracking-wider text-gray-400 mb-2">
                  Target Examination Year
                </label>
                <select
                  value={targetYear}
                  onChange={(e) => setTargetYear(e.target.value)}
                  className="w-full px-4 py-3.5 rounded-xl border border-gray-200 text-sm font-semibold bg-white focus:outline-none focus:border-blue-500"
                >
                  <option value="2026">2026</option>
                  <option value="2027">2027</option>
                  <option value="2028">2028</option>
                </select>
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-4 bg-[#0a0a0a] text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-blue-600 transition-all shadow-xl active:scale-[0.98] flex items-center justify-center gap-2"
          >
            {loading ? "Saving Profile..." : "Activate My Vault"}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

      </div>
    </div>
  );
};

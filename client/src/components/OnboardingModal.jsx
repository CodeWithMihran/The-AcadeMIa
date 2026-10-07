import { TRACKS, TARGET_EXAMS } from "../constants";
import React, { useState, useEffect } from 'react';
import { tenantService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { GraduationCap, Target, Sparkles, ArrowRight, X } from 'lucide-react';

export const OnboardingModal = ({ isOpen, onClose }) => {
  const { user, refreshUser } = useAuth();
  const [track, setTrack] = useState(TRACKS.UNIVERSITY);
  const [tenants, setTenants] = useState([]);
  const [selectedTenantId, setSelectedTenantId] = useState('');
  const [college, setCollege] = useState('');
  const [isCustomCollege, setIsCustomCollege] = useState(false);
  const [branch, setBranch] = useState('');
  const [year, setYear] = useState('1');
  const [semester, setSemester] = useState('1');
  const [targetExam, setTargetExam] = useState(TARGET_EXAMS.JEE_MAINS);
  const [targetYear, setTargetYear] = useState('2027');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [tenantsLoading, setTenantsLoading] = useState(false);
  const [tenantsError, setTenantsError] = useState('');
  const [tenantReload, setTenantReload] = useState(0);

  useEffect(() => {
    if (!isOpen) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && !loading) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, loading, onClose]);

  useEffect(() => {
    const fetchTenants = async () => {
      setTenantsLoading(true);
      setTenantsError('');
      try {
        const res = await tenantService.getTenants();
        if (res.data.success) {
          // Filter university tenants
          const uniTenants = res.data.tenants.filter(t => t.type === TRACKS.UNIVERSITY);
          setTenants(uniTenants);

          // If user already had a detected tenant, auto-select
          if (user?.tenant) {
            const currentTenantId = typeof user.tenant === 'object' ? user.tenant._id : user.tenant;
            setSelectedTenantId(uniTenants.some(tenant => tenant._id === currentTenantId)
              ? currentTenantId
              : uniTenants[0]?._id || '');
          } else if (uniTenants.length > 0) {
            setSelectedTenantId(uniTenants[0]._id);
          } else {
            setSelectedTenantId('');
          }

          if (user?.college && user.college !== "Not Set") {
            setCollege(user.college);
          }
        }
      } catch (err) {
        console.error("Failed to load institutions:", err);
        setTenantsError(err.response?.data?.message || 'Could not load universities. Please try again.');
      } finally {
        setTenantsLoading(false);
      }
    };

    if (isOpen) {
      fetchTenants();
    }
  }, [isOpen, user, tenantReload]);

  // Dynamic affiliated colleges for chosen university
  const selectedTenant = tenants.find(t => t._id === selectedTenantId);
  const affiliatedColleges = selectedTenant?.affiliatedColleges || [];
  const selectedCollegeIsListed = affiliatedColleges.some(item => item.name === college);
  const collegeSelectValue = isCustomCollege || (college && !selectedCollegeIsListed) ? 'Other' : college;

  const handleYearChange = (e) => {
    const y = parseInt(e.target.value);
    setYear(y);
    // Auto set semester to start of that year
    setSemester((y * 2) - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (track === TRACKS.UNIVERSITY && !selectedTenantId) {
      setError('Choose an affiliated university before continuing.');
      return;
    }
    setLoading(true);

    try {
      const payload = {
        track,
        tenantId: track === TRACKS.UNIVERSITY ? selectedTenantId : undefined,
        college: track === TRACKS.UNIVERSITY ? college : undefined,
        branch: track === TRACKS.UNIVERSITY ? branch : undefined,
        year: track === TRACKS.UNIVERSITY ? parseInt(year) : undefined,
        semester: track === TRACKS.UNIVERSITY ? parseInt(semester) : undefined,
        targetExam: track !== TRACKS.UNIVERSITY ? targetExam : undefined,
        targetYear: track !== TRACKS.UNIVERSITY ? parseInt(targetYear) : undefined
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
    <div className="fixed inset-0 z-[100] overflow-y-auto bg-black/80 backdrop-blur-sm animate-in fade-in duration-200" onMouseDown={(event) => { if (event.target === event.currentTarget && !loading) onClose(); }}>
      <div className="flex min-h-full items-center justify-center p-3 sm:p-4">
      <div role="dialog" aria-modal="true" aria-labelledby="onboarding-title" className="relative w-full max-w-xl rounded-3xl border border-line bg-surface p-5 shadow-2xl modal-animate sm:p-7 md:p-8">
        <button type="button" onClick={onClose} disabled={loading} aria-label="Close study track form" className="absolute right-4 top-4 z-10 inline-flex h-10 w-10 items-center justify-center rounded-xl text-content-muted transition hover:bg-surface-muted hover:text-content focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50 sm:right-5 sm:top-5">
          <X className="h-5 w-5" />
        </button>
        
        <div className="mb-6 px-5 text-center sm:mb-7">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-xs font-bold uppercase tracking-wider mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            Set Up Your Academic Profile
          </div>
          <h2 id="onboarding-title" className="text-2xl font-black tracking-tight text-content md:text-3xl">
            Configure Your Vault
          </h2>
          <p className="text-content-muted text-sm mt-1">
            Choose your academic track so we can personalize your curriculum and syllabus.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-100 text-red-600 text-xs font-bold">
            ⚠️ {error}
          </div>
        )}

        {/* Track Selector Tabs */}
        <div className="mb-6 grid grid-cols-2 gap-3 sm:mb-7">
          <button
            type="button"
            onClick={() => setTrack(TRACKS.UNIVERSITY)}
            className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all ${
              track === TRACKS.UNIVERSITY
                ? 'border-blue-600 bg-blue-50/50 text-blue-700 shadow-sm'
                : 'border-line hover:border-line-strong text-content-secondary'
            }`}
          >
            <GraduationCap className="w-6 h-6" />
            <span className="text-xs font-black uppercase tracking-wider">University Degree</span>
            <span className="text-[10px] text-content-faint font-medium">B.Tech / Semester Syllabus</span>
          </button>

          <button
            type="button"
            onClick={() => setTrack(TRACKS.JEE)}
            className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all ${
              track !== TRACKS.UNIVERSITY
                ? 'border-blue-600 bg-blue-50/50 text-blue-700 shadow-sm'
                : 'border-line hover:border-line-strong text-content-secondary'
            }`}
          >
            <Target className="w-6 h-6" />
            <span className="text-xs font-black uppercase tracking-wider">Competitive Exam</span>
            <span className="text-[10px] text-content-faint font-medium">JEE Mains / Advanced / NEET</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
          {track === TRACKS.UNIVERSITY ? (
            <>
              {/* University Picker */}
              <div>
                <label className="block text-[11px] font-black uppercase tracking-wider text-content-faint mb-2">
                  Affiliated University
                </label>
                <select
                  value={selectedTenantId}
                  disabled={tenantsLoading || tenants.length === 0}
                  onChange={(e) => {
                    setSelectedTenantId(e.target.value);
                    setCollege('');
                    setIsCustomCollege(false);
                  }}
                  required
                  className="w-full px-4 py-3.5 rounded-xl border border-line text-sm font-semibold text-content-strong bg-surface focus:outline-none focus:border-blue-500"
                >
                  <option value="" disabled>
                    {tenantsLoading ? 'Loading universities...' : 'Select an affiliated university'}
                  </option>
                  {tenants.map(t => (
                    <option key={t._id} value={t._id}>
                      {t.name} ({t.shortCode}) — {t.state}
                    </option>
                  ))}
                </select>
                {tenantsError ? (
                  <div className="mt-2 flex items-center justify-between gap-3 text-xs text-red-600">
                    <span>{tenantsError}</span>
                    <button type="button" onClick={() => setTenantReload(value => value + 1)} className="font-bold underline">
                      Retry
                    </button>
                  </div>
                ) : !tenantsLoading && tenants.length === 0 ? (
                  <p className="mt-2 text-xs text-amber-700">
                    No universities are available yet. Please try again shortly or choose the Competitive Exam track.
                  </p>
                ) : null}
              </div>

              {/* College Picker or Input */}
              <div>
                <label className="block text-[11px] font-black uppercase tracking-wider text-content-faint mb-2">
                  College / Campus Name
                </label>
                {affiliatedColleges.length > 0 ? (
                  <div className="space-y-2">
                    <select
                      value={collegeSelectValue}
                      onChange={(e) => {
                        const nextCollege = e.target.value;
                        setIsCustomCollege(nextCollege === 'Other');
                        setCollege(nextCollege === 'Other' ? '' : nextCollege);
                      }}
                      required
                      className="w-full px-4 py-3.5 rounded-xl border border-line text-sm font-semibold text-content-strong bg-surface focus:outline-none focus:border-blue-500"
                    >
                      <option value="">Select your affiliated college...</option>
                      {affiliatedColleges.map((c, i) => (
                        <option key={i} value={c.name}>
                          {c.name} {c.city ? `(${c.city})` : ''}
                        </option>
                      ))}
                      <option value="Other">Other / Main Campus</option>
                    </select>
                    {collegeSelectValue === "Other" && (
                      <input
                        type="text"
                        placeholder="Type your exact college name..."
                        value={college}
                        onChange={(e) => setCollege(e.target.value)}
                        required
                        className="w-full px-4 py-3 rounded-xl border border-line text-sm focus:outline-none focus:border-blue-500"
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
                    className="w-full px-4 py-3.5 rounded-xl border border-line text-sm font-semibold text-content-strong focus:outline-none focus:border-blue-500"
                  />
                )}
              </div>

              {/* Branch, Year, Semester */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[11px] font-black uppercase tracking-wider text-content-faint mb-2">
                    Branch
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. CSE / AIML"
                    value={branch}
                    onChange={(e) => setBranch(e.target.value)}
                    required
                    className="w-full px-4 py-3.5 rounded-xl border border-line text-sm font-semibold uppercase focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-black uppercase tracking-wider text-content-faint mb-2">
                    Year
                  </label>
                  <select
                    value={year}
                    onChange={handleYearChange}
                    className="w-full px-4 py-3.5 rounded-xl border border-line text-sm font-semibold bg-surface focus:outline-none focus:border-blue-500"
                  >
                    <option value="1">1st Year</option>
                    <option value="2">2nd Year</option>
                    <option value="3">3rd Year</option>
                    <option value="4">4th Year</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-black uppercase tracking-wider text-content-faint mb-2">
                    Semester
                  </label>
                  <select
                    value={semester}
                    onChange={(e) => setSemester(e.target.value)}
                    className="w-full px-4 py-3.5 rounded-xl border border-line text-sm font-semibold bg-surface focus:outline-none focus:border-blue-500"
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
                <label className="block text-[11px] font-black uppercase tracking-wider text-content-faint mb-2">
                  Target Competitive Exam
                </label>
                <select
                  value={targetExam}
                  onChange={(e) => {
                    setTargetExam(e.target.value);
                    setTrack(e.target.value.includes(TRACKS.JEE) ? TRACKS.JEE : TRACKS.NEET);
                  }}
                  className="w-full px-4 py-3.5 rounded-xl border border-line text-sm font-semibold bg-surface focus:outline-none focus:border-blue-500"
                >
                  <option value={TARGET_EXAMS.JEE_MAINS}>JEE Mains</option>
                  <option value={TARGET_EXAMS.JEE_ADVANCED}>JEE Advanced</option>
                  <option value={TARGET_EXAMS.NEET}>NEET (UG)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-black uppercase tracking-wider text-content-faint mb-2">
                  Target Examination Year
                </label>
                <select
                  value={targetYear}
                  onChange={(e) => setTargetYear(e.target.value)}
                  className="w-full px-4 py-3.5 rounded-xl border border-line text-sm font-semibold bg-surface focus:outline-none focus:border-blue-500"
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
            disabled={loading || (track === TRACKS.UNIVERSITY && (tenantsLoading || tenants.length === 0))}
            className="w-full mt-4 bg-surface-inverse text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-blue-600 transition-all shadow-xl active:scale-[0.98] flex items-center justify-center gap-2"
          >
            {loading ? "Saving Profile..." : "Activate My Vault"}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

      </div>
      </div>
    </div>
  );
};

import { TRACKS, TARGET_EXAMS } from "../constants";
import React, { useCallback, useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { authService, tenantService } from "../services/api";
import ActivityHeatmap from "../components/ActivityHeatmap";
import {
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  User,
  Mail,
  GraduationCap,
  Sparkles,
} from "lucide-react";

export const Profile = () => {
  const { user, refreshUser } = useAuth();

  // UI State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [universities, setUniversities] = useState([]);
  const [tenantLoading, setTenantLoading] = useState(false);
  const [tenantError, setTenantError] = useState("");
  const [otherCollege, setOtherCollege] = useState("");

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    track: TRACKS.UNIVERSITY,
    tenantId: "",
    college: "",
    branch: "",
    year: 1,
    semester: 1,
    targetExam: TARGET_EXAMS.JEE_MAINS,
    targetYear: 2027,
    leaderboardOptIn: false,
  });

  // Sync user data to form state when component mounts or user updates
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        track: user.track || TRACKS.UNIVERSITY,
        tenantId: user.tenant?._id || user.tenant || "",
        college: user.college && user.college !== "Not Set" ? user.college : "",
        branch: user.branch || "",
        year: user.year || 1,
        semester: user.semester || 1,
        targetExam: user.targetExam || TARGET_EXAMS.JEE_MAINS,
        targetYear: user.targetYear || 2027,
        leaderboardOptIn: user.leaderboardOptIn === true,
      });
    }
  }, [user]);

  const loadUniversities = useCallback(() => {
    setTenantLoading(true);
    setTenantError("");
    tenantService.getTenants().then((res) => {
      if (res.data.success) setUniversities((res.data.tenants || []).filter((tenant) => tenant.type === TRACKS.UNIVERSITY));
    }).catch((err) => setTenantError(err.response?.data?.message || "Could not load universities.")).finally(() => setTenantLoading(false));
  }, []);
  useEffect(() => loadUniversities(), [loadUniversities]);

  // Dynamic Semester Logic
  const handleYearChange = (e) => {
    const newYear = parseInt(e.target.value);
    setFormData((prev) => ({
      ...prev,
      year: newYear,
      semester: newYear * 2 - 1, // Auto-select the first semester of the newly selected year
    }));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const profile = {
        ...formData,
        track: formData.track === TRACKS.UNIVERSITY ? TRACKS.UNIVERSITY : (formData.targetExam === TARGET_EXAMS.NEET ? TRACKS.NEET : TRACKS.JEE),
        college: formData.college === "Other" ? otherCollege : formData.college,
      };
      await authService.updateProfile(profile);
      await refreshUser(); // Update global context
      setSuccess("Academic profile updated successfully!");

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update profile.");
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null; // Prevent rendering before user context loads

  const isUniversity = formData.track === TRACKS.UNIVERSITY;
  const selectedUniversity = universities.find((tenant) => tenant._id === formData.tenantId);

  return (
    <main className="min-h-screen overflow-x-clip bg-app px-4 pb-16 pt-28 sm:px-6 lg:px-8">
      <div className="mx-auto min-w-0 max-w-7xl space-y-7 sm:space-y-9">
        {/* Header */}
        <header className="flex flex-col gap-4 rounded-3xl border border-line bg-surface p-5 shadow-sm sm:flex-row sm:items-end sm:justify-between sm:p-7">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.16em] text-blue-700">Your account</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-content sm:text-4xl">Profile and study settings</h1>
            <p className="mt-2 text-sm text-content-muted">Manage your personal details, study track, campus, and privacy choices.</p>
          </div>
          <div className="inline-flex min-h-10 items-center gap-2 self-start rounded-xl border border-line bg-surface-muted px-3.5 py-2 text-xs font-semibold text-content-secondary sm:self-auto">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            Account ID ·
            {user._id?.toString().slice(-6).toUpperCase() || "XXXXXX"}
          </div>
        </header>

        {/* Alerts */}
        {error && (
          <div role="alert" className="flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-4 text-sm font-semibold text-red-800">
            <AlertTriangle className="w-5 h-5" /> {error}
          </div>
        )}
        {success && (
          <div role="status" aria-live="polite" className="flex items-center gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-4 text-sm font-semibold text-emerald-800">
            <CheckCircle2 className="w-5 h-5" /> {success}
          </div>
        )}

        <section aria-label="Study activity"><ActivityHeatmap /></section>

        <div className="grid items-start gap-5 lg:grid-cols-[.8fr_1.2fr] lg:gap-6">
          {/* Left Column: Visual Profile Card */}
          <aside>
            <div className="bg-surface border border-line rounded-2xl p-5 shadow-sm sm:p-7">
              <div className="relative w-28 h-28 mx-auto mb-6">
                <div className="w-full h-full rounded-3xl bg-gradient-to-br from-gray-900 to-black flex items-center justify-center text-4xl font-black text-white italic shadow-xl">
                  {user.name?.charAt(0).toUpperCase()}
                </div>
                <div className="absolute -bottom-2 -right-2 bg-emerald-400 w-8 h-8 border-4 border-line rounded-full shadow-sm flex items-center justify-center">
                  <Sparkles className="w-3 h-3 text-white" />
                </div>
              </div>

              <div className="text-center mb-6">
                <h2 className="text-xl font-black text-content tracking-tight">
                  {user.name}
                </h2>
                <p className="text-content-faint text-xs font-bold uppercase tracking-wider mt-1">
                  {user.email}
                </p>
              </div>

              <div className="space-y-4 pt-6 border-t border-line">
                {isUniversity ? (
                  <>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black text-content-faint uppercase tracking-widest">
                        Branch
                      </span>
                      <span className="text-xs font-bold text-content uppercase">
                        {user.branch}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black text-content-faint uppercase tracking-widest">
                        Year
                      </span>
                      <span className="text-xs font-bold text-content">
                        {user.year}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black text-content-faint uppercase tracking-widest">
                        Semester
                      </span>
                      <span className="text-xs font-bold text-content">
                        {user.semester}
                      </span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black text-content-faint uppercase tracking-widest">
                        Target
                      </span>
                      <span className="text-xs font-bold text-content uppercase">
                        {user.targetExam}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black text-content-faint uppercase tracking-widest">
                        Target Year
                      </span>
                      <span className="text-xs font-bold text-content">
                        {user.targetYear}
                      </span>
                    </div>
                  </>
                )}
              </div>

              <div className="mt-8 pt-6 border-t border-line">
                <p className="text-[9px] text-center text-blue-500 uppercase tracking-[0.2em] font-black flex items-center justify-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> System Verified
                </p>
              </div>
            </div>
          </aside>

          {/* Right Column: Edit Form */}
          <section aria-labelledby="profile-form-title">
            <div className="bg-surface border border-line rounded-2xl p-5 shadow-sm sm:p-7">
              <h2 id="profile-form-title" className="text-lg font-black mb-6 flex items-center gap-2 tracking-tight text-content">
                <span className="text-blue-600">✦</span> Account and study details
              </h2>

              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Personal Info */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label htmlFor="profile-name" className="text-[11px] font-black text-content-faint uppercase tracking-wider flex items-center gap-1.5">
                      <User className="w-3 h-3" /> Full Name
                    </label>
                    <input
                      type="text"
                      id="profile-name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      className="w-full min-h-11 bg-surface px-4 py-3 rounded-xl border border-line text-sm font-semibold text-content transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="profile-email" className="text-[11px] font-black text-content-faint uppercase tracking-wider flex items-center gap-1.5">
                      <Mail className="w-3 h-3" /> Email Address
                    </label>
                    <input
                      type="email"
                      id="profile-email"
                      value={user.email}
                      readOnly
                      className="w-full min-h-11 px-4 py-3 rounded-xl border border-line text-sm font-semibold text-content-muted bg-surface-muted cursor-not-allowed focus:outline-none"
                    />
                  </div>
                </div>

                <div className="h-[1px] bg-surface-subtle w-full"></div>

                {/* Academic Info */}
                <div className="space-y-6 rounded-2xl border border-blue-100 bg-blue-50/40 p-5">
                  <div>
                    <label className="text-[11px] font-black text-content-muted uppercase tracking-wider">Learning Track</label>
                    <select name="track" value={formData.track} onChange={(e) => setFormData((prev) => ({ ...prev, track: e.target.value, tenantId: e.target.value === TRACKS.UNIVERSITY && !universities.some((tenant) => tenant._id === prev.tenantId) ? universities[0]?._id || "" : prev.tenantId, college: e.target.value === TRACKS.UNIVERSITY ? prev.college : "" }))} className="mt-2 w-full rounded-xl border border-line bg-surface px-4 py-3.5 text-sm font-semibold text-content-strong focus:border-blue-500 focus:outline-none">
                      <option value={TRACKS.UNIVERSITY}>University / College</option>
                      <option value={TRACKS.JEE}>Competitive exams</option>
                    </select>
                    <p className="mt-2 text-xs text-content-muted">Switching tracks changes the curriculum shown on your dashboard; your saved account and progress remain intact.</p>
                  </div>
                  {isUniversity ? <div className="grid gap-5 md:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-[11px] font-black text-content-muted uppercase tracking-wider">University</label>
                      <select name="tenantId" value={formData.tenantId} onChange={(e) => setFormData((prev) => ({ ...prev, tenantId: e.target.value, college: "" }))} required disabled={tenantLoading || universities.length === 0} className="w-full rounded-xl border border-line bg-surface px-4 py-3.5 text-sm font-semibold text-content-strong focus:border-blue-500 focus:outline-none">
                        <option value="">{tenantLoading ? "Loading universities…" : "Select university"}</option>
                        {universities.map((tenant) => <option key={tenant._id} value={tenant._id}>{tenant.name} ({tenant.shortCode})</option>)}
                      </select>
                      {!tenantLoading && universities.length === 0 && <p role={tenantError ? "alert" : "status"} className="mt-2 text-xs text-content-muted">{tenantError || "No universities are available yet."}{tenantError && <button type="button" onClick={loadUniversities} className="ml-2 min-h-11 font-bold text-blue-700 underline">Retry</button>}</p>}
                    </div>
                    <div className="space-y-2">
                      <label className="text-[11px] font-black text-content-muted uppercase tracking-wider">College / Campus</label>
                      {selectedUniversity?.affiliatedColleges?.length && (!formData.college || formData.college === "Other" || selectedUniversity.affiliatedColleges.some((campus) => campus.name === formData.college)) ? <select name="college" value={formData.college} onChange={(e) => { handleInputChange(e); if (e.target.value !== "Other") setOtherCollege(""); }} required className="w-full rounded-xl border border-line bg-surface px-4 py-3.5 text-sm font-semibold text-content-strong focus:border-blue-500 focus:outline-none">
                        <option value="">Select campus</option>
                        {selectedUniversity.affiliatedColleges.map((campus, index) => <option key={campus._id || index} value={campus.name}>{campus.name}</option>)}
                        <option value="Other">Other / Main campus</option>
                      </select> : <input name="college" value={formData.college} onChange={handleInputChange} required placeholder="College or campus name" className="w-full rounded-xl border border-line px-4 py-3.5 text-sm font-semibold focus:border-blue-500 focus:outline-none" />}
                      {formData.college === "Other" && <input value={otherCollege} onChange={(e) => setOtherCollege(e.target.value)} required placeholder="Enter campus name" className="w-full rounded-xl border border-line px-4 py-3 text-sm" />}
                    </div>
                  </div> : <div className="grid gap-5 md:grid-cols-2">
                    <div className="space-y-2"><label className="text-[11px] font-black text-content-muted uppercase tracking-wider">Target Exam</label><select name="targetExam" value={formData.targetExam} onChange={handleInputChange} className="w-full rounded-xl border border-line bg-surface px-4 py-3.5 text-sm font-semibold"><option value={TARGET_EXAMS.JEE_MAINS}>JEE Mains</option><option value={TARGET_EXAMS.JEE_ADVANCED}>JEE Advanced</option><option value={TARGET_EXAMS.NEET}>NEET (UG)</option></select></div>
                    <div className="space-y-2"><label className="text-[11px] font-black text-content-muted uppercase tracking-wider">Target Year</label><select name="targetYear" value={formData.targetYear} onChange={handleInputChange} className="w-full rounded-xl border border-line bg-surface px-4 py-3.5 text-sm font-semibold">{[2026, 2027, 2028, 2029, 2030].map((year) => <option key={year} value={year}>{year}</option>)}</select></div>
                  </div>}
                </div>

                <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-indigo-100 bg-indigo-50/40 p-5">
                  <input type="checkbox" checked={formData.leaderboardOptIn} onChange={(event) => setFormData((prev) => ({ ...prev, leaderboardOptIn: event.target.checked }))} className="mt-0.5 h-4 w-4 accent-indigo-600" />
                  <span><span className="block text-sm font-black text-content">Join anonymous campus rankings</span><span className="mt-1 block text-xs leading-relaxed text-content-secondary">Your readiness score can appear as an anonymous peer in your university, college, branch, and semester. Your name, email, and profile are never shown. You can opt out here at any time.</span></span>
                </label>

                {isUniversity ? (
                  <div className="grid md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <label className="text-[11px] font-black text-content-faint uppercase tracking-wider flex items-center gap-1.5">
                        <GraduationCap className="w-3 h-3" /> Branch
                      </label>
                      <input
                        type="text"
                        name="branch"
                        value={formData.branch}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3.5 rounded-xl border border-line text-sm font-semibold uppercase text-content-strong transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 focus:outline-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[11px] font-black text-content-faint uppercase tracking-wider">
                        Year
                      </label>
                      <select
                        name="year"
                        value={formData.year}
                        onChange={handleYearChange}
                        className="w-full px-4 py-3.5 rounded-xl border border-line text-sm font-semibold bg-surface text-content-strong transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 focus:outline-none"
                      >
                        {[1, 2, 3, 4].map((y) => (
                          <option key={y} value={y}>
                            Year {y}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[11px] font-black text-content-faint uppercase tracking-wider">
                        Semester
                      </label>
                      <select
                        name="semester"
                        value={formData.semester}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3.5 rounded-xl border border-line text-sm font-semibold bg-surface text-content-strong transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 focus:outline-none"
                      >
                        <option value={formData.year * 2 - 1}>
                          Semester {formData.year * 2 - 1}
                        </option>
                        <option value={formData.year * 2}>
                          Semester {formData.year * 2}
                        </option>
                      </select>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-content-muted">Your target exam preferences are set above.</p>
                )}

                <div className="pt-6">
                  <button
                    type="submit"
                    disabled={loading}
                    className="min-h-12 w-full bg-surface-inverse text-white px-5 py-3 rounded-xl text-xs uppercase tracking-widest font-black hover:bg-blue-600 transition-all shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {loading ? "Saving Changes..." : "Save Profile Changes"}
                  </button>
                </div>
              </form>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
};

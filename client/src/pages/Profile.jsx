import { TRACKS, TARGET_EXAMS } from "../constants";
import React, { useState, useEffect } from "react";
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

  useEffect(() => {
    setTenantLoading(true);
    tenantService.getTenants().then((res) => {
      if (res.data.success) setUniversities((res.data.tenants || []).filter((tenant) => tenant.type === TRACKS.UNIVERSITY));
    }).catch((err) => setError(err.response?.data?.message || "Could not load universities.")).finally(() => setTenantLoading(false));
  }, []);

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
    <div className="min-h-screen bg-[#fbfbfa] pt-32 pb-20 px-6 animate-in fade-in duration-500">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-10 flex flex-col md:flex-row items-start md:items-end justify-between border-b border-gray-200 pb-8 gap-4">
          <div>
            <h1 className="text-4xl font-black tracking-tighter text-[#1a1a1a]">
              Account Settings
            </h1>
            <p className="text-gray-500 mt-2 font-medium">
              Manage your academic identity and personal information.
            </p>
          </div>
          <div className="flex items-center gap-2 bg-gray-100 border border-gray-200 px-4 py-2 rounded-xl text-xs font-bold text-gray-500 uppercase tracking-widest shadow-sm">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            Student ID:{" "}
            {user._id?.toString().slice(-6).toUpperCase() || "XXXXXX"}
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div className="bg-red-50 border border-red-100 text-red-600 px-5 py-4 rounded-2xl mb-8 text-sm font-bold flex items-center gap-3">
            <AlertTriangle className="w-5 h-5" /> {error}
          </div>
        )}
        {success && (
          <div className="bg-emerald-50 border border-emerald-100 text-emerald-600 px-5 py-4 rounded-2xl mb-8 text-sm font-bold flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5" /> {success}
          </div>
        )}

        <div className="mb-8"><ActivityHeatmap /></div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Left Column: Visual Profile Card */}
          <div className="md:col-span-1">
            <div className="bg-white border border-gray-200 rounded-[2rem] p-8 md:sticky md:top-28 shadow-sm">
              <div className="relative w-28 h-28 mx-auto mb-6">
                <div className="w-full h-full rounded-3xl bg-gradient-to-br from-gray-900 to-black flex items-center justify-center text-4xl font-black text-white italic shadow-xl">
                  {user.name?.charAt(0).toUpperCase()}
                </div>
                <div className="absolute -bottom-2 -right-2 bg-emerald-400 w-8 h-8 border-4 border-white rounded-full shadow-sm flex items-center justify-center">
                  <Sparkles className="w-3 h-3 text-white" />
                </div>
              </div>

              <div className="text-center mb-8">
                <h2 className="text-xl font-black text-[#1a1a1a] tracking-tight">
                  {user.name}
                </h2>
                <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mt-1">
                  {user.email}
                </p>
              </div>

              <div className="space-y-4 pt-6 border-t border-gray-100">
                {isUniversity ? (
                  <>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                        Branch
                      </span>
                      <span className="text-xs font-bold text-black uppercase">
                        {user.branch}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                        Year
                      </span>
                      <span className="text-xs font-bold text-black">
                        {user.year}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                        Semester
                      </span>
                      <span className="text-xs font-bold text-black">
                        {user.semester}
                      </span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                        Target
                      </span>
                      <span className="text-xs font-bold text-black uppercase">
                        {user.targetExam}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                        Target Year
                      </span>
                      <span className="text-xs font-bold text-black">
                        {user.targetYear}
                      </span>
                    </div>
                  </>
                )}
              </div>

              <div className="mt-8 pt-6 border-t border-gray-100">
                <p className="text-[9px] text-center text-blue-500 uppercase tracking-[0.2em] font-black flex items-center justify-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> System Verified
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: Edit Form */}
          <div className="md:col-span-2">
            <div className="bg-white border border-gray-200 rounded-[2rem] p-8 md:p-10 shadow-sm">
              <h3 className="text-lg font-black mb-8 flex items-center gap-2 tracking-tight">
                <span className="text-blue-500">✦</span> Edit Information
              </h3>

              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Personal Info */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                      <User className="w-3 h-3" /> Full Name
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-800 transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 focus:outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Mail className="w-3 h-3" /> Email Address
                    </label>
                    <input
                      type="email"
                      value={user.email}
                      readOnly
                      className="w-full px-4 py-3.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-500 bg-gray-50 cursor-not-allowed focus:outline-none"
                    />
                  </div>
                </div>

                <div className="h-[1px] bg-gray-100 w-full"></div>

                {/* Academic Info */}
                <div className="space-y-6 rounded-2xl border border-blue-100 bg-blue-50/40 p-5">
                  <div>
                    <label className="text-[11px] font-black text-gray-500 uppercase tracking-wider">Learning Track</label>
                    <select name="track" value={formData.track} onChange={(e) => setFormData((prev) => ({ ...prev, track: e.target.value, tenantId: e.target.value === TRACKS.UNIVERSITY && !universities.some((tenant) => tenant._id === prev.tenantId) ? universities[0]?._id || "" : prev.tenantId, college: e.target.value === TRACKS.UNIVERSITY ? prev.college : "" }))} className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3.5 text-sm font-semibold text-gray-800 focus:border-blue-500 focus:outline-none">
                      <option value={TRACKS.UNIVERSITY}>University / College</option>
                      <option value={TRACKS.JEE}>Competitive exams</option>
                    </select>
                    <p className="mt-2 text-xs text-gray-500">Switching tracks changes the curriculum shown on your dashboard; your saved account and progress remain intact.</p>
                  </div>
                  {isUniversity ? <div className="grid gap-5 md:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-[11px] font-black text-gray-500 uppercase tracking-wider">University</label>
                      <select name="tenantId" value={formData.tenantId} onChange={(e) => setFormData((prev) => ({ ...prev, tenantId: e.target.value, college: "" }))} required disabled={tenantLoading || universities.length === 0} className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3.5 text-sm font-semibold text-gray-800 focus:border-blue-500 focus:outline-none">
                        <option value="">{tenantLoading ? "Loading universities…" : "Select university"}</option>
                        {universities.map((tenant) => <option key={tenant._id} value={tenant._id}>{tenant.name} ({tenant.shortCode})</option>)}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[11px] font-black text-gray-500 uppercase tracking-wider">College / Campus</label>
                      {selectedUniversity?.affiliatedColleges?.length && (!formData.college || formData.college === "Other" || selectedUniversity.affiliatedColleges.some((campus) => campus.name === formData.college)) ? <select name="college" value={formData.college} onChange={(e) => { handleInputChange(e); if (e.target.value !== "Other") setOtherCollege(""); }} required className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3.5 text-sm font-semibold text-gray-800 focus:border-blue-500 focus:outline-none">
                        <option value="">Select campus</option>
                        {selectedUniversity.affiliatedColleges.map((campus, index) => <option key={campus._id || index} value={campus.name}>{campus.name}</option>)}
                        <option value="Other">Other / Main campus</option>
                      </select> : <input name="college" value={formData.college} onChange={handleInputChange} required placeholder="College or campus name" className="w-full rounded-xl border border-gray-200 px-4 py-3.5 text-sm font-semibold focus:border-blue-500 focus:outline-none" />}
                      {formData.college === "Other" && <input value={otherCollege} onChange={(e) => setOtherCollege(e.target.value)} required placeholder="Enter campus name" className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm" />}
                    </div>
                  </div> : <div className="grid gap-5 md:grid-cols-2">
                    <div className="space-y-2"><label className="text-[11px] font-black text-gray-500 uppercase tracking-wider">Target Exam</label><select name="targetExam" value={formData.targetExam} onChange={handleInputChange} className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3.5 text-sm font-semibold"><option value={TARGET_EXAMS.JEE_MAINS}>JEE Mains</option><option value={TARGET_EXAMS.JEE_ADVANCED}>JEE Advanced</option><option value={TARGET_EXAMS.NEET}>NEET (UG)</option></select></div>
                    <div className="space-y-2"><label className="text-[11px] font-black text-gray-500 uppercase tracking-wider">Target Year</label><select name="targetYear" value={formData.targetYear} onChange={handleInputChange} className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3.5 text-sm font-semibold">{[2026, 2027, 2028, 2029, 2030].map((year) => <option key={year} value={year}>{year}</option>)}</select></div>
                  </div>}
                </div>

                <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-indigo-100 bg-indigo-50/40 p-5">
                  <input type="checkbox" checked={formData.leaderboardOptIn} onChange={(event) => setFormData((prev) => ({ ...prev, leaderboardOptIn: event.target.checked }))} className="mt-0.5 h-4 w-4 accent-indigo-600" />
                  <span><span className="block text-sm font-black text-gray-900">Join anonymous campus rankings</span><span className="mt-1 block text-xs leading-relaxed text-gray-600">Your readiness score can appear as an anonymous peer in your university, college, branch, and semester. Your name, email, and profile are never shown. You can opt out here at any time.</span></span>
                </label>

                {isUniversity ? (
                  <div className="grid md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <label className="text-[11px] font-black text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                        <GraduationCap className="w-3 h-3" /> Branch
                      </label>
                      <input
                        type="text"
                        name="branch"
                        value={formData.branch}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3.5 rounded-xl border border-gray-200 text-sm font-semibold uppercase text-gray-800 transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 focus:outline-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[11px] font-black text-gray-400 uppercase tracking-wider">
                        Year
                      </label>
                      <select
                        name="year"
                        value={formData.year}
                        onChange={handleYearChange}
                        className="w-full px-4 py-3.5 rounded-xl border border-gray-200 text-sm font-semibold bg-white text-gray-800 transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 focus:outline-none"
                      >
                        {[1, 2, 3, 4].map((y) => (
                          <option key={y} value={y}>
                            Year {y}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[11px] font-black text-gray-400 uppercase tracking-wider">
                        Semester
                      </label>
                      <select
                        name="semester"
                        value={formData.semester}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3.5 rounded-xl border border-gray-200 text-sm font-semibold bg-white text-gray-800 transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 focus:outline-none"
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
                  <p className="text-sm text-gray-500">Your target exam preferences are set above.</p>
                )}

                <div className="pt-6">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[#0a0a0a] text-white py-4 rounded-xl text-xs uppercase tracking-widest font-black hover:bg-blue-600 transition-all shadow-xl shadow-gray-200 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {loading ? "Saving Changes..." : "Save Profile Changes"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

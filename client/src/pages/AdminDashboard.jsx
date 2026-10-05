import { TRACKS, TARGET_EXAMS } from "../constants";
import React, { useCallback, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { adminService, tenantService } from "../services/api";
import {
  Users,
  BookOpen,
  Building2,
  Plus,
  Trash2,
  Edit3,
  Search,
  ShieldAlert,
  XCircle,
  Flag,
  ExternalLink,
  CheckCircle2,
} from "lucide-react";

export const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState("overview"); // 'overview' | 'subjects' | 'users'
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalSubjects: 0,
    totalTenants: 0,
  });
  const [subjects, setSubjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [linkReports, setLinkReports] = useState([]);
  const [reportStatus, setReportStatus] = useState("OPEN");
  const [tenants, setTenants] = useState([]);
  const [selectedTenant, setSelectedTenant] = useState("ALL");
  const [selectedTrack, setSelectedTrack] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Form State for Subject Creation / Modal
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [editingSubject, setEditingSubject] = useState(null);
  const [subjectForm, setSubjectForm] = useState({
    name: "",
    courseCode: "",
    credits: "",
    track: TRACKS.UNIVERSITY,
    tenantId: "",
    branch: "",
    semester: "1",
    examCategory: TARGET_EXAMS.JEE_MAINS,
  });

  const fetchInitialData = useCallback(async () => {
    setLoading(true);
    try {
      const [overviewRes, tenantsRes] = await Promise.all([
        adminService.getOverview(),
        tenantService.getTenants(),
      ]);

      if (overviewRes.data.success) {
        setStats(overviewRes.data.stats);
      }
      if (tenantsRes.data.success) {
          setTenants((tenantsRes.data.tenants || []).filter(tenant => tenant.type === TRACKS.UNIVERSITY));
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to load administrative analytics.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchSubjects = useCallback(async () => {
    try {
      const res = await adminService.getSubjects({
        tenantId: selectedTenant,
        track: selectedTrack,
      });
      if (res.data.success) {
        setSubjects(res.data.subjects);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch subjects list.");
    }
  }, [selectedTenant, selectedTrack]);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await adminService.getUsers({
        tenantId: selectedTenant,
        search: searchQuery,
      });
      if (res.data.success) {
        setUsers(res.data.users);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch user directory.");
    }
  }, [selectedTenant, searchQuery]);

  const fetchLinkReports = useCallback(async () => {
    try {
      const res = await adminService.getLinkReports({ status: reportStatus });
      if (res.data.success) setLinkReports(res.data.reports || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load broken-link reports.");
    }
  }, [reportStatus]);

  const handleLinkReportUpdate = async (report, status) => {
    try {
      const res = await adminService.updateLinkReport(report._id, { status });
      if (res.data.success) {
        setSuccessMsg(res.data.message);
        fetchLinkReports();
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update link report.");
    }
  };

  const handleDeleteSubject = async (id) => {
    if (
      !window.confirm(
        "Are you sure? This will purge all associated student progress records.",
      )
    )
      return;
    try {
      const res = await adminService.deleteSubject(id);
      if (res.data.success) {
        setSuccessMsg(res.data.message);
        fetchSubjects();
        fetchInitialData();
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete subject.");
    }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm("Permanently delete this user account?")) return;
    try {
      const res = await adminService.deleteUser(id);
      if (res.data.success) {
        setSuccessMsg(res.data.message);
        fetchUsers();
        fetchInitialData();
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete user.");
    }
  };

  const handleSubjectSubmit = async (e) => {
    e.preventDefault();
    try {
      let res;
      if (editingSubject) {
        res = await adminService.updateSubject(editingSubject._id, subjectForm);
      } else {
        res = await adminService.createSubject(subjectForm);
      }

      if (res.data.success) {
        setSuccessMsg(res.data.message);
        setShowSubjectModal(false);
        setEditingSubject(null);
        resetSubjectForm();
        fetchSubjects();
        fetchInitialData();
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save subject.");
    }
  };

  const resetSubjectForm = () => {
    setSubjectForm({
      name: "",
      courseCode: "",
      credits: "",
      track: TRACKS.UNIVERSITY,
      tenantId: tenants.find(tenant => tenant.type === TRACKS.UNIVERSITY)?._id || "",
      branch: "",
      semester: "1",
      examCategory: TARGET_EXAMS.JEE_MAINS,
    });
  };

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  useEffect(() => {
    if (activeTab === "subjects") fetchSubjects();
    if (activeTab === "users") fetchUsers();
    if (activeTab === "link-reports") fetchLinkReports();
  }, [activeTab, fetchSubjects, fetchUsers, fetchLinkReports]);

  if (loading) {
    return <main className="min-h-screen bg-[#fbfbfa] px-6 pt-40 text-center text-xs font-black uppercase tracking-widest text-gray-400">Loading admin console…</main>;
  }

  return (
    <div className="min-h-screen bg-[#fbfbfa] pt-28 pb-20 px-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Admin Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-gray-200 pb-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 text-white text-xs font-bold uppercase tracking-wider mb-3">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
              Administrative Command Center
            </div>
            <h1 className="text-4xl font-black tracking-tight text-[#1a1a1a]">
              Admin Control Vault
            </h1>
          </div>

          {/* Navigation Tabs */}
          <div className="flex bg-gray-100 p-1.5 rounded-2xl border border-gray-200 gap-1">
            {["overview", "subjects", "users", "link-reports"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                  activeTab === tab
                    ? "bg-white text-black shadow-sm"
                    : "text-gray-500 hover:text-black"
                }`}
              >
                {tab === "link-reports" ? "link reports" : tab}
              </button>
            ))}
          </div>
        </div>

        {/* Alert Banners */}
        {error && (
          <div className="p-4 rounded-2xl bg-red-50 border border-red-100 text-red-600 text-xs font-bold flex items-center justify-between">
            <span>⚠️ {error}</span>
            <button onClick={() => setError("")}>
              <XCircle className="w-4 h-4" />
            </button>
          </div>
        )}
        {successMsg && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-bold flex items-center justify-between">
            <span>✓ {successMsg}</span>
            <button onClick={() => setSuccessMsg("")}>
              <XCircle className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* TAB 1: OVERVIEW */}
        {activeTab === "overview" && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-3xl p-8 border border-gray-200 shadow-sm flex items-center gap-6">
                <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <Users className="w-7 h-7" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                    Total Enrolled
                  </p>
                  <p className="text-3xl font-black text-gray-900">
                    {stats.totalUsers}
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-3xl p-8 border border-gray-200 shadow-sm flex items-center gap-6">
                <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                  <BookOpen className="w-7 h-7" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                    Curriculum Modules
                  </p>
                  <p className="text-3xl font-black text-gray-900">
                    {stats.totalSubjects}
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-3xl p-8 border border-gray-200 shadow-sm flex items-center gap-6">
                <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <Building2 className="w-7 h-7" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                    Active Institutions
                  </p>
                  <p className="text-3xl font-black text-gray-900">
                    {stats.totalTenants}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: SUBJECT MANAGEMENT */}
        {activeTab === "subjects" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-center gap-3">
                <select
                  value={selectedTenant}
                  onChange={(e) => setSelectedTenant(e.target.value)}
                  className="px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-xs font-bold text-gray-800"
                >
                  <option value="ALL">All Institutions</option>
                  {tenants.map((t) => (
                    <option key={t._id} value={t._id}>
                      {t.name} ({t.shortCode})
                    </option>
                  ))}
                </select>

                <select
                  value={selectedTrack}
                  onChange={(e) => setSelectedTrack(e.target.value)}
                  className="px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-xs font-bold text-gray-800"
                >
                  <option value="ALL">All Tracks</option>
                  <option value={TRACKS.UNIVERSITY}>University Track</option>
                  <option value={TRACKS.JEE}>JEE Track</option>
                  <option value={TRACKS.NEET}>NEET Track</option>
                </select>
              </div>

              <button
                onClick={() => {
                  setEditingSubject(null);
                  resetSubjectForm();
                  setShowSubjectModal(true);
                }}
                className="px-5 py-2.5 bg-black text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 hover:bg-blue-600 transition-all"
              >
                <Plus className="w-4 h-4" /> Add Subject
              </button>
            </div>

            {/* Subjects Table */}
            <div className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-sm">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 border-b border-gray-200 text-[10px] font-black uppercase tracking-widest text-gray-400">
                  <tr>
                    <th className="px-6 py-4">Subject Name</th>
                    <th className="px-6 py-4">Code</th>
                    <th className="px-6 py-4">Track / Category</th>
                    <th className="px-6 py-4">Credits</th>
                    <th className="px-6 py-4">Institution</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {subjects.map((s) => (
                    <tr
                      key={s._id}
                      className="hover:bg-gray-50/50 transition-colors"
                    >
                      <td className="px-6 py-4 font-bold text-gray-900">
                        {s.name}
                      </td>
                      <td className="px-6 py-4 font-medium text-gray-500">
                        {s.courseCode || "N/A"}
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 rounded-md bg-blue-50 text-blue-600 text-[10px] font-black uppercase">
                          {s.track === TRACKS.UNIVERSITY
                            ? `Sem ${s.semester} (${s.branch})`
                            : s.examCategory || s.track}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-bold">
                        {s.track !== TRACKS.UNIVERSITY ? "—" : Number(s.credits) > 0 ? s.credits : <span className="text-amber-600">Missing</span>}
                      </td>
                      <td className="px-6 py-4 font-semibold text-gray-700">
                        {s.tenant?.shortCode || "National Track"}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link
                          to={`/subjects/edit/${s._id}`}
                          aria-label={`Edit ${s.name}`}
                          title="Edit subject"
                          className="inline-flex p-2 text-gray-400 hover:text-blue-600 transition-colors"
                        >
                          <Edit3 className="w-4 h-4" />
                        </Link>
                        <button
                          aria-label={`Delete ${s.name}`}
                          onClick={() => handleDeleteSubject(s._id)}
                          className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: USER DIRECTORY */}
        {activeTab === "users" && (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-gray-400 absolute left-4 top-3.5" />
                <input
                  type="text"
                  placeholder="Search students by name, email, or college..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 text-xs font-semibold focus:outline-none focus:border-black"
                />
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-sm">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 border-b border-gray-200 text-[10px] font-black uppercase tracking-widest text-gray-400">
                  <tr>
                    <th className="px-6 py-4">Student Name</th>
                    <th className="px-6 py-4">Email Address</th>
                    <th className="px-6 py-4">Academic Track</th>
                    <th className="px-6 py-4">Institution / Campus</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {users.map((u) => (
                    <tr
                      key={u._id}
                      className="hover:bg-gray-50/50 transition-colors"
                    >
                      <td className="px-6 py-4 font-bold text-gray-900">
                        {u.name}
                      </td>
                      <td className="px-6 py-4 font-medium text-gray-500">
                        {u.email}
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 rounded-md bg-gray-100 text-gray-700 text-[10px] font-black uppercase">
                          {u.track}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-semibold text-gray-700">
                        {u.tenant?.shortCode || u.college || "N/A"}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleDeleteUser(u._id)}
                          className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "link-reports" && (
          <section className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="flex items-center gap-2 text-xl font-black text-gray-900"><Flag className="h-5 w-5 text-amber-600"/>Broken-link reports</h2>
                <p className="mt-1 text-sm text-gray-500">Student reports for curated practice links and GATE PYQs. Showing up to 200 most recent.</p>
              </div>
              <select aria-label="Report status" value={reportStatus} onChange={e => setReportStatus(e.target.value)} className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-xs font-bold">
                <option value="OPEN">Needs review</option><option value="RESOLVED">Resolved</option><option value="DISMISSED">Dismissed</option><option value="ALL">All reports</option>
              </select>
            </div>
            {linkReports.length ? <div className="space-y-3">{linkReports.map(report => <article key={report._id} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
                <div className="min-w-0 space-y-2">
                  <div className="flex flex-wrap items-center gap-2"><span className={`rounded-full px-2.5 py-1 text-[10px] font-black ${report.status === "OPEN" ? "bg-amber-100 text-amber-800" : report.status === "RESOLVED" ? "bg-emerald-100 text-emerald-800" : "bg-gray-100 text-gray-700"}`}>{report.status}</span><span className="text-xs font-bold uppercase tracking-wide text-gray-500">{report.resourceType === "GATE_PYQ" ? "GATE PYQ" : "Coding practice"}</span><span className="text-xs text-gray-400">{new Date(report.createdAt).toLocaleString()}</span></div>
                  <h3 className="font-black text-gray-900">{report.resourceTitle}</h3>
                  <p className="text-xs text-gray-600">{report.subject?.name || "Deleted subject"}{report.subject?.courseCode ? ` · ${report.subject.courseCode}` : ""}{report.topic ? ` · ${report.topic}` : ""}</p>
                  <p className="text-xs text-gray-500">Reported by {report.reporter?.name || "Unknown student"} {report.reporter?.email ? `(${report.reporter.email})` : ""}</p>
                  <a href={report.resourceUrl} target="_blank" rel="noopener noreferrer" className="inline-flex max-w-full items-center gap-1 break-all text-xs font-semibold text-blue-700 underline">{report.resourceUrl}<ExternalLink className="h-3 w-3 shrink-0"/></a>
                  {report.resolutionNote && <p className="text-xs text-gray-500">Admin note: {report.resolutionNote}</p>}
                </div>
                {report.status === "OPEN" && <div className="flex shrink-0 gap-2"><button type="button" onClick={() => handleLinkReportUpdate(report, "RESOLVED")} className="inline-flex items-center gap-1 rounded-xl bg-emerald-700 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-800"><CheckCircle2 className="h-4 w-4"/>Resolve</button><button type="button" onClick={() => handleLinkReportUpdate(report, "DISMISSED")} className="rounded-xl border border-gray-200 px-3 py-2 text-xs font-bold text-gray-600 hover:bg-gray-50">Dismiss</button></div>}
              </div>
            </article>)}</div> : <div className="rounded-3xl border border-dashed border-gray-300 bg-white p-12 text-center"><Flag className="mx-auto h-8 w-8 text-gray-300"/><p className="mt-3 font-bold text-gray-700">No reports in this view</p><p className="mt-1 text-sm text-gray-500">New student link reports will appear here.</p></div>}
          </section>
        )}
      </div>

      {/* CREATE SUBJECT MODAL */}
      {showSubjectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full border border-gray-100 shadow-2xl space-y-4">
            <h3 className="text-xl font-black text-gray-900">
              Add New Subject Module
            </h3>

            <form onSubmit={handleSubjectSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-black uppercase text-gray-400 mb-1">
                  Subject Name
                </label>
                <input
                  type="text"
                  required
                  value={subjectForm.name}
                  onChange={(e) =>
                    setSubjectForm({ ...subjectForm, name: e.target.value })
                  }
                  placeholder="e.g. Data Structures & Algorithms"
                  className="w-full p-3 rounded-xl border border-gray-200 text-xs font-semibold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-gray-400 mb-1">
                  Course Code
                </label>
                <input
                  type="text"
                  value={subjectForm.courseCode}
                  onChange={(e) =>
                    setSubjectForm({
                      ...subjectForm,
                      courseCode: e.target.value,
                    })
                  }
                  placeholder="e.g. BCS-301"
                  className="w-full p-3 rounded-xl border border-gray-200 text-xs font-semibold"
                />
              </div>
              {subjectForm.track === TRACKS.UNIVERSITY && <div>
                <label className="block text-[10px] font-black uppercase text-gray-400 mb-1">Official Course Credits</label>
                <input type="number" min="0.1" max="100" step="0.1" required value={subjectForm.credits} onChange={(e) => setSubjectForm({ ...subjectForm, credits: e.target.value })} placeholder="e.g. 4" className="w-full p-3 rounded-xl border border-gray-200 text-xs font-semibold" />
              </div>}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black uppercase text-gray-400 mb-1">
                    Track
                  </label>
                  <select
                    value={subjectForm.track}
                    onChange={(e) =>
                      setSubjectForm({ ...subjectForm, track: e.target.value })
                    }
                    className="w-full p-3 rounded-xl border border-gray-200 text-xs font-semibold bg-white"
                  >
                    <option value={TRACKS.UNIVERSITY}>University</option>
                    <option value={TRACKS.JEE}>JEE</option>
                    <option value={TRACKS.NEET}>NEET</option>
                  </select>
                </div>

                {subjectForm.track === TRACKS.UNIVERSITY ? (
                  <div>
                    <label className="block text-[10px] font-black uppercase text-gray-400 mb-1">
                      Institution
                    </label>
                    <select
                      value={subjectForm.tenantId}
                      onChange={(e) =>
                        setSubjectForm({
                          ...subjectForm,
                          tenantId: e.target.value,
                        })
                      }
                      className="w-full p-3 rounded-xl border border-gray-200 text-xs font-semibold bg-white"
                      required
                    >
                      {tenants.map((t) => (
                        <option key={t._id} value={t._id}>
                          {t.shortCode}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="block text-[10px] font-black uppercase text-gray-400 mb-1">
                      Exam Category
                    </label>
                    <select
                      value={subjectForm.examCategory}
                      onChange={(e) =>
                        setSubjectForm({
                          ...subjectForm,
                          examCategory: e.target.value,
                        })
                      }
                      className="w-full p-3 rounded-xl border border-gray-200 text-xs font-semibold bg-white"
                    >
                      <option value={TARGET_EXAMS.JEE_MAINS}>JEE Mains</option>
                      <option value={TARGET_EXAMS.JEE_ADVANCED}>JEE Advanced</option>
                      <option value={TARGET_EXAMS.NEET}>NEET</option>
                    </select>
                  </div>
                )}
              </div>

              {subjectForm.track === TRACKS.UNIVERSITY && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-black uppercase text-gray-400 mb-1">
                      Branch
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. CSE"
                      value={subjectForm.branch}
                      onChange={(e) =>
                        setSubjectForm({
                          ...subjectForm,
                          branch: e.target.value,
                        })
                      }
                      className="w-full p-3 rounded-xl border border-gray-200 text-xs font-semibold uppercase"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase text-gray-400 mb-1">
                      Semester
                    </label>
                    <select
                      value={subjectForm.semester}
                      onChange={(e) =>
                        setSubjectForm({
                          ...subjectForm,
                          semester: e.target.value,
                        })
                      }
                      className="w-full p-3 rounded-xl border border-gray-200 text-xs font-semibold bg-white"
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                        <option key={s} value={s}>
                          Sem {s}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSubjectModal(false)}
                  className="w-1/2 py-3 rounded-xl bg-gray-100 text-gray-700 text-xs font-bold uppercase"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-3 rounded-xl bg-black text-white text-xs font-bold uppercase hover:bg-blue-600 transition-all"
                >
                  Create Subject
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

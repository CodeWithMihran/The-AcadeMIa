import { TRACKS, TARGET_EXAMS } from "../constants";
import React, { useCallback, useState, useEffect, useRef } from "react";
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
  const subjectModalRef = useRef(null);
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

  useEffect(() => {
    if (!showSubjectModal) return undefined;
    const dialog = subjectModalRef.current;
    const previousFocus = document.activeElement;
    const getFocusable = () => [...(dialog?.querySelectorAll('button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href]') || [])];
    getFocusable()[0]?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setShowSubjectModal(false);
      } else if (event.key === "Tab") {
        const focusable = getFocusable();
        if (!focusable.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
      previousFocus?.focus?.();
    };
  }, [showSubjectModal]);

  if (loading) {
    return <main className="min-h-screen bg-app px-4 pb-16 pt-28 sm:px-6 lg:px-8"><div role="status" aria-label="Loading administration" className="mx-auto max-w-7xl animate-pulse space-y-5"><div className="h-32 rounded-3xl border border-line bg-surface"/><div className="grid gap-4 sm:grid-cols-3"><div className="h-24 rounded-2xl border border-line bg-surface"/><div className="h-24 rounded-2xl border border-line bg-surface"/><div className="h-24 rounded-2xl border border-line bg-surface"/></div><div className="h-72 rounded-2xl border border-line bg-surface"/></div></main>;
  }

  return (
    <main className="min-h-screen bg-app px-4 pb-16 pt-28 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-7 sm:space-y-9">
        {/* Admin Header */}
        <header className="flex flex-col gap-5 rounded-3xl border border-line bg-surface p-5 shadow-sm sm:p-7 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-line bg-surface-muted px-3 py-1.5 text-[11px] font-bold text-content-secondary mb-3">
              <ShieldAlert className="h-3.5 w-3.5 text-amber-600" />
              Administration
            </div>
            <h1 className="text-3xl font-black tracking-tight text-content sm:text-4xl">Admin workspace</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-content-muted">Manage the subject catalog, accounts, and student-reported links from one place.</p>
          </div>

          {/* Navigation Tabs */}
          <nav aria-label="Administration sections" className="-mx-1 flex max-w-full gap-1 overflow-x-auto rounded-2xl border border-line bg-surface-muted p-1.5">
            {["overview", "subjects", "users", "link-reports"].map((tab) => (
              <button
                key={tab}
                type="button"
                aria-pressed={activeTab === tab}
                onClick={() => setActiveTab(tab)}
                className={`min-h-10 shrink-0 rounded-xl px-4 py-2.5 text-xs font-bold capitalize transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                  activeTab === tab
                    ? "bg-surface text-content shadow-sm"
                    : "text-content-muted hover:text-content"
                }`}
              >
                {tab === "link-reports" ? "link reports" : tab}
              </button>
            ))}
          </nav>
        </header>

        {/* Alert Banners */}
        {error && (
          <div role="alert" className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-sm font-semibold flex flex-wrap items-center justify-between gap-3">
            <span>⚠️ {error}</span>
            <div className="flex items-center gap-2"><button type="button" onClick={() => { if (activeTab === "overview") fetchInitialData(); else if (activeTab === "subjects") fetchSubjects(); else if (activeTab === "users") fetchUsers(); else fetchLinkReports(); }} className="min-h-11 rounded-xl border border-red-200 bg-surface px-4 py-2 text-xs font-bold">Retry</button><button type="button" aria-label="Dismiss error" onClick={() => setError("")} className="min-h-11 min-w-11 rounded-xl hover:bg-red-100"><XCircle className="mx-auto w-4 h-4" /></button></div>
          </div>
        )}
        {successMsg && (
          <div role="status" aria-live="polite" className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-800 text-sm font-semibold flex items-center justify-between">
            <span>✓ {successMsg}</span>
            <button type="button" aria-label="Dismiss success message" onClick={() => setSuccessMsg("")} className="min-h-10 min-w-10 rounded-lg hover:bg-emerald-100">
              <XCircle className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* TAB 1: OVERVIEW */}
        {activeTab === "overview" && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="bg-surface rounded-2xl p-5 border border-line shadow-sm flex items-center gap-4 sm:p-6">
                <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <Users className="w-7 h-7" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-content-faint">
                    Total Enrolled
                  </p>
                  <p className="text-3xl font-black text-content">
                    {stats.totalUsers}
                  </p>
                </div>
              </div>

              <div className="bg-surface rounded-2xl p-5 border border-line shadow-sm flex items-center gap-4 sm:p-6">
                <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                  <BookOpen className="w-7 h-7" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-content-faint">
                    Curriculum Modules
                  </p>
                  <p className="text-3xl font-black text-content">
                    {stats.totalSubjects}
                  </p>
                </div>
              </div>

              <div className="bg-surface rounded-2xl p-5 border border-line shadow-sm flex items-center gap-4 sm:p-6">
                <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <Building2 className="w-7 h-7" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-content-faint">
                    Active Institutions
                  </p>
                  <p className="text-3xl font-black text-content">
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
                  aria-label="Filter subjects by institution"
                  value={selectedTenant}
                  onChange={(e) => setSelectedTenant(e.target.value)}
                  className="min-h-11 flex-1 px-4 py-2.5 rounded-xl border border-line bg-surface text-sm font-semibold text-content-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 sm:flex-none"
                >
                  <option value="ALL">All Institutions</option>
                  {tenants.map((t) => (
                    <option key={t._id} value={t._id}>
                      {t.name} ({t.shortCode})
                    </option>
                  ))}
                </select>

                <select
                  aria-label="Filter subjects by study track"
                  value={selectedTrack}
                  onChange={(e) => setSelectedTrack(e.target.value)}
                  className="min-h-11 flex-1 px-4 py-2.5 rounded-xl border border-line bg-surface text-sm font-semibold text-content-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 sm:flex-none"
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
                className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-surface-inverse px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white transition hover:bg-blue-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 sm:w-auto"
              >
                <Plus className="w-4 h-4" /> Add Subject
              </button>
            </div>

            {/* Subjects Table */}
            <div className="bg-surface rounded-3xl border border-line overflow-x-auto shadow-sm">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="bg-surface-muted border-b border-line text-[10px] font-black uppercase tracking-widest text-content-faint">
                  <tr>
                    <th className="px-6 py-4">Subject Name</th>
                    <th className="px-6 py-4">Code</th>
                    <th className="px-6 py-4">Track / Category</th>
                    <th className="px-6 py-4">Credits</th>
                    <th className="px-6 py-4">Institution</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {subjects.length ? subjects.map((s) => (
                    <tr
                      key={s._id}
                      className="hover:bg-surface-muted/50 transition-colors"
                    >
                      <td className="px-6 py-4 font-bold text-content">
                        {s.name}
                      </td>
                      <td className="px-6 py-4 font-medium text-content-muted">
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
                      <td className="px-6 py-4 font-semibold text-content-secondary">
                        {s.tenant?.shortCode || "National Track"}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link
                          to={`/subjects/edit/${s._id}`}
                          aria-label={`Edit ${s.name}`}
                          title="Edit subject"
                          className="inline-flex p-2 text-content-faint hover:text-blue-600 transition-colors"
                        >
                          <Edit3 className="w-4 h-4" />
                        </Link>
                        <button
                          aria-label={`Delete ${s.name}`}
                          onClick={() => handleDeleteSubject(s._id)}
                          className="p-2 text-content-faint hover:text-red-600 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  )) : <tr><td colSpan="6" className="px-6 py-10 text-center text-sm text-content-muted">{error && activeTab === "subjects" ? "Subject results could not be confirmed. Review the error above and retry." : "No subjects match the selected filters. Adjust the filters or add a subject."}</td></tr>}
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
                <Search className="w-4 h-4 text-content-faint absolute left-4 top-3.5" />
                <input
                  aria-label="Search students"
                  type="text"
                  placeholder="Search students by name, email, or college..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-line text-xs font-semibold focus:outline-none focus:border-black"
                />
              </div>
            </div>

            <div className="bg-surface rounded-3xl border border-line overflow-x-auto shadow-sm">
              <table className="w-full min-w-[680px] text-left text-sm">
                <thead className="bg-surface-muted border-b border-line text-[10px] font-black uppercase tracking-widest text-content-faint">
                  <tr>
                    <th className="px-6 py-4">Student Name</th>
                    <th className="px-6 py-4">Email Address</th>
                    <th className="px-6 py-4">Academic Track</th>
                    <th className="px-6 py-4">Institution / Campus</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {users.length ? users.map((u) => (
                    <tr
                      key={u._id}
                      className="hover:bg-surface-muted/50 transition-colors"
                    >
                      <td className="px-6 py-4 font-bold text-content">
                        {u.name}
                      </td>
                      <td className="px-6 py-4 font-medium text-content-muted">
                        {u.email}
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 rounded-md bg-surface-subtle text-content-secondary text-[10px] font-black uppercase">
                          {u.track}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-semibold text-content-secondary">
                        {u.tenant?.shortCode || u.college || "N/A"}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          type="button"
                          aria-label={`Delete ${u.name}`}
                          onClick={() => handleDeleteUser(u._id)}
                          className="p-2 text-content-faint hover:text-red-600 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  )) : <tr><td colSpan="5" className="px-6 py-10 text-center text-sm text-content-muted">{error && activeTab === "users" ? "Student results could not be confirmed. Review the error above and retry." : "No students match this search."}</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "link-reports" && (
          <section className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="flex items-center gap-2 text-xl font-black text-content"><Flag className="h-5 w-5 text-amber-600"/>Broken-link reports</h2>
                <p className="mt-1 text-sm text-content-muted">Student reports for curated practice links and GATE PYQs. Showing up to 200 most recent.</p>
              </div>
              <select aria-label="Report status" value={reportStatus} onChange={e => setReportStatus(e.target.value)} className="rounded-xl border border-line bg-surface px-4 py-2.5 text-xs font-bold">
                <option value="OPEN">Needs review</option><option value="RESOLVED">Resolved</option><option value="DISMISSED">Dismissed</option><option value="ALL">All reports</option>
              </select>
            </div>
            {linkReports.length ? <div className="space-y-3">{linkReports.map(report => <article key={report._id} className="rounded-2xl border border-line bg-surface p-5 shadow-sm">
              <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
                <div className="min-w-0 space-y-2">
                  <div className="flex flex-wrap items-center gap-2"><span className={`rounded-full px-2.5 py-1 text-[10px] font-black ${report.status === "OPEN" ? "bg-amber-100 text-amber-800" : report.status === "RESOLVED" ? "bg-emerald-100 text-emerald-800" : "bg-surface-subtle text-content-secondary"}`}>{report.status}</span><span className="text-xs font-bold uppercase tracking-wide text-content-muted">{report.resourceType === "GATE_PYQ" ? "GATE PYQ" : "Coding practice"}</span><span className="text-xs text-content-faint">{new Date(report.createdAt).toLocaleString()}</span></div>
                  <h3 className="font-black text-content">{report.resourceTitle}</h3>
                  <p className="text-xs text-content-secondary">{report.subject?.name || "Deleted subject"}{report.subject?.courseCode ? ` · ${report.subject.courseCode}` : ""}{report.topic ? ` · ${report.topic}` : ""}</p>
                  <p className="text-xs text-content-muted">Reported by {report.reporter?.name || "Unknown student"} {report.reporter?.email ? `(${report.reporter.email})` : ""}</p>
                  <a href={report.resourceUrl} target="_blank" rel="noopener noreferrer" className="inline-flex max-w-full items-center gap-1 break-all text-xs font-semibold text-blue-700 underline">{report.resourceUrl}<ExternalLink className="h-3 w-3 shrink-0"/></a>
                  {report.resolutionNote && <p className="text-xs text-content-muted">Admin note: {report.resolutionNote}</p>}
                </div>
                {report.status === "OPEN" && <div className="flex shrink-0 gap-2"><button type="button" onClick={() => handleLinkReportUpdate(report, "RESOLVED")} className="inline-flex items-center gap-1 rounded-xl bg-emerald-700 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-800"><CheckCircle2 className="h-4 w-4"/>Resolve</button><button type="button" onClick={() => handleLinkReportUpdate(report, "DISMISSED")} className="rounded-xl border border-line px-3 py-2 text-xs font-bold text-content-secondary hover:bg-surface-muted">Dismiss</button></div>}
              </div>
            </article>)}</div> : <div className="rounded-3xl border border-dashed border-line-strong bg-surface p-12 text-center"><Flag className="mx-auto h-8 w-8 text-content-faint"/><p className="mt-3 font-bold text-content-secondary">No reports in this view</p><p className="mt-1 text-sm text-content-muted">New student link reports will appear here.</p></div>}
          </section>
        )}
      </div>

      {/* CREATE SUBJECT MODAL */}
      {showSubjectModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm sm:items-center">
          <section ref={subjectModalRef} role="dialog" aria-modal="true" aria-labelledby="create-subject-title" className="my-auto max-h-[calc(100dvh-2rem)] w-full max-w-md space-y-4 overflow-y-auto rounded-3xl border border-line bg-surface p-5 shadow-2xl sm:p-8">
            <h3 id="create-subject-title" className="text-xl font-black text-content">
              Add New Subject Module
            </h3>

            <form onSubmit={handleSubjectSubmit} className="space-y-4">
              <div>
                <label htmlFor="subject-name" className="block text-[10px] font-black uppercase text-content-faint mb-1">
                  Subject Name
                </label>
                <input
                  id="subject-name"
                  type="text"
                  required
                  value={subjectForm.name}
                  onChange={(e) =>
                    setSubjectForm({ ...subjectForm, name: e.target.value })
                  }
                  placeholder="e.g. Data Structures & Algorithms"
                  className="w-full p-3 rounded-xl border border-line text-xs font-semibold"
                />
              </div>

              <div>
                <label htmlFor="course-code" className="block text-[10px] font-black uppercase text-content-faint mb-1">
                  Course Code
                </label>
                <input
                  id="course-code"
                  type="text"
                  value={subjectForm.courseCode}
                  onChange={(e) =>
                    setSubjectForm({
                      ...subjectForm,
                      courseCode: e.target.value,
                    })
                  }
                  placeholder="e.g. BCS-301"
                  className="w-full p-3 rounded-xl border border-line text-xs font-semibold"
                />
              </div>
              {subjectForm.track === TRACKS.UNIVERSITY && <div>
                <label htmlFor="subject-credits" className="block text-[10px] font-black uppercase text-content-faint mb-1">Official Course Credits</label>
                <input id="subject-credits" type="number" min="0.1" max="100" step="0.1" required value={subjectForm.credits} onChange={(e) => setSubjectForm({ ...subjectForm, credits: e.target.value })} placeholder="e.g. 4" className="w-full p-3 rounded-xl border border-line text-xs font-semibold" />
              </div>}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="subject-track" className="block text-[10px] font-black uppercase text-content-faint mb-1">
                    Track
                  </label>
                  <select
                    id="subject-track"
                    value={subjectForm.track}
                    onChange={(e) =>
                      setSubjectForm({ ...subjectForm, track: e.target.value })
                    }
                    className="w-full p-3 rounded-xl border border-line text-xs font-semibold bg-surface"
                  >
                    <option value={TRACKS.UNIVERSITY}>University</option>
                    <option value={TRACKS.JEE}>JEE</option>
                    <option value={TRACKS.NEET}>NEET</option>
                  </select>
                </div>

                {subjectForm.track === TRACKS.UNIVERSITY ? (
                  <div>
                    <label htmlFor="subject-tenant" className="block text-[10px] font-black uppercase text-content-faint mb-1">
                      Institution
                    </label>
                    <select
                      id="subject-tenant"
                      value={subjectForm.tenantId}
                      onChange={(e) =>
                        setSubjectForm({
                          ...subjectForm,
                          tenantId: e.target.value,
                        })
                      }
                      className="w-full p-3 rounded-xl border border-line text-xs font-semibold bg-surface"
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
                    <label htmlFor="subject-exam-category" className="block text-[10px] font-black uppercase text-content-faint mb-1">
                      Exam Category
                    </label>
                    <select
                      id="subject-exam-category"
                      value={subjectForm.examCategory}
                      onChange={(e) =>
                        setSubjectForm({
                          ...subjectForm,
                          examCategory: e.target.value,
                        })
                      }
                      className="w-full p-3 rounded-xl border border-line text-xs font-semibold bg-surface"
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
                    <label htmlFor="subject-branch" className="block text-[10px] font-black uppercase text-content-faint mb-1">
                      Branch
                    </label>
                    <input
                      id="subject-branch"
                      type="text"
                      placeholder="e.g. CSE"
                      value={subjectForm.branch}
                      onChange={(e) =>
                        setSubjectForm({
                          ...subjectForm,
                          branch: e.target.value,
                        })
                      }
                      className="w-full p-3 rounded-xl border border-line text-xs font-semibold uppercase"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="subject-semester" className="block text-[10px] font-black uppercase text-content-faint mb-1">
                      Semester
                    </label>
                    <select
                      id="subject-semester"
                      value={subjectForm.semester}
                      onChange={(e) =>
                        setSubjectForm({
                          ...subjectForm,
                          semester: e.target.value,
                        })
                      }
                      className="w-full p-3 rounded-xl border border-line text-xs font-semibold bg-surface"
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
                  className="w-1/2 py-3 rounded-xl bg-surface-subtle text-content-secondary text-xs font-bold uppercase"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-3 rounded-xl bg-surface-inverse text-white text-xs font-bold uppercase hover:bg-blue-600 transition-all"
                >
                  Create Subject
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </main>
  );
};

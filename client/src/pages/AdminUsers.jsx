import React, { useMemo, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminService } from '../services/api';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import {
  Users, 
  ShieldCheck, 
  GraduationCap, 
  Trash2, 
  Search, 
  AlertTriangle, 
  CheckCircle2,
  ArrowLeft
} from 'lucide-react';

export const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebouncedValue(searchTerm, 300);

  const fetchUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await adminService.getUsers();
      if (res.data.success) {
        setUsers(res.data.users);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch user directory.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleDeleteUser = async (userId, userName) => {
    if (!window.confirm(`Permanently delete ${userName}'s account and associated records? This action cannot be undone.`)) {
      return;
    }

    try {
      const res = await adminService.deleteUser(userId);
      if (res.data.success) {
        setSuccess(`User ${userName} and associated records were permanently deleted.`);
        setUsers(currentUsers => currentUsers.filter(user => user._id !== userId));
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete user record.');
      setTimeout(() => setError(''), 3000);
    }
  };

  // Filter users based on search input
  const filteredUsers = useMemo(() => {
    const query = debouncedSearchTerm.trim().toLocaleLowerCase();
    if (!query) return users;
    return users.filter((user) => [user.name, user.email, user.branch]
      .some((value) => String(value || '').toLocaleLowerCase().includes(query)));
  }, [users, debouncedSearchTerm]);

  return (
    <main className="min-h-screen bg-app px-4 pb-16 pt-28 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-7 sm:space-y-9">
        
        {/* Header */}
        <header className="flex flex-col gap-5 rounded-3xl border border-line bg-surface p-5 shadow-sm sm:flex-row sm:items-end sm:justify-between sm:p-7">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700"><Users className="h-5 w-5" /></div>
              <h1 className="text-3xl font-black tracking-tight text-content sm:text-4xl">User directory</h1>
            </div>
            <p className="mt-2 text-sm text-content-muted">Review accounts, academic tracks, and access roles.</p>
          </div>
          
          <Link 
            to="/admin" 
            className="inline-flex min-h-11 items-center justify-center gap-2 self-start rounded-xl border border-line bg-surface px-4 py-2.5 text-xs font-bold text-content-secondary transition hover:bg-surface-inverse hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 sm:self-auto"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Console
          </Link>
        </header>

        {/* Feedback Alerts */}
        {error && (
          <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-4 text-sm font-semibold text-red-800">
            <AlertTriangle className="w-5 h-5" /> {error}
            <button type="button" onClick={fetchUsers} disabled={loading} className="min-h-10 rounded-xl bg-surface px-4 py-2 text-xs font-bold text-content shadow-sm disabled:opacity-60">{loading ? "Retrying…" : "Try again"}</button>
          </div>
        )}
        {success && (
          <div role="status" aria-live="polite" className="flex items-center gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-4 text-sm font-semibold text-emerald-800">
            <CheckCircle2 className="w-5 h-5" /> {success}
          </div>
        )}

        {/* Search Toolbar */}
        <section className="flex flex-col gap-3 rounded-2xl border border-line bg-surface p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between" aria-label="Search and filter users">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-content-faint" />
            <input 
              type="text"
              placeholder="Search by name, email, or branch..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="min-h-11 w-full rounded-xl border border-line bg-surface py-2.5 pl-11 pr-4 text-sm font-medium text-content focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold text-content-muted">
            <span>{searchTerm ? "Matching users" : "Total users"}</span>
            <span className="rounded-full bg-surface-muted px-3 py-1.5 text-xs font-black text-content">{loading ? "—" : filteredUsers.length}</span>
          </div>
        </section>

        {/* Table Container */}
        <section className="overflow-hidden rounded-2xl border border-line bg-surface shadow-sm" aria-label="User records">
          {loading ? (
            <div className="p-24 text-center space-y-3">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-content-faint font-bold text-xs uppercase tracking-widest">Loading user directory…</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-24 text-center">
              <Users className="w-12 h-12 text-content-faint mx-auto mb-3" />
              <p className="text-content-muted font-bold text-sm">{error ? "User records could not be confirmed." : debouncedSearchTerm ? "No users match this search." : "No user accounts are available yet."}</p>
              {error && <button type="button" onClick={fetchUsers} className="mt-4 min-h-10 rounded-xl border border-line px-4 py-2 text-xs font-bold text-content-secondary hover:bg-surface-muted">Retry loading users</button>}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-muted border-b border-line">
                    <th className="py-4 px-6 text-[10px] font-extrabold uppercase tracking-[0.15em] text-content-faint">Identity</th>
                    <th className="py-4 px-6 text-[10px] font-extrabold uppercase tracking-[0.15em] text-content-faint">Email address</th>
                    <th className="py-4 px-6 text-[10px] font-extrabold uppercase tracking-[0.15em] text-content-faint">Branch / Sem</th>
                    <th className="py-4 px-6 text-[10px] font-extrabold uppercase tracking-[0.15em] text-content-faint">Year</th>
                    <th className="py-4 px-6 text-[10px] font-extrabold uppercase tracking-[0.15em] text-content-faint">Access Level</th>
                    <th className="py-4 px-6 text-[10px] font-extrabold uppercase tracking-[0.15em] text-content-faint text-center">Control</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {filteredUsers.map((u) => (
                    <tr key={u._id} className="hover:bg-surface-muted/50 transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 bg-surface-subtle rounded-xl flex items-center justify-center font-black text-content text-xs shadow-inner">
                            {u.name?.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-bold text-sm text-content">{u.name}</span>
                        </div>
                      </td>
                      
                      <td className="py-4 px-6 font-medium text-content-muted text-xs italic">
                        {u.email}
                      </td>
                      
                      <td className="py-4 px-6">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[10px] font-black text-blue-600 uppercase tracking-tighter">{u.branch || 'Not Set'}</span>
                          <span className="text-[9px] font-bold text-content-faint uppercase">Semester {u.semester || 1}</span>
                        </div>
                      </td>

                      <td className="py-4 px-6 font-bold text-xs text-content-secondary">
                        Year {u.year || 1}
                      </td>

                      <td className="py-4 px-6">
                        {u.role === 'admin' ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-purple-50 text-purple-600 border border-purple-100 text-[9px] font-black uppercase tracking-wider">
                            <ShieldCheck className="w-3 h-3" /> Admin Console
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-blue-50 text-blue-600 border border-blue-100 text-[9px] font-black uppercase tracking-wider">
                            <GraduationCap className="w-3 h-3" /> Student Access
                          </span>
                        )}
                      </td>

                      <td className="py-4 px-6 text-center">
                        <button 
                          onClick={() => handleDeleteUser(u._id, u.name)}
                          className="inline-flex items-center gap-1 text-[10px] font-black text-red-400 uppercase tracking-widest hover:text-red-600 transition-all hover:bg-red-50 px-3 py-2 rounded-xl"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Footer info */}
      </div>
    </main>
  );
};

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminService } from '../services/api';
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
    if (!window.confirm(`Are you sure you want to permanently archive records for ${userName}?`)) {
      return;
    }

    try {
      const res = await adminService.deleteUser(userId);
      if (res.data.success) {
        setSuccess(`User ${userName} successfully archived.`);
        setUsers(users.filter(u => u._id !== userId));
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete user record.');
      setTimeout(() => setError(''), 3000);
    }
  };

  // Filter users based on search input
  const filteredUsers = users.filter(u => 
    u.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.branch?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#fbfbfa] pt-32 pb-20 px-6 animate-in fade-in duration-500">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="h-2 w-2 rounded-full bg-blue-600 animate-pulse"></div>
              <h1 className="text-4xl font-black tracking-tighter text-[#1a1a1a] italic">
                User <span className="text-gray-400 font-light not-italic">Directory</span>
              </h1>
            </div>
            <p className="text-gray-500 font-medium italic text-sm tracking-tight">Authenticating & Managing Student Access</p>
          </div>
          
          <Link 
            to="/admin" 
            className="flex items-center gap-2 bg-white border border-gray-200 text-[#1a1a1a] px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-black hover:text-white transition-all shadow-sm active:scale-95"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Console
          </Link>
        </div>

        {/* Feedback Alerts */}
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

        {/* Search Toolbar */}
        <div className="mb-6 flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text"
              placeholder="Search by name, email, or branch..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold focus:outline-none focus:border-blue-500"
            />
          </div>
          <div className="flex items-center gap-2 text-xs font-bold text-gray-400 px-2">
            <span>Total Records:</span>
            <span className="bg-[#0a0a0a] text-white px-3 py-1 rounded-full text-[10px] font-black">{filteredUsers.length}</span>
          </div>
        </div>

        {/* Table Container */}
        <div className="bg-white rounded-[2.5rem] border border-gray-200 overflow-hidden shadow-sm">
          {loading ? (
            <div className="p-24 text-center space-y-3">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-gray-400 font-bold text-xs uppercase tracking-widest">Loading Directory...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-24 text-center">
              <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-bold italic text-sm">No matching user records found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#fcfcfc] border-b border-gray-100">
                    <th className="py-4 px-6 text-[10px] font-extrabold uppercase tracking-[0.15em] text-gray-400">Identity</th>
                    <th className="py-4 px-6 text-[10px] font-extrabold uppercase tracking-[0.15em] text-gray-400">Email Credentials</th>
                    <th className="py-4 px-6 text-[10px] font-extrabold uppercase tracking-[0.15em] text-gray-400">Branch / Sem</th>
                    <th className="py-4 px-6 text-[10px] font-extrabold uppercase tracking-[0.15em] text-gray-400">Year</th>
                    <th className="py-4 px-6 text-[10px] font-extrabold uppercase tracking-[0.15em] text-gray-400">Access Level</th>
                    <th className="py-4 px-6 text-[10px] font-extrabold uppercase tracking-[0.15em] text-gray-400 text-center">Control</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredUsers.map((u) => (
                    <tr key={u._id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 bg-gray-100 rounded-xl flex items-center justify-center font-black text-[#1a1a1a] text-xs shadow-inner">
                            {u.name?.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-bold text-sm text-[#1a1a1a]">{u.name}</span>
                        </div>
                      </td>
                      
                      <td className="py-4 px-6 font-medium text-gray-500 text-xs italic">
                        {u.email}
                      </td>
                      
                      <td className="py-4 px-6">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[10px] font-black text-blue-600 uppercase tracking-tighter">{u.branch || 'Not Set'}</span>
                          <span className="text-[9px] font-bold text-gray-400 uppercase">Semester {u.semester || 1}</span>
                        </div>
                      </td>

                      <td className="py-4 px-6 font-bold text-xs text-gray-600">
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
        </div>

        {/* Footer info */}
        <div className="mt-20 flex flex-col md:flex-row justify-between items-center pt-10 border-t border-gray-200 gap-4">
          <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.5em]">RIT AcadeMIA Terminal Directory</p>
          <div className="flex gap-6">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest italic">Encrypted Database Link Active</span>
          </div>
        </div>

      </div>
    </div>
  );
};
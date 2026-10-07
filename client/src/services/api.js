import axios from 'axios';

// In development, send requests through Vite so the browser sees same-origin
// API calls regardless of whether the app is opened on localhost, 127.0.0.1,
// or a fallback Vite port. In production, same-origin is the safe default;
// deployments with a separately hosted API must configure VITE_API_BASE_URL.
const API_BASE = (
  import.meta.env.DEV
    ? '/api'
    : (import.meta.env.VITE_API_BASE_URL || '/api')
).replace(/\/$/, '');

const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Attach token from localStorage if available
api.interceptors.request.use((config) => {
  let token = null;
  try { token = localStorage.getItem('academia_token'); } catch { /* HttpOnly cookies can authenticate requests when storage is blocked. */ }
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 unauthorized globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      if (window.location.pathname !== '/' && !window.location.pathname.startsWith('/auth')) {
        try { localStorage.removeItem('academia_token'); } catch { /* Continue clearing the in-memory session. */ }
        window.location.href = '/'; // ✅ Added forced redirect to login page on session expiry
      }
    }
    return Promise.reject(error);
  }
);

// Auth Endpoints
export const authService = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout'),
  updateProfile: (data) => api.put('/auth/profile', data) // ✅ Added this line for Profile.jsx
};

// Tenant Endpoints
export const tenantService = {
  getTenants: () => api.get('/tenants'),
  resolveDomain: (email) => api.post('/tenants/resolve-domain', { email }),
  completeOnboarding: (data) => api.post('/tenants/onboarding', data)
};

// Subject Endpoints
export const subjectService = {
  getSubjects: () => api.get('/subjects'),
  getBranches: (tenantId) => api.get('/subjects/branches', { params: { tenantId } }),
  getSubjectById: (id) => api.get(`/subjects/${id}`)
};

// Progress Endpoints
export const progressService = {
  toggleTopic: (subjectId, topicId) => api.post('/progress/toggle', { subjectId, topicId }),
  getSubjectProgress: (subjectId) => api.get(`/progress/${subjectId}`),
  getGlobalProgress: () => api.get('/progress/overview'),
  getLeaderboard: () => api.get('/progress/leaderboard'),
  getActivity: () => api.get('/progress/activity'),
  getCareerProgress: (subjectId) => api.get(`/progress/career/${subjectId}`),
  setCareerCompletion: (data) => api.put('/progress/career-resource', data)
};

// Persistent student utility tools
export const studyToolsService = {
  getTools: () => api.get('/study-tools'),
  saveAttendance: (attendance, overallAttendance) => api.put('/study-tools/attendance', { attendance, overallAttendance }),
  saveSessionals: (sessionals) => api.put('/study-tools/sessionals', { sessionals }),
  savePlanner: (planner) => api.put('/study-tools/planner', planner)
};

export const communityService = {
  getWallet: () => api.get('/community/wallet'),
  getMyNotes: () => api.get('/community/my-notes'),
  getSubjectNotes: (subjectId) => api.get(`/community/subjects/${subjectId}/notes`),
  submitNote: (data) => api.post('/community/notes', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  upvoteNote: (noteId) => api.post(`/community/notes/${noteId}/upvote`),
  createBounty: (data) => api.post('/community/bounties', data),
  cancelBounty: (bountyId) => api.post(`/community/bounties/${bountyId}/cancel`),
  getModerationQueue: () => api.get('/community/moderation/queue'),
  reviewNote: (noteId, data) => api.patch(`/community/moderation/notes/${noteId}`, data),
  noteFile: (noteId) => api.get(`/community/notes/${noteId}/file`, { responseType: 'blob' }),
  grantAmbassador: (userId, data) => api.patch(`/community/admin/users/${userId}/ambassador`, data),
  adjustCredits: (userId, data) => api.post(`/community/admin/users/${userId}/credits`, data)
};

// Admin Endpoints
export const adminService = {
  getOverview: () => api.get('/admin/overview'),
  getSubjects: (params) => api.get('/admin/subjects', { params }),
  getSubject: (id) => api.get(`/admin/subjects/${id}`),
  createSubject: (data) => api.post('/admin/subjects', data),
  updateSubject: (id, data) => api.put(`/admin/subjects/${id}`, data),
  deleteSubject: (id) => api.delete(`/admin/subjects/${id}`),
  getUsers: (params) => api.get('/admin/users', { params }),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  getLinkReports: (params) => api.get('/admin/link-reports', { params }),
  updateLinkReport: (id, data) => api.patch(`/admin/link-reports/${id}`, data),
  reportBrokenLink: (subjectId, data) => api.post(`/subjects/${subjectId}/link-reports`, data)
};

export default api;

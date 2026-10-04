import axios from 'axios';

// Keep local frontend/API requests on the same loopback hostname. Browsers can
// resolve `localhost` differently from `127.0.0.1` (especially on Windows/IPv6).
const localApiBase = `${window.location.protocol}//${window.location.hostname}:3000/api`;
const API_BASE = (import.meta.env.VITE_API_BASE_URL || localApiBase).replace(/\/$/, '');

const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Attach token from localStorage if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('academia_token');
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
        localStorage.removeItem('academia_token');
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
  getSubjectById: (id) => api.get(`/subjects/${id}`)
};

// Progress Endpoints
export const progressService = {
  toggleTopic: (subjectId, topicId) => api.post('/progress/toggle', { subjectId, topicId }),
  getSubjectProgress: (subjectId) => api.get(`/progress/${subjectId}`),
  getGlobalProgress: () => api.get('/progress/overview')
};

// Persistent student utility tools
export const studyToolsService = {
  getTools: () => api.get('/study-tools'),
  saveAttendance: (attendance) => api.put('/study-tools/attendance', { attendance }),
  saveSessionals: (sessionals) => api.put('/study-tools/sessionals', { sessionals }),
  savePlanner: (planner) => api.put('/study-tools/planner', planner)
};

// Admin Endpoints
export const adminService = {
  getOverview: () => api.get('/admin/overview'),
  getSubjects: (params) => api.get('/admin/subjects', { params }),
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

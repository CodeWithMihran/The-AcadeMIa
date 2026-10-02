import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

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
  logout: () => api.post('/auth/logout')
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

// Admin Endpoints
export const adminService = {
  getOverview: () => api.get('/admin/overview'),
  getSubjects: (params) => api.get('/admin/subjects', { params }),
  createSubject: (data) => api.post('/admin/subjects', data),
  updateSubject: (id, data) => api.put(`/admin/subjects/${id}`, data),
  deleteSubject: (id) => api.delete(`/admin/subjects/${id}`),
  getUsers: (params) => api.get('/admin/users', { params }),
  deleteUser: (id) => api.delete(`/admin/users/${id}`)
};

export default api;

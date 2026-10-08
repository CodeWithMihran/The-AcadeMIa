import axios, {AxiosError, InternalAxiosRequestConfig} from 'axios';
import {reportSessionExpiration} from './authSession';
import {clearAuthToken, readAuthToken} from './tokenStore';

declare global {
  // Set this before app startup when using a physical device or deployed API.
  // Metro does not automatically load .env files in a bare React Native app.
  var __ACADEMIA_API_BASE_URL__: string | undefined;
}

const configuredBaseUrl = globalThis.__ACADEMIA_API_BASE_URL__?.trim();
const developmentBaseUrl = 'http://10.0.2.2:3000/api';

export const API_BASE_URL = configuredBaseUrl || (__DEV__ ? developmentBaseUrl : '');

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {'Content-Type': 'application/json'},
});

api.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  if (!API_BASE_URL) {
    throw new Error(
      'Set globalThis.__ACADEMIA_API_BASE_URL__ to the deployed HTTPS API URL before a production build.',
    );
  }

  const token = await readAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(response => response, async error => {
  if (axios.isAxiosError(error) && error.response?.status === 401) {
    const requestUrl = error.config?.url?.split('?')[0] || '';
    const isCredentialSubmission = /\/auth\/(login|register)\/?$/.test(requestUrl);
    const authorization = error.config?.headers?.Authorization;
    const requestToken = typeof authorization === 'string' ? authorization.replace(/^Bearer\s+/i, '') : '';

    // Invalid credentials should stay on the sign-in form. Token matching also
    // prevents a delayed response from an older request ending a newer session.
    if (!isCredentialSubmission && requestToken) {
      const currentToken = await readAuthToken().catch(() => null);
      if (currentToken && currentToken === requestToken) {
        reportSessionExpiration();
        await clearAuthToken().catch(() => undefined);
      }
    }
  }
  return Promise.reject(error);
});

export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<{message?: string}>;
    const serverMessage = axiosError.response?.data?.message;
    if (typeof serverMessage === 'string' && serverMessage.trim()) {
      return serverMessage;
    }
    if (axiosError.code === 'ECONNABORTED') {
      return 'The request took too long. Check your connection and try again.';
    }
    if (!axiosError.response) {
      return 'Could not connect to The AcadeMIa server. Check the API address and your connection.';
    }
  }

  return error instanceof Error && error.message ? error.message : fallback;
}

export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', {email, password}),
  register: (data: {
    name: string;
    email: string;
    password: string;
    confirmPassword: string;
  }) => api.post('/auth/register', data),
  currentUser: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout'),
  updateProfile: (data: Record<string, unknown>) => api.put('/auth/profile', data),
};

export const tenantApi = {
  getTenants: () => api.get('/tenants'),
  resolveDomain: (email: string) => api.post('/tenants/resolve-domain', {email}),
  completeOnboarding: (data: Record<string, unknown>) =>
    api.post('/tenants/onboarding', data),
};

export const subjectApi = {
  getBranches: (tenantId: string) =>
    api.get('/subjects/branches', {params: {tenantId}}),
  getSubjects: () => api.get('/subjects'),
  getSubject: (id: string) => api.get(`/subjects/${encodeURIComponent(id)}`),
  reportBrokenLink: (id: string, resourceId: string, resourceType: 'CODING_LINK' | 'GATE_PYQ') =>
    api.post(`/subjects/${encodeURIComponent(id)}/link-reports`, {resourceId, resourceType}),
};

export const progressApi = {
  getCareer: (subjectId: string) => api.get(`/progress/career/${encodeURIComponent(subjectId)}`),
  setCareerCompletion: (data: {subjectId: string; resourceType: 'INTERVIEW_QUESTION' | 'CODING_LINK'; resourceId: string; completed: boolean}) =>
    api.put('/progress/career-resource', data),
};

export const communityApi = {
  wallet: () => api.get('/community/wallet'),
  myNotes: () => api.get('/community/my-notes'),
  subjectNotes: (subjectId: string) => api.get(`/community/subjects/${encodeURIComponent(subjectId)}/notes`),
  submitNote: (data: {subjectId: string; unitId?: string; unitTitle: string; title: string; description: string}, file: {uri: string; name: string; type: string}) => {
    const form = new FormData();
    Object.entries(data).forEach(([key, value]) => { if (value) form.append(key, value); });
    form.append('file', {uri: file.uri, name: file.name, type: file.type} as unknown as Blob);
    return api.post('/community/notes', form, {headers: {'Content-Type': 'multipart/form-data'}});
  },
  vote: (noteId: string) => api.post(`/community/notes/${encodeURIComponent(noteId)}/upvote`),
  createBounty: (data: {subjectId: string; unitTitle: string; title: string; description: string; reward: number}) => api.post('/community/bounties', data),
  cancelBounty: (bountyId: string) => api.post(`/community/bounties/${encodeURIComponent(bountyId)}/cancel`),
  moderationQueue: () => api.get('/community/moderation/queue'),
  reviewNote: (noteId: string, data: {decision: 'APPROVE' | 'REJECT'; reviewNote?: string; fulfillBounty?: boolean}) => api.patch(`/community/moderation/notes/${encodeURIComponent(noteId)}`, data),
};

export const adminApi = {
  overview: () => api.get('/admin/overview'),
  users: (search = '') => api.get('/admin/users', {params: search ? {search} : {}}),
  subjects: () => api.get('/admin/subjects'),
  subject: (id: string) => api.get(`/admin/subjects/${encodeURIComponent(id)}`),
  createSubject: (data: Record<string, unknown>) => api.post('/admin/subjects', data),
  updateSubject: (id: string, data: Record<string, unknown>) => api.put(`/admin/subjects/${encodeURIComponent(id)}`, data),
  deleteSubject: (id: string) => api.delete(`/admin/subjects/${encodeURIComponent(id)}`),
  reports: () => api.get('/admin/link-reports'),
  updateReport: (id: string, status: 'RESOLVED' | 'DISMISSED') => api.patch(`/admin/link-reports/${encodeURIComponent(id)}`, {status}),
  deleteUser: (id: string) => api.delete(`/admin/users/${encodeURIComponent(id)}`),
};

export const studyToolsApi = {
  get: () => api.get('/study-tools'),
  saveAttendance: (attendance: unknown[], overallAttendance: Record<string, number>) =>
    api.put('/study-tools/attendance', {attendance, overallAttendance}),
  saveSessionals: (sessionals: unknown[]) =>
    api.put('/study-tools/sessionals', {sessionals}),
  savePlanner: (planner: Record<string, unknown>) =>
    api.put('/study-tools/planner', planner),
};

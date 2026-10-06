import React, { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './queryClient';

// Context
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';

// Components & Layout
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';

// Load route code on demand so students only download the screens they visit.
const Home = lazy(() => import('./pages/Home').then(module => ({ default: module.Home })));
const Dashboard = lazy(() => import('./pages/Dashboard').then(module => ({ default: module.Dashboard })));
const SubjectCatalog = lazy(() => import('./pages/SubjectCatalog').then(module => ({ default: module.SubjectCatalog })));
const SubjectDetail = lazy(() => import('./pages/SubjectDetail'));
const Profile = lazy(() => import('./pages/Profile').then(module => ({ default: module.Profile })));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard').then(module => ({ default: module.AdminDashboard })));
const AdminUsers = lazy(() => import('./pages/AdminUsers').then(module => ({ default: module.AdminUsers })));
const AddSubject = lazy(() => import('./pages/AddSubject').then(module => ({ default: module.AddSubject })));
const EditSubject = lazy(() => import('./pages/EditSubject').then(module => ({ default: module.EditSubject })));
const ProgressOverview = lazy(() => import('./pages/ProgressOverview').then(module => ({ default: module.ProgressOverview })));
const SubjectVault = lazy(() => import('./pages/SubjectVault'));
const StudyTools = lazy(() => import('./pages/StudyTools').then(module => ({ default: module.StudyTools })));
const CampusDashboard = lazy(() => import('./pages/CampusDashboard').then(module => ({ default: module.CampusDashboard })));
const Rankings = lazy(() => import('./pages/Rankings'));

// ✅ OAuth Callback Handler with Error Safety & Seamless Navigation
const OAuthCallback = () => {
  const navigate = useNavigate();
  const { refreshUser } = useAuth();

  useEffect(() => {
    const handleAuthCallback = async () => {
      // Google OAuth sets the session token in an HttpOnly cookie. Keep it out
      // of the URL, browser history, and referrer headers.
      const user = await refreshUser();
      navigate(user ? '/dashboard' : '/?error=denied', { replace: true });
    };

    handleAuthCallback().catch(() => navigate('/?error=failed', { replace: true }));
  }, [navigate, refreshUser]);

  return (
    <main role="status" aria-label="Completing secure sign in" className="flex min-h-[70vh] items-center justify-center bg-app px-5 py-12">
      <section className="flex w-full max-w-md flex-col items-center rounded-3xl border border-line bg-surface p-8 text-center shadow-sm">
        <span aria-hidden="true" className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50"><span className="h-6 w-6 animate-spin rounded-full border-[3px] border-line border-t-blue-600" /></span>
        <h1 className="text-lg font-black text-content">Securing your sign in</h1>
        <p className="mt-2 text-sm text-content-muted">We’re verifying your session and preparing your dashboard.</p>
      </section>
    </main>
  );
};

// Route Protection Wrapper with strict Admin Check
const ProtectedRoute = ({ children, requireAdmin = false }) => {
  const { user, isAuthenticated, loading, authError, refreshUser } = useAuth();

  if (loading) {
    return (
      <main role="status" aria-label="Verifying your session" className="flex min-h-[60vh] items-center justify-center bg-app px-5 py-12">
        <section className="flex w-full max-w-md flex-col items-center rounded-3xl border border-line bg-surface p-8 text-center shadow-sm">
          <span aria-hidden="true" className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50"><span className="h-6 w-6 animate-spin rounded-full border-[3px] border-line border-t-blue-600" /></span>
          <h1 className="text-lg font-black text-content">Verifying your session</h1>
          <p className="mt-2 text-sm text-content-muted">This should only take a moment.</p>
        </section>
      </main>
    );
  }

  if (!isAuthenticated) {
    if (authError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-app px-5 pt-24">
          <section className="w-full max-w-lg rounded-3xl border border-line bg-surface p-8 text-center shadow-sm">
            <h1 className="text-xl font-black text-content">Session could not be verified</h1>
            <p role="alert" className="mt-3 text-sm text-content-secondary">{authError}</p>
            <button type="button" onClick={refreshUser} className="mt-6 rounded-xl bg-surface-inverse px-5 py-3 text-xs font-bold text-white hover:bg-blue-600">Retry</button>
          </section>
        </div>
      );
    }
    return <Navigate to="/" replace />;
  }

  if (requireAdmin && user?.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default function App() {
  return (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider>
          <div className="flex flex-col min-h-screen bg-app">
            {/* Dynamic Smart Navbar */}
            <Navbar />

          <main className="flex-grow">
            <Suspense fallback={<div role="status" className="flex min-h-[50vh] items-center justify-center bg-app px-5 pt-24 text-sm font-semibold text-content-muted"><span className="mr-3 h-4 w-4 animate-spin rounded-full border-2 border-line-strong border-t-blue-600" />Loading page…</div>}>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Home />} />
              <Route path="/auth/callback" element={<OAuthCallback />} />

              {/* Student Protected Routes */}
              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/subjects" element={<ProtectedRoute><SubjectCatalog /></ProtectedRoute>} />
              <Route path="/subjects/:id" element={<ProtectedRoute><SubjectVault /></ProtectedRoute>} />
              <Route path="/progress" element={<ProtectedRoute><ProgressOverview /></ProtectedRoute>} />
              <Route path="/rankings" element={<ProtectedRoute><Rankings /></ProtectedRoute>} />
              <Route path="/progress/:subjectId" element={<ProtectedRoute><SubjectDetail /></ProtectedRoute>} />
              <Route path="/study-tools" element={<ProtectedRoute><StudyTools /></ProtectedRoute>} />
              <Route path="/campus" element={<ProtectedRoute><CampusDashboard /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />

              {/* Admin Protected Routes */}
              <Route path="/admin" element={<ProtectedRoute requireAdmin={true}><AdminDashboard /></ProtectedRoute>} />
              <Route path="/admin/users" element={<ProtectedRoute requireAdmin={true}><AdminUsers /></ProtectedRoute>} />
              <Route path="/subjects/add" element={<ProtectedRoute requireAdmin={true}><AddSubject /></ProtectedRoute>} />
              <Route path="/subjects/edit/:id" element={<ProtectedRoute requireAdmin={true}><EditSubject /></ProtectedRoute>} />

              {/* Catch-all Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
            </Suspense>
          </main>

            {/* Consolidated Dynamic Footer */}
            <Footer />
          </div>
        </ThemeProvider>
      </AuthProvider>
      </QueryClientProvider>
    </BrowserRouter>
  );
}

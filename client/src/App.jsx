import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './queryClient';

// Context
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';

// Components & Layout
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';

// Pages
import { Home } from './pages/Home';
import { Dashboard } from './pages/Dashboard';
import { SubjectCatalog } from './pages/SubjectCatalog';
import SubjectDetail from './pages/SubjectDetail';
import { Profile } from './pages/Profile';
import { AdminDashboard } from './pages/AdminDashboard';
import { AdminUsers } from './pages/AdminUsers';
import { AddSubject } from './pages/AddSubject';
import { EditSubject } from './pages/EditSubject';
import { ProgressOverview } from './pages/ProgressOverview';
import SubjectVault from './pages/SubjectVault';
import { StudyTools } from './pages/StudyTools';
import { CampusDashboard } from './pages/CampusDashboard';
import Rankings from './pages/Rankings';

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
    <div className="min-h-screen flex items-center justify-center bg-[#fbfbfa]">
      <div className="flex flex-col items-center gap-3">
        <span className="w-8 h-8 rounded-full border-4 border-gray-200 border-t-blue-600 animate-spin"></span>
        <span className="text-xs font-bold uppercase tracking-widest text-gray-400">
          Securing Vault Access...
        </span>
      </div>
    </div>
  );
};

// Route Protection Wrapper with strict Admin Check
const ProtectedRoute = ({ children, requireAdmin = false }) => {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fbfbfa]">
        <div className="flex flex-col items-center gap-3">
          <span className="w-8 h-8 rounded-full border-4 border-gray-200 border-t-blue-600 animate-spin"></span>
          <span className="text-xs font-bold uppercase tracking-widest text-gray-400">
            Verifying Vault Session...
          </span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
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
          <div className="flex flex-col min-h-screen bg-[#fbfbfa]">
            {/* Dynamic Smart Navbar */}
            <Navbar />

          <main className="flex-grow">
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

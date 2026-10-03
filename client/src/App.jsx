import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useSearchParams } from 'react-router-dom';

// Context
import { AuthProvider, useAuth } from './context/AuthContext';

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

// ✅ OAuth Callback Handler with Error Safety
const OAuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const token = searchParams.get('token');
    
    if (token) {
      localStorage.setItem('academia_token', token);
      window.location.href = '/dashboard';
    } else {
      navigate('/', { replace: true });
    }
  }, [searchParams, navigate]);

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
      <AuthProvider>
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
              <Route path="/progress/:subjectId" element={<ProtectedRoute><SubjectDetail /></ProtectedRoute>} />
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
      </AuthProvider>
    </BrowserRouter>
  );
}

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Context
import { AuthProvider, useAuth } from './context/AuthContext';

// Pages
// (Ensure these paths match your actual folder structure)
import { Dashboard } from './pages/Dashboard';
import { AdminDashboard } from './pages/AdminDashboard';
import SubjectDetail from './pages/SubjectDetail';

// Temporary placeholder for your Landing/Login page if you haven't built it yet
const Home = () => {
  const { isAuthenticated } = useAuth();
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#fbfbfa]">
      <h1 className="text-4xl font-black mb-4">The AcadeMIa</h1>
      <p className="text-gray-500 mb-8">Please log in to access your vault.</p>
      {/* Mount your actual Login/Google OAuth component here */}
      <div className="p-4 bg-yellow-50 text-yellow-700 rounded-lg text-sm font-bold">
        Mount your Authentication/Login Component Here
      </div>
    </div>
  );
};

// Route Protection Wrapper
const ProtectedRoute = ({ children, requireAdmin = false }) => {
  const { user, isAuthenticated, loading } = useAuth();

  // Wait for session verification before rendering routes
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

  // Redirect unauthenticated users to the home/login page
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  // Restrict admin routes
  if (requireAdmin && user?.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default function App() {
  return (
    <BrowserRouter>
      {/* AuthProvider wraps the router so all routes have access to session state */}
      <AuthProvider>
        <Routes>
          {/* Public Route */}
          <Route path="/" element={<Home />} />

          {/* Student Protected Routes */}
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/subjects/:id" 
            element={
              <ProtectedRoute>
                <SubjectDetail />
              </ProtectedRoute>
            } 
          />

          {/* Admin Protected Route */}
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute requireAdmin={true}>
                <AdminDashboard />
              </ProtectedRoute>
            } 
          />

          {/* Catch-all redirect for unknown URLs */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
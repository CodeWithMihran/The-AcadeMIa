import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { tenantService } from '../services/api';
import { 
  Sparkles, 
  ArrowRight,
  Building2
} from 'lucide-react';

export const Home = () => {
  const { login, register, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [isLoginTab, setIsLoginTab] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [detectedTenant, setDetectedTenant] = useState(null);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  // Real-time domain resolution as student types email
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (formData.email && formData.email.includes('@')) {
        try {
          const res = await tenantService.resolveDomain(formData.email);
          if (res.data.success && res.data.matched) {
            setDetectedTenant(res.data);
          } else {
            setDetectedTenant(null);
          }
        } catch {
          setDetectedTenant(null);
        }
      } else {
        setDetectedTenant(null);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [formData.email]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLoginTab) {
        await login(formData.email, formData.password);
      } else {
        await register(formData);
      }
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = () => {
    const configuredApiUrl = import.meta.env.VITE_API_BASE_URL;
    const apiUrl = configuredApiUrl
      ? configuredApiUrl.replace(/\/api\/?$/, '')
      : `${window.location.protocol}//${window.location.hostname}:3000`;
    window.location.href = `${apiUrl}/auth/google`;
  };

  return (
    <div className="min-h-screen bg-white">
      
      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6 max-w-6xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-blue-600 text-xs font-bold uppercase tracking-wider mb-6 animate-in fade-in duration-300">
          <Sparkles className="w-3.5 h-3.5" />
          The Academic Operating System
        </div>

        <h1 className="text-5xl md:text-7xl font-black tracking-tight text-[#1a1a1a] leading-[1.08] mb-6">
          Your entire semester, <br />
          <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-black bg-clip-text text-transparent">
            organized in one place.
          </span>
        </h1>

        <p className="text-lg md:text-xl text-gray-500 max-w-2xl mx-auto mb-10 leading-relaxed font-normal">
          A centralized curriculum vault for state technical universities (<strong className="text-gray-800">AKTU, VMSB UTU</strong>) and competitive exam aspirants (<strong className="text-gray-800">JEE & NEET</strong>). Unit-wise notes, curated lectures, and topic mastery tracking.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row justify-center gap-4 mb-16">
          <a 
            href="#auth"
            className="bg-[#0a0a0a] text-white px-8 py-4 rounded-2xl font-bold text-sm hover:bg-blue-600 transition-all shadow-xl shadow-gray-200 active:scale-95 flex items-center justify-center gap-2"
          >
            <span>Open Your Vault — Free</span>
            <ArrowRight className="w-4 h-4" />
          </a>
          <a 
            href="#universities"
            className="bg-gray-50 text-gray-700 border border-gray-200 px-8 py-4 rounded-2xl font-bold text-sm hover:bg-gray-100 transition-all flex items-center justify-center gap-2"
          >
            <span>Explore Universities</span>
          </a>
        </div>

        {/* University Logos / Badges */}
        <div id="universities" className="pt-10 border-t border-gray-100">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 mb-6">
            Supporting Multi-University Ecosystems & National Tracks
          </p>
          <div className="flex flex-wrap justify-center items-center gap-4 md:gap-8 text-xs font-bold text-gray-600">
            <span className="px-4 py-2 rounded-xl bg-gray-50 border border-gray-100">🏛️ VMSB Uttarakhand Tech University</span>
            <span className="px-4 py-2 rounded-xl bg-gray-50 border border-gray-100">🏛️ Dr. A.P.J. Abdul Kalam Technical University (AKTU)</span>
            <span className="px-4 py-2 rounded-xl bg-gray-50 border border-gray-100">🎯 JEE Mains & Advanced</span>
            <span className="px-4 py-2 rounded-xl bg-gray-50 border border-gray-100">🧬 NEET UG</span>
          </div>
        </div>
      </section>

      {/* Auth Portal Section */}
      <section id="auth" className="py-24 bg-[#fbfbfa] border-y border-gray-200">
        <div className="max-w-md mx-auto px-6">
          
          <div className="bg-white rounded-[2.5rem] p-8 md:p-10 shadow-2xl border border-gray-200">
            
            {/* Tabs */}
            <div className="flex items-center gap-2 p-1.5 bg-gray-100 rounded-2xl mb-8">
              <button
                type="button"
                onClick={() => { setIsLoginTab(true); setError(''); }}
                className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                  isLoginTab ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-black'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => { setIsLoginTab(false); setError(''); }}
                className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                  !isLoginTab ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-black'
                }`}
              >
                Create Account
              </button>
            </div>

            {error && (
              <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-100 text-red-600 text-xs font-bold">
                ⚠️ {error}
              </div>
            )}

            {/* Google OAuth Button */}
            <button
              onClick={handleGoogleAuth}
              type="button"
              className="w-full flex items-center justify-center gap-3 bg-white border border-gray-200 py-3.5 rounded-2xl font-bold text-xs text-gray-700 hover:bg-gray-50 transition-all shadow-sm active:scale-[0.98] mb-6"
            >
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-4 h-4" alt="Google" />
              <span>Continue with Google</span>
            </button>

            <div className="relative flex items-center justify-center mb-6">
              <div className="border-t w-full border-gray-200"></div>
              <span className="bg-white px-3 text-[9px] text-gray-400 font-black uppercase tracking-widest absolute">
                Or with Email
              </span>
            </div>

            {/* Live Domain Match Badge */}
            {detectedTenant && (
              <div className="mb-4 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-start gap-2.5 text-xs text-emerald-800 animate-in fade-in">
                <Building2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Affiliated Institution Detected:</p>
                  <p className="text-[11px] text-emerald-700 font-medium">
                    {detectedTenant.college} ({detectedTenant.tenant.shortCode})
                  </p>
                </div>
              </div>
            )}

            {/* Manual Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLoginTab && (
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-gray-400 mb-1.5">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Mihran Sohail"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-blue-600 font-medium"
                  />
                </div>
              )}

              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-gray-400 mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  placeholder="student@college.edu or gmail"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-blue-600 font-medium"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-gray-400 mb-1.5">
                  Password
                </label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-blue-600 font-medium"
                />
              </div>

              {!isLoginTab && (
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-gray-400 mb-1.5">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-blue-600 font-medium"
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 bg-[#0a0a0a] text-white py-3.5 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-blue-600 transition-all shadow-lg active:scale-95"
              >
                {loading ? "Processing..." : isLoginTab ? "Access Dashboard" : "Create Account"}
              </button>
            </form>

          </div>

        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 bg-white text-center text-xs text-gray-400 font-medium">
        <p>© 2026 The AcadeMIa. Multi-tenant academic operating system built for engineering students.</p>
      </footer>

    </div>
  );
};

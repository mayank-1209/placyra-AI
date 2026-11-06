import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  GraduationCap,
  Shield,
  Sparkles,
  ArrowRight,
  AlertCircle,
  Loader2,
  CheckCircle2,
} from 'lucide-react';

export const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [role, setRole] = useState('student');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [branch, setBranch] = useState('Computer Science and Engineering');
  const [cgpa, setCgpa] = useState('8.5');
  const [gradYear, setGradYear] = useState('2026');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const { login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const redirectAfterAuth = (userRole) => {
    const fromPath = location.state?.from?.pathname;
    if (fromPath && fromPath !== '/auth') {
      navigate(fromPath);
      return;
    }
    if (userRole === 'student') {
      navigate('/student');
    } else {
      navigate('/tnp');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isLogin) {
        const loggedUser = await login(email, password);
        redirectAfterAuth(loggedUser.role);
      } else {
        const registeredUser = await register({
          email,
          password,
          full_name: fullName,
          role,
          branch,
          cgpa: parseFloat(cgpa) || null,
          graduation_year: parseInt(gradYear) || null,
        });
        redirectAfterAuth(registeredUser.role);
      }
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (demoEmail, demoPassword) => {
    setLoading(true);
    setError(null);
    try {
      const loggedUser = await login(demoEmail, demoPassword);
      redirectAfterAuth(loggedUser.role);
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Demo login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg text-text flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Glow Accent */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-accent-subtle blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 text-center">
        {/* Placyra Logo */}
        <div className="inline-flex justify-center mb-4">
          <img
            src="/assets/placyra-logo.svg"
            alt="Placyra Official Logo"
            className="h-14 w-auto object-contain"
          />
        </div>
        <p className="text-xs uppercase tracking-widest text-accent font-bold mb-1">
          Campus Placement & AI Career Assistant
        </p>
        <h2 className="text-2xl font-black text-text">
          {isLogin ? 'Sign In to Your Workspace' : 'Create Placyra Account'}
        </h2>
        <p className="mt-1 text-xs text-text-muted">
          Access PyMuPDF ATS scoring, Qdrant semantic matching, and adaptive Ollama mock interviews.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-surface py-8 px-6 border border-border shadow-2xl rounded-2xl sm:px-10 space-y-6">
          {/* Auth Mode Toggle */}
          <div className="flex border-b border-border">
            <button
              type="button"
              onClick={() => {
                setIsLogin(true);
                setError(null);
              }}
              className={`flex-1 pb-3 text-xs font-bold uppercase tracking-wider transition-all ${
                isLogin
                  ? 'border-b-2 border-accent text-accent'
                  : 'text-text-muted hover:text-text'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setIsLogin(false);
                setError(null);
              }}
              className={`flex-1 pb-3 text-xs font-bold uppercase tracking-wider transition-all ${
                !isLogin
                  ? 'border-b-2 border-accent text-accent'
                  : 'text-text-muted hover:text-text'
              }`}
            >
              Register Candidate
            </button>
          </div>

          {/* Role Selector (Registration only) */}
          {!isLogin && (
            <div>
              <label className="block text-xs font-semibold text-text-muted mb-2 uppercase tracking-wider">
                Select Placement Role
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'student', label: 'Student', icon: GraduationCap },
                  { id: 'alumni', label: 'Alumni', icon: Sparkles },
                  { id: 'tnp_admin', label: 'T&P Cell', icon: Shield },
                ].map((item) => {
                  const Icon = item.icon;
                  const isSelected = role === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setRole(item.id)}
                      className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-semibold transition-all ${
                        isSelected
                          ? 'bg-accent-subtle border-accent text-accent shadow-inner'
                          : 'bg-surface-2 border-border text-text-muted hover:text-text hover:bg-surface-hover'
                      }`}
                    >
                      <Icon className="w-4 h-4 mb-1" />
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {error && (
            <div className="p-3 bg-danger-subtle border border-danger/20 text-danger rounded-xl text-xs flex items-center">
              <AlertCircle className="w-4 h-4 mr-2 shrink-0" />
              <span>{typeof error === 'string' ? error : 'Authentication failed.'}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="block text-xs font-semibold text-text-muted mb-1.5 uppercase">
                  Full Name
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Maya Chen"
                  className="w-full bg-surface-2 border border-border text-text rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-accent"
                  required
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-text-muted mb-1.5 uppercase">
                Institutional Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@university.edu"
                className="w-full bg-surface-2 border border-border text-text rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-accent"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-muted mb-1.5 uppercase">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-surface-2 border border-border text-text rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-accent"
                required
              />
            </div>

            {!isLogin && role === 'student' && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-text-muted mb-1.5 uppercase">
                    Academic Branch / Department
                  </label>
                  <input
                    type="text"
                    value={branch}
                    onChange={(e) => setBranch(e.target.value)}
                    placeholder="Computer Science, IT, Electronics"
                    className="w-full bg-surface-2 border border-border text-text rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-accent"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-text-muted mb-1.5 uppercase">
                      Current CGPA
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="10"
                      value={cgpa}
                      onChange={(e) => setCgpa(e.target.value)}
                      placeholder="8.50"
                      className="w-full bg-surface-2 border border-border text-text rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-accent"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-text-muted mb-1.5 uppercase">
                      Grad Year
                    </label>
                    <input
                      type="number"
                      min="2024"
                      max="2030"
                      value={gradYear}
                      onChange={(e) => setGradYear(e.target.value)}
                      placeholder="2026"
                      className="w-full bg-surface-2 border border-border text-text rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-accent"
                    />
                  </div>
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 bg-accent hover:bg-accent-hover disabled:opacity-50 text-accent-contrast text-sm font-bold rounded-xl shadow-lg shadow-accent/20 flex items-center justify-center transition-all"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Verifying Credentials...
                </>
              ) : (
                <>
                  <ArrowRight className="w-4 h-4 mr-2" />
                  {isLogin ? 'Sign In to Placyra' : 'Complete Registration'}
                </>
              )}
            </button>
          </form>

          {/* Demo Login Credentials Fast-Track */}
          <div className="pt-4 border-t border-border">
            <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wider text-center mb-2.5">
              One-Click Demo Access
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleDemoLogin('student@placyra.local', 'Student@2026')}
                className="px-2 py-2 bg-accent-subtle hover:bg-accent/20 border border-accent/20 text-accent text-xs font-semibold rounded-xl transition-colors"
              >
                Student Demo
              </button>
              <button
                type="button"
                onClick={() => handleDemoLogin('admin@placyra.local', 'Admin@2026')}
                className="px-2 py-2 bg-success-subtle hover:bg-success/20 border border-success/20 text-success text-xs font-semibold rounded-xl transition-colors"
              >
                Admin Demo
              </button>
              <button
                type="button"
                onClick={() => handleDemoLogin('alumni@placyra.local', 'Alumni@2026')}
                className="px-2 py-2 bg-warning-subtle hover:bg-warning/20 border border-warning/20 text-warning text-xs font-semibold rounded-xl transition-colors"
              >
                Alumni Demo
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;

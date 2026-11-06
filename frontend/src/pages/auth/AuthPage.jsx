import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isLogin) {
        const loggedUser = await login(email, password);
        if (loggedUser.role === 'student') {
          navigate('/student');
        } else {
          navigate('/tnp');
        }
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
        if (registeredUser.role === 'student') {
          navigate('/student');
        } else {
          navigate('/tnp');
        }
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (demoEmail, demoPassword) => {
    setLoading(true);
    setError(null);
    try {
      const loggedUser = await login(demoEmail, demoPassword);
      if (loggedUser.role === 'student') {
        navigate('/student');
      } else {
        navigate('/tnp');
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Demo login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Glow Accents */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-gradient-to-b from-indigo-600/20 via-violet-600/10 to-transparent blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 text-center">
        {/* Placyra Logo */}
        <div className="inline-flex justify-center mb-4">
          <img
            src="/assets/placyra-logo.svg"
            alt="Placyra Official Logo"
            className="h-14 w-auto object-contain"
          />
        </div>
        <p className="text-xs uppercase tracking-widest text-indigo-400 font-bold mb-1">
          Campus Placement & AI Career Assistant
        </p>
        <h2 className="text-2xl font-black text-white">
          {isLogin ? 'Sign in to your account' : 'Register your campus profile'}
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4">
        <div className="bg-slate-900/90 border border-slate-800 py-8 px-6 sm:px-10 rounded-2xl shadow-2xl backdrop-blur-xl">
          {/* Tab Switcher */}
          <div className="flex border-b border-slate-800 pb-4 mb-6">
            <button
              onClick={() => {
                setIsLogin(true);
                setError(null);
              }}
              className={`flex-1 pb-2 text-sm font-bold transition-colors ${
                isLogin
                  ? 'border-b-2 border-indigo-500 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => {
                setIsLogin(false);
                setError(null);
              }}
              className={`flex-1 pb-2 text-sm font-bold transition-colors ${
                !isLogin
                  ? 'border-b-2 border-indigo-500 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Role Selector (When Registering) */}
          {!isLogin && (
            <div className="mb-6">
              <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase">
                Select Your Role
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setRole('student')}
                  className={`p-2.5 text-xs font-bold rounded-xl border flex flex-col items-center justify-center transition-all ${
                    role === 'student'
                      ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-inner'
                      : 'border-slate-800 text-slate-400 hover:bg-slate-850'
                  }`}
                >
                  <GraduationCap className="w-4 h-4 mb-1" />
                  Student
                </button>
                <button
                  type="button"
                  onClick={() => setRole('tnp_admin')}
                  className={`p-2.5 text-xs font-bold rounded-xl border flex flex-col items-center justify-center transition-all ${
                    role === 'tnp_admin'
                      ? 'bg-emerald-600/20 border-emerald-500 text-white shadow-inner'
                      : 'border-slate-800 text-slate-400 hover:bg-slate-850'
                  }`}
                >
                  <Shield className="w-4 h-4 mb-1" />
                  T&P Admin
                </button>
                <button
                  type="button"
                  onClick={() => setRole('alumni')}
                  className={`p-2.5 text-xs font-bold rounded-xl border flex flex-col items-center justify-center transition-all ${
                    role === 'alumni'
                      ? 'bg-amber-600/20 border-amber-500 text-white shadow-inner'
                      : 'border-slate-800 text-slate-400 hover:bg-slate-850'
                  }`}
                >
                  <Sparkles className="w-4 h-4 mb-1" />
                  Alumni
                </button>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1 uppercase">
                  Full Name
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Rahul Sharma"
                  className="w-full bg-slate-950 border border-slate-700 text-slate-100 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1 uppercase">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@placyra.edu"
                className="w-full bg-slate-950 border border-slate-700 text-slate-100 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1 uppercase">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-950 border border-slate-700 text-slate-100 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500"
                required
              />
            </div>

            {!isLogin && role === 'student' && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1 uppercase">
                    CGPA
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="10"
                    value={cgpa}
                    onChange={(e) => setCgpa(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 text-slate-100 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1 uppercase">
                    Graduation Year
                  </label>
                  <input
                    type="number"
                    value={gradYear}
                    onChange={(e) => setGradYear(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 text-slate-100 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            )}

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-xs flex items-center">
                <AlertCircle className="w-4 h-4 mr-2 shrink-0" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 disabled:opacity-50 text-white text-sm font-bold rounded-xl shadow-lg shadow-indigo-600/30 flex items-center justify-center transition-all"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  {isLogin ? 'Sign In to Placyra' : 'Complete Registration'}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </button>
          </form>

          {/* 1-Click Demo Accounts Quick Test */}
          <div className="mt-8 pt-6 border-t border-slate-800">
            <p className="text-xs text-center text-slate-400 uppercase font-semibold mb-3">
              Fast 1-Click Evaluation Accounts
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleDemoLogin('student@placyra.edu', 'student123')}
                className="px-2 py-2 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 text-indigo-300 text-xs font-semibold rounded-xl transition-colors"
              >
                🎓 Student
              </button>
              <button
                type="button"
                onClick={() => handleDemoLogin('admin@placyra.edu', 'admin123')}
                className="px-2 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-300 text-xs font-semibold rounded-xl transition-colors"
              >
                🛡️ T&P Admin
              </button>
              <button
                type="button"
                onClick={() => handleDemoLogin('alumni@placyra.edu', 'alumni123')}
                className="px-2 py-2 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 text-amber-300 text-xs font-semibold rounded-xl transition-colors"
              >
                ✨ Alumni
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;

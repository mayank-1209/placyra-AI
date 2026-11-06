import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { X, Sparkles, AlertCircle, Loader2, CheckCircle2, Shield, ArrowRight, GraduationCap } from 'lucide-react';
import { loginUser, registerUser, closeAuthModal, clearAuthError } from '../../store/slices/authSlice';

export const AuthModal = () => {
  const dispatch = useDispatch();
  const { isAuthModalOpen, authModalMode, pendingAction, loading, error } = useSelector(
    (state) => state.auth
  );

  const [mode, setMode] = useState(authModalMode || 'signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('student');
  const [branch, setBranch] = useState('Computer Science and Engineering');
  const [cgpa, setCgpa] = useState('8.5');
  const [gradYear, setGradYear] = useState('2026');

  useEffect(() => {
    if (authModalMode) {
      setMode(authModalMode);
    }
  }, [authModalMode]);

  useEffect(() => {
    // Listen to global 401 events dispatched from apiClient
    const handleAuthRequiredEvent = () => {
      // automatically handled if state is managed
    };
    window.addEventListener('placyra:auth_required', handleAuthRequiredEvent);
    return () => window.removeEventListener('placyra:auth_required', handleAuthRequiredEvent);
  }, []);

  if (!isAuthModalOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    dispatch(clearAuthError());

    if (mode === 'login') {
      await dispatch(loginUser({ email, password }));
    } else {
      await dispatch(
        registerUser({
          email,
          password,
          full_name: fullName,
          role,
          branch,
          cgpa: parseFloat(cgpa) || null,
          graduation_year: parseInt(gradYear) || null,
        })
      );
    }
  };

  const handleDemoLogin = async (demoEmail, demoPassword) => {
    dispatch(clearAuthError());
    await dispatch(loginUser({ email: demoEmail, password: demoPassword }));
  };

  const getActionBannerText = () => {
    if (!pendingAction) return 'Create an account or sign in to continue';
    const act = pendingAction.action || '';
    if (act.includes('resume')) return 'Sign in to access AI ATS Resume OCR & Skill Scoring';
    if (act.includes('interview')) return 'Sign in to launch your interactive AI Mock Interview';
    if (act.includes('gap')) return 'Sign in to generate real-time Company Skill Gap Radar';
    return 'Authentication required to complete this action';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-600/10 text-blue-500 rounded-xl">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                {mode === 'signup' ? 'Create Your Account' : 'Welcome Back'}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">{getActionBannerText()}</p>
            </div>
          </div>
          <button
            onClick={() => dispatch(closeAuthModal())}
            className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 p-1">
          <button
            type="button"
            onClick={() => {
              setMode('signup');
              dispatch(clearAuthError());
            }}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-colors ${
              mode === 'signup'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Create Account
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('login');
              dispatch(clearAuthError());
            }}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-colors ${
              mode === 'login'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Sign In
          </button>
        </div>

        {/* Form body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-xs flex items-center">
              <AlertCircle className="w-4 h-4 mr-2 shrink-0" />
              <span>{typeof error === 'string' ? error : 'Authentication failed'}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {mode === 'signup' && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1 uppercase">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Alex Morgan"
                    required
                    className="w-full bg-slate-950 border border-slate-700 text-slate-100 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1 uppercase">
                      Role
                    </label>
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 text-slate-100 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                    >
                      <option value="student">Student</option>
                      <option value="alumni">Alumni Mentor</option>
                      <option value="tnp_admin">T&P Admin</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1 uppercase">
                      CGPA
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="10"
                      value={cgpa}
                      onChange={(e) => setCgpa(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 text-slate-100 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1 uppercase">
                    Branch / Major
                  </label>
                  <input
                    type="text"
                    value={branch}
                    onChange={(e) => setBranch(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 text-slate-100 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1 uppercase">
                College / Institutional Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="candidate@university.edu"
                required
                className="w-full bg-slate-950 border border-slate-700 text-slate-100 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500"
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
                required
                className="w-full bg-slate-950 border border-slate-700 text-slate-100 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold rounded-xl text-sm shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center mt-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Processing...
                </>
              ) : mode === 'signup' ? (
                <>
                  <GraduationCap className="w-4 h-4 mr-2" />
                  Create Free Account & Continue
                </>
              ) : (
                <>
                  <ArrowRight className="w-4 h-4 mr-2" />
                  Sign In & Continue
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Login shortcuts */}
          <div className="pt-3 border-t border-slate-800">
            <p className="text-[11px] font-semibold uppercase text-slate-500 text-center mb-2">
              Instant Demo Access
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleDemoLogin('student@placyra.local', 'Student@2026')}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium transition-colors"
              >
                Demo Student
              </button>
              <button
                type="button"
                onClick={() => handleDemoLogin('admin@placyra.local', 'Admin@2026')}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium transition-colors"
              >
                Demo T&P Admin
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;

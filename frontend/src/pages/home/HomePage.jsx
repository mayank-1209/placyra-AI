import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  FileText,
  MessageSquare,
  Target,
  Sparkles,
  ArrowRight,
  Building2,
  CheckCircle2,
  TrendingUp,
  Shield,
  HelpCircle,
  Award,
  BookOpen,
} from 'lucide-react';
import Navbar from '../../components/common/Navbar';
import { useAuth } from '../../context/AuthContext';
import { useAuthGate } from '../../features/auth/useAuthGate';
import { tnpApi } from '../../services/apiClient';

export const HomePage = () => {
  const { user, isAuthenticated } = useAuth();
  const { requireAuth } = useAuthGate();
  const navigate = useNavigate();

  const [companies, setCompanies] = useState([]);
  const [sampleQuestions, setSampleQuestions] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState(null);

  useEffect(() => {
    // Public data fetching - no login required
    const loadPublicDirectory = async () => {
      try {
        const compResp = await tnpApi.getCompanies();
        setCompanies(compResp.data || []);
        if (compResp.data?.length > 0) {
          setSelectedCompany(compResp.data[0]);
        }
      } catch (err) {
        console.error('Failed to load public company directory:', err);
      }

      try {
        const qResp = await tnpApi.getQuestions({ status: 'approved' });
        setSampleQuestions((qResp.data || []).slice(0, 3));
      } catch (err) {
        console.error('Failed to load sample questions:', err);
      }
    };

    loadPublicDirectory();
  }, []);

  const handleUploadResumeClick = () => {
    requireAuth(
      () => {
        navigate('/student');
      },
      { action: 'resume_upload' }
    );
  };

  const handleMockInterviewClick = () => {
    requireAuth(
      () => {
        navigate('/student');
      },
      { action: 'mock_interview' }
    );
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden py-16 md:py-24 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold uppercase tracking-wider mb-6">
            <Sparkles className="w-3.5 h-3.5 mr-1.5" />
            AI-Powered Campus Placement Intelligence
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight text-white max-w-4xl mx-auto leading-tight">
            Master Technical Interviews & ATS Resumes with{' '}
            <span className="text-blue-500">Autonomous AI</span>
          </h1>

          <p className="mt-6 text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Placyra analyzes your resume using advanced PyMuPDF OCR, maps your skill gaps against corporate hiring cutoffs, and conducts adaptive AI mock interviews.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={handleUploadResumeClick}
              className="w-full sm:w-auto px-8 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl shadow-lg shadow-blue-600/25 flex items-center justify-center transition-all group"
            >
              <FileText className="w-5 h-5 mr-2" />
              Upload Resume for ATS Score
              <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              onClick={handleMockInterviewClick}
              className="w-full sm:w-auto px-8 py-3.5 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 font-semibold rounded-xl flex items-center justify-center transition-all"
            >
              <MessageSquare className="w-5 h-5 mr-2 text-blue-400" />
              Launch AI Mock Interview
            </button>

            <Link
              to="/blog"
              className="w-full sm:w-auto px-6 py-3.5 bg-slate-900/60 hover:bg-slate-800/80 text-slate-400 hover:text-slate-200 border border-slate-800 font-medium rounded-xl flex items-center justify-center transition-all"
            >
              <BookOpen className="w-4 h-4 mr-2" />
              Placement Guides & Blog
            </Link>
          </div>

          {/* Social Proof / Key Highlights */}
          <div className="mt-14 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto pt-10 border-t border-slate-900">
            <div className="p-4 bg-slate-900/40 rounded-xl border border-slate-800/60">
              <p className="text-2xl font-black text-white">768-d</p>
              <p className="text-xs text-slate-400 mt-0.5">Semantic Vector Indexing</p>
            </div>
            <div className="p-4 bg-slate-900/40 rounded-xl border border-slate-800/60">
              <p className="text-2xl font-black text-white">100% Local</p>
              <p className="text-xs text-slate-400 mt-0.5">Private Ollama AI Engine</p>
            </div>
            <div className="p-4 bg-slate-900/40 rounded-xl border border-slate-800/60">
              <p className="text-2xl font-black text-white">ATS-Optimized</p>
              <p className="text-xs text-slate-400 mt-0.5">PyMuPDF OCR Extractor</p>
            </div>
            <div className="p-4 bg-slate-900/40 rounded-xl border border-slate-800/60">
              <p className="text-2xl font-black text-white">Zero Friction</p>
              <p className="text-xs text-slate-400 mt-0.5">Guest Exploration Enabled</p>
            </div>
          </div>
        </div>
      </section>

      {/* Public Feature Showcase Section */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full space-y-16">
        {/* Core Pillars */}
        <div>
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h2 className="text-2xl font-bold text-white">Full-Stack Career Preparation</h2>
            <p className="text-sm text-slate-400 mt-2">
              Everything engineering candidates need to clear technical assessments, group rounds, and managerial interviews.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 bg-slate-900/70 border border-slate-800 rounded-2xl shadow-xl flex flex-col justify-between hover:border-slate-700 transition-all">
              <div>
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center mb-4">
                  <FileText className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white">PyMuPDF OCR Resume Engine</h3>
                <p className="text-sm text-slate-400 mt-2 leading-relaxed">
                  Extracts structured technical skills, project metrics, and academic cutoffs from PDF or image resumes with automated verification.
                </p>
              </div>
              <button
                onClick={handleUploadResumeClick}
                className="mt-6 text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center"
              >
                Try Resume OCR <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </button>
            </div>

            <div className="p-6 bg-slate-900/70 border border-slate-800 rounded-2xl shadow-xl flex flex-col justify-between hover:border-slate-700 transition-all">
              <div>
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-4">
                  <Target className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white">Target Company Skill-Gap Radar</h3>
                <p className="text-sm text-slate-400 mt-2 leading-relaxed">
                  Benchmarks your skill profile directly against corporate job descriptions (JDs) and computes missing algorithmic foundations.
                </p>
              </div>
              <button
                onClick={handleUploadResumeClick}
                className="mt-6 text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center"
              >
                View Skill Radar <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </button>
            </div>

            <div className="p-6 bg-slate-900/70 border border-slate-800 rounded-2xl shadow-xl flex flex-col justify-between hover:border-slate-700 transition-all">
              <div>
                <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center mb-4">
                  <MessageSquare className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white">Adaptive RAG Mock Interview</h3>
                <p className="text-sm text-slate-400 mt-2 leading-relaxed">
                  Evaluates your answers in real time on time/space complexity and provides customized follow-up questions powered by local Ollama.
                </p>
              </div>
              <button
                onClick={handleMockInterviewClick}
                className="mt-6 text-xs font-semibold text-purple-400 hover:text-purple-300 flex items-center"
              >
                Launch Mock Chamber <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </button>
            </div>
          </div>
        </div>

        {/* Public Company Criteria Explorer */}
        {companies.length > 0 && (
          <div className="p-8 bg-slate-900/80 border border-slate-800 rounded-2xl shadow-xl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
              <div>
                <span className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center">
                  <Building2 className="w-4 h-4 mr-1.5" />
                  Live Recruiter Directory (Guest Accessible)
                </span>
                <h3 className="text-xl font-bold text-white mt-1">
                  Explore Placement Criteria & Cutoffs
                </h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {companies.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedCompany(c)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                      selectedCompany?.id === c.id
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            </div>

            {selectedCompany && (
              <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-4">
                  <h4 className="text-lg font-bold text-white">{selectedCompany.name}</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {selectedCompany.description || 'Target recruiter recruiting engineering candidates through Placyra.'}
                  </p>

                  <div className="space-y-2">
                    <p className="text-xs font-bold uppercase text-slate-400 tracking-wider">
                      Required Core Skills:
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedCompany.required_skills?.map((s, idx) => (
                        <span
                          key={idx}
                          className="px-2.5 py-1 bg-slate-950 border border-slate-800 text-slate-200 rounded-lg text-xs"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs font-bold uppercase text-slate-400 tracking-wider">
                      Recruitment Workflow Rounds:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {selectedCompany.hiring_workflow?.map((r, idx) => (
                        <span
                          key={idx}
                          className="px-2.5 py-1 bg-blue-500/10 text-blue-300 border border-blue-500/20 rounded-lg text-xs"
                        >
                          Round {idx + 1}: {r}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="p-5 bg-slate-950/60 border border-slate-800 rounded-xl flex flex-col justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase text-slate-500">Academic Eligibility</p>
                    <p className="text-3xl font-black text-white mt-1">
                      {selectedCompany.min_cgpa} <span className="text-xs font-normal text-slate-400">CGPA</span>
                    </p>
                    <p className="text-xs text-slate-400 mt-2">
                      Eligible: {selectedCompany.eligible_branches?.join(', ') || 'All Branches'}
                    </p>
                  </div>

                  <button
                    onClick={handleUploadResumeClick}
                    className="mt-6 w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-blue-600/20 transition-all flex items-center justify-center"
                  >
                    Check My Match with {selectedCompany.name}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Sample Real Placement Questions Preview */}
        {sampleQuestions.length > 0 && (
          <div className="p-8 bg-slate-900/80 border border-slate-800 rounded-2xl shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center">
                  <HelpCircle className="w-5 h-5 mr-2 text-blue-400" />
                  Recent Placement Interview Questions
                </h3>
                <p className="text-xs text-slate-400">Curated & verified by university alumni and T&P cells</p>
              </div>
              <button
                onClick={handleMockInterviewClick}
                className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center"
              >
                Practice in AI Chamber <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              {sampleQuestions.map((q) => (
                <div key={q.id} className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-blue-400 uppercase">{q.topic}</span>
                    <span className="text-slate-500">{q.difficulty}</span>
                  </div>
                  <p className="text-xs text-slate-200 line-clamp-3 leading-relaxed">
                    {q.question_text}
                  </p>
                  <p className="text-[11px] text-slate-500 pt-1 border-t border-slate-900">
                    {q.company_name || 'General Campus Round'} • {q.round_type}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-800 bg-slate-950 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center space-x-3">
            <img src="/assets/placyra-logo.svg" alt="Placyra" className="h-7 w-auto object-contain" />
            <span>© {new Date().getFullYear()} Placyra. All rights reserved.</span>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-slate-400">
            <Link to="/blog" className="hover:text-slate-200 transition-colors">
              Blog & Articles
            </Link>
            <Link to="/about" className="hover:text-slate-200 transition-colors">
              About
            </Link>
            <Link to="/contact" className="hover:text-slate-200 transition-colors">
              Contact
            </Link>
            <Link to="/privacy" className="hover:text-slate-200 transition-colors">
              Privacy Policy
            </Link>
            <Link to="/terms" className="hover:text-slate-200 transition-colors">
              Terms of Service
            </Link>
            <Link to="/cookie-policy" className="hover:text-slate-200 transition-colors">
              Cookie Policy
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;

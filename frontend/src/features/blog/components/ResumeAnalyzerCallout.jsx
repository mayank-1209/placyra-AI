import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthGate } from '../../auth/useAuthGate';
import { FileText, ArrowRight, CheckCircle2, ShieldCheck } from 'lucide-react';

export const ResumeAnalyzerCallout = ({ targetRole = 'Software Engineer', companyName = '' }) => {
  const navigate = useNavigate();
  const { requireAuth } = useAuthGate();

  const handleStartAnalysis = () => {
    requireAuth(
      () => {
        navigate('/student/resume');
      },
      {
        action: 'resume_upload',
        source: 'blog_conversion_hook',
        metadata: { targetRole, companyName },
      }
    );
  };

  return (
    <div className="my-8 rounded-2xl border border-border bg-surface p-6 sm:p-8 shadow-sm relative overflow-hidden">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="space-y-3 max-w-xl">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-surface-2 border border-border text-accent text-xs font-semibold">
            <FileText className="w-3.5 h-3.5" />
            <span>Interactive Placement Tool</span>
          </div>

          <h3 className="text-xl font-black text-text">
            Compare Your Resume Against {companyName || targetRole} Benchmarks
          </h3>

          <p className="text-sm text-text-muted leading-relaxed">
            Our AI OCR engine extracts your technical skills, calculates your ATS keyword match score, and pinpoints exact syllabus gaps before your campus drive.
          </p>

          <div className="flex flex-wrap items-center gap-4 text-xs text-text-muted pt-1">
            <div className="flex items-center space-x-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-accent" />
              <span>Instant ATS Score</span>
            </div>
            <div className="flex items-center space-x-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-accent" />
              <span>Cosine Gap Analysis</span>
            </div>
            <div className="flex items-center space-x-1">
              <ShieldCheck className="w-3.5 h-3.5 text-accent" />
              <span>100% Free for Students</span>
            </div>
          </div>
        </div>

        <button
          onClick={handleStartAnalysis}
          className="w-full sm:w-auto shrink-0 inline-flex items-center justify-center px-6 py-3.5 rounded-xl bg-accent hover:bg-accent-hover text-white font-bold text-sm shadow-md transition-all group"
        >
          <span>Run Resume Audit</span>
          <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </div>
  );
};

export default ResumeAnalyzerCallout;

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthGate } from '../../auth/useAuthGate';
import { Bot, Play, Building2, Sparkles, Trophy } from 'lucide-react';

export const CompanyMockInterviewButton = ({ companyName = 'Google', topic = 'Data Structures & Algorithms' }) => {
  const navigate = useNavigate();
  const { requireAuth } = useAuthGate();

  const handleLaunchSimulation = () => {
    requireAuth(
      () => {
        navigate(`/student/interview?company=${encodeURIComponent(companyName)}`);
      },
      {
        action: 'mock_interview_start',
        source: 'blog_company_hook',
        metadata: { companyName, topic },
      }
    );
  };

  return (
    <div className="my-8 rounded-2xl border border-border bg-surface-2/60 p-6 sm:p-7 relative overflow-hidden transition-all hover:border-accent/40 shadow-xs">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2.5">
          <div className="inline-flex items-center space-x-2">
            <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-surface border border-border text-accent text-xs font-bold">
              <Building2 className="w-3.5 h-3.5" />
              <span>{companyName} Placement Drill</span>
            </span>
            <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-accent/10 text-accent text-[11px] font-semibold">
              <Sparkles className="w-3 h-3" />
              <span>Ollama RAG Powered</span>
            </span>
          </div>

          <h3 className="text-lg font-black text-text">
            Simulate the Live {companyName} Technical & Behavioral Round
          </h3>

          <p className="text-xs text-text-muted leading-relaxed max-w-xl">
            Test yourself under genuine round constraints. Our AI interviewer evaluates your code optimality, communication clarity, and follow-up depth in real time.
          </p>

          <div className="flex items-center space-x-4 text-[11px] text-text-muted pt-1">
            <span className="flex items-center space-x-1">
              <Trophy className="w-3.5 h-3.5 text-accent" />
              <span>Verified Alumni Question Bank</span>
            </span>
            <span className="flex items-center space-x-1">
              <Bot className="w-3.5 h-3.5 text-accent" />
              <span>Adaptive Follow-up Inquiries</span>
            </span>
          </div>
        </div>

        <button
          onClick={handleLaunchSimulation}
          className="w-full md:w-auto shrink-0 inline-flex items-center justify-center space-x-2 px-6 py-3.5 rounded-xl bg-accent hover:bg-accent-hover text-white font-bold text-sm shadow-md transition-all active:scale-[0.98]"
        >
          <Play className="w-4 h-4 fill-white" />
          <span>Practice {companyName} Round</span>
        </button>
      </div>
    </div>
  );
};

export default CompanyMockInterviewButton;

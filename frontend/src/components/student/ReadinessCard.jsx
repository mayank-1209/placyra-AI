import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { BarChart3, TrendingUp, CheckCircle, AlertTriangle, FileText, Bot, Award, Loader2, Lock } from 'lucide-react';
import { fetchStudentReadiness } from '../../store/slices/resumeSlice';
import { useAuthGate } from '../../features/auth/useAuthGate';

export const ReadinessCard = () => {
  const dispatch = useDispatch();
  const { isAuthenticated, requireAuth } = useAuthGate();
  const { readiness, readinessLoading } = useSelector((state) => state.resume);

  useEffect(() => {
    if (isAuthenticated && !readiness) {
      dispatch(fetchStudentReadiness());
    }
  }, [dispatch, isAuthenticated, readiness]);

  if (!isAuthenticated) {
    return (
      <div className="p-8 bg-surface border border-border rounded-2xl shadow-xl space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-border">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-accent-subtle text-accent rounded-xl">
              <Award className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-text">Placement Readiness Engine</h3>
              <p className="text-xs text-text-muted mt-0.5">
                Multi-factor evaluation aggregating PyMuPDF OCR resume extraction, interview scores, and cohort percentiles.
              </p>
            </div>
          </div>
          <button
            onClick={() => requireAuth(null, { action: 'readiness_analytics' })}
            className="px-6 py-2.5 bg-accent hover:bg-accent-hover text-accent-contrast rounded-xl text-xs font-semibold shadow-md transition-all shrink-0"
          >
            Sign In to Unlock My Score
          </button>
        </div>

        {/* Demo KPI preview cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 opacity-75">
          <div className="p-5 bg-surface-2 border border-border rounded-xl">
            <p className="text-xs uppercase text-text-muted font-semibold">Placement Readiness</p>
            <p className="text-2xl font-black text-accent mt-1">-- %</p>
            <span className="text-[11px] text-text-muted mt-1 block">Awaiting candidate resume</span>
          </div>
          <div className="p-5 bg-surface-2 border border-border rounded-xl">
            <p className="text-xs uppercase text-text-muted font-semibold">Resume Strength</p>
            <p className="text-2xl font-black text-success mt-1">-- %</p>
            <span className="text-[11px] text-text-muted mt-1 block">PyMuPDF ATS Parser</span>
          </div>
          <div className="p-5 bg-surface-2 border border-border rounded-xl">
            <p className="text-xs uppercase text-text-muted font-semibold">Mock Interview Avg</p>
            <p className="text-2xl font-black text-warning mt-1">-- / 10</p>
            <span className="text-[11px] text-text-muted mt-1 block">Local Ollama Technical</span>
          </div>
          <div className="p-5 bg-surface-2 border border-border rounded-xl">
            <p className="text-xs uppercase text-text-muted font-semibold">Completed Rounds</p>
            <p className="text-2xl font-black text-text mt-1">0</p>
            <span className="text-[11px] text-text-muted mt-1 block">Active Preparation</span>
          </div>
        </div>
      </div>
    );
  }

  if (readinessLoading && !readiness) {
    return (
      <div className="p-12 text-center text-text-muted flex flex-col items-center justify-center space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
        <p className="text-sm font-medium">Loading Placement Readiness Analytics...</p>
      </div>
    );
  }

  if (!readiness) return null;

  return (
    <div className="space-y-6">
      {/* Top Level KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Overall Score */}
        <div className="p-6 bg-surface border border-accent/20 rounded-2xl shadow-xl flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-accent">
              Placement Readiness
            </p>
            <h3 className="text-3xl font-black text-text mt-1">
              {readiness.overall_score}%
            </h3>
            <span className="text-[11px] text-success font-medium flex items-center mt-1">
              <TrendingUp className="w-3 h-3 mr-1" /> Top Tier Batch Ranking
            </span>
          </div>
          <div className="p-3 bg-accent-subtle text-accent rounded-xl">
            <Award className="w-7 h-7" />
          </div>
        </div>

        {/* Resume Score */}
        <div className="p-6 bg-surface border border-border rounded-2xl shadow-xl flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">
              Resume Strength
            </p>
            <h3 className="text-3xl font-black text-text mt-1">
              {readiness.resume_score}%
            </h3>
            <span className="text-[11px] text-text-muted mt-1 block">
              Verified by PyMuPDF OCR
            </span>
          </div>
          <div className="p-3 bg-success-subtle text-success rounded-xl">
            <FileText className="w-7 h-7" />
          </div>
        </div>

        {/* Mock Interview Average */}
        <div className="p-6 bg-surface border border-border rounded-2xl shadow-xl flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">
              Mock Interview Avg
            </p>
            <h3 className="text-3xl font-black text-text mt-1">
              {readiness.interview_avg_score} / 10
            </h3>
            <span className="text-[11px] text-text-muted mt-1 block">
              Ollama Technical Scoring
            </span>
          </div>
          <div className="p-3 bg-warning-subtle text-warning rounded-xl">
            <Bot className="w-7 h-7" />
          </div>
        </div>

        {/* Sessions Completed */}
        <div className="p-6 bg-surface border border-border rounded-2xl shadow-xl flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">
              Completed Rounds
            </p>
            <h3 className="text-3xl font-black text-text mt-1">
              {readiness.interviews_completed}
            </h3>
            <span className="text-[11px] text-accent mt-1 block">
              Active Preparation Practice
            </span>
          </div>
          <div className="p-3 bg-surface-2 text-text-muted rounded-xl">
            <BarChart3 className="w-7 h-7" />
          </div>
        </div>
      </div>

      {/* Historical Progress Chart */}
      <div className="p-6 bg-surface border border-border rounded-2xl shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-text flex items-center">
            <TrendingUp className="w-4 h-4 mr-2 text-accent" />
            Historical Placement Readiness Progression
          </h3>
          <span className="text-xs text-text-muted">Trend over practice rounds</span>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={readiness.historical_trend}>
              <defs>
                <linearGradient id="scoreColor" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="var(--accent)" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="session" stroke="var(--text-muted)" tick={{ fontSize: 11 }} />
              <YAxis domain={[0, 100]} stroke="var(--text-muted)" tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)', borderRadius: '8px' }}
                itemStyle={{ fontSize: '12px', color: 'var(--accent)' }}
              />
              <Area
                type="monotone"
                dataKey="score"
                stroke="var(--accent)"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#scoreColor)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Strengths & Actionable Gaps */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 bg-surface border border-border rounded-2xl shadow-xl">
          <h4 className="text-sm font-bold text-success uppercase tracking-wider mb-4 flex items-center">
            <CheckCircle className="w-4 h-4 mr-2" />
            Placement Strengths
          </h4>
          <ul className="space-y-3">
            {readiness.top_strengths?.map((s, idx) => (
              <li key={idx} className="flex items-start text-xs text-text">
                <span className="text-success mr-2 font-bold">•</span>
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="p-6 bg-surface border border-border rounded-2xl shadow-xl">
          <h4 className="text-sm font-bold text-warning uppercase tracking-wider mb-4 flex items-center">
            <AlertTriangle className="w-4 h-4 mr-2" />
            Critical Preparation Gaps
          </h4>
          <ul className="space-y-3">
            {readiness.critical_gaps?.map((g, idx) => (
              <li key={idx} className="flex items-start text-xs text-text">
                <span className="text-warning mr-2 font-bold">•</span>
                <span>{g}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ReadinessCard;

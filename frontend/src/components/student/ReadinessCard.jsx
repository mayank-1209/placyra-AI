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
import { BarChart3, TrendingUp, CheckCircle, AlertTriangle, FileText, Bot, Award, Loader2 } from 'lucide-react';
import { fetchStudentReadiness } from '../../store/slices/resumeSlice';

export const ReadinessCard = () => {
  const dispatch = useDispatch();
  const { readiness, readinessLoading } = useSelector((state) => state.resume);

  useEffect(() => {
    if (!readiness) {
      dispatch(fetchStudentReadiness());
    }
  }, [dispatch, readiness]);

  if (readinessLoading && !readiness) {
    return (
      <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
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
        <div className="p-6 bg-gradient-to-br from-indigo-900/60 to-slate-900 border border-indigo-500/30 rounded-2xl shadow-xl flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-indigo-300">
              Placement Readiness
            </p>
            <h3 className="text-3xl font-black text-white mt-1">
              {readiness.overall_score}%
            </h3>
            <span className="text-[11px] text-emerald-400 font-medium flex items-center mt-1">
              <TrendingUp className="w-3 h-3 mr-1" /> Top Tier Batch Ranking
            </span>
          </div>
          <div className="p-3 bg-indigo-600/20 text-indigo-400 rounded-xl">
            <Award className="w-7 h-7" />
          </div>
        </div>

        {/* Resume Score */}
        <div className="p-6 bg-slate-900/80 border border-slate-800 rounded-2xl shadow-xl flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Resume Strength
            </p>
            <h3 className="text-3xl font-black text-white mt-1">
              {readiness.resume_score}%
            </h3>
            <span className="text-[11px] text-slate-400 mt-1 block">
              Verified by PyMuPDF OCR
            </span>
          </div>
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl">
            <FileText className="w-7 h-7" />
          </div>
        </div>

        {/* Mock Interview Average */}
        <div className="p-6 bg-slate-900/80 border border-slate-800 rounded-2xl shadow-xl flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Mock Interview Avg
            </p>
            <h3 className="text-3xl font-black text-white mt-1">
              {readiness.interview_avg_score} / 10
            </h3>
            <span className="text-[11px] text-slate-400 mt-1 block">
              Ollama Technical Scoring
            </span>
          </div>
          <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl">
            <Bot className="w-7 h-7" />
          </div>
        </div>

        {/* Sessions Completed */}
        <div className="p-6 bg-slate-900/80 border border-slate-800 rounded-2xl shadow-xl flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Completed Rounds
            </p>
            <h3 className="text-3xl font-black text-white mt-1">
              {readiness.interviews_completed}
            </h3>
            <span className="text-[11px] text-indigo-400 mt-1 block">
              Active Preparation Practice
            </span>
          </div>
          <div className="p-3 bg-cyan-500/10 text-cyan-400 rounded-xl">
            <BarChart3 className="w-7 h-7" />
          </div>
        </div>
      </div>

      {/* Historical Progress Chart */}
      <div className="p-6 bg-slate-900/80 border border-slate-800 rounded-2xl shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-white flex items-center">
            <TrendingUp className="w-4 h-4 mr-2 text-indigo-400" />
            Historical Placement Readiness Progression
          </h3>
          <span className="text-xs text-slate-400">Trend over practice rounds</span>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={readiness.historical_trend}>
              <defs>
                <linearGradient id="scoreColor" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="session" stroke="#64748b" tick={{ fontSize: 11 }} />
              <YAxis domain={[0, 100]} stroke="#64748b" tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                itemStyle={{ fontSize: '12px', color: '#818cf8' }}
              />
              <Area
                type="monotone"
                dataKey="score"
                stroke="#818cf8"
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
        <div className="p-6 bg-slate-900/80 border border-slate-800 rounded-2xl shadow-xl">
          <h4 className="text-sm font-bold text-emerald-400 uppercase tracking-wider mb-4 flex items-center">
            <CheckCircle className="w-4 h-4 mr-2" />
            Placement Strengths
          </h4>
          <ul className="space-y-3">
            {readiness.top_strengths?.map((s, idx) => (
              <li key={idx} className="flex items-start text-xs text-slate-300">
                <span className="text-emerald-400 mr-2 font-bold">•</span>
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="p-6 bg-slate-900/80 border border-slate-800 rounded-2xl shadow-xl">
          <h4 className="text-sm font-bold text-amber-400 uppercase tracking-wider mb-4 flex items-center">
            <AlertTriangle className="w-4 h-4 mr-2" />
            Critical Preparation Gaps
          </h4>
          <ul className="space-y-3">
            {readiness.critical_gaps?.map((g, idx) => (
              <li key={idx} className="flex items-start text-xs text-slate-300">
                <span className="text-amber-400 mr-2 font-bold">•</span>
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

import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';
import { Target, CheckCircle2, AlertTriangle, ArrowRight, Loader2, Sparkles, Building2 } from 'lucide-react';
import { fetchCompanies } from '../../store/slices/tnpSlice';
import { analyzeSkillGap } from '../../store/slices/resumeSlice';

export const SkillGapRadar = () => {
  const dispatch = useDispatch();
  const { companies } = useSelector((state) => state.tnp);
  const { skillGapAnalysis: analysis, analysisLoading: loading, error } = useSelector((state) => state.resume);

  const [selectedCompanyId, setSelectedCompanyId] = useState('');

  useEffect(() => {
    dispatch(fetchCompanies());
  }, [dispatch]);

  useEffect(() => {
    if (companies.length > 0 && !selectedCompanyId) {
      setSelectedCompanyId(companies[0].id);
    }
  }, [companies, selectedCompanyId]);

  const runAnalysis = () => {
    if (!selectedCompanyId) return;
    dispatch(analyzeSkillGap(selectedCompanyId));
  };

  return (
    <div className="space-y-6">
      {/* Target Company Selector */}
      <div className="p-6 bg-slate-900/80 border border-slate-800 rounded-2xl shadow-xl">
        <h2 className="text-xl font-bold text-white flex items-center mb-1">
          <Target className="w-5 h-5 mr-2 text-indigo-400" />
          Target Company Skill-Gap & Radar Analysis
        </h2>
        <p className="text-sm text-slate-400 mb-6">
          Compare your extracted resume proficiencies against official campus placement criteria using Redux-managed state.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <div className="w-full sm:w-80">
            <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
              Select Company
            </label>
            <div className="relative">
              <select
                value={selectedCompanyId}
                onChange={(e) => setSelectedCompanyId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 text-slate-100 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500"
              >
                {companies.map((comp) => (
                  <option key={comp.id} value={comp.id}>
                    {comp.name} ({comp.industry || 'Tech'})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            onClick={runAnalysis}
            disabled={loading || !selectedCompanyId}
            className="w-full sm:w-auto mt-6 px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 disabled:opacity-50 text-white text-sm font-semibold rounded-xl shadow-lg shadow-indigo-600/30 flex items-center justify-center transition-all"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Analyzing Gap...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Compute Skill Gap
              </>
            )}
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm flex items-center">
            <AlertTriangle className="w-4 h-4 mr-2 shrink-0" />
            {error}
          </div>
        )}
      </div>

      {/* Analysis Results View */}
      {analysis && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Radar Chart Visual */}
          <div className="lg:col-span-7 p-6 bg-slate-900/80 border border-slate-800 rounded-2xl shadow-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white flex items-center">
                  <Building2 className="w-5 h-5 mr-2 text-indigo-400" />
                  {analysis.company_name} Readiness Radar
                </h3>
                <div className="px-3 py-1 bg-indigo-500/10 border border-indigo-500/30 rounded-full text-xs font-semibold text-indigo-400">
                  Match Score: {analysis.match_score}%
                </div>
              </div>
              <p className="text-xs text-slate-400 mb-4">
                Comparison of your skills against {analysis.company_name} benchmarks across 5 dimensions.
              </p>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={analysis.radar_data}>
                  <PolarGrid stroke="#334155" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#475569" />
                  <Radar
                    name="Your Score"
                    dataKey="student"
                    stroke="#818cf8"
                    fill="#6366f1"
                    fillOpacity={0.5}
                  />
                  <Radar
                    name="Company Benchmark"
                    dataKey="required"
                    stroke="#38bdf8"
                    fill="#0ea5e9"
                    fillOpacity={0.2}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                    itemStyle={{ fontSize: '12px', color: '#f8fafc' }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Matched vs Missing Skills */}
          <div className="lg:col-span-5 space-y-6">
            <div className="p-6 bg-slate-900/80 border border-slate-800 rounded-2xl shadow-xl">
              <h4 className="text-sm font-bold text-emerald-400 uppercase tracking-wider mb-3 flex items-center">
                <CheckCircle2 className="w-4 h-4 mr-1.5" />
                Matched Skills ({analysis.matched_skills?.length || 0})
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {analysis.matched_skills?.length > 0 ? (
                  analysis.matched_skills.map((s, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-xs font-medium rounded-lg"
                    >
                      {s}
                    </span>
                  ))
                ) : (
                  <p className="text-xs text-slate-500">No direct skills matched yet.</p>
                )}
              </div>

              <h4 className="text-sm font-bold text-amber-400 uppercase tracking-wider mt-5 mb-3 flex items-center">
                <AlertTriangle className="w-4 h-4 mr-1.5" />
                Missing / Recommended Skills ({analysis.missing_skills?.length || 0})
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {analysis.missing_skills?.length > 0 ? (
                  analysis.missing_skills.map((s, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 bg-amber-500/10 text-amber-300 border border-amber-500/20 text-xs font-medium rounded-lg"
                    >
                      {s}
                    </span>
                  ))
                ) : (
                  <p className="text-xs text-emerald-400">Congratulations! All key skills matched.</p>
                )}
              </div>
            </div>

            {/* Strategic Action Plan */}
            <div className="p-6 bg-slate-900/80 border border-slate-800 rounded-2xl shadow-xl">
              <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-3">
                Strategic Placement Action Plan
              </h4>
              <ul className="space-y-2.5">
                {analysis.action_plan?.map((step, idx) => (
                  <li key={idx} className="flex items-start text-xs text-slate-300">
                    <ArrowRight className="w-3.5 h-3.5 mr-2 text-indigo-400 shrink-0 mt-0.5" />
                    <span>{step}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SkillGapRadar;

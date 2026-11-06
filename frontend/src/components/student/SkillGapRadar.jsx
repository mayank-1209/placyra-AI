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
} from 'recharts';
import { Target, TrendingUp, AlertCircle, CheckCircle2, Loader2, Sparkles, Building2, Lock } from 'lucide-react';
import { analyzeSkillGap } from '../../store/slices/resumeSlice';
import { fetchCompanies } from '../../store/slices/tnpSlice';
import { useAuthGate } from '../../features/auth/useAuthGate';

export const SkillGapRadar = () => {
  const dispatch = useDispatch();
  const { isAuthenticated, requireAuth } = useAuthGate();
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
    requireAuth(() => {
      dispatch(analyzeSkillGap(selectedCompanyId));
    }, { action: 'skill_gap_analysis' });
  };

  return (
    <div className="space-y-6">
      {/* Target Company Selector */}
      <div className="p-6 bg-surface border border-border rounded-2xl shadow-xl">
        <h2 className="text-xl font-bold text-text flex items-center mb-1">
          <Target className="w-5 h-5 mr-2 text-accent" />
          Target Company Skill-Gap & Radar Analysis
        </h2>
        <p className="text-sm text-text-muted mb-6">
          Compare your extracted resume proficiencies against official campus placement criteria using Redux-managed state.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <div className="w-full sm:w-80">
            <label className="block text-xs font-semibold text-text-muted mb-1.5 uppercase tracking-wider">
              Select Company
            </label>
            <div className="relative">
              <select
                value={selectedCompanyId}
                onChange={(e) => setSelectedCompanyId(e.target.value)}
                className="w-full bg-surface-2 border border-border text-text rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-accent"
              >
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.industry || 'Technology'})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="sm:self-end w-full sm:w-auto">
            <button
              onClick={runAnalysis}
              disabled={loading || !selectedCompanyId}
              className="w-full sm:w-auto px-6 py-2.5 bg-accent hover:bg-accent-hover text-accent-contrast font-semibold rounded-xl text-sm shadow-lg shadow-accent/20 flex items-center justify-center transition-all disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Analyzing Skill Gap...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Compute Skill Gap
                </>
              )}
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-danger-subtle border border-danger/20 text-danger rounded-xl text-xs flex items-center">
            <AlertCircle className="w-4 h-4 mr-2 shrink-0" />
            {error}
          </div>
        )}
      </div>

      {/* Guest Mode Informational Callout */}
      {!isAuthenticated && !analysis && (
        <div className="p-6 bg-surface-2 border border-border rounded-2xl flex items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-accent-subtle text-accent rounded-xl">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-text">Interactive Recruiter Skill Benchmarking</h4>
              <p className="text-xs text-text-muted mt-0.5">
                Sign in with your candidate account to unlock comparative radar mapping and personalized curriculum recommendations.
              </p>
            </div>
          </div>
          <button
            onClick={() => runAnalysis()}
            className="px-4 py-2 bg-accent hover:bg-accent-hover text-accent-contrast rounded-xl text-xs font-semibold shrink-0"
          >
            Unlock Skill Radar
          </button>
        </div>
      )}

      {/* Analysis Results */}
      {analysis && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Radar Chart Visualizer */}
          <div className="p-6 bg-surface border border-border rounded-2xl shadow-xl flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-text flex items-center">
                <TrendingUp className="w-4 h-4 mr-2 text-accent" />
                Multi-Axis Skill Proficiency Radar
              </h3>
              <span className="text-xs text-text-muted">Target Benchmarks</span>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={analysis.radar_chart}>
                  <PolarGrid stroke="var(--border)" />
                  <PolarAngleAxis dataKey="skill" stroke="var(--text-muted)" tick={{ fontSize: 11 }} />
                  <PolarRadiusAxis domain={[0, 100]} stroke="var(--border-muted)" />
                  <Radar
                    name="Candidate Match"
                    dataKey="score"
                    stroke="var(--accent)"
                    fill="var(--accent)"
                    fillOpacity={0.4}
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)', borderRadius: '8px' }}
                    itemStyle={{ fontSize: '12px', color: 'var(--accent)' }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-4 pt-4 border-t border-border flex items-center justify-between text-xs text-text-muted">
              <span>Overall Target Match:</span>
              <span className="text-base font-black text-accent">
                {analysis.match_percentage}%
              </span>
            </div>
          </div>

          {/* Missing Skills & Recommendations */}
          <div className="space-y-6">
            {/* Critical Missing Skills */}
            <div className="p-6 bg-surface border border-border rounded-2xl shadow-xl">
              <h3 className="text-sm font-bold text-danger uppercase tracking-wider mb-4 flex items-center">
                <AlertCircle className="w-4 h-4 mr-2" />
                Critical Preparation Gaps ({analysis.missing_skills?.length || 0})
              </h3>
              <div className="flex flex-wrap gap-2">
                {analysis.missing_skills?.map((skill, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 bg-danger-subtle text-danger border border-danger/20 text-xs font-semibold rounded-lg"
                  >
                    + {skill}
                  </span>
                ))}
              </div>
            </div>

            {/* Strengths / Matched Skills */}
            <div className="p-6 bg-surface border border-border rounded-2xl shadow-xl">
              <h3 className="text-sm font-bold text-success uppercase tracking-wider mb-4 flex items-center">
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Demonstrated Recruiter Match ({analysis.matched_skills?.length || 0})
              </h3>
              <div className="flex flex-wrap gap-2">
                {analysis.matched_skills?.map((skill, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 bg-success-subtle text-success border border-success/20 text-xs font-semibold rounded-lg"
                  >
                    ✓ {skill}
                  </span>
                ))}
              </div>
            </div>

            {/* AI Action Plan */}
            <div className="p-6 bg-surface border border-border rounded-2xl shadow-xl">
              <h3 className="text-sm font-bold text-text mb-3 flex items-center">
                <Sparkles className="w-4 h-4 mr-2 text-warning" />
                Target Preparation Roadmap
              </h3>
              <ul className="space-y-2 text-xs text-text-muted">
                {analysis.recommended_actions?.map((action, idx) => (
                  <li key={idx} className="flex items-start">
                    <span className="text-accent mr-2 font-bold">•</span>
                    <span>{action}</span>
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

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../../components/common/Navbar';
import Sidebar from '../../components/common/Sidebar';
import JDManager from '../../components/tnp/JDManager';
import QuestionUploadForm from '../../components/tnp/QuestionUploadForm';
import BulkCsvUploader from '../../components/tnp/BulkCsvUploader';
import ModerationQueue from '../../components/tnp/ModerationQueue';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import {
  TrendingUp,
  Users,
  Building2,
  FileQuestion,
  Clock,
  Sparkles,
  Award,
} from 'lucide-react';
import { analyticsApi } from '../../services/apiClient';

export const TnpDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(
    user?.role === 'alumni' ? 'add-question' : 'companies'
  );
  const [batchData, setBatchData] = useState(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);

  useEffect(() => {
    if (activeTab === 'batch-analytics') {
      loadBatchAnalytics();
    }
  }, [activeTab]);

  const loadBatchAnalytics = async () => {
    setLoadingAnalytics(true);
    try {
      const resp = await analyticsApi.getTnpBatchOverview();
      setBatchData(resp.data);
    } catch (err) {
      console.error('Failed to load batch analytics:', err);
    } finally {
      setLoadingAnalytics(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      <Navbar />

      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} role={user?.role} />

        <main className="flex-1 p-6 overflow-y-auto">
          {activeTab === 'companies' && <JDManager />}

          {activeTab === 'add-question' && <QuestionUploadForm />}

          {activeTab === 'bulk-upload' && <BulkCsvUploader />}

          {activeTab === 'moderation' && <ModerationQueue />}

          {activeTab === 'batch-analytics' && (
            <div className="space-y-6">
              {loadingAnalytics || !batchData ? (
                <div className="p-8 text-center text-slate-400">
                  Loading Batch Placement Analytics...
                </div>
              ) : (
                <>
                  {/* Top Level KPIs */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="p-5 bg-slate-900/80 border border-slate-800 rounded-2xl shadow-xl flex items-center justify-between">
                      <div>
                        <p className="text-xs font-semibold uppercase text-slate-400">
                          Registered Students
                        </p>
                        <h3 className="text-3xl font-black text-white mt-1">
                          {batchData.batch_kpis?.total_students}
                        </h3>
                      </div>
                      <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl">
                        <Users className="w-6 h-6" />
                      </div>
                    </div>

                    <div className="p-5 bg-slate-900/80 border border-slate-800 rounded-2xl shadow-xl flex items-center justify-between">
                      <div>
                        <p className="text-xs font-semibold uppercase text-slate-400">
                          Partner Companies
                        </p>
                        <h3 className="text-3xl font-black text-white mt-1">
                          {batchData.batch_kpis?.active_companies}
                        </h3>
                      </div>
                      <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl">
                        <Building2 className="w-6 h-6" />
                      </div>
                    </div>

                    <div className="p-5 bg-slate-900/80 border border-slate-800 rounded-2xl shadow-xl flex items-center justify-between">
                      <div>
                        <p className="text-xs font-semibold uppercase text-slate-400">
                          Indexed Questions
                        </p>
                        <h3 className="text-3xl font-black text-white mt-1">
                          {batchData.batch_kpis?.indexed_questions}
                        </h3>
                      </div>
                      <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl">
                        <FileQuestion className="w-6 h-6" />
                      </div>
                    </div>

                    <div className="p-5 bg-slate-900/80 border border-slate-800 rounded-2xl shadow-xl flex items-center justify-between">
                      <div>
                        <p className="text-xs font-semibold uppercase text-slate-400">
                          Moderation Pending
                        </p>
                        <h3 className="text-3xl font-black text-white mt-1">
                          {batchData.batch_kpis?.pending_moderation}
                        </h3>
                      </div>
                      <div className="p-3 bg-purple-500/10 text-purple-400 rounded-xl">
                        <Clock className="w-6 h-6" />
                      </div>
                    </div>
                  </div>

                  {/* Branch Readiness Distributions Bar Chart */}
                  <div className="p-6 bg-slate-900/80 border border-slate-800 rounded-2xl shadow-xl">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-base font-bold text-white flex items-center">
                        <TrendingUp className="w-4 h-4 mr-2 text-indigo-400" />
                        Branch-Wise Placement Readiness Distribution
                      </h3>
                      <span className="text-xs text-slate-400">Aggregate batch metrics</span>
                    </div>

                    <div className="h-72 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={batchData.branch_distributions}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                          <XAxis dataKey="branch" stroke="#64748b" tick={{ fontSize: 11 }} />
                          <YAxis domain={[0, 100]} stroke="#64748b" tick={{ fontSize: 11 }} />
                          <Tooltip
                            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                            itemStyle={{ fontSize: '12px' }}
                          />
                          <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                          <Bar dataKey="avg_readiness" name="Average Readiness (%)" fill="#6366f1" radius={[6, 6, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Common Missing Skills Table */}
                  <div className="p-6 bg-slate-900/80 border border-slate-800 rounded-2xl shadow-xl">
                    <h3 className="text-base font-bold text-white mb-4 flex items-center">
                      <Sparkles className="w-4 h-4 mr-2 text-amber-400" />
                      Top Critical Skill Gaps Across Student Batch
                    </h3>
                    <div className="space-y-3">
                      {batchData.top_missing_skills?.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-3.5 bg-slate-950 border border-slate-800 rounded-xl"
                        >
                          <span className="text-xs font-semibold text-slate-200">
                            {item.skill}
                          </span>
                          <div className="flex items-center space-x-3">
                            <span className="text-xs text-slate-400">
                              {item.students_missing_count} students affected
                            </span>
                            <span className="px-2.5 py-0.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-lg text-xs font-bold">
                              {item.percentage}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default TnpDashboard;

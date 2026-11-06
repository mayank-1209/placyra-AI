import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
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
  Loader2,
} from 'lucide-react';
import { fetchBatchAnalytics } from '../../store/slices/tnpSlice';

export const TnpDashboard = () => {
  const { user } = useAuth();
  const dispatch = useDispatch();
  const { batchAnalytics, loading: analyticsLoading } = useSelector((state) => state.tnp);

  const [activeTab, setActiveTab] = useState(
    user?.role === 'alumni' ? 'add-question' : 'companies'
  );

  useEffect(() => {
    if (activeTab === 'batch-analytics' && !batchAnalytics) {
      dispatch(fetchBatchAnalytics());
    }
  }, [activeTab, batchAnalytics, dispatch]);

  return (
    <div className="min-h-screen bg-bg text-text flex flex-col">
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
              {analyticsLoading && !batchAnalytics ? (
                <div className="p-12 text-center text-text-muted flex flex-col items-center justify-center space-y-3">
                  <Loader2 className="w-8 h-8 animate-spin text-accent" />
                  <p className="text-sm font-medium">Loading Batch Placement Analytics...</p>
                </div>
              ) : !batchAnalytics ? (
                <div className="p-8 text-center text-text-muted bg-surface rounded-xl border border-border">
                  No batch analytics data currently available.
                </div>
              ) : (
                <>
                  {/* Top Level KPIs */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="p-5 bg-surface border border-border rounded-2xl shadow-xl flex items-center justify-between">
                      <div>
                        <p className="text-xs font-semibold uppercase text-text-muted">
                          Registered Students
                        </p>
                        <h3 className="text-3xl font-black text-text mt-1">
                          {batchAnalytics.batch_kpis?.total_students}
                        </h3>
                      </div>
                      <div className="p-3 bg-accent-subtle text-accent rounded-xl">
                        <Users className="w-6 h-6" />
                      </div>
                    </div>

                    <div className="p-5 bg-surface border border-border rounded-2xl shadow-xl flex items-center justify-between">
                      <div>
                        <p className="text-xs font-semibold uppercase text-text-muted">
                          Partner Companies
                        </p>
                        <h3 className="text-3xl font-black text-text mt-1">
                          {batchAnalytics.batch_kpis?.active_companies}
                        </h3>
                      </div>
                      <div className="p-3 bg-success-subtle text-success rounded-xl">
                        <Building2 className="w-6 h-6" />
                      </div>
                    </div>

                    <div className="p-5 bg-surface border border-border rounded-2xl shadow-xl flex items-center justify-between">
                      <div>
                        <p className="text-xs font-semibold uppercase text-text-muted">
                          Indexed Questions
                        </p>
                        <h3 className="text-3xl font-black text-text mt-1">
                          {batchAnalytics.batch_kpis?.indexed_questions}
                        </h3>
                      </div>
                      <div className="p-3 bg-warning-subtle text-warning rounded-xl">
                        <FileQuestion className="w-6 h-6" />
                      </div>
                    </div>

                    <div className="p-5 bg-surface border border-border rounded-2xl shadow-xl flex items-center justify-between">
                      <div>
                        <p className="text-xs font-semibold uppercase text-text-muted">
                          Moderation Pending
                        </p>
                        <h3 className="text-3xl font-black text-text mt-1">
                          {batchAnalytics.batch_kpis?.pending_moderation}
                        </h3>
                      </div>
                      <div className="p-3 bg-accent-subtle text-accent rounded-xl">
                        <Clock className="w-6 h-6" />
                      </div>
                    </div>
                  </div>

                  {/* Branch Readiness Distributions Bar Chart */}
                  <div className="p-6 bg-surface border border-border rounded-2xl shadow-xl">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-base font-bold text-text flex items-center">
                        <TrendingUp className="w-4 h-4 mr-2 text-accent" />
                        Branch-Wise Placement Readiness Distribution
                      </h3>
                      <span className="text-xs text-text-muted">Aggregate batch metrics</span>
                    </div>

                    <div className="h-72 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={batchAnalytics.branch_distributions}>
                          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                          <XAxis dataKey="branch" stroke="var(--text-muted)" tick={{ fontSize: 11 }} />
                          <YAxis domain={[0, 100]} stroke="var(--text-muted)" tick={{ fontSize: 11 }} />
                          <Tooltip
                            contentStyle={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)', borderRadius: '8px' }}
                            itemStyle={{ fontSize: '12px', color: 'var(--accent)' }}
                          />
                          <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                          <Bar dataKey="avg_readiness" name="Average Readiness (%)" fill="var(--accent)" radius={[6, 6, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Common Missing Skills Table */}
                  <div className="p-6 bg-surface border border-border rounded-2xl shadow-xl">
                    <h3 className="text-base font-bold text-text mb-4 flex items-center">
                      <Sparkles className="w-4 h-4 mr-2 text-warning" />
                      Top Critical Skill Gaps Across Student Batch
                    </h3>
                    <div className="space-y-3">
                      {batchAnalytics.top_missing_skills?.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-3.5 bg-surface-2 border border-border rounded-xl"
                        >
                          <span className="text-xs font-semibold text-text">
                            {item.skill}
                          </span>
                          <div className="flex items-center space-x-3">
                            <span className="text-xs text-text-muted">
                              {item.students_missing_count} students affected
                            </span>
                            <span className="px-2.5 py-0.5 bg-warning-subtle border border-warning/20 text-warning rounded-lg text-xs font-bold">
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

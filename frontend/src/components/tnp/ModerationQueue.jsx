import React, { useState, useEffect } from 'react';
import { CheckSquare, Check, X, Loader2, AlertCircle, Building2, User, Sparkles } from 'lucide-react';
import { tnpApi } from '../../services/apiClient';

export const ModerationQueue = ({ onStatusChanged }) => {
  const [pendingQuestions, setPendingQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionInProgress, setActionInProgress] = useState(null);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    loadPendingQuestions();
  }, []);

  const loadPendingQuestions = async () => {
    setLoading(true);
    try {
      const resp = await tnpApi.getPendingQuestions();
      setPendingQuestions(resp.data);
    } catch (err) {
      console.error('Failed to load pending questions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    setActionInProgress(id);
    setMessage(null);
    try {
      await tnpApi.approveQuestion(id);
      setMessage({ type: 'success', text: `Question #${id} approved and indexed into Qdrant vector database!` });
      setPendingQuestions((prev) => prev.filter((q) => q.id !== id));
      if (onStatusChanged) onStatusChanged();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.detail || 'Failed to approve question.' });
    } finally {
      setActionInProgress(null);
    }
  };

  const handleReject = async (id) => {
    setActionInProgress(id);
    setMessage(null);
    try {
      await tnpApi.rejectQuestion(id);
      setMessage({ type: 'info', text: `Question #${id} rejected.` });
      setPendingQuestions((prev) => prev.filter((q) => q.id !== id));
      if (onStatusChanged) onStatusChanged();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.detail || 'Failed to reject question.' });
    } finally {
      setActionInProgress(null);
    }
  };

  return (
    <div className="p-6 bg-slate-900/80 border border-slate-800 rounded-2xl shadow-xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center">
            <CheckSquare className="w-5 h-5 mr-2 text-indigo-400" />
            Alumni Question Moderation Queue
          </h2>
          <p className="text-sm text-slate-400">
            Review questions submitted by alumni and students. Approving triggers 768-d Ollama embedding and Qdrant vector indexing.
          </p>
        </div>
        <div className="px-3 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-full text-xs font-semibold">
          {pendingQuestions.length} Awaiting Verification
        </div>
      </div>

      {message && (
        <div
          className={`p-3 rounded-xl text-xs font-medium border flex items-center ${
            message.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
              : message.type === 'error'
              ? 'bg-red-500/10 border-red-500/20 text-red-400'
              : 'bg-slate-800 border-slate-700 text-slate-300'
          }`}
        >
          <Sparkles className="w-4 h-4 mr-2 shrink-0" />
          {message.text}
        </div>
      )}

      {loading ? (
        <div className="p-8 text-center text-slate-400 flex items-center justify-center">
          <Loader2 className="w-5 h-5 animate-spin mr-2" />
          Loading moderation queue...
        </div>
      ) : pendingQuestions.length === 0 ? (
        <div className="p-8 text-center text-slate-500 bg-slate-950/40 rounded-xl border border-slate-800">
          No questions pending moderation. All submitted questions are verified and indexed!
        </div>
      ) : (
        <div className="space-y-4">
          {pendingQuestions.map((q) => (
            <div
              key={q.id}
              className="p-5 bg-slate-950/60 border border-slate-800 rounded-xl hover:border-slate-700 transition-all space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center space-x-2">
                  <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded text-[11px] font-bold">
                    {q.topic}
                  </span>
                  <span className="text-xs text-slate-400">• {q.difficulty}</span>
                  <span className="text-xs text-slate-400">• {q.round_type}</span>
                </div>
                <div className="text-xs text-slate-400 flex items-center">
                  <Building2 className="w-3.5 h-3.5 mr-1 text-slate-500" />
                  {q.company_name || 'General Placement'}
                </div>
              </div>

              <p className="text-sm text-slate-200 leading-relaxed font-medium">
                {q.question_text}
              </p>

              {q.answer_guidelines && (
                <div className="p-3 bg-slate-900 border border-slate-800/80 rounded-lg text-xs text-slate-400">
                  <span className="font-semibold text-slate-300">Answer Guidelines: </span>
                  {q.answer_guidelines}
                </div>
              )}

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-800/60">
                <button
                  onClick={() => handleReject(q.id)}
                  disabled={actionInProgress === q.id}
                  className="px-3.5 py-1.5 bg-slate-800 hover:bg-red-500/20 hover:text-red-400 text-slate-300 text-xs font-semibold rounded-lg border border-slate-700 transition-colors flex items-center"
                >
                  <X className="w-3.5 h-3.5 mr-1" />
                  Reject
                </button>
                <button
                  onClick={() => handleApprove(q.id)}
                  disabled={actionInProgress === q.id}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg shadow-md shadow-emerald-600/20 transition-all flex items-center"
                >
                  {actionInProgress === q.id ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
                  ) : (
                    <Check className="w-3.5 h-3.5 mr-1" />
                  )}
                  Approve & Index in Qdrant
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ModerationQueue;

import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { CheckSquare, Check, X, Loader2, Sparkles, Building2, AlertCircle } from 'lucide-react';
import { fetchPendingQuestions, approveQuestion, rejectQuestion, clearTnpMessages } from '../../store/slices/tnpSlice';

export const ModerationQueue = ({ onStatusChanged }) => {
  const dispatch = useDispatch();
  const {
    pendingQuestions,
    loading,
    actionLoadingId,
    successMessage,
    error,
  } = useSelector((state) => state.tnp);

  useEffect(() => {
    dispatch(fetchPendingQuestions());
  }, [dispatch]);

  const handleApprove = async (id) => {
    const result = await dispatch(approveQuestion(id));
    if (approveQuestion.fulfilled.match(result) && onStatusChanged) {
      onStatusChanged();
    }
  };

  const handleReject = async (id) => {
    const result = await dispatch(rejectQuestion(id));
    if (rejectQuestion.fulfilled.match(result) && onStatusChanged) {
      onStatusChanged();
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
          {pendingQuestions?.length || 0} Awaiting Verification
        </div>
      </div>

      {successMessage && (
        <div className="p-3 rounded-xl text-xs font-medium border flex items-center justify-between bg-emerald-500/10 border-emerald-500/20 text-emerald-400">
          <div className="flex items-center">
            <Sparkles className="w-4 h-4 mr-2 shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button
            onClick={() => dispatch(clearTnpMessages())}
            className="text-xs hover:underline text-emerald-300 ml-2"
          >
            Dismiss
          </button>
        </div>
      )}

      {error && (
        <div className="p-3 rounded-xl text-xs font-medium border flex items-center justify-between bg-red-500/10 border-red-500/20 text-red-400">
          <div className="flex items-center">
            <AlertCircle className="w-4 h-4 mr-2 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => dispatch(clearTnpMessages())}
            className="text-xs hover:underline text-red-300 ml-2"
          >
            Dismiss
          </button>
        </div>
      )}

      {loading && (!pendingQuestions || pendingQuestions.length === 0) ? (
        <div className="p-8 text-center text-slate-400 flex items-center justify-center">
          <Loader2 className="w-5 h-5 animate-spin mr-2" />
          Loading moderation queue...
        </div>
      ) : !pendingQuestions || pendingQuestions.length === 0 ? (
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
                  disabled={actionLoadingId === q.id}
                  className="px-3.5 py-1.5 bg-slate-800 hover:bg-red-500/20 hover:text-red-400 text-slate-300 text-xs font-semibold rounded-lg border border-slate-700 transition-colors flex items-center disabled:opacity-50"
                >
                  <X className="w-3.5 h-3.5 mr-1" />
                  Reject
                </button>
                <button
                  onClick={() => handleApprove(q.id)}
                  disabled={actionLoadingId === q.id}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg shadow-md shadow-emerald-600/20 transition-all flex items-center disabled:opacity-50"
                >
                  {actionLoadingId === q.id ? (
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

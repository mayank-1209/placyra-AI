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
    <div className="p-6 bg-surface border border-border rounded-2xl shadow-xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-text flex items-center">
            <CheckSquare className="w-5 h-5 mr-2 text-accent" />
            Alumni Question Moderation Queue
          </h2>
          <p className="text-sm text-text-muted">
            Review questions submitted by alumni and students. Approving triggers 768-d Ollama embedding and Qdrant vector indexing.
          </p>
        </div>
        <div className="px-3 py-1 bg-warning-subtle border border-warning/20 text-warning rounded-full text-xs font-semibold">
          {pendingQuestions?.length || 0} Awaiting Verification
        </div>
      </div>

      {successMessage && (
        <div className="p-3 rounded-xl text-xs font-medium border flex items-center justify-between bg-success-subtle border-success/20 text-success">
          <div className="flex items-center">
            <Sparkles className="w-4 h-4 mr-2 shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button
            onClick={() => dispatch(clearTnpMessages())}
            className="text-xs hover:underline text-success ml-2"
          >
            Dismiss
          </button>
        </div>
      )}

      {error && (
        <div className="p-3 rounded-xl text-xs font-medium border flex items-center justify-between bg-danger-subtle border-danger/20 text-danger">
          <div className="flex items-center">
            <AlertCircle className="w-4 h-4 mr-2 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => dispatch(clearTnpMessages())}
            className="text-xs hover:underline text-danger ml-2"
          >
            Dismiss
          </button>
        </div>
      )}

      {loading && (!pendingQuestions || pendingQuestions.length === 0) ? (
        <div className="p-8 text-center text-text-muted flex items-center justify-center">
          <Loader2 className="w-5 h-5 animate-spin mr-2 text-accent" />
          Loading moderation queue...
        </div>
      ) : !pendingQuestions || pendingQuestions.length === 0 ? (
        <div className="p-8 text-center text-text-muted bg-surface-2 rounded-xl border border-border">
          No questions pending moderation. All submitted questions are verified and indexed!
        </div>
      ) : (
        <div className="space-y-4">
          {pendingQuestions.map((q) => (
            <div
              key={q.id}
              className="p-5 bg-surface-2 border border-border rounded-xl hover:border-border-muted transition-all space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center space-x-2">
                  <span className="px-2 py-0.5 bg-accent-subtle text-accent border border-accent/20 rounded text-[11px] font-bold">
                    {q.topic}
                  </span>
                  <span className="text-xs text-text-muted">• {q.difficulty}</span>
                  <span className="text-xs text-text-muted">• {q.round_type}</span>
                </div>
                <div className="text-xs text-text-muted flex items-center">
                  <Building2 className="w-3.5 h-3.5 mr-1 text-text-muted" />
                  {q.company_name || 'General Placement'}
                </div>
              </div>

              <p className="text-sm text-text leading-relaxed font-medium">
                {q.question_text}
              </p>

              {q.answer_guidelines && (
                <div className="p-3 bg-surface border border-border rounded-lg text-xs text-text-muted">
                  <span className="font-semibold text-text">Answer Guidelines: </span>
                  {q.answer_guidelines}
                </div>
              )}

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-border">
                <button
                  onClick={() => handleReject(q.id)}
                  disabled={actionLoadingId === q.id}
                  className="px-3.5 py-1.5 bg-surface hover:bg-danger-subtle hover:text-danger text-text-muted text-xs font-semibold rounded-lg border border-border transition-colors flex items-center disabled:opacity-50"
                >
                  <X className="w-3.5 h-3.5 mr-1" />
                  Reject
                </button>
                <button
                  onClick={() => handleApprove(q.id)}
                  disabled={actionLoadingId === q.id}
                  className="px-4 py-1.5 bg-success hover:bg-success text-accent-contrast text-xs font-semibold rounded-lg shadow-sm transition-all flex items-center disabled:opacity-50"
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

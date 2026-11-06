import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  MessageSquare,
  Bot,
  User,
  Send,
  Loader2,
  Sparkles,
  HelpCircle,
  Award,
  CheckCircle2,
  AlertCircle,
  Building2,
  Play,
  RotateCcw,
  Lock,
} from 'lucide-react';
import {
  startMockInterview,
  submitInterviewAnswer,
  endMockInterview,
  resetInterviewSession,
  appendOptimisticUserMessage,
} from '../../store/slices/interviewSlice';
import { fetchCompanies } from '../../store/slices/tnpSlice';
import { useAuthGate } from '../../features/auth/useAuthGate';

export const MockInterviewChat = () => {
  const dispatch = useDispatch();
  const { isAuthenticated, requireAuth } = useAuthGate();
  const { session, messages, currentTurn, concludedReport, loading, evaluating, error } =
    useSelector((state) => state.interview);
  const { companies } = useSelector((state) => state.tnp);

  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const [targetRole, setTargetRole] = useState('Software Engineer');
  const [difficulty, setDifficulty] = useState('Medium');
  const [answerText, setAnswerText] = useState('');
  const [showHint, setShowHint] = useState(false);

  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!companies || companies.length === 0) {
      dispatch(fetchCompanies());
    }
  }, [dispatch, companies]);

  useEffect(() => {
    if (companies && companies.length > 0 && !selectedCompanyId) {
      setSelectedCompanyId(companies[0].id);
    }
  }, [companies, selectedCompanyId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, evaluating]);

  const handleStartInterview = () => {
    requireAuth(() => {
      dispatch(
        startMockInterview({
          companyId: selectedCompanyId,
          targetRole,
          difficulty,
        })
      );
    }, { action: 'mock_interview' });
  };

  const handleSubmitAnswer = async (e) => {
    e.preventDefault();
    if (!answerText.trim() || evaluating || !session) return;

    const userAns = answerText.trim();
    setAnswerText('');
    setShowHint(false);

    // Optimistically append student message in Redux store
    const tempUserMsg = {
      id: `turn-${currentTurn}-user`,
      role: 'user',
      turn_number: currentTurn,
      text: userAns,
    };
    dispatch(appendOptimisticUserMessage(tempUserMsg));

    const resultAction = await dispatch(
      submitInterviewAnswer({ sessionId: session.id, answerText: userAns })
    );

    if (submitInterviewAnswer.fulfilled.match(resultAction)) {
      if (resultAction.payload.is_concluded) {
        dispatch(endMockInterview(session.id));
      }
    }
  };

  const handleEndInterviewEarly = () => {
    if (!session) return;
    dispatch(endMockInterview(session.id));
  };

  const handleReset = () => {
    dispatch(resetInterviewSession());
  };

  return (
    <div className="space-y-6">
      {/* Error notification */}
      {error && (
        <div className="p-4 bg-danger-subtle border border-danger/20 rounded-xl text-danger text-sm flex items-center justify-between">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 mr-2 shrink-0" />
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Configuration Header / Start Bar */}
      {!session || concludedReport ? (
        <div className="p-6 bg-surface border border-border rounded-2xl shadow-xl">
          <h2 className="text-xl font-bold text-text flex items-center mb-1">
            <MessageSquare className="w-5 h-5 mr-2 text-accent" />
            AI RAG Adaptive Mock Interview Chamber
          </h2>
          <p className="text-sm text-text-muted mb-6">
            Experience real-time interactive technical interviews powered by local Ollama LLMs and Qdrant company question vectors.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-xs font-semibold text-text-muted mb-1.5 uppercase">
                Target Company
              </label>
              <select
                value={selectedCompanyId}
                onChange={(e) => setSelectedCompanyId(e.target.value)}
                className="w-full bg-surface-2 border border-border text-text rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-accent"
              >
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-muted mb-1.5 uppercase">
                Target Role
              </label>
              <input
                type="text"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                placeholder="e.g. Software Engineer"
                className="w-full bg-surface-2 border border-border text-text rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-accent"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-muted mb-1.5 uppercase">
                Difficulty
              </label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className="w-full bg-surface-2 border border-border text-text rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-accent"
              >
                <option value="Easy">Easy (Foundation DSA)</option>
                <option value="Medium">Medium (Industry Standard)</option>
                <option value="Hard">Hard (High-Scale Systems)</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            {!isAuthenticated && (
              <span className="text-xs text-text-muted flex items-center">
                <Lock className="w-3.5 h-3.5 mr-1 text-accent" />
                Guest Mode: Launching will open a quick signup to record your answers.
              </span>
            )}
            <button
              onClick={handleStartInterview}
              disabled={loading}
              className="w-full sm:w-auto ml-auto px-8 py-3 bg-accent hover:bg-accent-hover text-accent-contrast font-semibold rounded-xl shadow-lg shadow-accent/20 flex items-center justify-center transition-all disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Initializing RAG Context...
                </>
              ) : (
                <>
                  <Play className="w-5 h-5 mr-2 fill-current" />
                  Launch Mock Interview
                </>
              )}
            </button>
          </div>
        </div>
      ) : null}

      {/* Active Interview Chamber */}
      {session && !concludedReport && (
        <div className="bg-surface border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[650px]">
          {/* Header Bar */}
          <div className="p-4 bg-surface-2 border-b border-border flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 rounded-full bg-success animate-pulse" />
              <div>
                <h3 className="text-sm font-bold text-text flex items-center">
                  <Building2 className="w-4 h-4 mr-1 text-accent" />
                  {companies.find((c) => c.id === parseInt(selectedCompanyId))?.name || 'Company'}{' '}
                  • {session.target_role}
                </h3>
                <span className="text-xs text-text-muted">
                  Round: Technical Turn {currentTurn} of 5 ({session.difficulty})
                </span>
              </div>
            </div>

            <button
              onClick={handleEndInterviewEarly}
              disabled={loading}
              className="px-3.5 py-1.5 bg-surface-2 hover:bg-danger-subtle hover:text-danger text-text-muted text-xs font-semibold rounded-lg border border-border transition-colors"
            >
              {loading ? 'Concluding...' : 'Conclude Early'}
            </button>
          </div>

          {/* Transcript Scroll Area */}
          <div className="flex-1 p-6 overflow-y-auto space-y-5 bg-bg/50">
            {messages.map((msg, index) => {
              const isAI = msg.role === 'assistant';
              return (
                <div
                  key={msg.id || index}
                  className={`flex items-start space-x-3 ${isAI ? 'justify-start' : 'justify-end'}`}
                >
                  {isAI && (
                    <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-accent-contrast shrink-0 shadow-sm">
                      <Bot className="w-4 h-4" />
                    </div>
                  )}

                  <div className={`max-w-2xl space-y-2 ${isAI ? 'text-left' : 'text-right'}`}>
                    <div
                      className={`p-4 rounded-2xl text-sm leading-relaxed ${
                        isAI
                          ? 'bg-surface text-text border border-border rounded-tl-none shadow-sm'
                          : 'bg-accent text-accent-contrast rounded-tr-none shadow-sm'
                      }`}
                    >
                      {msg.topic && (
                        <span className="inline-block px-2 py-0.5 mb-2 bg-accent-subtle text-accent text-[10px] font-bold uppercase tracking-wider rounded-md">
                          {msg.topic}
                        </span>
                      )}
                      <p className="whitespace-pre-wrap">{msg.text}</p>
                    </div>

                    {/* AI Feedback & Score Card for Candidate Answers */}
                    {!isAI && msg.score !== undefined && (
                      <div className="p-3 bg-surface border border-border rounded-xl text-left text-xs space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-text flex items-center">
                            <Award className="w-3.5 h-3.5 mr-1 text-warning" />
                            Turn Score: {msg.score} / 10
                          </span>
                        </div>
                        {msg.feedback && (
                          <p className="text-text-muted leading-normal">{msg.feedback}</p>
                        )}
                      </div>
                    )}
                  </div>

                  {!isAI && (
                    <div className="w-8 h-8 rounded-full bg-surface-2 border border-border flex items-center justify-center text-text shrink-0">
                      <User className="w-4 h-4" />
                    </div>
                  )}
                </div>
              );
            })}

            {evaluating && (
              <div className="flex items-center space-x-3 text-text-muted text-xs">
                <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center">
                  <Loader2 className="w-4 h-4 animate-spin text-accent" />
                </div>
                <span>Evaluating answer & synthesizing next question...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Answer Input Bar */}
          <form
            onSubmit={handleSubmitAnswer}
            className="p-4 bg-surface border-t border-border space-y-2"
          >
            {/* Hint Toggle */}
            {messages.length > 0 && messages[messages.length - 1]?.hints && (
              <div className="flex items-center justify-between text-xs">
                <button
                  type="button"
                  onClick={() => setShowHint(!showHint)}
                  className="text-warning hover:underline flex items-center font-medium"
                >
                  <HelpCircle className="w-3.5 h-3.5 mr-1" />
                  {showHint ? 'Hide Interviewer Hint' : 'Need a Hint?'}
                </button>
                {showHint && (
                  <span className="text-text-muted italic">
                    Hint: {messages[messages.length - 1].hints}
                  </span>
                )}
              </div>
            )}

            <div className="flex items-end space-x-2">
              <textarea
                value={answerText}
                onChange={(e) => setAnswerText(e.target.value)}
                placeholder="Type your structured technical answer (state time/space complexity, edge cases)..."
                rows={3}
                disabled={evaluating}
                className="flex-1 bg-surface-2 border border-border focus:border-accent rounded-xl p-3 text-sm text-text placeholder-text-muted resize-none focus:outline-none"
              />
              <button
                type="submit"
                disabled={evaluating || !answerText.trim()}
                className="p-3 bg-accent hover:bg-accent-hover disabled:opacity-50 text-accent-contrast rounded-xl shadow-sm transition-all shrink-0"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Concluded Session Report Card */}
      {concludedReport && (
        <div className="p-8 bg-surface border border-border rounded-2xl shadow-2xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-border gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-success flex items-center">
                <CheckCircle2 className="w-4 h-4 mr-1.5" />
                Session Concluded Successfully
              </span>
              <h3 className="text-2xl font-black text-text mt-1">
                Placement Performance Evaluation
              </h3>
            </div>
            <div className="p-4 bg-accent-subtle border border-accent/20 rounded-2xl text-center min-w-[140px]">
              <span className="text-xs text-accent font-semibold uppercase">Overall Score</span>
              <p className="text-3xl font-black text-accent">
                {concludedReport.overall_score} / 10
              </p>
            </div>
          </div>

          <div className="p-4 bg-surface-2 border border-border rounded-xl text-sm text-text leading-relaxed">
            {concludedReport.feedback_summary}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-5 bg-surface-2 border border-success/20 rounded-xl">
              <h4 className="text-sm font-bold text-success uppercase tracking-wider mb-3 flex items-center">
                <CheckCircle2 className="w-4 h-4 mr-1.5" />
                Demonstrated Strengths
              </h4>
              <ul className="space-y-2 text-xs text-text">
                {concludedReport.strengths?.map((s, idx) => (
                  <li key={idx} className="flex items-start">
                    <span className="text-success mr-2">•</span>
                    {s}
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-5 bg-surface-2 border border-warning/20 rounded-xl">
              <h4 className="text-sm font-bold text-warning uppercase tracking-wider mb-3 flex items-center">
                <AlertCircle className="w-4 h-4 mr-1.5" />
                Areas for Improvement
              </h4>
              <ul className="space-y-2 text-xs text-text">
                {concludedReport.areas_to_improve?.map((a, idx) => (
                  <li key={idx} className="flex items-start">
                    <span className="text-warning mr-2">•</span>
                    {a}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button
              onClick={handleReset}
              className="px-6 py-2.5 bg-accent hover:bg-accent-hover text-accent-contrast text-sm font-semibold rounded-xl flex items-center shadow-lg shadow-accent/20 transition-all"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Start New Mock Interview
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MockInterviewChat;

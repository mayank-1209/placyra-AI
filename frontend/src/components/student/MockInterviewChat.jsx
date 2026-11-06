import React, { useState, useEffect, useRef } from 'react';
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
} from 'lucide-react';
import { interviewApi, tnpApi } from '../../services/apiClient';

export const MockInterviewChat = () => {
  const [companies, setCompanies] = useState([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const [targetRole, setTargetRole] = useState('Software Engineer');
  const [difficulty, setDifficulty] = useState('Medium');

  // Interview session state
  const [session, setSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [currentTurn, setCurrentTurn] = useState(1);
  const [answerText, setAnswerText] = useState('');
  const [loading, setLoading] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [concludedReport, setConcludedReport] = useState(null);

  const messagesEndRef = useRef(null);

  useEffect(() => {
    loadCompanies();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, evaluating]);

  const loadCompanies = async () => {
    try {
      const resp = await tnpApi.getCompanies();
      setCompanies(resp.data);
      if (resp.data.length > 0) {
        setSelectedCompanyId(resp.data[0].id);
      }
    } catch (err) {
      console.error('Failed to load companies:', err);
    }
  };

  const handleStartInterview = async () => {
    setLoading(true);
    setConcludedReport(null);
    setMessages([]);
    try {
      const resp = await interviewApi.startInterview({
        company_id: selectedCompanyId ? parseInt(selectedCompanyId) : null,
        target_role: targetRole,
        difficulty: difficulty,
      });

      const data = resp.data;
      setSession({ id: data.session_id, target_role: targetRole, difficulty: difficulty });
      setCurrentTurn(data.turn_number);

      // Add initial interviewer question
      setMessages([
        {
          id: 'turn-1-q',
          role: 'assistant',
          turn_number: data.turn_number,
          text: data.question,
          topic: data.context_topic,
          hints: data.hints,
        },
      ]);
    } catch (err) {
      console.error('Failed to start interview:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitAnswer = async (e) => {
    e.preventDefault();
    if (!answerText.trim() || evaluating) return;

    const userAns = answerText.trim();
    setAnswerText('');
    setEvaluating(true);
    setShowHint(false);

    // Optimistically append student message
    const tempUserMsg = {
      id: `turn-${currentTurn}-user`,
      role: 'user',
      turn_number: currentTurn,
      text: userAns,
    };
    setMessages((prev) => [...prev, tempUserMsg]);

    try {
      const resp = await interviewApi.submitAnswer(session.id, userAns);
      const data = resp.data;

      // Update user message with evaluation score & feedback
      setMessages((prev) =>
        prev.map((m) =>
          m.id === tempUserMsg.id
            ? { ...m, score: data.evaluation_score, feedback: data.evaluation_feedback }
            : m
        )
      );

      if (data.is_concluded) {
        // Concluded
        const endResp = await interviewApi.endInterview(session.id);
        setConcludedReport(endResp.data);
      } else {
        // Append Next Question
        setCurrentTurn(data.turn_number);
        setMessages((prev) => [
          ...prev,
          {
            id: `turn-${data.turn_number}-q`,
            role: 'assistant',
            turn_number: data.turn_number,
            text: data.question,
            topic: data.context_topic,
            hints: data.hints,
          },
        ]);
      }
    } catch (err) {
      console.error('Failed to submit answer:', err);
    } finally {
      setEvaluating(false);
    }
  };

  const handleEndInterviewEarly = async () => {
    if (!session) return;
    setLoading(true);
    try {
      const resp = await interviewApi.endInterview(session.id);
      setConcludedReport(resp.data);
    } catch (err) {
      console.error('Failed to end interview:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Configuration Header / Start Bar */}
      {!session || concludedReport ? (
        <div className="p-6 bg-slate-900/80 border border-slate-800 rounded-2xl shadow-xl">
          <h2 className="text-xl font-bold text-white flex items-center mb-1">
            <MessageSquare className="w-5 h-5 mr-2 text-indigo-400" />
            AI RAG Adaptive Mock Interview Chamber
          </h2>
          <p className="text-sm text-slate-400 mb-6">
            Experience real-time interactive technical interviews powered by local Ollama LLMs and Qdrant company question vectors.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">
                Target Company
              </label>
              <select
                value={selectedCompanyId}
                onChange={(e) => setSelectedCompanyId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 text-slate-100 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500"
              >
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">
                Target Role
              </label>
              <input
                type="text"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                placeholder="e.g. Software Engineer"
                className="w-full bg-slate-950 border border-slate-700 text-slate-100 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">
                Difficulty
              </label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 text-slate-100 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500"
              >
                <option value="Easy">Easy (Foundation DSA)</option>
                <option value="Medium">Medium (Industry Standard)</option>
                <option value="Hard">Hard (High-Scale Systems)</option>
              </select>
            </div>
          </div>

          <button
            onClick={handleStartInterview}
            disabled={loading}
            className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-semibold rounded-xl shadow-lg shadow-indigo-600/30 flex items-center justify-center transition-all"
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
      ) : null}

      {/* Active Interview Chamber */}
      {session && !concludedReport && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[650px]">
          {/* Header Bar */}
          <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
              <div>
                <h3 className="text-sm font-bold text-white flex items-center">
                  <Building2 className="w-4 h-4 mr-1 text-indigo-400" />
                  {companies.find((c) => c.id === parseInt(selectedCompanyId))?.name || 'Company'}{' '}
                  • {session.target_role}
                </h3>
                <span className="text-xs text-slate-400">
                  Round: Technical Turn {currentTurn} of 5 ({session.difficulty})
                </span>
              </div>
            </div>

            <button
              onClick={handleEndInterviewEarly}
              className="px-3.5 py-1.5 bg-slate-800 hover:bg-red-500/10 hover:text-red-400 text-slate-300 text-xs font-semibold rounded-lg border border-slate-700 transition-colors"
            >
              Conclude Early
            </button>
          </div>

          {/* Transcript Scroll Area */}
          <div className="flex-1 p-6 overflow-y-auto space-y-5">
            {messages.map((msg, index) => {
              const isAI = msg.role === 'assistant';
              return (
                <div
                  key={index}
                  className={`flex items-start space-x-3 ${isAI ? 'justify-start' : 'justify-end'}`}
                >
                  {isAI && (
                    <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white shrink-0 shadow-lg shadow-indigo-600/30">
                      <Bot className="w-4 h-4" />
                    </div>
                  )}

                  <div className={`max-w-2xl space-y-2 ${isAI ? 'text-left' : 'text-right'}`}>
                    <div
                      className={`p-4 rounded-2xl text-sm leading-relaxed ${
                        isAI
                          ? 'bg-slate-800/80 text-slate-100 border border-slate-700/80 rounded-tl-none shadow-md'
                          : 'bg-indigo-600 text-white rounded-tr-none shadow-lg shadow-indigo-600/20'
                      }`}
                    >
                      {msg.topic && (
                        <span className="inline-block px-2 py-0.5 mb-2 bg-indigo-500/20 text-indigo-300 text-[10px] font-bold uppercase tracking-wider rounded-md">
                          {msg.topic}
                        </span>
                      )}
                      <p className="whitespace-pre-wrap">{msg.text}</p>
                    </div>

                    {/* AI Feedback & Score Card for Candidate Answers */}
                    {!isAI && msg.score !== undefined && (
                      <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-left text-xs space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-300 flex items-center">
                            <Award className="w-3.5 h-3.5 mr-1 text-amber-400" />
                            Turn Score: {msg.score} / 10
                          </span>
                        </div>
                        {msg.feedback && (
                          <p className="text-slate-400 leading-normal">{msg.feedback}</p>
                        )}
                      </div>
                    )}
                  </div>

                  {!isAI && (
                    <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-white shrink-0">
                      <User className="w-4 h-4" />
                    </div>
                  )}
                </div>
              );
            })}

            {evaluating && (
              <div className="flex items-center space-x-3 text-slate-400 text-xs">
                <div className="w-8 h-8 rounded-full bg-indigo-600/50 flex items-center justify-center">
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                </div>
                <span>Evaluating answer & synthesizing next question...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Answer Input Bar */}
          <form
            onSubmit={handleSubmitAnswer}
            className="p-4 bg-slate-950 border-t border-slate-800 space-y-2"
          >
            {/* Hint Toggle */}
            {messages.length > 0 && messages[messages.length - 1]?.hints && (
              <div className="flex items-center justify-between text-xs">
                <button
                  type="button"
                  onClick={() => setShowHint(!showHint)}
                  className="text-amber-400 hover:text-amber-300 flex items-center font-medium"
                >
                  <HelpCircle className="w-3.5 h-3.5 mr-1" />
                  {showHint ? 'Hide Interviewer Hint' : 'Need a Hint?'}
                </button>
                {showHint && (
                  <span className="text-slate-400 italic">
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
                className="flex-1 bg-slate-900 border border-slate-700 focus:border-indigo-500 rounded-xl p-3 text-sm text-slate-100 placeholder-slate-500 resize-none focus:outline-none"
              />
              <button
                type="submit"
                disabled={evaluating || !answerText.trim()}
                className="p-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl shadow-lg shadow-indigo-600/30 transition-all shrink-0"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Concluded Session Report Card */}
      {concludedReport && (
        <div className="p-8 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-2xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-800 gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center">
                <CheckCircle2 className="w-4 h-4 mr-1.5" />
                Session Concluded Successfully
              </span>
              <h3 className="text-2xl font-black text-white mt-1">
                Placement Performance Evaluation
              </h3>
            </div>
            <div className="p-4 bg-indigo-500/10 border border-indigo-500/30 rounded-2xl text-center min-w-[140px]">
              <span className="text-xs text-indigo-300 font-semibold uppercase">Overall Score</span>
              <p className="text-3xl font-black text-indigo-400">
                {concludedReport.overall_score} / 10
              </p>
            </div>
          </div>

          <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl text-sm text-slate-300 leading-relaxed">
            {concludedReport.feedback_summary}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-5 bg-slate-950/40 border border-emerald-500/20 rounded-xl">
              <h4 className="text-sm font-bold text-emerald-400 uppercase tracking-wider mb-3 flex items-center">
                <CheckCircle2 className="w-4 h-4 mr-1.5" />
                Demonstrated Strengths
              </h4>
              <ul className="space-y-2 text-xs text-slate-300">
                {concludedReport.strengths?.map((s, idx) => (
                  <li key={idx} className="flex items-start">
                    <span className="text-emerald-400 mr-2">•</span>
                    {s}
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-5 bg-slate-950/40 border border-amber-500/20 rounded-xl">
              <h4 className="text-sm font-bold text-amber-400 uppercase tracking-wider mb-3 flex items-center">
                <AlertCircle className="w-4 h-4 mr-1.5" />
                Areas for Improvement
              </h4>
              <ul className="space-y-2 text-xs text-slate-300">
                {concludedReport.areas_to_improve?.map((a, idx) => (
                  <li key={idx} className="flex items-start">
                    <span className="text-amber-400 mr-2">•</span>
                    {a}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button
              onClick={() => {
                setSession(null);
                setConcludedReport(null);
              }}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl flex items-center shadow-lg shadow-indigo-600/30 transition-all"
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

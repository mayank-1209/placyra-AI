import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { PlusCircle, CheckCircle2, AlertCircle, Loader2, Sparkles } from 'lucide-react';
import { createQuestion, fetchCompanies } from '../../store/slices/tnpSlice';

export const QuestionUploadForm = ({ onQuestionAdded }) => {
  const dispatch = useDispatch();
  const { companies, error: tnpError } = useSelector((state) => state.tnp);

  const [formData, setFormData] = useState({
    company_id: '',
    role_title: 'Software Engineer',
    round_type: 'Technical Interview 1',
    difficulty: 'Medium',
    topic: 'Data Structures',
    question_text: '',
    answer_guidelines: '',
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!companies || companies.length === 0) {
      dispatch(fetchCompanies());
    }
  }, [dispatch, companies]);

  useEffect(() => {
    if (companies && companies.length > 0 && !formData.company_id) {
      setFormData((prev) => ({ ...prev, company_id: companies[0].id }));
    }
  }, [companies, formData.company_id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.question_text.trim()) {
      setError('Question text is required.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    const payload = {
      ...formData,
      company_id: formData.company_id ? parseInt(formData.company_id) : null,
    };

    const result = await dispatch(createQuestion(payload));
    setLoading(false);

    if (createQuestion.fulfilled.match(result)) {
      setSuccess(true);
      setFormData((prev) => ({
        ...prev,
        question_text: '',
        answer_guidelines: '',
      }));
      if (onQuestionAdded) onQuestionAdded();
    } else {
      setError(result.payload || 'Failed to submit question.');
    }
  };

  return (
    <div className="p-6 bg-slate-900/80 border border-slate-800 rounded-2xl shadow-xl">
      <h2 className="text-xl font-bold text-white flex items-center mb-1">
        <PlusCircle className="w-5 h-5 mr-2 text-indigo-400" />
        Add Placement Interview Question
      </h2>
      <p className="text-sm text-slate-400 mb-6">
        Submit curated questions to the Placyra repository. Questions added by T&P Admins are automatically verified and indexed into Qdrant for semantic search.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">
              Company
            </label>
            <select
              name="company_id"
              value={formData.company_id}
              onChange={handleChange}
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
              name="role_title"
              value={formData.role_title}
              onChange={handleChange}
              placeholder="e.g. Software Engineer"
              className="w-full bg-slate-950 border border-slate-700 text-slate-100 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">
              Round Type
            </label>
            <input
              type="text"
              name="round_type"
              value={formData.round_type}
              onChange={handleChange}
              placeholder="e.g. Technical Round 1 (DSA)"
              className="w-full bg-slate-950 border border-slate-700 text-slate-100 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">
              Topic / Domain
            </label>
            <input
              type="text"
              name="topic"
              value={formData.topic}
              onChange={handleChange}
              placeholder="e.g. Data Structures, DBMS"
              className="w-full bg-slate-950 border border-slate-700 text-slate-100 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">
              Difficulty
            </label>
            <select
              name="difficulty"
              value={formData.difficulty}
              onChange={handleChange}
              className="w-full bg-slate-950 border border-slate-700 text-slate-100 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500"
            >
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">
            Question Text
          </label>
          <textarea
            name="question_text"
            value={formData.question_text}
            onChange={handleChange}
            placeholder="State the technical question clearly with problem constraints and requirements..."
            rows={4}
            className="w-full bg-slate-950 border border-slate-700 text-slate-100 rounded-xl p-3 text-sm focus:outline-none focus:border-indigo-500"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">
            Answer Guidelines / Ground Truth (For AI Evaluation)
          </label>
          <textarea
            name="answer_guidelines"
            value={formData.answer_guidelines}
            onChange={handleChange}
            placeholder="Optimal algorithms, expected time/space complexity, edge cases candidate must address..."
            rows={3}
            className="w-full bg-slate-950 border border-slate-700 text-slate-100 rounded-xl p-3 text-sm focus:outline-none focus:border-indigo-500"
          />
        </div>

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm flex items-center">
            <AlertCircle className="w-4 h-4 mr-2 shrink-0" />
            {error}
          </div>
        )}

        {success && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-sm flex items-center">
            <CheckCircle2 className="w-4 h-4 mr-2 shrink-0" />
            Question successfully added and indexed into vector repository!
          </div>
        )}

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-semibold rounded-xl text-sm shadow-lg shadow-indigo-600/30 flex items-center transition-all disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Indexing in Qdrant...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Submit Question
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default QuestionUploadForm;

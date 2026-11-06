import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Building2, Plus, Trash2, Globe, Award, Loader2, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';
import { fetchCompanies, createCompany, deleteCompany } from '../../store/slices/tnpSlice';

export const JDManager = () => {
  const dispatch = useDispatch();
  const { companies, companiesLoading, error: tnpError } = useSelector((state) => state.tnp);

  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    industry: 'Technology & Cloud',
    description: '',
    website: '',
    min_cgpa: '7.0',
    eligible_branches: 'Computer Science, Information Technology, Electronics',
    required_skills: 'Data Structures, Algorithms, Python, System Design',
    hiring_workflow: 'Online Assessment, Technical Interview 1, Technical Interview 2, HR',
  });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState(null);

  useEffect(() => {
    dispatch(fetchCompanies());
  }, [dispatch]);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this company profile?')) return;
    dispatch(deleteCompany(id));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    setSaving(true);
    setFormError(null);

    const payload = {
      name: formData.name.trim(),
      industry: formData.industry,
      description: formData.description,
      website: formData.website,
      min_cgpa: parseFloat(formData.min_cgpa) || 0.0,
      eligible_branches: formData.eligible_branches.split(',').map((s) => s.trim()).filter(Boolean),
      required_skills: formData.required_skills.split(',').map((s) => s.trim()).filter(Boolean),
      hiring_workflow: formData.hiring_workflow.split(',').map((s) => s.trim()).filter(Boolean),
    };

    const result = await dispatch(createCompany(payload));
    setSaving(false);

    if (createCompany.fulfilled.match(result)) {
      setShowAddForm(false);
      setFormData({
        name: '',
        industry: 'Technology & Cloud',
        description: '',
        website: '',
        min_cgpa: '7.0',
        eligible_branches: 'Computer Science, Information Technology, Electronics',
        required_skills: 'Data Structures, Algorithms, Python, System Design',
        hiring_workflow: 'Online Assessment, Technical Round 1, Technical Round 2, HR',
      });
    } else {
      setFormError(result.payload || 'Failed to create company profile.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="p-6 bg-slate-900/80 border border-slate-800 rounded-2xl shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center">
            <Building2 className="w-5 h-5 mr-2 text-indigo-400" />
            Hiring Companies & Job Description Manager
          </h2>
          <p className="text-sm text-slate-400">
            Define corporate recruiter criteria, cutoffs, required skills, and round roadmaps for student preparation.
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-indigo-600/30 flex items-center transition-all shrink-0"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          {showAddForm ? 'Close Form' : 'Add Target Company'}
        </button>
      </div>

      {/* Add Company Form */}
      {showAddForm && (
        <div className="p-6 bg-slate-900/90 border border-indigo-500/30 rounded-2xl shadow-xl space-y-4">
          <h3 className="text-base font-bold text-white flex items-center">
            <Sparkles className="w-4 h-4 mr-2 text-indigo-400" />
            New Corporate Placement Profile
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1 uppercase">
                  Company Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Google, Atlassian"
                  className="w-full bg-slate-950 border border-slate-700 text-slate-100 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1 uppercase">
                  Industry
                </label>
                <input
                  type="text"
                  value={formData.industry}
                  onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                  placeholder="e.g. Enterprise Cloud"
                  className="w-full bg-slate-950 border border-slate-700 text-slate-100 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1 uppercase">
                  Min CGPA Cutoff
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="10"
                  value={formData.min_cgpa}
                  onChange={(e) => setFormData({ ...formData, min_cgpa: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 text-slate-100 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1 uppercase">
                Description / Overview
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={2}
                placeholder="Brief corporate background and campus hiring focus..."
                className="w-full bg-slate-950 border border-slate-700 text-slate-100 rounded-xl p-3 text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1 uppercase">
                  Required Technical Skills (Comma-Separated)
                </label>
                <input
                  type="text"
                  value={formData.required_skills}
                  onChange={(e) => setFormData({ ...formData, required_skills: e.target.value })}
                  placeholder="DSA, Python, Java, Docker, System Design"
                  className="w-full bg-slate-950 border border-slate-700 text-slate-100 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1 uppercase">
                  Eligible Academic Branches (Comma-Separated)
                </label>
                <input
                  type="text"
                  value={formData.eligible_branches}
                  onChange={(e) => setFormData({ ...formData, eligible_branches: e.target.value })}
                  placeholder="Computer Science, IT, Electronics"
                  className="w-full bg-slate-950 border border-slate-700 text-slate-100 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {formError && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-xs flex items-center">
                <AlertCircle className="w-4 h-4 mr-2" />
                {formError}
              </div>
            )}

            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/30 flex items-center"
              >
                {saving && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />}
                Save Company Profile
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Loading Indicator */}
      {companiesLoading && companies.length === 0 && (
        <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
          <p className="text-sm font-medium">Loading Company Profiles...</p>
        </div>
      )}

      {/* Companies Directory Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {companies.map((comp) => (
          <div
            key={comp.id}
            className="p-5 bg-slate-900/80 border border-slate-800 rounded-2xl shadow-xl space-y-4 hover:border-slate-700 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center">
                    {comp.name}
                  </h3>
                  <span className="text-xs text-indigo-400 font-medium">{comp.industry}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="px-2.5 py-1 bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 rounded-lg text-xs font-semibold">
                    Cutoff: {comp.min_cgpa} CGPA
                  </span>
                  <button
                    onClick={() => handleDelete(comp.id)}
                    className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {comp.description && (
                <p className="text-xs text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                  {comp.description}
                </p>
              )}
            </div>

            <div className="space-y-3 pt-3 border-t border-slate-800">
              {/* Required Skills */}
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                  Required Core Skills
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {comp.required_skills?.map((s, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 bg-slate-800 text-slate-300 border border-slate-700 text-[11px] font-medium rounded"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              {/* Rounds */}
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                  Recruitment Workflow
                </p>
                <div className="flex flex-wrap gap-1">
                  {comp.hiring_workflow?.map((r, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 bg-slate-950 text-indigo-300/80 border border-slate-800 text-[10px] rounded"
                    >
                      Round {idx + 1}: {r}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default JDManager;

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../../components/common/Navbar';
import apiClient from '../../../services/apiClient';
import {
  FileText,
  Save,
  Send,
  Eye,
  Edit3,
  Building2,
  Tag,
  AlertCircle,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

export const BlogEditorPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('write'); // 'write' | 'preview'
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    category_id: '',
    company_name: '',
    role_name: '',
    excerpt: '',
    content: `## Overview of the Interview Process\n\nDetail the rounds and candidate requirements here...\n\n## Algorithmic & Technical Questions\n\nExplain key problems, time complexities, and optimization insights.\n\n## Behavioral & Leadership Evaluation\n\nShare tips for personal projects, conflict resolution, and communication depth.`,
    status: 'draft',
    seo_title: '',
    seo_description: '',
  });

  useEffect(() => {
    apiClient
      .get('/blog/categories')
      .then((res) => {
        if (Array.isArray(res.data) && res.data.length > 0) {
          setCategories(res.data);
          setFormData((prev) => ({ ...prev, category_id: res.data[0].id }));
        }
      })
      .catch(() => {});
  }, []);

  const handleTitleChange = (e) => {
    const title = e.target.value;
    const generatedSlug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
    setFormData((prev) => ({
      ...prev,
      title,
      slug: prev.slug === '' || prev.slug === generatedSlug.slice(0, -1) ? generatedSlug : prev.slug,
    }));
  };

  const handleSave = async (targetStatus) => {
    setLoading(true);
    setFeedback(null);
    try {
      const payload = {
        ...formData,
        status: targetStatus,
      };
      const res = await apiClient.post('/blog/posts', payload);
      setFeedback({ type: 'success', message: `Article successfully saved as ${targetStatus}!` });
      setTimeout(() => {
        navigate(`/blog/${res.data.slug || formData.slug}`);
      }, 1200);
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || err.response?.data?.detail || 'Failed to save article. Check your permissions.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg text-text flex flex-col transition-colors">
      <Navbar />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
          <div>
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-surface-2 border border-border text-accent text-xs font-bold mb-2">
              <FileText className="w-3.5 h-3.5" />
              <span>Editorial Studio</span>
            </div>
            <h1 className="text-2xl font-black text-text">Create Placement Guide & Technical Chronicle</h1>
            <p className="text-xs text-text-muted mt-0.5">
              Draft or publish round-by-round interview debriefs and campus prep materials with RBAC validation.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => handleSave('draft')}
              disabled={loading || !formData.title}
              className="inline-flex items-center space-x-1.5 px-4 py-2.5 rounded-xl border border-border bg-surface hover:bg-surface-2 text-text font-semibold text-xs transition-colors disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Draft</span>
            </button>
            <button
              onClick={() => handleSave('published')}
              disabled={loading || !formData.title}
              className="inline-flex items-center space-x-1.5 px-5 py-2.5 rounded-xl bg-accent hover:bg-accent-hover text-white font-bold text-xs shadow-sm transition-colors disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Publish Now</span>
            </button>
          </div>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div
            className={`p-4 rounded-xl border text-xs flex items-center space-x-2 ${
              feedback.type === 'success'
                ? 'bg-success/10 border-success/30 text-success'
                : 'bg-danger/10 border-danger/30 text-danger'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
        )}

        {/* Form Fields Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Main 2 Cols: Title, Excerpt, Content */}
          <div className="md:col-span-2 space-y-5">
            <div>
              <label className="block text-xs font-bold text-text mb-1.5">Article Title *</label>
              <input
                type="text"
                value={formData.title}
                onChange={handleTitleChange}
                placeholder="e.g. Cracking Google L4: On-Campus Placement Breakdown & System Design Matrix"
                className="w-full px-4 py-2.5 rounded-xl bg-surface border border-border text-sm text-text placeholder-text-muted focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-text mb-1.5">Short Excerpt *</label>
              <textarea
                rows={2}
                value={formData.excerpt}
                onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                placeholder="A concise 1-2 sentence preview for search results and social cards..."
                className="w-full px-4 py-2.5 rounded-xl bg-surface border border-border text-xs text-text placeholder-text-muted focus:outline-none focus:border-accent"
              />
            </div>

            {/* Editor vs Preview Tabs */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-text">Content (Markdown Supported) *</label>
                <div className="flex items-center space-x-1 bg-surface-2 p-1 rounded-lg border border-border text-xs">
                  <button
                    type="button"
                    onClick={() => setActiveTab('write')}
                    className={`px-3 py-1 rounded-md font-semibold transition-colors ${
                      activeTab === 'write' ? 'bg-surface text-accent shadow-xs' : 'text-text-muted'
                    }`}
                  >
                    <Edit3 className="w-3 h-3 inline mr-1" />
                    Write
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('preview')}
                    className={`px-3 py-1 rounded-md font-semibold transition-colors ${
                      activeTab === 'preview' ? 'bg-surface text-accent shadow-xs' : 'text-text-muted'
                    }`}
                  >
                    <Eye className="w-3 h-3 inline mr-1" />
                    Preview
                  </button>
                </div>
              </div>

              {activeTab === 'write' ? (
                <textarea
                  rows={14}
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Draft your guide using markdown headings (##, ###), bullet points, and code blocks..."
                  className="w-full px-4 py-3 rounded-xl bg-surface border border-border text-sm font-mono text-text focus:outline-none focus:border-accent"
                />
              ) : (
                <div className="p-6 rounded-xl bg-surface border border-border min-h-[350px] text-sm text-text space-y-4 whitespace-pre-wrap leading-relaxed">
                  {formData.content}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Taxonomy, Company, SEO */}
          <div className="space-y-5 bg-surface border border-border rounded-2xl p-5 h-fit shadow-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-text pb-2 border-b border-border">
              Placement Metadata
            </h3>

            <div>
              <label className="block text-xs font-semibold text-text-muted mb-1">Category</label>
              <select
                value={formData.category_id}
                onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-surface-2 border border-border text-xs text-text focus:outline-none focus:border-accent"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-muted mb-1">Company (Optional)</label>
              <div className="relative flex items-center">
                <Building2 className="w-3.5 h-3.5 absolute left-3 text-text-muted" />
                <input
                  type="text"
                  value={formData.company_name}
                  onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                  placeholder="e.g. Google, Amazon, Microsoft"
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-surface-2 border border-border text-xs text-text focus:outline-none focus:border-accent"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-muted mb-1">Target Role (Optional)</label>
              <input
                type="text"
                value={formData.role_name}
                onChange={(e) => setFormData({ ...formData, role_name: e.target.value })}
                placeholder="e.g. SDE-1, Data Analyst"
                className="w-full px-3 py-2 rounded-xl bg-surface-2 border border-border text-xs text-text focus:outline-none focus:border-accent"
              />
            </div>

            <div className="pt-2 border-t border-border">
              <h4 className="text-xs font-bold uppercase tracking-wider text-text mb-3">SEO Tuning</h4>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-text-muted mb-1">Custom Slug</label>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-surface-2 border border-border text-xs text-text font-mono focus:outline-none focus:border-accent"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text-muted mb-1">SEO Title</label>
                  <input
                    type="text"
                    value={formData.seo_title}
                    onChange={(e) => setFormData({ ...formData, seo_title: e.target.value })}
                    placeholder="Article Title | Placyra"
                    className="w-full px-3 py-2 rounded-xl bg-surface-2 border border-border text-xs text-text focus:outline-none focus:border-accent"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default BlogEditorPage;

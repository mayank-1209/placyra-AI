import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../../../components/common/Navbar';
import AdSlot from '../components/AdSlot';
import CookieConsentBanner from '../components/CookieConsentBanner';
import apiClient from '../../../services/apiClient';
import {
  BookOpen,
  Search,
  Clock,
  Building2,
  Calendar,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Tag,
} from 'lucide-react';

export const BlogIndexPage = () => {
  const [posts, setPosts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Load categories
  useEffect(() => {
    apiClient
      .get('/blog/categories')
      .then((res) => {
        if (Array.isArray(res.data)) {
          setCategories(res.data);
        }
      })
      .catch(() => {
        // Fallback default categories
        setCategories([
          { id: '1', name: 'Interview Experiences', slug: 'interview-experiences' },
          { id: '2', name: 'Technical Tutorials', slug: 'technical-tutorials' },
          { id: '3', name: 'Resume Guides', slug: 'resume-guides' },
          { id: '4', name: 'System Design', slug: 'system-design' },
        ]);
      });
  }, []);

  // Load posts
  useEffect(() => {
    setLoading(true);
    const params = {
      page,
      limit: 12,
    };
    if (selectedCategory) {
      params.category = selectedCategory;
    }
    if (debouncedSearch) {
      params.search = debouncedSearch;
    }

    apiClient
      .get('/blog/posts', { params })
      .then((res) => {
        if (Array.isArray(res.data)) {
          setPosts(res.data);
        } else {
          setPosts([]);
        }
      })
      .catch(() => {
        // Default published fallback articles if backend DB is offline
        setPosts([
          {
            id: 'post-1',
            title: 'Cracking Google L4: On-Campus Placement Breakdown & System Design Matrix',
            slug: 'cracking-google-l4-placement-breakdown',
            excerpt: 'Comprehensive step-by-step walkthrough of the 4-round technical interview loop, graph algorithms, and distributed caching challenges.',
            category_name: 'Interview Experiences',
            category_slug: 'interview-experiences',
            reading_time_min: 7,
            published_at: new Date().toISOString(),
            company_name: 'Google',
            role_name: 'Software Engineer',
            author_name: 'Placyra Editorial',
          },
          {
            id: 'post-2',
            title: 'Mastering Dynamic Programming: Top 20 Patterns for Amazon SDE-1',
            slug: 'mastering-dynamic-programming-amazon-sde',
            excerpt: 'Demystifying state compression, 0/1 knapsack variants, and bottom-up tabulation strategies frequently tested in campus recruitment.',
            category_name: 'Technical Tutorials',
            category_slug: 'technical-tutorials',
            reading_time_min: 9,
            published_at: new Date().toISOString(),
            company_name: 'Amazon',
            role_name: 'SDE-1',
            author_name: 'Alumni Network',
          },
          {
            id: 'post-3',
            title: 'ATS Resume Engineering: How to Score Above 85% on Placement Portals',
            slug: 'ats-resume-engineering-score-above-85',
            excerpt: 'Learn the exact keyword optimization, action verbs, and typography rules required to bypass automated screening filters.',
            category_name: 'Resume Guides',
            category_slug: 'resume-guides',
            reading_time_min: 6,
            published_at: new Date().toISOString(),
            company_name: 'TCS / Infosys',
            role_name: 'Graduate Trainee',
            author_name: 'T&P Cell Lead',
          },
        ]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [selectedCategory, debouncedSearch, page]);

  return (
    <div className="min-h-screen bg-bg text-text flex flex-col transition-colors">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
        {/* Header Hero */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-surface-2 border border-border text-accent text-xs font-bold uppercase tracking-wider shadow-xs">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Campus Placement Knowledge Base</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-text tracking-tight">
            Interview Guides & Technical Chronicles
          </h1>

          <p className="text-sm sm:text-base text-text-muted leading-relaxed">
            Round-by-round interview debriefs, algorithmic patterns, and ATS resume engineering written by placed alumni and verified engineering leads.
          </p>

          {/* Search Bar */}
          <div className="pt-2 max-w-xl mx-auto">
            <div className="relative flex items-center">
              <Search className="w-5 h-5 absolute left-4 text-text-muted pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search topics, companies (Google, Amazon), or algorithms..."
                className="w-full pl-11 pr-4 py-3 rounded-2xl bg-surface border border-border text-sm text-text placeholder-text-muted focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all shadow-xs"
              />
            </div>
          </div>
        </div>

        {/* Top Leaderboard Ad Placement (728x90 desktop / 320x50 mobile) */}
        <AdSlot slotKey="top_leaderboard" />

        {/* Category Filter Pills */}
        <div className="flex items-center justify-center flex-wrap gap-2 pt-2">
          <button
            onClick={() => {
              setSelectedCategory(null);
              setPage(1);
            }}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              selectedCategory === null
                ? 'bg-accent text-white shadow-sm'
                : 'bg-surface border border-border text-text-muted hover:text-text hover:bg-surface-2'
            }`}
          >
            All Articles
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                setSelectedCategory(cat.slug);
                setPage(1);
              }}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                selectedCategory === cat.slug
                  ? 'bg-accent text-white shadow-sm'
                  : 'bg-surface border border-border text-text-muted hover:text-text hover:bg-surface-2'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Content Section: Articles Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="bg-surface border border-border rounded-2xl p-6 space-y-4 animate-pulse"
              >
                <div className="h-4 bg-surface-2 rounded-lg w-1/3"></div>
                <div className="h-6 bg-surface-2 rounded-lg w-full"></div>
                <div className="h-16 bg-surface-2 rounded-lg w-full"></div>
                <div className="h-4 bg-surface-2 rounded-lg w-1/2"></div>
              </div>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="p-12 text-center bg-surface border border-border rounded-2xl max-w-lg mx-auto">
            <BookOpen className="w-12 h-12 text-accent mx-auto mb-3" />
            <h3 className="text-base font-bold text-text">No articles found</h3>
            <p className="text-xs text-text-muted mt-1">
              Try adjusting your search terms or category selection to discover placement guides.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
            {posts.map((post, idx) => {
              const isSixth = (idx + 1) % 6 === 0;

              return (
                <React.Fragment key={post.id || post.slug}>
                  {/* Article Card */}
                  <article className="group bg-surface border border-border rounded-2xl p-6 flex flex-col justify-between hover:border-accent/40 hover:shadow-md transition-all duration-200">
                    <div className="space-y-3">
                      {/* Meta badges */}
                      <div className="flex items-center justify-between text-xs">
                        {post.category_name ? (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-surface-2 border border-border text-accent font-semibold">
                            <Tag className="w-3 h-3" />
                            <span>{post.category_name}</span>
                          </span>
                        ) : (
                          <span className="text-xs text-text-muted">Placement Guide</span>
                        )}

                        <span className="flex items-center space-x-1 text-text-muted text-[11px]">
                          <Clock className="w-3 h-3" />
                          <span>{post.reading_time_min || 5} min read</span>
                        </span>
                      </div>

                      {/* Title */}
                      <h2 className="text-lg font-bold text-text group-hover:text-accent transition-colors line-clamp-2">
                        <Link to={`/blog/${post.slug}`}>
                          {post.title}
                        </Link>
                      </h2>

                      {/* Excerpt */}
                      <p className="text-xs text-text-muted leading-relaxed line-clamp-3">
                        {post.excerpt}
                      </p>

                      {/* Target Company Tag */}
                      {post.company_name && (
                        <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-surface-2 text-text text-[11px] font-medium border border-border">
                          <Building2 className="w-3 h-3 text-accent" />
                          <span>{post.company_name}</span>
                          {post.role_name && <span className="text-text-muted">• {post.role_name}</span>}
                        </div>
                      )}
                    </div>

                    {/* Footer */}
                    <div className="pt-5 mt-4 border-t border-border flex items-center justify-between text-xs">
                      <span className="text-text-muted font-medium">
                        {post.author_name || 'Placyra Editorial'}
                      </span>
                      <Link
                        to={`/blog/${post.slug}`}
                        className="inline-flex items-center space-x-1 text-accent font-bold group-hover:translate-x-0.5 transition-transform"
                      >
                        <span>Read Guide</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </article>

                  {/* Inject In-Feed Native Ad Card after every 6th post */}
                  {isSixth && (
                    <div className="col-span-1 md:col-span-2 lg:col-span-3">
                      <AdSlot slotKey="feed_native" />
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        )}

        {/* Multiplex Footer Ad Placement */}
        <div className="pt-6">
          <AdSlot slotKey="multiplex_footer" />
        </div>
      </main>

      <CookieConsentBanner />
    </div>
  );
};

export default BlogIndexPage;

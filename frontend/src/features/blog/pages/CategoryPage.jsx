import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Navbar from '../../../components/common/Navbar';
import AdSlot from '../components/AdSlot';
import CookieConsentBanner from '../components/CookieConsentBanner';
import apiClient from '../../../services/apiClient';
import {
  Tag,
  Clock,
  Building2,
  Calendar,
  ChevronRight,
  ArrowRight,
  ArrowLeft,
  BookOpen,
} from 'lucide-react';

export const CategoryPage = () => {
  const { slug } = useParams();
  const [category, setCategory] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);

    // Fetch categories to locate active title and description
    apiClient
      .get('/blog/categories')
      .then((res) => {
        if (Array.isArray(res.data)) {
          const match = res.data.find((c) => c.slug === slug);
          if (match) {
            setCategory(match);
          } else {
            setCategory({
              name: slug ? slug.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()) : 'Category',
              slug: slug,
              description: `Curated campus preparation guides and technical notes in ${slug}.`,
            });
          }
        }
      })
      .catch(() => {
        setCategory({
          name: slug ? slug.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()) : 'Category',
          slug: slug,
          description: `Curated campus preparation guides and technical notes in ${slug}.`,
        });
      });

    // Fetch category posts
    apiClient
      .get('/blog/posts', { params: { category: slug, limit: 18 } })
      .then((res) => {
        if (Array.isArray(res.data)) {
          setPosts(res.data);
        } else {
          setPosts([]);
        }
      })
      .catch(() => {
        setPosts([]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [slug]);

  return (
    <div className="min-h-screen bg-bg text-text flex flex-col transition-colors">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="flex items-center space-x-2 text-xs text-text-muted">
          <Link to="/" className="hover:text-text transition-colors">Home</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <Link to="/blog" className="hover:text-text transition-colors">Blog</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-text font-medium">{category?.name || 'Category'}</span>
        </nav>

        {/* Category Header */}
        <div className="space-y-3 max-w-3xl">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-surface-2 border border-border text-accent text-xs font-bold">
            <Tag className="w-3.5 h-3.5" />
            <span>Category Archive</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-black text-text tracking-tight">
            {category?.name}
          </h1>

          <p className="text-sm text-text-muted leading-relaxed">
            {category?.description || `Explore our hand-picked placement resources and real student test experiences in ${category?.name}.`}
          </p>
        </div>

        {/* Top Leaderboard Ad */}
        <AdSlot slotKey="top_leaderboard" />

        {/* Posts Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-surface border border-border rounded-2xl p-6 space-y-4 animate-pulse">
                <div className="h-4 bg-surface-2 rounded w-1/3"></div>
                <div className="h-6 bg-surface-2 rounded w-full"></div>
                <div className="h-16 bg-surface-2 rounded w-full"></div>
              </div>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="p-12 text-center bg-surface border border-border rounded-2xl max-w-lg mx-auto">
            <BookOpen className="w-12 h-12 text-accent mx-auto mb-3" />
            <h3 className="text-base font-bold text-text">No articles found in this category</h3>
            <p className="text-xs text-text-muted mt-1 mb-4">
              More placement guides are currently being prepared for this stream.
            </p>
            <Link
              to="/blog"
              className="inline-flex items-center space-x-1 text-xs font-semibold text-accent"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Browse All Guides</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
            {posts.map((post, idx) => {
              const isSixth = (idx + 1) % 6 === 0;

              return (
                <React.Fragment key={post.id || post.slug}>
                  <article className="group bg-surface border border-border rounded-2xl p-6 flex flex-col justify-between hover:border-accent/40 hover:shadow-md transition-all">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-xs font-bold text-accent">{post.category_name}</span>
                        <span className="flex items-center space-x-1 text-text-muted text-[11px]">
                          <Clock className="w-3 h-3" />
                          <span>{post.reading_time_min || 5} min</span>
                        </span>
                      </div>

                      <h2 className="text-lg font-bold text-text group-hover:text-accent transition-colors line-clamp-2">
                        <Link to={`/blog/${post.slug}`}>{post.title}</Link>
                      </h2>

                      <p className="text-xs text-text-muted leading-relaxed line-clamp-3">
                        {post.excerpt}
                      </p>

                      {post.company_name && (
                        <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-surface-2 text-text text-[11px] font-medium border border-border">
                          <Building2 className="w-3 h-3 text-accent" />
                          <span>{post.company_name}</span>
                        </div>
                      )}
                    </div>

                    <div className="pt-5 mt-4 border-t border-border flex items-center justify-between text-xs">
                      <span className="text-text-muted font-medium">{post.author_name || 'Placyra Lead'}</span>
                      <Link
                        to={`/blog/${post.slug}`}
                        className="inline-flex items-center space-x-1 text-accent font-bold group-hover:translate-x-0.5 transition-transform"
                      >
                        <span>Read</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </article>

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

        {/* Multiplex Footer */}
        <div className="pt-6">
          <AdSlot slotKey="multiplex_footer" />
        </div>
      </main>

      <CookieConsentBanner />
    </div>
  );
};

export default CategoryPage;

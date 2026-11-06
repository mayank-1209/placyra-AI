import React, { useState, useEffect } from 'react';
import { List, ChevronRight } from 'lucide-react';

export const ArticleTOC = ({ headings = [] }) => {
  const [activeId, setActiveId] = useState('');

  useEffect(() => {
    if (!headings.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { rootMargin: '-80px 0% -60% 0%', threshold: 0.1 }
    );

    headings.forEach((h) => {
      const el = document.getElementById(h.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [headings]);

  if (!headings.length) return null;

  const scrollToHeading = (id) => {
    const el = document.getElementById(id);
    if (el) {
      const yOffset = -90;
      const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  return (
    <nav aria-label="Table of contents" className="bg-surface border border-border rounded-2xl p-5 mb-6 shadow-xs">
      <div className="flex items-center space-x-2 pb-3 mb-3 border-b border-border text-xs font-bold uppercase tracking-wider text-text">
        <List className="w-4 h-4 text-accent" />
        <span>Table of Contents</span>
      </div>

      <ul className="space-y-2 text-xs">
        {headings.map((h) => {
          const isActive = activeId === h.id;
          return (
            <li
              key={h.id}
              style={{ paddingLeft: `${(h.level - 2) * 12}px` }}
              className="transition-colors"
            >
              <button
                onClick={() => scrollToHeading(h.id)}
                className={`text-left w-full flex items-center justify-between py-1 transition-colors ${
                  isActive
                    ? 'font-bold text-accent'
                    : 'text-text-muted hover:text-text'
                }`}
              >
                <span className="line-clamp-1">{h.text}</span>
                {isActive && <ChevronRight className="w-3.5 h-3.5 shrink-0 text-accent" />}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};

export default ArticleTOC;

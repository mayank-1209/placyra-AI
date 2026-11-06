import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Cookie, X } from 'lucide-react';

export const CookieConsentBanner = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const consent = localStorage.getItem('placyra-cookie-consent');
      if (!consent) {
        // Small delay to prevent initial page layout jump
        const timer = setTimeout(() => setVisible(true), 1200);
        return () => clearTimeout(timer);
      }
    } catch (e) {
      // Fallback
    }
  }, []);

  const handleAcceptAll = () => {
    try {
      localStorage.setItem('placyra-cookie-consent', 'all');
      window.dispatchEvent(new CustomEvent('placyra:consent_updated', { detail: { consent: 'all' } }));
    } catch (e) {}
    setVisible(false);
  };

  const handleEssentialOnly = () => {
    try {
      localStorage.setItem('placyra-cookie-consent', 'essential');
      window.dispatchEvent(new CustomEvent('placyra:consent_updated', { detail: { consent: 'essential' } }));
    } catch (e) {}
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:max-w-md z-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="bg-surface border border-border shadow-2xl rounded-2xl p-5 text-text flex flex-col space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-surface-2 border border-border flex items-center justify-center text-accent">
              <Cookie className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-text">Privacy & Partner Cookies</h4>
              <p className="text-xs text-text-muted">AdSense & Placement Insights</p>
            </div>
          </div>
          <button
            onClick={handleEssentialOnly}
            className="text-text-muted hover:text-text p-1 rounded-lg transition-colors"
            title="Dismiss"
            aria-label="Dismiss cookie notice"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-text-muted leading-relaxed">
          Placyra uses essential cookies for secure login and optional contextual cookies to fund our free campus placement guides through educational partner advertisements.
        </p>

        <div className="flex items-center justify-between pt-1 text-xs">
          <Link
            to="/cookie-policy"
            className="text-text-muted hover:text-accent underline underline-offset-2 transition-colors"
          >
            Read Cookie Policy
          </Link>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleEssentialOnly}
              className="px-3 py-1.5 rounded-xl border border-border bg-surface-2 hover:bg-surface text-text font-medium text-xs transition-colors"
            >
              Essential Only
            </button>
            <button
              onClick={handleAcceptAll}
              className="px-4 py-1.5 rounded-xl bg-accent hover:bg-accent-hover text-white font-semibold text-xs transition-colors shadow-sm"
            >
              Accept All
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CookieConsentBanner;

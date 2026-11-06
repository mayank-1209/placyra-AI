import React, { useState, useEffect, useRef } from 'react';
import apiClient from '../../../services/apiClient';
import { ExternalLink, Sparkles } from 'lucide-react';

const DEFAULT_SLOT_DEFS = {
  top_leaderboard: {
    slot_key: 'top_leaderboard',
    placement: 'top_leaderboard',
    device_target: 'all',
    min_height_px: 90,
    width_px: 728,
    is_enabled: true,
    ad_format: 'horizontal',
    description: 'Header Leaderboard (728x90 desktop / 320x50 mobile)',
  },
  in_article_1: {
    slot_key: 'in_article_1',
    placement: 'in_article_1',
    device_target: 'all',
    min_height_px: 250,
    width_px: 336,
    is_enabled: true,
    ad_format: 'rectangle',
    description: 'In-Article Upper (336x280 / Responsive)',
  },
  sticky_sidebar: {
    slot_key: 'sticky_sidebar',
    placement: 'sticky_sidebar',
    device_target: 'desktop',
    min_height_px: 600,
    width_px: 300,
    is_enabled: true,
    ad_format: 'vertical',
    description: 'Desktop Sticky Sidebar (300x600 Half Page / 300x250)',
  },
  in_article_2: {
    slot_key: 'in_article_2',
    placement: 'in_article_2',
    device_target: 'all',
    min_height_px: 250,
    width_px: 336,
    is_enabled: true,
    ad_format: 'rectangle',
    description: 'In-Article Mid-Read Unit (336x280)',
  },
  feed_native: {
    slot_key: 'feed_native',
    placement: 'feed_native',
    device_target: 'all',
    min_height_px: 180,
    width_px: 600,
    is_enabled: true,
    ad_format: 'fluid',
    description: 'In-Feed Native Placement',
  },
  multiplex_footer: {
    slot_key: 'multiplex_footer',
    placement: 'multiplex_footer',
    device_target: 'all',
    min_height_px: 280,
    width_px: 728,
    is_enabled: true,
    ad_format: 'autorelaxed',
    description: 'Multiplex Grid Footer Recommendations',
  },
};

let cachedSlotsConfig = null;
let fetchPromise = null;

export const AdSlot = ({ slotKey, className = '', customStyle = {} }) => {
  const [slotConfig, setSlotConfig] = useState(() => {
    return (cachedSlotsConfig && cachedSlotsConfig[slotKey]) || DEFAULT_SLOT_DEFS[slotKey] || {
      slot_key: slotKey,
      min_height_px: 90,
      is_enabled: true,
      device_target: 'all',
    };
  });
  const [isMobile, setIsMobile] = useState(() => (typeof window !== 'undefined' ? window.innerWidth < 768 : false));
  const [isDesktop, setIsDesktop] = useState(() => (typeof window !== 'undefined' ? window.innerWidth >= 1024 : true));
  const [consent, setConsent] = useState(() => {
    try {
      return localStorage.getItem('placyra-cookie-consent') || 'pending';
    } catch (e) {
      return 'pending';
    }
  });

  const adRef = useRef(null);
  const pushedRef = useRef(false);

  // Sync viewport width for device-targeting filters
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      setIsDesktop(window.innerWidth >= 1024);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Listen for consent updates
  useEffect(() => {
    const handleConsent = (evt) => {
      setConsent(evt?.detail?.consent || 'all');
    };
    window.addEventListener('placyra:consent_updated', handleConsent);
    return () => window.removeEventListener('placyra:consent_updated', handleConsent);
  }, []);

  // Load slot configurations from backend
  useEffect(() => {
    let isMounted = true;

    if (cachedSlotsConfig) {
      if (cachedSlotsConfig[slotKey]) {
        setSlotConfig(cachedSlotsConfig[slotKey]);
      }
      return;
    }

    if (!fetchPromise) {
      fetchPromise = apiClient
        .get('/ads/slots')
        .then((res) => {
          const map = {};
          if (Array.isArray(res.data)) {
            res.data.forEach((s) => {
              map[s.slot_key] = s;
            });
          }
          cachedSlotsConfig = map;
          return map;
        })
        .catch(() => {
          cachedSlotsConfig = DEFAULT_SLOT_DEFS;
          return DEFAULT_SLOT_DEFS;
        });
    }

    fetchPromise.then((map) => {
      if (isMounted && map[slotKey]) {
        setSlotConfig(map[slotKey]);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [slotKey]);

  // Handle Google AdSense push if real ad unit is mounted
  const adClientId = import.meta.env.VITE_ADSENSE_CLIENT_ID || '';
  const isAdSenseConfigured = adClientId && adClientId.startsWith('ca-pub-') && !adClientId.includes('0000000000');

  useEffect(() => {
    if (isAdSenseConfigured && slotConfig?.is_enabled && consent === 'all' && !pushedRef.current) {
      try {
        if (typeof window !== 'undefined' && window.adsbygoogle) {
          (window.adsbygoogle = window.adsbygoogle || []).push({});
          pushedRef.current = true;
        }
      } catch (err) {
        // AdSense push safely guarded
      }
    }
  }, [isAdSenseConfigured, slotConfig?.is_enabled, consent]);

  if (!slotConfig || !slotConfig.is_enabled) {
    return null;
  }

  // Device target check
  if (slotConfig.device_target === 'desktop' && !isDesktop) {
    return null;
  }
  if (slotConfig.device_target === 'mobile' && !isMobile) {
    return null;
  }

  const minHeight = slotConfig.min_height_px || 90;
  const isFeed = slotKey === 'feed_native';

  return (
    <div
      className={`ad-slot-wrapper relative my-6 w-full flex flex-col items-center justify-center transition-all ${className}`}
      style={{ minHeight: `${minHeight}px`, ...customStyle }}
      data-ad-slot-key={slotKey}
      data-ad-placement={slotConfig.placement}
    >
      {/* Ad Disclosure Label */}
      <div className="w-full max-w-full flex items-center justify-between px-2 mb-1 text-[10px] font-medium uppercase tracking-wider text-text-muted select-none">
        <span className="flex items-center space-x-1">
          <span>Sponsored Educational Opportunity</span>
        </span>
        <span className="opacity-70">AdSense Ready</span>
      </div>

      {isAdSenseConfigured && consent === 'all' ? (
        /* Real Google AdSense Tag */
        <ins
          ref={adRef}
          className={`adsbygoogle block w-full ${isFeed ? 'bg-transparent' : 'bg-surface border border-border rounded-xl'}`}
          style={{ display: 'block', minHeight: `${minHeight}px` }}
          data-ad-client={adClientId}
          data-ad-slot={slotConfig.ad_slot_id || '1234567890'}
          data-ad-format={slotConfig.ad_format || 'auto'}
          data-full-width-responsive="true"
        />
      ) : (
        /* Neutral High-Polish Preview Card (AdSense Compliance & Local Dev Mode) */
        <div
          className={`w-full rounded-xl border border-dashed border-border bg-surface-2/40 flex flex-col items-center justify-center text-center p-4 transition-colors hover:border-border-hover ${
            isFeed ? 'rounded-2xl border-solid bg-surface p-6 shadow-sm' : ''
          }`}
          style={{ minHeight: `${minHeight}px` }}
        >
          <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-surface border border-border text-text-muted text-[11px] font-semibold mb-2 shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-accent" />
            <span>Campus Career Partner</span>
          </div>

          <h5 className="text-xs font-bold text-text mb-0.5">
            {slotConfig.description || `Ad Unit: ${slotKey}`}
          </h5>
          <p className="text-[11px] text-text-muted max-w-sm">
            Targeting engineering & campus recruitment programs. Reserved {slotConfig.width_px || 'Responsive'} × {minHeight}px viewport box (CLS Protected).
          </p>

          <div className="mt-3 inline-flex items-center space-x-1 text-[10px] font-medium text-accent">
            <span>Learn with Verified Prep Partners</span>
            <ExternalLink className="w-2.5 h-2.5" />
          </div>
        </div>
      )}
    </div>
  );
};

export default AdSlot;

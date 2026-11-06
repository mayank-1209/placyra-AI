import React, { useState, useEffect } from 'react';
import Navbar from '../../../components/common/Navbar';
import apiClient from '../../../services/apiClient';
import {
  LayoutGrid,
  CheckCircle2,
  AlertCircle,
  Save,
  Monitor,
  Smartphone,
  Layers,
  Sparkles,
} from 'lucide-react';

export const AdManagerPage = () => {
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    fetchSlots();
  }, []);

  const fetchSlots = () => {
    setLoading(true);
    apiClient
      .get('/ads/slots')
      .then((res) => {
        if (Array.isArray(res.data)) {
          setSlots(res.data);
        }
      })
      .catch(() => {
        // Fallback default slots
        setSlots([
          {
            id: '1',
            slot_key: 'top_leaderboard',
            placement: 'top_leaderboard',
            device_target: 'all',
            min_height_px: 90,
            width_px: 728,
            is_enabled: true,
            ad_slot_id: '1001',
          },
          {
            id: '2',
            slot_key: 'in_article_1',
            placement: 'in_article_1',
            device_target: 'all',
            min_height_px: 250,
            width_px: 336,
            is_enabled: true,
            ad_slot_id: '1002',
          },
          {
            id: '3',
            slot_key: 'sticky_sidebar',
            placement: 'sticky_sidebar',
            device_target: 'desktop',
            min_height_px: 600,
            width_px: 300,
            is_enabled: true,
            ad_slot_id: '1003',
          },
          {
            id: '4',
            slot_key: 'in_article_2',
            placement: 'in_article_2',
            device_target: 'all',
            min_height_px: 250,
            width_px: 336,
            is_enabled: true,
            ad_slot_id: '1004',
          },
          {
            id: '5',
            slot_key: 'feed_native',
            placement: 'feed_native',
            device_target: 'all',
            min_height_px: 180,
            width_px: 600,
            is_enabled: true,
            ad_slot_id: '1005',
          },
          {
            id: '6',
            slot_key: 'multiplex_footer',
            placement: 'multiplex_footer',
            device_target: 'all',
            min_height_px: 280,
            width_px: 728,
            is_enabled: true,
            ad_slot_id: '1006',
          },
        ]);
      })
      .finally(() => setLoading(false));
  };

  const handleUpdateField = (id, field, value) => {
    setSlots((prev) =>
      prev.map((s) => (s.id === id ? { ...s, [field]: value } : s))
    );
  };

  const handleSaveSlot = async (slot) => {
    setSavingId(slot.id);
    setMessage(null);
    try {
      await apiClient.patch(`/ads/slots/${slot.id}`, {
        is_enabled: slot.is_enabled,
        device_target: slot.device_target,
        min_height_px: parseInt(slot.min_height_px, 10),
        width_px: slot.width_px ? parseInt(slot.width_px, 10) : null,
        ad_slot_id: slot.ad_slot_id,
      });
      setMessage({ type: 'success', text: `Saved configuration for ${slot.slot_key}!` });
    } catch (err) {
      setMessage({
        type: 'error',
        text: err.response?.data?.message || 'Failed to update ad slot. Verify admin permissions.',
      });
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-bg text-text flex flex-col transition-colors">
      <Navbar />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div>
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-surface-2 border border-border text-accent text-xs font-bold mb-2">
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>AdSense & Monetization Controller</span>
          </div>
          <h1 className="text-2xl font-black text-text">Placement Ad Unit Inventory</h1>
          <p className="text-xs text-text-muted mt-0.5">
            Manage live container rules, device targeting, and CLS bounding boxes across the campus knowledge base.
          </p>
        </div>

        {message && (
          <div
            className={`p-4 rounded-xl border text-xs flex items-center space-x-2 ${
              message.type === 'success'
                ? 'bg-success/10 border-success/30 text-success'
                : 'bg-danger/10 border-danger/30 text-danger'
            }`}
          >
            {message.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-28 bg-surface border border-border rounded-2xl animate-pulse"></div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {slots.map((slot) => (
              <div
                key={slot.id || slot.slot_key}
                className="bg-surface border border-border rounded-2xl p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
              >
                <div className="space-y-2 min-w-[220px]">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-xs font-bold text-accent bg-surface-2 px-2 py-0.5 rounded border border-border">
                      {slot.slot_key}
                    </span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={slot.is_enabled}
                        onChange={(e) => handleUpdateField(slot.id, 'is_enabled', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-surface-2 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-border after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-accent"></div>
                    </label>
                  </div>
                  <p className="text-xs text-text font-semibold capitalize">
                    {slot.placement?.replace(/_/g, ' ')}
                  </p>
                </div>

                {/* Configuration Options */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full md:w-auto">
                  <div>
                    <label className="block text-[11px] font-semibold text-text-muted mb-1">Device Target</label>
                    <select
                      value={slot.device_target}
                      onChange={(e) => handleUpdateField(slot.id, 'device_target', e.target.value)}
                      className="px-2.5 py-1.5 rounded-lg bg-surface-2 border border-border text-xs text-text focus:outline-none focus:border-accent"
                    >
                      <option value="all">All Devices</option>
                      <option value="desktop">Desktop Only</option>
                      <option value="mobile">Mobile Only</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-text-muted mb-1">Min Height (px)</label>
                    <input
                      type="number"
                      value={slot.min_height_px}
                      onChange={(e) => handleUpdateField(slot.id, 'min_height_px', e.target.value)}
                      className="w-24 px-2.5 py-1.5 rounded-lg bg-surface-2 border border-border text-xs text-text focus:outline-none focus:border-accent"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-text-muted mb-1">Width (px)</label>
                    <input
                      type="number"
                      value={slot.width_px || ''}
                      placeholder="Auto"
                      onChange={(e) => handleUpdateField(slot.id, 'width_px', e.target.value)}
                      className="w-24 px-2.5 py-1.5 rounded-lg bg-surface-2 border border-border text-xs text-text focus:outline-none focus:border-accent"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-text-muted mb-1">AdSense Slot ID</label>
                    <input
                      type="text"
                      value={slot.ad_slot_id || ''}
                      placeholder="1234567890"
                      onChange={(e) => handleUpdateField(slot.id, 'ad_slot_id', e.target.value)}
                      className="w-28 px-2.5 py-1.5 rounded-lg bg-surface-2 border border-border text-xs text-text focus:outline-none focus:border-accent"
                    />
                  </div>
                </div>

                {/* Save Button */}
                <button
                  onClick={() => handleSaveSlot(slot)}
                  disabled={savingId === slot.id}
                  className="w-full md:w-auto inline-flex items-center justify-center space-x-1.5 px-4 py-2 rounded-xl bg-accent hover:bg-accent-hover text-white text-xs font-semibold shadow-xs transition-colors shrink-0 disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{savingId === slot.id ? 'Saving...' : 'Apply'}</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default AdManagerPage;

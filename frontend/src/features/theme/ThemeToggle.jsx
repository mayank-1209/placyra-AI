import React from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from './ThemeContext';

export const ThemeToggle = ({ compact = false, className = '' }) => {
  const { theme, setTheme } = useTheme();

  const options = [
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'system', label: 'System', icon: Monitor },
    { value: 'dark', label: 'Dark', icon: Moon },
  ];

  return (
    <div
      className={`inline-flex items-center p-1 bg-surface-2 border border-border rounded-xl ${className}`}
      role="group"
      aria-label="Theme switcher"
    >
      {options.map((opt) => {
        const Icon = opt.icon;
        const isActive = theme === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => setTheme(opt.value)}
            title={`Switch to ${opt.label} theme`}
            className={`flex items-center justify-center rounded-lg transition-all text-xs font-semibold ${
              compact ? 'p-1.5' : 'px-2.5 py-1.5 space-x-1'
            } ${
              isActive
                ? 'bg-surface text-accent shadow-sm border border-border'
                : 'text-text-muted hover:text-text hover:bg-surface-hover'
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {!compact && <span>{opt.label}</span>}
          </button>
        );
      })}
    </div>
  );
};

export default ThemeToggle;

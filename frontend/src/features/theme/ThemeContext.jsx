import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { useSelector } from 'react-redux';
import { authApi } from '../../services/apiClient';

const ThemeContext = createContext(null);

export const ThemeProvider = ({ children }) => {
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  
  // Initialize from localStorage or default to system
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('placyra-theme') || 'system';
  });

  const syncTimeoutRef = useRef(null);

  // Apply theme to document element
  useEffect(() => {
    const root = document.documentElement;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const applyTheme = () => {
      let isDark = false;
      if (theme === 'dark') {
        isDark = true;
      } else if (theme === 'light') {
        isDark = false;
      } else {
        // System preference
        isDark = mediaQuery.matches;
      }

      if (isDark) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    };

    applyTheme();

    // Listen for live system changes if in system mode
    const handleSystemChange = () => {
      if (theme === 'system') {
        applyTheme();
      }
    };

    mediaQuery.addEventListener('change', handleSystemChange);
    return () => mediaQuery.removeEventListener('change', handleSystemChange);
  }, [theme]);

  // Sync with DB settings when user logs in
  useEffect(() => {
    if (isAuthenticated) {
      authApi
        .getSettings()
        .then((res) => {
          if (res.data?.theme_preference) {
            setTheme(res.data.theme_preference);
            localStorage.setItem('placyra-theme', res.data.theme_preference);
          }
        })
        .catch(() => {
          // If settings endpoint is pending migration, fallback safely
        });
    }
  }, [isAuthenticated]);

  const updateTheme = (newTheme) => {
    if (!['light', 'dark', 'system'].includes(newTheme)) return;
    setTheme(newTheme);
    localStorage.setItem('placyra-theme', newTheme);

    // Debounced DB persistence if logged in
    if (isAuthenticated) {
      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
      syncTimeoutRef.current = setTimeout(() => {
        authApi.updateSettings({ theme_preference: newTheme }).catch((err) => {
          console.warn('Failed to persist theme preference to backend:', err);
        });
      }, 500);
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme: updateTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export default ThemeContext;

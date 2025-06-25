import React, { createContext, useState, useContext, useEffect, ReactNode, useCallback } from 'react';

type Theme = 'light' | 'dark' | 'auto';
type ResolvedTheme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = 'voting_app_theme';

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window === 'undefined') return 'auto';
    const storedTheme = localStorage.getItem(THEME_STORAGE_KEY) as Theme | null;
    return storedTheme || 'auto';
  });
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>('light');

  const applyTheme = useCallback((currentTheme: Theme) => {
    let newResolvedTheme: ResolvedTheme;
    if (currentTheme === 'auto') {
      newResolvedTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    } else {
      newResolvedTheme = currentTheme;
    }
    setResolvedTheme(newResolvedTheme);

    if (newResolvedTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  useEffect(() => {
    applyTheme(theme);
  }, [theme, applyTheme]);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (theme === 'auto') {
        applyTheme('auto');
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme, applyTheme]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem(THEME_STORAGE_KEY, newTheme);
  };
  
  // Apply theme on initial load based on localStorage or system preference
  useEffect(() => {
    const initialTheme = (localStorage.getItem(THEME_STORAGE_KEY) as Theme | null) || 'auto';
    setThemeState(initialTheme); // Set state to trigger effects
    applyTheme(initialTheme); // Also apply immediately
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only once on mount


  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
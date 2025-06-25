import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';

const SunIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path d="M12 2.25a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75zM7.5 12a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM18.894 6.166a.75.75 0 00-1.06-1.06l-1.591 1.59a.75.75 0 101.06 1.061l1.591-1.59zM21.75 12a.75.75 0 01-.75.75h-2.25a.75.75 0 010-1.5H21a.75.75 0 01.75.75zM17.834 18.894a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 10-1.061 1.06l1.59 1.591zM12 18a.75.75 0 01.75.75V21a.75.75 0 01-1.5 0v-2.25A.75.75 0 0112 18zM7.758 17.303a.75.75 0 00-1.061-1.06l-1.591 1.59a.75.75 0 001.06 1.061l1.591-1.59zM6 12a.75.75 0 01-.75.75H3a.75.75 0 010-1.5h2.25A.75.75 0 016 12zM6.697 7.757a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 00-1.061 1.06l1.59 1.591z" />
  </svg>
);

const MoonIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path fillRule="evenodd" d="M9.528 1.718a.75.75 0 01.162.819A8.97 8.97 0 009 6a9 9 0 009 9 8.97 8.97 0 003.463-.69.75.75 0 01.981.98 10.503 10.503 0 01-9.694 6.46c-5.799 0-10.5-4.701-10.5-10.5 0-4.368 2.667-8.112 6.46-9.694a.75.75 0 01.818.162z" clipRule="evenodd" />
  </svg>
);

const SystemIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path fillRule="evenodd" d="M2.25 5.25a3 3 0 013-3h13.5a3 3 0 013 3V15a3 3 0 01-3 3h-3v.257c0 .597.237 1.17.659 1.591l.621.622a.75.75 0 01-.53 1.28h-9a.75.75 0 01-.53-1.28l.621-.622a2.25 2.25 0 00.659-1.59V18h-3a3 3 0 01-3-3V5.25zm1.5 0v9.75c0 .83.67 1.5 1.5 1.5h13.5c.83 0 1.5-.67 1.5-1.5V5.25c0-.83-.67-1.5-1.5-1.5H5.25c-.83 0-1.5.67-1.5 1.5z" clipRule="evenodd" />
  </svg>
);

const ThemeSwitcher: React.FC<{ className?: string }> = ({ className }) => {
  const { theme, setTheme } = useTheme();

  const themes = [
    { name: 'light', label: 'Modo claro', icon: <SunIcon /> },
    { name: 'dark', label: 'Modo oscuro', icon: <MoonIcon /> },
    { name: 'auto', label: 'Automático', icon: <SystemIcon /> },
  ] as const;

  return (
    <div className={`inline-flex rounded-container-fourth bg-slate-100/80 dark:bg-slate-700/60 p-1 backdrop-blur-sm border border-slate-200/60 dark:border-slate-600/40 shadow-spectra-sm ${className || ''}`}>
      {themes.map((item) => (
        <button
          key={item.name}
          onClick={() => setTheme(item.name)}
          className={`
            relative px-3 py-1.5 rounded-container-fourth transition-all duration-300 ease-apple flex items-center justify-center min-w-[2.5rem] hover:scale-[1.02] active:scale-[0.98]
            ${theme === item.name 
              ? 'bg-white dark:bg-slate-600 text-primary-maroon dark:text-accent-gold shadow-spectra-md border border-slate-200/60 dark:border-slate-500/60 font-medium' 
              : 'text-slate-600 dark:text-slate-300 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-white/50 dark:hover:bg-slate-600/40'
            }
            focus:outline-none focus:ring-2 focus:ring-primary-maroon/30 dark:focus:ring-accent-gold/30 focus:ring-offset-2 focus:ring-offset-slate-100 dark:focus:ring-offset-slate-700
          `}
          aria-pressed={theme === item.name}
          title={item.label}
          aria-label={item.label}
        >
          {item.icon}
          <span className="sr-only">{item.label}</span>
          
          {/* Active indicator dot */}
          {theme === item.name && (
            <div className="absolute -bottom-0.5 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-primary-maroon dark:bg-accent-gold rounded-full shadow-sm"></div>
          )}
        </button>
      ))}
    </div>
  );
};

export default ThemeSwitcher;
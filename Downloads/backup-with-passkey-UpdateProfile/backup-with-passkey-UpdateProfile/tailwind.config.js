/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./**/*.{js,ts,jsx,tsx}"
  ],
  darkMode: 'class',  theme: {
    extend: {
      borderRadius: {
        // Sistema de esquinas jerárquico
        'container-first': '40px',    // Primer nivel (contenedores principales)
        'container-second': '30px',   // Segundo nivel
        'container-third': '20px',    // Tercer nivel
        'container-fourth': '15px',   // Cuarto nivel
        'modern-sm': '8px',           // Elementos pequeños
        'modern-md': '12px',          // Elementos medianos
        'modern-lg': '16px',          // Elementos grandes
        'modern-xl': '24px',          // Elementos extra grandes
      },
      colors: {
        // SpectraUI Primary Colors (Light Mode)
        'primary-maroon': '#611232',
        'primary-maroon-hover': '#500F2A',
        'primary-maroon-darker': '#460A1E',
        'primary-maroon-lighter': 'rgba(97, 18, 50, 0.1)',
        'primary-maroon-light': 'rgba(97, 18, 50, 0.05)',
        
        // SpectraUI Accent Colors (Dark Mode Primary)
        'accent-gold': '#A57F2C',
        'accent-gold-hover': '#B99340',
        'accent-gold-brighter': '#CDA754',
        'accent-gold-lighter': 'rgba(165, 127, 44, 0.2)',
        'accent-gold-light': 'rgba(165, 127, 44, 0.1)',
        'accent-gold-darker': '#915B18',
        'text-on-gold': '#111827',
        
        // Neutrals Light Mode
        'light-bg': '#ffffff',
        'light-gray': '#f9fafb',
        'light-gray-alt': '#e5e7eb',
        'text-primary-light': '#1f2937',
        'text-secondary-light': '#374151',
        
        // Neutrals Dark Mode
        'dm-bg-main': '#111827',
        'dm-bg-card': 'rgba(51, 65, 85, 0.8)',
        'dm-bg-content': 'rgba(30, 41, 59, 0.85)',
        'dm-bg-navbar': 'rgba(30, 41, 59, 0.9)',
        'dm-bg-sidebar': 'rgba(23, 31, 46, 0.95)',
        'text-primary-dark': '#e5e7eb',
        'text-secondary-dark': '#d1d5db',
        
        // Complementary Colors
        'comp-pink': '#db2777',
        'comp-rose': '#fb9aa3',
        'comp-amber': '#fbbf24',
        'comp-orange': '#fb923c',
        
        // Scrollbar Colors
        'scrollbar-track-light': '#e5e7eb',
        'scrollbar-thumb-light': '#611232',
        'scrollbar-thumb-light-hover': '#500F2A',
        'scrollbar-track-dark': '#28374a',
        'scrollbar-thumb-dark': '#A57F2C',
        'scrollbar-thumb-dark-hover': '#B99340',
        
        // Legacy color mappings for backward compatibility
        'custom-pink': '#611232',
        'custom-pink-hover': '#500F2A',
        'custom-gold': '#A57F2C',
        'card-bg': 'rgba(255, 255, 255, 0.8)',
        'light-gray': '#f9fafb',
        'border-gray': '#e5e7eb',
        'text-primary': '#1f2937',
        'text-secondary': '#374151',
        'text-tertiary': '#6b7280',
        
        // Status colors
        'success-bg': '#10b981',
        'success-text': '#059669',
        'error-bg': '#ef4444',
        'error-text': '#dc2626',
        'warning-bg': '#f59e0b',
        'warning-text': '#d97706',
        'info-bg': '#3b82f6',
        'info-text': '#2563eb',
      },
      fontFamily: {
        'sans': ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        'spectra-sm': '0 2px 8px rgba(0, 0, 0, 0.08)',
        'spectra-md': '0 4px 16px rgba(0, 0, 0, 0.08)',
        'spectra-lg': '0 8px 24px rgba(0, 0, 0, 0.12)',
        'spectra-xl': '0 12px 32px rgba(0, 0, 0, 0.16)',
        'spectra-2xl': '0 16px 48px rgba(0, 0, 0, 0.20)',
        'spectra-primary': '0 8px 32px rgba(97, 18, 50, 0.3), 0 4px 12px rgba(97, 18, 50, 0.2)',
        'spectra-gold': '0 8px 32px rgba(165, 127, 44, 0.3), 0 4px 12px rgba(165, 127, 44, 0.2)',
        // Legacy shadows
        'apple-sm': '0 2px 8px rgba(0, 0, 0, 0.08)',
        'apple-md': '0 4px 16px rgba(0, 0, 0, 0.08)',
        'apple-lg': '0 8px 24px rgba(0, 0, 0, 0.12)',
        'apple-xl': '0 12px 32px rgba(0, 0, 0, 0.16)',
      },
      borderRadius: {
        'spectra-sm': '8px',
        'spectra-md': '12px',
        'spectra-lg': '16px',
        'spectra-xl': '20px',
        // Legacy radius mappings
        'container-first': '20px',
        'container-second': '16px',
        'container-third': '12px',
      },
      backdropBlur: {
        'spectra': '16px',
      },
      backgroundImage: {
        'gradient-primary-light': 'linear-gradient(135deg, #611232, #db2777, #fb9aa3)',
        'gradient-primary-dark': 'linear-gradient(135deg, #A57F2C, #fbbf24, #CDA754)',
        'gradient-card-light': 'linear-gradient(135deg, rgba(97, 18, 50, 0.7), rgba(219, 39, 119, 0.7))',
        'gradient-card-dark': 'linear-gradient(135deg, rgba(165, 127, 44, 0.7), rgba(205, 167, 84, 0.7))',
      },
      animation: {
        'spectra-fade-in': 'spectra-fade-in 0.4s cubic-bezier(0.25, 0.1, 0.25, 1)',
        'spectra-slide-up': 'spectra-slide-up 0.4s cubic-bezier(0.25, 0.1, 0.25, 1)',
        'spectra-scale': 'spectra-scale 0.3s cubic-bezier(0.25, 0.1, 0.25, 1)',
      },
      keyframes: {
        'spectra-fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'spectra-slide-up': {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'spectra-scale': {
          '0%': { transform: 'scale(0.95)' },
          '100%': { transform: 'scale(1)' },
        },
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      },
    },
  },
  plugins: [],
}
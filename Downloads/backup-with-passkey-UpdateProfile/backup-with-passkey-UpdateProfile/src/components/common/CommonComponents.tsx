import React, { ReactNode, useState, useRef, useEffect, useCallback } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { APP_NAME, ROUTES, DEFAULT_PROFILE_PIC_BASE_URL } from '../../constants';
import { UserRole } from '../../types';
import ThemeSwitcher from './ThemeSwitcher'; // Import ThemeSwitcher
import { useTheme } from '../../contexts/ThemeContext'; // Import useTheme for Select arrow
import { useNotifications } from '../../hooks/useNotifications';
import AdminSidebar from '../admin/AdminSidebar';

// Button Component
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'link';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  fullWidth?: boolean;
}
export const Button: React.FC<ButtonProps> = ({ children, variant = 'primary', size = 'md', className = '', isLoading = false, disabled, fullWidth, ...props }) => {
  const baseStyles = 'font-medium rounded-container-fourth focus:outline-none transition-all duration-300 ease-apple flex items-center justify-center hover:scale-[1.02] active:scale-[0.98] relative overflow-hidden';
  
  const sizeStyles = {
    sm: 'px-3 py-1.5 text-sm h-8',
    md: 'px-5 py-2 text-base h-10',
    lg: 'px-7 py-2.5 text-lg h-12',
  };
    const variantStyles = {
    // Primary CTA - Enhanced visibility with better contrast
    primary: 'bg-gradient-to-r from-primary-maroon to-primary-maroon-hover dark:from-accent-gold dark:to-accent-gold-hover text-white dark:text-neutral-900 hover:from-primary-maroon-hover hover:to-primary-maroon-darker dark:hover:from-accent-gold-hover dark:hover:to-accent-gold-brighter shadow-spectra-md hover:shadow-spectra-lg focus:ring-4 focus:ring-primary-maroon/40 dark:focus:ring-accent-gold/40 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-neutral-800 border border-primary-maroon/20 dark:border-accent-gold/30',
    
    // Secondary/Standard - Enhanced contrast and readability
    secondary: 'bg-white/95 dark:bg-slate-700/90 text-slate-800 dark:text-slate-100 hover:bg-white dark:hover:bg-slate-600/95 shadow-spectra-sm hover:shadow-spectra-md backdrop-blur-sm border-2 border-slate-300/70 dark:border-slate-500/70 hover:border-slate-400/90 dark:hover:border-slate-400/90 focus:ring-4 focus:ring-slate-400/50 dark:focus:ring-slate-500/50 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-neutral-800',
    
    // Danger - Enhanced visibility with better contrast
    danger: 'bg-gradient-to-r from-red-600 to-red-700 text-white hover:from-red-700 hover:to-red-800 shadow-spectra-md hover:shadow-spectra-lg focus:ring-4 focus:ring-red-500/40 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-neutral-800 border border-red-600/30',
    
    // Ghost/Icon buttons - Enhanced visibility
    ghost: 'bg-transparent text-slate-700 dark:text-slate-200 hover:bg-slate-200/80 dark:hover:bg-slate-600/60 hover:text-primary-maroon dark:hover:text-accent-gold backdrop-blur-sm border border-transparent hover:border-slate-300/80 dark:hover:border-slate-500/60 focus:ring-4 focus:ring-slate-400/40 dark:focus:ring-slate-500/40 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-neutral-800',
    
    // Link/Text buttons - Enhanced contrast
    link: 'bg-transparent text-primary-maroon dark:text-accent-gold hover:text-primary-maroon-hover dark:hover:text-accent-gold-hover hover:underline p-0 h-auto hover:scale-105 focus:ring-4 focus:ring-primary-maroon/30 dark:focus:ring-accent-gold/30 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-neutral-800 font-semibold',
  };
  
  const disabledStyles = 'opacity-50 cursor-not-allowed hover:scale-100 active:scale-100 hover:shadow-none';
  const loadingStyles = 'cursor-wait pointer-events-none';
  const fullWidthStyles = fullWidth ? 'w-full' : '';

  return (
    <button
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${disabled ? disabledStyles : ''} ${isLoading ? loadingStyles : ''} ${fullWidthStyles} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <LoadingSpinner 
          size="sm" 
          color={variant === 'primary' || variant === 'danger' ? 'text-white' : variant === 'secondary' ? 'text-slate-600' : 'text-primary-maroon dark:text-accent-gold'} 
        />
      ) : children}
    </button>
  );
};

// Input Component
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: ReactNode;
  containerClassName?: string;
}
export const Input: React.FC<InputProps> = ({ label, name, type = 'text', error, className = '', icon, containerClassName = '', ...props }) => {  return (
    <div className={`w-full ${containerClassName}`}>
      {label && <label htmlFor={name} className="block text-sm font-semibold text-slate-900 dark:text-slate-100 mb-2">{label}</label>}
      <div className="relative">
        {icon && <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">{React.cloneElement(icon as React.ReactElement<{ className?: string }>, { className: 'w-5 h-5 text-slate-600 dark:text-slate-400' })}</div>}
        <input
          id={name}
          name={name}
          type={type}
          className={`w-full px-4 py-3 text-base font-medium bg-white/95 dark:bg-slate-700/95 border-2 border-slate-300/80 dark:border-slate-600/80 rounded-container-fourth text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-primary-maroon/30 dark:focus:ring-accent-gold/30 focus:border-primary-maroon dark:focus:border-accent-gold transition-all duration-200 backdrop-blur-sm ${error ? 'border-red-500/80 dark:border-red-400/80 bg-red-50/50 dark:bg-red-900/20' : ''} ${icon ? 'pl-12' : ''} ${className}`}
          {...props}
        />
      </div>
      {error && <p className="mt-2 text-sm font-medium text-red-700 dark:text-red-400">{error}</p>}
    </div>
  );
};

// Select Component
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
  containerClassName?: string;
}
export const Select: React.FC<SelectProps> = ({ label, name, error, options, className = '', containerClassName = '', ...props }) => {
  const { resolvedTheme } = useTheme();
  const arrowColor = resolvedTheme === 'dark' ? '%23e2e8f0' : '%230f172a'; // Better contrast colors
  return (
    <div className={`w-full ${containerClassName}`}>
      {label && <label htmlFor={name} className="block text-sm font-semibold text-slate-900 dark:text-slate-100 mb-2">{label}</label>}
      <select
        id={name}
        name={name}
        className={`w-full px-4 py-3 text-base font-medium bg-white/95 dark:bg-slate-700/95 border-2 border-slate-300/80 dark:border-slate-600/80 rounded-container-fourth text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-4 focus:ring-primary-maroon/30 dark:focus:ring-accent-gold/30 focus:border-primary-maroon dark:focus:border-accent-gold transition-all duration-200 backdrop-blur-sm appearance-none bg-no-repeat bg-right-3 pr-12 ${error ? 'border-red-500/80 dark:border-red-400/80 bg-red-50/50 dark:bg-red-900/20' : ''} ${className}`}
        style={{ 
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='${arrowColor}' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M6 8l4 4 4-4'/%3E%3C/svg%3E")`,
            backgroundPosition: 'right 0.75rem center',
            backgroundSize: '1.25rem 1.25rem'
        }}
        {...props}
      >
        {options.map(option => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
      {error && <p className="mt-2 text-sm font-medium text-red-700 dark:text-red-400">{error}</p>}
    </div>
  );
};

// Modal Component
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'fit';
  zIndex?: string;
  hideCloseButton?: boolean;
}
export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, size = 'md', zIndex = 'z-50', hideCloseButton = false }) => {
  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-lg',
    xl: 'max-w-xl', '2xl': 'max-w-2xl', fit: 'max-w-fit',
  };  return (
    <div className={`fixed inset-0 ${zIndex} flex items-center justify-center p-4 transition-opacity duration-300 ease-out`}>
      <div onClick={onClose} className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm"></div>
      <div 
        className={`bg-white dark:bg-neutral-800 rounded-container-third shadow-spectra-2xl border border-slate-200/60 dark:border-neutral-700/60 backdrop-blur-xl ${sizeClasses[size]} w-full transform transition-all duration-300 ease-out scale-100 relative max-h-[90vh] flex flex-col`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? "modal-title" : undefined}
      >
        {(title || !hideCloseButton) && (
          <div className="flex items-center justify-between p-6 border-b-2 border-slate-200/30 dark:border-slate-600/30">
            {title && <h3 id="modal-title" className="text-xl font-bold text-slate-900 dark:text-slate-100">{title}</h3>}
            {!hideCloseButton && (
              <button 
                onClick={onClose} 
                className="text-slate-500 dark:text-slate-400 hover:text-red-500 dark:hover:text-red-400 p-2 rounded-container-fourth transition-all duration-300 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-neutral-800"
                aria-label="Cerrar modal"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        )}
        <div className="p-6 overflow-y-auto flex-grow bg-gradient-to-b from-transparent to-gray-50/10 dark:to-neutral-800/10">
          {children}
        </div>
      </div>
    </div>  );
};

// NotificationBell Component
export const NotificationBell: React.FC = () => {
  const { currentUser } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [showAllNotifications, setShowAllNotifications] = useState(false);
  const { notifications, unreadCount, markAsRead, markAllAsRead, refreshNotifications } = useNotifications();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleRefreshNotifications = async () => {
    try {
      await refreshNotifications();
    } catch (error) {
      console.error('Error refreshing notifications:', error);
    }
  };
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'candidacy_withdrawal':
        return (
          <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.728-.833-2.498 0L4.316 14.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        );
      case 'voting_reminder':
        return (
          <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'nomination_reminder':
        return (
          <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  const formatTimeAgo = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (days > 0) return `Hace ${days}d`;
    if (hours > 0) return `Hace ${hours}h`;
    if (minutes > 0) return `Hace ${minutes}m`;
    return 'Ahora';
  };

  if (!currentUser) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Icon Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2.5 rounded-container-fourth bg-gray-50/80 dark:bg-neutral-700/80 hover:bg-gray-100/90 dark:hover:bg-neutral-600/90 transition-all duration-300 ease-apple backdrop-blur-sm border border-gray-200/60 dark:border-neutral-600/40 hover:border-gray-300/80 dark:hover:border-neutral-500/80 focus:outline-none focus:ring-4 focus:ring-gray-300/40 dark:focus:ring-neutral-600/40 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-neutral-800 group"
        aria-label="Notificaciones"
        aria-expanded={isOpen}
      >        <svg 
          className="w-5 h-5 text-gray-600 dark:text-gray-300 group-hover:text-gray-800 dark:group-hover:text-gray-100 transition-colors duration-200" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.73 21a2 2 0 01-3.46 0" />
        </svg>
        
        {/* Notification Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center border-2 border-white dark:border-neutral-800 shadow-sm animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white/95 dark:bg-neutral-800/95 backdrop-blur-xl rounded-container-second shadow-spectra-xl border border-gray-200/80 dark:border-neutral-700/80 z-50 max-h-96 overflow-hidden"
             style={{
               backgroundColor: 'rgba(255, 255, 255, 0.98)',
               backdropFilter: 'blur(20px) saturate(180%)',
               WebkitBackdropFilter: 'blur(20px) saturate(180%)',
             }}
        >          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-200/60 dark:border-neutral-700/60 bg-gradient-to-r from-gray-50/90 to-gray-100/90 dark:from-neutral-700/90 dark:to-neutral-600/90">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                Notificaciones {unreadCount > 0 && `(${unreadCount})`}
              </h3>
              <div className="flex items-center space-x-2">
                {/* Refresh Button */}
                <button
                  onClick={handleRefreshNotifications}
                  className="p-1.5 rounded-full hover:bg-gray-200/60 dark:hover:bg-neutral-600/60 transition-colors duration-200"
                  title="Refrescar notificaciones"
                >
                  <svg className="w-4 h-4 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
                
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-xs text-custom-pink dark:text-custom-gold hover:underline font-medium"
                  >
                    Marcar todas como leídas
                  </button>
                )}
              </div>
            </div>
          </div>{/* Notifications List */}
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <svg className="w-12 h-12 mx-auto text-gray-400 dark:text-gray-500 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M13 3A4 4 0 019 7v4L7 13v2h10v-2l-2-2V7a4 4 0 00-4-4z" />
                </svg>
                <p className="text-sm text-gray-500 dark:text-gray-400">No tienes notificaciones</p>
              </div>
            ) : (
              (showAllNotifications ? notifications : notifications.slice(0, 3)).map((notification) => (
                <div
                  key={notification.id}
                  className={`px-4 py-3 border-b border-gray-100 dark:border-neutral-700 hover:bg-gray-50 dark:hover:bg-neutral-700/50 transition-colors duration-200 cursor-pointer ${!notification.read ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
                  onClick={() => markAsRead(notification.id)}
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-0.5">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                          {notification.title}
                        </p>
                        <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0 ml-2">
                          {formatTimeAgo(notification.timestamp)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 leading-relaxed">
                        {notification.message}
                      </p>                      {notification.userData && (
                        <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-neutral-700 rounded-modern-sm px-2 py-1">
                          Usuario: {notification.userData.nombre} {notification.userData.apellidoPaterno} ({notification.userData.assignedBlock})
                        </div>
                      )}
                      {!notification.read && (
                        <div className="mt-2">
                          <span className="inline-block w-2 h-2 bg-blue-500 rounded-full"></span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-4 py-3 bg-gray-50 dark:bg-neutral-700 text-center border-t border-gray-200 dark:border-neutral-700">
              {!showAllNotifications && notifications.length > 3 ? (
                <button 
                  onClick={() => setShowAllNotifications(true)}
                  className="text-sm text-custom-pink dark:text-custom-gold hover:underline font-medium"
                >
                  Ver todas las notificaciones ({notifications.length})
                </button>
              ) : showAllNotifications ? (
                <button 
                  onClick={() => setShowAllNotifications(false)}
                  className="text-sm text-custom-pink dark:text-custom-gold hover:underline font-medium"
                >
                  Mostrar menos
                </button>
              ) : (
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {notifications.length} {notifications.length === 1 ? 'notificación' : 'notificaciones'}
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Navbar Component
export const Navbar: React.FC = () => {
  const { currentUser, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [adminMenuOpen, setAdminMenuOpen] = useState(false); // Add admin menu state
  const location = useLocation();
  
  // Handle body scroll lock and escape key for mobile sidebar
  useEffect(() => {
    if (menuOpen || adminMenuOpen) {
      // Lock body scroll when sidebar is open
      document.body.style.overflow = 'hidden';
      
      // Handle escape key
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          setMenuOpen(false);
          setAdminMenuOpen(false);
        }
      };
      
      document.addEventListener('keydown', handleEscape);
      
      return () => {
        document.body.style.overflow = 'unset';
        document.removeEventListener('keydown', handleEscape);
      };
    }
  }, [menuOpen, adminMenuOpen]);

  // Close menu when route changes
  useEffect(() => {
    setMenuOpen(false);
    setAdminMenuOpen(false);
  }, [location.pathname]);

  const isSuperAdminPage = currentUser?.role === UserRole.SUPERADMIN && location.pathname.startsWith(ROUTES.DASHBOARD);
    // Determinar si estamos en una página de administración (usado para estilizar link "Dashboard")
  const isAdminPageContext = location.pathname.includes(ROUTES.ADMIN_USERS) ||
                      location.pathname.includes(ROUTES.ADMIN_BLOCKS) ||
                      location.pathname.includes(ROUTES.ADMIN_CALENDAR) ||
                      location.pathname.includes(ROUTES.ADMIN_WHITELIST) ||
                      location.pathname.includes(ROUTES.ADMIN_EMAILS) ||
                      location.pathname.includes(ROUTES.ADMIN_SETTINGS) ||
                      (location.pathname === ROUTES.DASHBOARD && currentUser?.role === UserRole.SUPERADMIN);

  // Enhanced navbar link styles with modern glassmorphism and corner radius
  const navLinkClasses = "text-slate-700 dark:text-neutral-300 hover:text-slate-900 dark:hover:text-neutral-100 px-4 py-2.5 rounded-container-fourth text-sm font-medium transition-all duration-300 ease-apple hover:bg-gray-100/50 dark:hover:bg-neutral-700/30 hover:backdrop-blur-sm";
  const activeNavLinkClasses = "bg-gradient-to-r from-custom-pink/15 to-custom-pink/10 dark:from-custom-pink/25 dark:to-custom-pink/15 text-custom-pink dark:text-custom-pink font-semibold shadow-apple-sm border border-custom-pink/20 dark:border-custom-pink/30 backdrop-blur-sm";  return (
    <nav className="bg-gradient-to-r from-card-bg/95 via-card-bg/90 to-card-bg/95 dark:from-neutral-800/95 dark:via-neutral-800/90 dark:to-neutral-800/95 backdrop-blur-xl shadow-apple-lg sticky top-0 z-50 border-b border-gradient-to-r from-border-gray/20 via-border-gray/40 to-border-gray/20 dark:from-neutral-700/30 dark:via-neutral-700/50 dark:to-neutral-700/30 max-lg:min-h-[4.5rem]">
      <div className={`${isSuperAdminPage ? 'w-full px-4 sm:px-6 lg:px-8' : 'container mx-auto px-4 sm:px-6 lg:px-8'} h-full`}>
        <div className="flex items-center justify-between h-full max-lg:min-h-[4.5rem] py-3">{/* Logo Section with enhanced styling */}
          <div className="flex items-center min-w-0 flex-shrink-0">
            <Link 
              to={currentUser ? ROUTES.DASHBOARD : ROUTES.AUTH} 
              className="flex-shrink-0 hover:scale-105 transition-all duration-300 ease-apple"
              title={APP_NAME}
            >
              {/* Logo Image - Dark image for light mode, Light image for dark mode */}
              <img 
                src="/ETI-01.png" 
                alt={APP_NAME}
                className="h-8 sm:h-10 w-auto hidden dark:block"
              />
              <img 
                src="/ETI-04.png" 
                alt={APP_NAME}
                className="h-8 sm:h-10 w-auto block dark:hidden"
              />
            </Link>
          </div>{/* Desktop Navigation Links - Hide at lg instead of md */}
          <div className="hidden xl:flex items-center">
            <div className="ml-12 flex items-center space-x-1">
              {currentUser && (
                <div className="flex items-center space-x-1 bg-gray-50/50 dark:bg-neutral-700/20 rounded-container-third px-2 py-1 backdrop-blur-sm border border-border-gray/30 dark:border-neutral-600/30">
                  <NavLink 
                    to={ROUTES.DASHBOARD} 
                    className={({isActive}) => `${navLinkClasses} ${isActive && !isAdminPageContext ? activeNavLinkClasses : ''} ${isAdminPageContext ? 'text-custom-pink dark:text-custom-gold font-semibold bg-custom-pink/10 dark:bg-custom-gold/10' : ''}`}
                  >
                    Dashboard
                  </NavLink>
                  {currentUser.role !== UserRole.SUPERADMIN && (
                    <NavLink 
                      to={ROUTES.VIEW_CANDIDATES} 
                      className={({isActive}) => `${navLinkClasses} ${isActive ? activeNavLinkClasses : ''}`}
                    >
                      Candidatos
                    </NavLink>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Notifications Bell - Desktop - Hide at lg instead of md */}
          {currentUser && (
            <div className="hidden xl:flex items-center ml-4">
              <NotificationBell />
            </div>
          )}

          {/* User Section with enhanced layout - Hide at lg instead of md */}
          <div className="hidden xl:flex items-center">
            {currentUser ? (
              <div className="flex items-center space-x-4 bg-gray-50/40 dark:bg-neutral-700/20 rounded-container-third px-4 py-2 backdrop-blur-sm border border-border-gray/30 dark:border-neutral-600/30">
                {!isSuperAdminPage && <ThemeSwitcher className=""/>}
                
                {/* User Info Section */}
                <div className="flex items-center space-x-3">
                  <div className="text-right hidden 2xl:block">
                    <div className={`text-sm font-semibold ${isAdminPageContext ? "text-custom-pink dark:text-custom-gold" : "text-text-primary dark:text-neutral-100"}`}>
                      {currentUser.nombre}
                    </div>
                    <div className="text-xs text-text-tertiary dark:text-neutral-400">
                      {currentUser.role === UserRole.SUPERADMIN ? 'Super Admin' : 'Usuario'}
                    </div>
                  </div>
                  
                  <div className="relative">
                    <img 
                      className="h-11 w-11 rounded-container-fourth object-cover border-2 border-gray-200/70 dark:border-neutral-600/70 shadow-apple-sm hover:border-custom-pink dark:hover:border-custom-gold hover:shadow-apple-md transition-all duration-300 ease-apple hover:scale-105" 
                      src={currentUser.profilePicUrl || `${DEFAULT_PROFILE_PIC_BASE_URL}${encodeURIComponent(currentUser.nombre + ' ' + currentUser.apellidoPaterno)}`} 
                      alt="Perfil" 
                    />
                    <div className="absolute -top-1 -right-1 h-4 w-4 bg-green-400 dark:bg-green-500 rounded-full border-2 border-card-bg dark:border-neutral-800 shadow-sm"></div>
                  </div>
                </div>

                {!isSuperAdminPage && (
                  <div className="h-8 w-px bg-border-gray/40 dark:bg-neutral-600/40"></div>
                )}
                  {!isSuperAdminPage && (
                  <Button 
                    onClick={logout} 
                    variant="ghost" 
                    size="sm" 
                    className="!text-slate-500 dark:!text-slate-400 hover:!text-red-600 dark:hover:!text-red-400 hover:!bg-red-50 dark:hover:!bg-red-900/20 rounded-container-fourth px-3 py-2 transition-all duration-300 hover:scale-105 focus:ring-2 focus:ring-red-500/30 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-neutral-800"
                  >
                    <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Salir
                  </Button>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-4 bg-gray-50/40 dark:bg-neutral-700/20 rounded-container-third px-4 py-2 backdrop-blur-sm border border-border-gray/30 dark:border-neutral-600/30">
                <ThemeSwitcher className=""/>
                <div className="h-6 w-px bg-border-gray/40 dark:bg-neutral-600/40"></div>
                <NavLink 
                  to={ROUTES.AUTH} 
                  className={({isActive}) => `${navLinkClasses} ${isActive ? activeNavLinkClasses : ''} px-6`}
                >
                  <svg className="w-4 h-4 mr-2 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                  Iniciar Sesión
                </NavLink>
              </div>
            )}
          </div>          {/* Mobile menu button with enhanced styling - Show at xl and below */}
          <div className="flex xl:hidden items-center space-x-3">
            {isSuperAdminPage ? (
              // Admin hamburger button
              <button
                onClick={() => setAdminMenuOpen(!adminMenuOpen)}
                type="button"
                className="spectra-icon-btn bg-slate-100/80 dark:bg-slate-700/80 inline-flex items-center justify-center p-2.5 rounded-container-fourth text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-slate-100 hover:bg-slate-200/90 dark:hover:bg-slate-600/90 transition-all duration-300 ease-apple backdrop-blur-sm border border-slate-200/60 dark:border-slate-600/40 hover:border-slate-300/80 dark:hover:border-slate-500/80 focus:outline-none focus:ring-4 focus:ring-slate-300/40 dark:focus:ring-slate-600/40 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-neutral-800"
                aria-controls="admin-mobile-menu"
                aria-expanded={adminMenuOpen}
              >
                <span className="sr-only">Abrir menú de administración</span>
                {!adminMenuOpen ? (
                  <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                  </svg>
                ) : (
                  <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
              </button>
            ) : !isSuperAdminPage && (
              // Regular user hamburger button
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                type="button"
                className="spectra-icon-btn bg-slate-100/80 dark:bg-slate-700/80 inline-flex items-center justify-center p-2.5 rounded-container-fourth text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-slate-100 hover:bg-slate-200/90 dark:hover:bg-slate-600/90 transition-all duration-300 ease-apple backdrop-blur-sm border border-slate-200/60 dark:border-slate-600/40 hover:border-slate-300/80 dark:hover:border-slate-500/80 focus:outline-none focus:ring-4 focus:ring-slate-300/40 dark:focus:ring-slate-600/40 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-neutral-800"
                aria-controls="mobile-menu"
                aria-expanded={menuOpen}
              >
                <span className="sr-only">Abrir menú principal</span>
                {!menuOpen ? (
                  <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                  </svg>
                ) : (
                  <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}              </button>
            )}
          </div>
        </div>
      </div>      {/* Mobile Menus */}      {/* Admin Mobile Menu */}
      {adminMenuOpen && (
        <div className="fixed top-0 left-0 right-0 bottom-0 z-40 xl:hidden">
          <div className={`mobile-sidebar-overlay ${adminMenuOpen ? 'visible' : ''}`} onClick={() => setAdminMenuOpen(false)} />
          <div className={`w-[320px] admin-mobile-sidebar-menu ${adminMenuOpen ? 'open' : ''}`}>
            <AdminSidebar isOpen={adminMenuOpen} closeSidebar={() => setAdminMenuOpen(false)} />
          </div>
        </div>
      )}
      
      {/* Regular User Mobile Menu */}
      {menuOpen && !isSuperAdminPage && (
        <div className="fixed top-0 left-0 right-0 bottom-0 z-40 xl:hidden">
          <div className={`mobile-sidebar-overlay ${menuOpen ? 'visible' : ''}`} onClick={() => setMenuOpen(false)} />          <div className={`w-80 bg-white/95 dark:bg-neutral-800/95 backdrop-blur-xl shadow-spectra-xl border-r border-gray-200/80 dark:border-neutral-700/80 mobile-sidebar-menu ${menuOpen ? 'open' : ''}`}>
            <div className="p-6 h-full flex flex-col pt-6 max-lg:pt-6">{/* Asegurar que el contenido empiece después del padding superior */}
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Menú</h3>
                <button
                  onClick={() => setMenuOpen(false)}
                  className="p-2 rounded-container-fourth text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100/60 dark:hover:bg-slate-700/60 transition-all duration-300"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              {/* Navigation Links */}
              {currentUser && (
                <div className="space-y-2 mb-6">
                  <NavLink 
                    to={ROUTES.DASHBOARD} 
                    className={({isActive}) => `block ${navLinkClasses} ${isActive ? activeNavLinkClasses : ''} px-4 py-3`}
                    onClick={() => setMenuOpen(false)}
                  >
                    Dashboard
                  </NavLink>
                  {currentUser.role !== UserRole.SUPERADMIN && (
                    <NavLink 
                      to={ROUTES.VIEW_CANDIDATES} 
                      className={({isActive}) => `block ${navLinkClasses} ${isActive ? activeNavLinkClasses : ''} px-4 py-3`}
                      onClick={() => setMenuOpen(false)}
                    >
                      Candidatos
                    </NavLink>
                  )}
                </div>
              )}
              
              {/* User Section or Auth */}
              <div className="mt-auto">
                {currentUser ? (
                  <div className="border-t border-gray-200/60 dark:border-neutral-700/60 pt-6">
                    <div className="flex items-center space-x-3 mb-4">
                      <img 
                        className="h-10 w-10 rounded-container-fourth object-cover border-2 border-gray-200/70 dark:border-neutral-600/70" 
                        src={currentUser.profilePicUrl || `${DEFAULT_PROFILE_PIC_BASE_URL}${encodeURIComponent(currentUser.nombre + ' ' + currentUser.apellidoPaterno)}`} 
                        alt="Perfil" 
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                          {currentUser.nombre} {currentUser.apellidoPaterno}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                          {currentUser.assignedBlock}
                        </p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <ThemeSwitcher />
                      <Button 
                        onClick={() => { logout(); setMenuOpen(false); }} 
                        variant="ghost" 
                        size="sm" 
                        fullWidth
                        className="justify-center"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Salir
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="border-t border-gray-200/60 dark:border-neutral-700/60 pt-6">
                    <ThemeSwitcher className="mb-4" />
                    <NavLink 
                      to={ROUTES.AUTH} 
                      className={({isActive}) => `block ${navLinkClasses} ${isActive ? activeNavLinkClasses : ''} px-4 py-3 text-center`}
                      onClick={() => setMenuOpen(false)}
                    >
                      <svg className="w-4 h-4 mr-2 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                      </svg>
                      Iniciar Sesión
                    </NavLink>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

// LoadingSpinner Component
interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: string; 
  className?: string;
}
export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ size = 'md', color = 'text-custom-pink', className }) => {
  const sizeClasses = {
    sm: 'w-5 h-5 border-2',
    md: 'w-8 h-8 border-[3px]',
    lg: 'w-12 h-12 border-4',
  };
  return (
    <div className={`animate-spin rounded-full border-solid border-t-transparent ${sizeClasses[size]} ${color} ${className || ''}`} role="status">
      <span className="sr-only">Cargando...</span>
    </div>
  );
};

// CameraCaptureModal Component
interface CameraCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (base64Image: string) => void;
}
export const CameraCaptureModal: React.FC<CameraCaptureModalProps> = ({ isOpen, onClose, onCapture }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [hasStream, setHasStream] = useState<boolean>(false);

  const startCamera = useCallback(async () => {
    setError(null);
    setHasStream(false);

    if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
    }
    if (videoRef.current && videoRef.current.srcObject) {
        (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
        videoRef.current.srcObject = null;
    }

    try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false });
        streamRef.current = mediaStream;

        if (videoRef.current) {
            videoRef.current.srcObject = mediaStream;
            videoRef.current.muted = true; 
            
            await videoRef.current.play();
            setHasStream(true);

        } else {
            setError("Referencia del elemento de video no disponible.");
            streamRef.current?.getTracks().forEach(track => track.stop());
            streamRef.current = null;
            setHasStream(false);
        }
    } catch (err) {
        console.error("Error accessing camera or playing video:", err);
        if (err instanceof Error) {
            if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
                setError("Permiso de cámara denegado. Por favor, habilita el acceso a la cámara en la configuración de tu navegador.");
            } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
                setError("No se encontró ninguna cámara. Asegúrate de que una cámara esté conectada y habilitada.");
            } else if (err.name === "AbortError" || err.name === "NotReadableError") {
                 setError("La cámara está ocupada o no se pudo leer. Intenta cerrar otras aplicaciones que puedan estar usándola o refresca la página.");
            } else if (err.name === "OverconstrainedError") {
                 setError("No se pudo satisfacer la resolución de video solicitada. Intenta con otra configuración o cámara.");
            }
            else {
                setError(`Error al acceder a la cámara: ${err.message}. Inténtalo de nuevo.`);
            }
        } else {
            setError("Un error desconocido ocurrió al acceder a la cámara.");
        }
        streamRef.current?.getTracks().forEach(track => track.stop());
        streamRef.current = null;
        setHasStream(false);
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.srcObject = null;
    }
    setHasStream(false);
  }, []);

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera(); 
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, startCamera, stopCamera]);

  const handleCapture = () => {
    if (videoRef.current && canvasRef.current && streamRef.current && hasStream) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const aspectRatio = video.videoWidth / video.videoHeight;
      const maxWidth = 800; 
      canvas.width = Math.min(video.videoWidth, maxWidth);
      canvas.height = canvas.width / aspectRatio;

      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const base64Image = canvas.toDataURL('image/jpeg', 0.9);
        onCapture(base64Image);
        onClose(); 
      }
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Tomar Foto de Perfil" size="lg" zIndex="z-[100]">
      <div className="space-y-4">
        {error && <Alert type="error" message={error} />}
        <div className="relative w-full aspect-[16/9] bg-neutral-800 dark:bg-black rounded-container-third overflow-hidden">
           <video ref={videoRef} playsInline className="w-full h-full object-cover" />
           {!hasStream && !error && <div className="absolute inset-0 flex items-center justify-center"><LoadingSpinner color="text-white" /></div>}
        </div>
        <canvas ref={canvasRef} style={{ display: 'none' }} />
        <div className="flex justify-center space-x-3 pt-2">
          <Button onClick={onClose} variant="secondary" className="spectra-btn-secondary-enhanced">Cancelar</Button>
          <Button onClick={handleCapture} disabled={!hasStream || !!error} className="spectra-btn-primary-enhanced spectra-btn-cta-pulse">Capturar Foto</Button>
        </div>
      </div>
    </Modal>
  );
};


// FileUploadInput
interface FileUploadInputProps {
  label: string;
  value: string; 
  onChange: (base64DataUri: string) => void;
  name: string;
  error?: string;
  defaultUserName?: string;
}
export const FileUploadInput: React.FC<FileUploadInputProps> = ({ label, value, onChange, name, error, defaultUserName = "Usuario" }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [internalError, setInternalError] = useState<string | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInternalError(null);
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { 
        setInternalError("El archivo es demasiado grande. El límite es 5MB.");
        return;
      }
      if (!file.type.startsWith('image/')) {
        setInternalError("Tipo de archivo no válido. Por favor, selecciona una imagen.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        onChange(reader.result as string);
      };
      reader.onerror = () => {
        setInternalError("Error al leer el archivo.");
      }
      reader.readAsDataURL(file);
    }
  };

  const handleTakePhotoClick = () => {
    setInternalError(null);
    setShowCameraModal(true);
  };

  const handleCapturePhoto = (base64Image: string) => {
    onChange(base64Image);
    setShowCameraModal(false);
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };
  
  const imageSrc = value || `${DEFAULT_PROFILE_PIC_BASE_URL}${encodeURIComponent(defaultUserName)}`;
  return (
    <div className="w-full">
      {label && <label className="block text-sm font-semibold text-slate-900 dark:text-slate-100 mb-2">{label}</label>}
      <div className="flex flex-col items-center space-y-4">
        <div className="w-36 h-36 rounded-full overflow-hidden shadow-apple-md border-4 border-white dark:border-neutral-700">
            <img 
            src={imageSrc} 
            alt="Vista previa de perfil" 
            className="w-full h-full object-cover" 
            onError={(e) => { 
                const target = e.target as HTMLImageElement;
                target.onerror = null; 
                target.src = `${DEFAULT_PROFILE_PIC_BASE_URL}${encodeURIComponent(defaultUserName)}`;
            }}
            />
        </div>
        <div className="flex space-x-2">
          <Button type="button" variant="secondary" size="sm" onClick={triggerFileInput}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 mr-1.5">
              <path fillRule="evenodd" d="M9.25 13.25a.75.75 0 001.5 0V4.636l2.955 3.129a.75.75 0 001.09-1.03l-4.25-4.5a.75.75 0 00-1.09 0l-4.25 4.5a.75.75 0 101.09 1.03L9.25 4.636v8.614z" clipRule="evenodd" />
              <path d="M3.5 12.75a.75.75 0 00-1.5 0v2.5A2.75 2.75 0 004.75 18h10.5A2.75 2.75 0 0018 15.25v-2.5a.75.75 0 00-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5z" />
            </svg>
            Subir Archivo
          </Button>
          <Button type="button" variant="secondary" size="sm" onClick={handleTakePhotoClick}>
             <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 mr-1.5">
                <path fillRule="evenodd" d="M1 8a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 018.07 3h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0016.07 6H17a2 2 0 012 2v7a2 2 0 01-2 2H3a2 2 0 01-2-2V8zm13.5 3a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM10 14a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
             </svg>
            Tomar Foto
          </Button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          name={name}
          accept="image/png, image/jpeg, image/gif, image/webp"
          onChange={handleFileChange}
          className="hidden"
          aria-hidden="true"
        />
      </div>
      {(error || internalError) && <p className="mt-2 text-sm font-medium text-red-700 dark:text-red-400 text-center">{error || internalError}</p>}
      <CameraCaptureModal
        isOpen={showCameraModal}
        onClose={() => setShowCameraModal(false)}
        onCapture={handleCapturePhoto}
      />
    </div>
  );
};

// Card Component
interface CardProps {
  children: ReactNode;
  className?: string;
  title?: string | ReactNode;
  actions?: ReactNode;
  padding?: 'sm' | 'md' | 'none';
}
export const Card: React.FC<CardProps> = ({ children, className, title, actions, padding = 'md' }) => {
  const paddingClasses = {
    sm: 'p-4',
    md: 'p-5 sm:p-6',
    none: '',
  };  return (
    <div className={`bg-card-bg dark:bg-neutral-800 shadow-apple-md rounded-container-third border border-slate-200/40 dark:border-neutral-700/40 ${className || ''}`}>
      {(title || actions) && (
        <div className="px-5 sm:px-6 py-4 border-b border-border-gray/50 dark:border-neutral-700/50 flex justify-between items-center">
          {typeof title === 'string' ? <h2 className="text-lg font-semibold text-text-primary dark:text-custom-gold">{title}</h2> : title}
          {actions && <div className="flex space-x-2 items-center">{actions}</div>}
        </div>
      )}
      <div className={paddingClasses[padding]}>
        {children}
      </div>
    </div>
  );
};

// Alert Component
interface AlertProps {
  type: 'success' | 'error' | 'warning' | 'info';
  message: string | ReactNode;
  onClose?: () => void;
  className?: string; 
  title?: string;
}
export const Alert: React.FC<AlertProps> = ({ type, message, onClose, className = '', title }) => {
  // Base light mode classes
  const lightTypeClasses = {
    success: "bg-success-bg text-success-text border-success-text/30",
    error: "bg-error-bg text-error-text border-error-text/30",
    warning: "bg-warning-bg text-warning-text border-warning-text/30",
    info: "bg-info-bg text-info-text border-info-text/30",
  };
  // Dark mode specific classes
  const darkTypeClasses = {
    success: "dark:bg-green-800/30 dark:text-green-300 dark:border-green-500/40",
    error: "dark:bg-red-800/30 dark:text-red-300 dark:border-red-500/40",
    warning: "dark:bg-orange-800/30 dark:text-orange-300 dark:border-orange-500/40", 
    info: "dark:bg-custom-pink/30 dark:text-pink-300 dark:border-pink-300/40",
  };

  const lightIconColorClasses = {
    success: "text-success-text",
    error: "text-error-text",
    warning: "text-warning-text",
    info: "text-info-text", // Uses info-text from Tailwind config
  };
  const darkIconColorClasses = {
    success: "dark:text-green-400",
    error: "dark:text-red-400",
    warning: "dark:text-orange-400",
    info: "dark:text-pink-300", // Uses pink-300 from Tailwind config
  }

  const iconPaths = {
     success: "M9 12.75L11.25 15L15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z", 
     error: "M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z", 
     warning: "M10.26 3.21A1.028 1.028 0 0112 2.25a1.028 1.028 0 011.74.96l-.001.002-1.512 7.562a1.028 1.028 0 01-1.02 1.02H10.79a1.028 1.028 0 01-1.02-1.02L8.258 3.212l.002-.002A1.028 1.028 0 0110.26 3.21zM12 17a1 1 0 100-2 1 1 0 000 2z",
     info: "M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z",
  };
  
  const combinedTypeClasses = `${lightTypeClasses[type]} ${darkTypeClasses[type]}`;
  const combinedIconColorClasses = `${lightIconColorClasses[type]} ${darkIconColorClasses[type]}`;

  const closeButtonHoverBg = {
    success: "hover:bg-success-text/20 dark:hover:bg-green-400/20",
    error: "hover:bg-error-text/20 dark:hover:bg-red-400/20",
    warning: "hover:bg-warning-text/20 dark:hover:bg-orange-400/20",
    info: "hover:bg-info-text/20 dark:hover:bg-pink-300/20",
  }
  const closeButtonFocusRing = {
    success: "focus:ring-success-text dark:focus:ring-green-400",
    error: "focus:ring-error-text dark:focus:ring-red-400",
    warning: "focus:ring-warning-text dark:focus:ring-orange-400",
    info: "focus:ring-info-text dark:focus:ring-pink-300",
  }

  return (
    <div className={`p-4 mb-4 rounded-container-third border flex items-start ${combinedTypeClasses} ${className}`} role="alert">
        <svg className={`w-5 h-5 inline mr-3 flex-shrink-0 ${combinedIconColorClasses}`} fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" d={iconPaths[type]}></path>
        </svg>
      <div className="flex-grow">
        {title && <h5 className="font-semibold mb-0.5 text-text-primary dark:text-inherit">{title}</h5>}
        <span className="text-sm text-text-secondary dark:text-inherit">{message}</span>
      </div>
      {onClose && (
        <button
          type="button"
          className={`ml-auto -mx-1.5 -my-1.5 rounded-full focus:ring-2 p-1.5 inline-flex h-8 w-8 ${combinedIconColorClasses} ${closeButtonHoverBg[type]} ${closeButtonFocusRing[type]}`}
          onClick={onClose}
          aria-label="Cerrar"
        >
          <span className="sr-only">Cerrar</span>
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path></svg>
        </button>
      )}
    </div>
  );
};


// PageTitle Component
export const PageTitle: React.FC<{ title: string; subtitle?: string, actions?: ReactNode }> = ({ title, subtitle, actions }) => (
  <div className="mb-6 md:mb-8 pb-4 border-b border-border-gray/50 dark:border-neutral-700/50"> {/* Changed md:mb-10 to md:mb-8 */}
    <div className="flex flex-col sm:flex-row justify-between sm:items-center">
        <div>
            <h1 className="text-3xl md:text-4xl font-bold text-text-primary dark:text-custom-gold tracking-tight">{title}</h1>
            {subtitle && <p className="text-text-secondary dark:text-neutral-400 mt-1.5 text-lg">{subtitle}</p>}
        </div>
        {actions && <div className="mt-4 sm:mt-0">{actions}</div>}
    </div>
  </div>
);

// ConfirmationModal Component
interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string | ReactNode;
  confirmText?: string;
  cancelText?: string;
  confirmButtonVariant?: ButtonProps['variant'];
  isLoading?: boolean;
}
export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  confirmButtonVariant = 'primary',
  isLoading = false,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="md">
      <div className="text-sm text-text-secondary dark:text-neutral-300 mb-6">{message}</div>
      <div className="flex justify-end space-x-3">
        <Button variant="secondary" onClick={onClose} disabled={isLoading}>
          {cancelText}
        </Button>
        <Button variant={confirmButtonVariant} onClick={onConfirm} isLoading={isLoading} disabled={isLoading}>
                   {confirmText}
        </Button>
      </div>
    </Modal>
  );
};

// ProgressStepper Component
interface ProgressStepperProps {
  totalSteps: number;
  currentStep: number; // 1-indexed, indicates the overall active phase of the election
  stepTitles?: string[]; 
  stepDetails?: (string | React.ReactNode)[]; 
  stepVisualOverrides?: Array<'completed' | 'rejected' | null>; // Allows per-step visual state override
}
export const ProgressStepper: React.FC<ProgressStepperProps> = ({ 
  totalSteps, 
  currentStep, 
  stepTitles, 
  stepDetails,
  stepVisualOverrides 
}) => {
  const steps = Array.from({ length: totalSteps }, (_, i) => i + 1);
  const [expandedStep, setExpandedStep] = useState<number | null>(null);
  const [popoverHorizontalShifts, setPopoverHorizontalShifts] = useState<Record<number, number>>({});
  const stepperContainerRef = useRef<HTMLDivElement>(null);


  useEffect(() => {
    if (expandedStep !== null && stepperContainerRef.current) {
      const popoverDiv = document.getElementById(`step-detail-${expandedStep}`);
      const anchorButton = document.getElementById(`step-button-${expandedStep}`);

      if (popoverDiv && anchorButton && stepperContainerRef.current) {
        const anchorContainer = anchorButton.parentElement; 
        if (!anchorContainer) return;

        requestAnimationFrame(() => {
          if (!stepperContainerRef.current || !popoverDiv || !anchorContainer) return;

          const stepperRect = stepperContainerRef.current.getBoundingClientRect();
          const anchorContainerRect = anchorContainer.getBoundingClientRect(); 
          const popoverWidth = popoverDiv.offsetWidth;

          let shift = 0;
          const projectedPopoverLeftInViewport = anchorContainerRect.left + (anchorContainerRect.width - popoverWidth) / 2;
          const projectedPopoverRightInViewport = projectedPopoverLeftInViewport + popoverWidth;

          if (projectedPopoverLeftInViewport < stepperRect.left) {
            shift = stepperRect.left - projectedPopoverLeftInViewport; 
          } else if (projectedPopoverRightInViewport > stepperRect.right) {
            shift = stepperRect.right - projectedPopoverRightInViewport; 
          }
          
          setPopoverHorizontalShifts(prev => ({ ...prev, [expandedStep]: shift }));
        });
      }
    }
  }, [expandedStep]);


  const toggleExpand = (stepNumber: number) => {
    const newExpandedStep = expandedStep === stepNumber ? null : stepNumber;
    setExpandedStep(newExpandedStep);
  };
    return (
    <div className="w-full p-4 bg-pink-50/80 dark:bg-[#3a2d0f]/40 rounded-container-third border border-pink-200/50 dark:border-[#3a2d0f]/60" ref={stepperContainerRef}>
      <div className="flex items-start justify-between">
        {steps.map((step, index) => {
          const visualOverride = stepVisualOverrides?.[index];
          
          const isGloballyActive = step === currentStep;          const isVisuallyCompleted = visualOverride === 'completed' || (!visualOverride && step < currentStep && !isGloballyActive);
          const isVisuallyRejected = visualOverride === 'rejected';
          const isVisuallyActive = isGloballyActive && !visualOverride; // Active ring if globally active AND no override

          let circleClasses = "w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300 ease-apple relative";
          let circleContent;
          let labelTextColorClass;
          let labelFontWeightClass;
          let lineAfterColorClass;

          if (isVisuallyRejected) {
            circleClasses += " bg-gray-200 dark:bg-neutral-600 border-2 border-gray-400 dark:border-neutral-500 text-gray-600 dark:text-neutral-300";
            circleContent = (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            );
            labelTextColorClass = "text-gray-600 dark:text-neutral-400";
            labelFontWeightClass = "font-medium";
            lineAfterColorClass = "bg-gray-300 dark:bg-neutral-500/40"; // Line after rejected is pending/dim
          } else if (isVisuallyCompleted) {            circleClasses += " bg-custom-pink dark:bg-[#a57f2c] border-2 border-custom-pink dark:border-[#a57f2c] text-white shadow-md";
            circleContent = (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="white" className="w-5 h-5">
                <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
              </svg>
            );
            labelTextColorClass = "text-custom-pink dark:text-[#a57f2c]";
            labelFontWeightClass = "font-bold";
            lineAfterColorClass = "bg-custom-pink dark:bg-[#a57f2c]";
          } else if (isVisuallyActive) {            circleClasses += " bg-custom-pink dark:bg-[#a57f2c] text-white ring-4 ring-custom-pink/40 dark:ring-[#a57f2c]/40 ring-offset-2 ring-offset-pink-100 dark:ring-offset-[#3a2d0f] shadow-lg";
            circleContent = <span className="text-white">{step}</span>;
            labelTextColorClass = "text-custom-pink dark:text-[#a57f2c]";
            labelFontWeightClass = "font-bold";
            lineAfterColorClass = "bg-custom-pink dark:bg-[#a57f2c]"; // Line after active step is also "active" color          } else {
            // Pending state            circleClasses += " bg-custom-pink dark:bg-neutral-700 border-2 border-custom-pink dark:border-[#a57f2c] text-white shadow-sm";
            circleContent = <span className="text-white">{step}</span>;
            labelTextColorClass = "text-custom-pink/90 dark:text-[#a57f2c]/90";
            labelFontWeightClass = "font-medium";
            lineAfterColorClass = "bg-pink-300/80 dark:bg-[#a57f2c]/50";
          }
          
          const titleText = stepTitles && stepTitles[index] ? stepTitles[index] : `Paso ${step}`;
          const detailContent = stepDetails && stepDetails[index] ? stepDetails[index] : null;
          
          const currentPopoverShift = (expandedStep === step && popoverHorizontalShifts[step]) ? popoverHorizontalShifts[step] : 0;
          const transformValue = `scale(${expandedStep === step ? 1 : 0.95}) translateY(${expandedStep === step ? '0px' : '-5px'}) translateX(calc(-50% + ${currentPopoverShift}px))`;

          return (
            <React.Fragment key={step}>
              <div className="flex flex-col items-center text-center group relative">
                 <button
                    type="button"
                    className="flex flex-col items-center focus:outline-none group rounded-container-fourth apple-focus-ring p-1"
                    onClick={() => toggleExpand(step)}
                    aria-expanded={expandedStep === step}
                    aria-controls={`step-detail-${step}`}
                    id={`step-button-${step}`}
                  >
                    <div className={circleClasses} aria-hidden="true">
                      {circleContent}
                    </div>
                    <span className={`text-xs mt-2 w-24 truncate ${labelTextColorClass} ${labelFontWeightClass}`}>
                      {titleText}
                    </span>
                  </button>

                  {detailContent && (
                    <div
                      id={`step-detail-${step}`}
                      role="region"
                      aria-labelledby={`step-button-${step}`}
                      className="absolute top-full left-1/2 mt-1 w-64 sm:w-72 p-3 bg-white/95 dark:bg-neutral-700/95 rounded-container-fourth shadow-apple-lg border border-slate-200/60 dark:border-neutral-600/60 text-xs text-slate-700 dark:text-neutral-200 text-left z-10 backdrop-blur-sm"
                      style={{
                        maxHeight: expandedStep === step ? '200px' : '0px', 
                        opacity: expandedStep === step ? 1 : 0,
                        transform: transformValue,
                        transition: 'max-height 0.3s ease-out, opacity 0.2s ease-out, transform 0.2s ease-out',
                        overflow: 'hidden', 
                        pointerEvents: expandedStep === step ? 'auto' : 'none',
                      }}
                    >
                      {typeof detailContent === 'string' ? <div className="whitespace-pre-line">{detailContent}</div> : detailContent}
                    </div>
                  )}
              </div>
              {index < steps.length - 1 && (
                <div className={`flex-1 h-1 mt-3.5 transition-colors duration-300 ease-apple ${lineAfterColorClass}`}></div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

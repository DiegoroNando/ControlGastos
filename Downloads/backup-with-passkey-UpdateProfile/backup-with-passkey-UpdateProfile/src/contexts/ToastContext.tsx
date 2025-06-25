import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import ToastNotification, { ToastData, ToastType } from '../components/common/ToastNotification';

interface ToastContextValue {
  showToast: (
    type: ToastType,
    message: string,
    options?: {
      title?: string;
      duration?: number;
      action?: {
        label: string;
        onClick: () => void;
      };
    }
  ) => void;
  success: (message: string, options?: { title?: string; duration?: number }) => void;
  error: (message: string, options?: { title?: string; duration?: number }) => void;
  info: (message: string, options?: { title?: string; duration?: number }) => void;
  warning: (message: string, options?: { title?: string; duration?: number }) => void;
  clearAll: () => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

interface ToastProviderProps {
  children: ReactNode;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastData[]>([]);
  const [recentToasts, setRecentToasts] = useState<Set<string>>(new Set());

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);
  // Clear recent toasts cache every 3 seconds to allow showing the same message again after a delay
  useEffect(() => {
    const interval = setInterval(() => {
      setRecentToasts(new Set());
    }, 3000);
    return () => clearInterval(interval);
  }, []);const showToast = useCallback((
    type: ToastType,
    message: string,
    options?: {
      title?: string;
      duration?: number;
      action?: {
        label: string;
        onClick: () => void;
      };
    }
  ) => {
    // Create a unique key for duplicate detection
    const messageKey = `${type}-${message}-${options?.title || ''}`;
    
    // Check if this exact message was recently shown
    if (recentToasts.has(messageKey)) {
      return; // Don't show duplicate
    }

    // Generate a more unique ID to prevent duplicates
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
    const newToast: ToastData = {
      id,
      type,
      message,
      title: options?.title,
      duration: options?.duration ?? (type === 'error' ? 8000 : 5000), // Errors stay longer
      action: options?.action,
    };

    // Add to recent toasts cache
    setRecentToasts(prev => new Set([...prev, messageKey]));

    setToasts(prev => {
      // Limit to 5 toasts max
      const filtered = prev.slice(-4);
      return [...filtered, newToast];
    });
  }, [recentToasts]);

  const success = useCallback((message: string, options?: { title?: string; duration?: number }) => {
    showToast('success', message, options);
  }, [showToast]);

  const error = useCallback((message: string, options?: { title?: string; duration?: number }) => {
    showToast('error', message, options);
  }, [showToast]);

  const info = useCallback((message: string, options?: { title?: string; duration?: number }) => {
    showToast('info', message, options);
  }, [showToast]);

  const warning = useCallback((message: string, options?: { title?: string; duration?: number }) => {
    showToast('warning', message, options);
  }, [showToast]);

  const clearAll = useCallback(() => {
    setToasts([]);
  }, []);

  const value: ToastContextValue = {
    showToast,
    success,
    error,
    info,
    warning,
    clearAll,
  };
  return (
    <ToastContext.Provider value={value}>
      {children}
      {/* Render toasts */}
      <div className="fixed top-0 right-0 z-[9999] pointer-events-none p-4">        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="pointer-events-auto mb-3"
          ><ToastNotification
              toast={toast}
              onClose={removeToast}
            />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextValue => {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

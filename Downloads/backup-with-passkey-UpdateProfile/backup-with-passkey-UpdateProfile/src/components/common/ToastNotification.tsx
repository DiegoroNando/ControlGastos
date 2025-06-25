import React, { useEffect, useState } from 'react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastData {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ToastNotificationProps {
  toast: ToastData;
  onClose: (id: string) => void;
}

const ToastNotification: React.FC<ToastNotificationProps> = ({ toast, onClose }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Trigger entrance animation
    const timer = setTimeout(() => setIsVisible(true), 10);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (toast.duration && toast.duration > 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, toast.duration);
      return () => clearTimeout(timer);
    }
  }, [toast.duration]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      onClose(toast.id);
    }, 300); // Match exit animation duration
  };

  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return (
          <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        );
      case 'error':
        return (
          <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        );
      case 'warning':
        return (
          <svg className="w-5 h-5 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.1 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        );
      case 'info':
      default:
        return (
          <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  const getColorClasses = () => {
    switch (toast.type) {
      case 'success':
        return 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/50';
      case 'error':
        return 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/50';
      case 'warning':
        return 'border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/50';
      case 'info':
      default:
        return 'border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/50';
    }
  };  return (
    <div
      className={`
        relative max-w-sm w-full
        transform transition-all duration-300 ease-out
        ${isVisible && !isExiting 
          ? 'translate-x-0 opacity-100 scale-100' 
          : 'translate-x-64 opacity-0 scale-95'
        }
      `}
      style={{
        transformOrigin: 'right center',
      }}
    >
      <div        className={`
          relative rounded-2xl border backdrop-blur-xl
          ${getColorClasses()}
          p-4 shadow-2xl
        `}
        style={{
          background: toast.type === 'success' 
            ? 'rgba(34, 197, 94, 0.1)' 
            : toast.type === 'error' 
              ? 'rgba(239, 68, 68, 0.1)' 
              : toast.type === 'warning' 
                ? 'rgba(245, 158, 11, 0.1)' 
                : 'rgba(59, 130, 246, 0.1)',
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        }}
      >
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-2 right-2 p-1 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
          aria-label="Cerrar notificación"
        >
          <svg className="w-4 h-4 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="flex items-start space-x-3 pr-6">
          {/* Icon */}
          <div className="flex-shrink-0 mt-0.5">
            <div className="p-1 rounded-full bg-white/50 dark:bg-black/20">
              {getIcon()}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {toast.title && (
              <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">
                {toast.title}
              </h4>
            )}
            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
              {toast.message}
            </p>
            
            {toast.action && (
              <button
                onClick={toast.action.onClick}
                className="mt-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
              >
                {toast.action.label}
              </button>
            )}
          </div>
        </div>        {/* Progress bar for timed toasts */}
        {toast.duration && toast.duration > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/5 dark:bg-white/10 rounded-b-2xl overflow-hidden">
            <div
              className={`h-full rounded-b-2xl ${
                toast.type === 'success' ? 'bg-green-500' :
                toast.type === 'error' ? 'bg-red-500' :
                toast.type === 'warning' ? 'bg-amber-500' :
                'bg-blue-500'
              } opacity-60`}
              style={{
                animation: `toast-progress ${toast.duration}ms linear forwards`,
                transformOrigin: 'left center'
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default ToastNotification;

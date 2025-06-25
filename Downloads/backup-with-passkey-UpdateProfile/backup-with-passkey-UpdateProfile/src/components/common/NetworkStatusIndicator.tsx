import React, { useState, useEffect } from 'react';
import useNetworkStatus from '../../hooks/useNetworkStatus';

interface NetworkStatusIndicatorProps {
  showDetails?: boolean;
  className?: string;
}

/**
 * Componente que muestra el estado actual de la red
 */
const NetworkStatusIndicator: React.FC<NetworkStatusIndicatorProps> = ({
  showDetails = false,
  className = '',
}) => {
  const { isOnline, isSlowConnection, connectionType, connectionSpeed } = useNetworkStatus({
    showNotifications: true,
  });
  
  const [visible, setVisible] = useState(false);
  
  // Solo mostrar cuando esté offline o cuando se soliciten detalles
  useEffect(() => {
    if (!isOnline || showDetails) {
      setVisible(true);
    } else {
      // Si volvemos online, esperar un poco antes de ocultar
      const timeout = setTimeout(() => {
        setVisible(false);
      }, 3000);
      
      return () => clearTimeout(timeout);
    }
  }, [isOnline, showDetails]);
  
  if (!visible) return null;
  
  return (
    <div 
      className={`fixed bottom-4 left-4 rounded-container-third shadow-apple-md px-3 py-2 transition-all duration-300 z-50 flex items-center text-sm ${
        isOnline 
          ? isSlowConnection 
            ? 'bg-warning-bg text-warning-text' 
            : 'bg-success-bg text-success-text' 
          : 'bg-error-bg text-error-text'
      } ${className}`}
    >
      {/* Indicador de estado */}
      <div 
        className={`w-2.5 h-2.5 rounded-full mr-2 ${
          isOnline 
            ? isSlowConnection 
              ? 'bg-warning-text animate-pulse' 
              : 'bg-success-text' 
            : 'bg-error-text animate-pulse'
        }`}
      />
      
      {/* Texto de estado */}
      <span className="font-medium">
        {!isOnline ? 'Sin conexión' : isSlowConnection ? 'Conexión lenta' : 'Conectado'}
      </span>
      
      {/* Detalles (opcional) */}
      {showDetails && isOnline && (
        <div className="ml-2 text-xs opacity-80">
          {connectionType && <span className="mr-2">{connectionType}</span>}
          {connectionSpeed && <span>{connectionSpeed} Mbps</span>}
        </div>
      )}
    </div>
  );
};

export default NetworkStatusIndicator;

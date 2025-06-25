import { useState, useEffect } from 'react';

interface NetworkStatusOptions {
  /**
   * Si es true, muestra notificaciones automáticas cuando cambia el estado de la red
   */
  showNotifications?: boolean;
  
  /**
   * Si es true, intenta reconectar automáticamente cuando se detecta que la red está disponible de nuevo
   */
  autoReconnect?: boolean;
  
  /**
   * Función a llamar cuando se detecta que la red está disponible de nuevo
   */
  onReconnect?: () => void;
}

interface NetworkStatus {
  /**
   * Si el dispositivo está actualmente online
   */
  isOnline: boolean;
  
  /**
   * Si se detectó una conexión lenta
   */
  isSlowConnection: boolean;
  
  /**
   * Velocidad estimada de la conexión en Mbps (si está disponible)
   */
  connectionSpeed?: number;
  
  /**
   * Tipo de conexión (si está disponible)
   */
  connectionType?: string;
  
  /**
   * Última vez que se detectó un cambio en el estado de la red
   */
  lastChange: Date;
}

/**
 * Hook para monitorizar el estado de la conexión de red
 */
export const useNetworkStatus = (options: NetworkStatusOptions = {}): NetworkStatus => {
  const { 
    showNotifications = true,
    autoReconnect = true,
    onReconnect
  } = options;
  
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [isSlowConnection, setIsSlowConnection] = useState<boolean>(false);
  const [connectionSpeed, setConnectionSpeed] = useState<number | undefined>(undefined);
  const [connectionType, setConnectionType] = useState<string | undefined>(undefined);
  const [lastChange, setLastChange] = useState<Date>(new Date());
  
  // Detectar cambios en la conexión
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setLastChange(new Date());
      
      if (showNotifications) {
        // Mostrar notificación de reconexión
        const notification = document.createElement('div');
        notification.className = 'fixed bottom-4 right-4 bg-success-bg text-success-text px-4 py-3 rounded-container-third shadow-apple-md z-50 animate-fade-in';
        notification.innerHTML = `
          <div class="flex items-center">
            <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
            </svg>
            <span>Conexión restablecida</span>
          </div>
        `;
        document.body.appendChild(notification);
        
        // Eliminar la notificación después de 3 segundos
        setTimeout(() => {
          notification.classList.add('animate-fade-out');
          setTimeout(() => {
            document.body.removeChild(notification);
          }, 300);
        }, 3000);
      }
      
      // Ejecutar la función de reconexión
      if (autoReconnect && onReconnect) {
        onReconnect();
      }
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      setLastChange(new Date());
      
      if (showNotifications) {
        // Mostrar notificación de desconexión
        const notification = document.createElement('div');
        notification.className = 'fixed bottom-4 right-4 bg-error-bg text-error-text px-4 py-3 rounded-container-third shadow-apple-md z-50 animate-fade-in';
        notification.innerHTML = `
          <div class="flex items-center">
            <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
              <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path>
            </svg>
            <span>Sin conexión a Internet</span>
          </div>
        `;
        document.body.appendChild(notification);
        
        // Eliminar la notificación después de 5 segundos
        setTimeout(() => {
          notification.classList.add('animate-fade-out');
          setTimeout(() => {
            document.body.removeChild(notification);
          }, 300);
        }, 5000);
      }
    };
    
    // Comprobar la velocidad y el tipo de conexión
    const checkConnectionQuality = () => {
      // @ts-ignore - La API de Network Information no está en todos los navegadores
      const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
      
      if (connection) {
        setConnectionType(connection.effectiveType);
        setConnectionSpeed(connection.downlink);
        setIsSlowConnection(
          connection.effectiveType === 'slow-2g' || 
          connection.effectiveType === '2g' || 
          (connection.downlink && connection.downlink < 1.5)
        );
      }
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Verificar inicialmente la calidad de la conexión
    checkConnectionQuality();
    
    // @ts-ignore - La API de Network Information no está en todos los navegadores
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (connection) {
      connection.addEventListener('change', checkConnectionQuality);
    }
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      
      if (connection) {
        connection.removeEventListener('change', checkConnectionQuality);
      }
    };
  }, [showNotifications, autoReconnect, onReconnect]);
  
  return { isOnline, isSlowConnection, connectionSpeed, connectionType, lastChange };
};

export default useNetworkStatus;

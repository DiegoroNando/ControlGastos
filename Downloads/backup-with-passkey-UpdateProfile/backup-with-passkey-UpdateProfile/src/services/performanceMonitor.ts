/**
 * Servicio para monitorear el rendimiento de la aplicación
 */

// Tipos para métricas
export interface PerformanceMetrics {
  pageLoad: number;
  domContentLoaded: number;
  firstPaint?: number;
  firstContentfulPaint?: number;
  memoryUsage?: {
    jsHeapSizeLimit?: number;
    totalJSHeapSize?: number;
    usedJSHeapSize?: number;
  };
  networkInfo?: {
    effectiveType?: string;
    downlink?: number;
    rtt?: number;
    saveData?: boolean;
  };
  deviceInfo: {
    isMobile: boolean;
    screenWidth: number;
    screenHeight: number;
    pixelRatio: number;
    isLowEndDevice: boolean;
  };
}

/**
 * Detecta si el dispositivo es de gama baja
 */
export const isLowEndDevice = (): boolean => {
  const memory = (navigator as any).deviceMemory;
  const cpuCores = (navigator as any).hardwareConcurrency;
  
  // Consideramos gama baja si tiene menos de 4GB de RAM o menos de 4 núcleos
  return (
    (memory !== undefined && memory < 4) ||
    (cpuCores !== undefined && cpuCores <= 2)
  );
};

/**
 * Recopila y devuelve métricas de rendimiento
 */
export const collectPerformanceMetrics = (): PerformanceMetrics | null => {
  if (typeof window === 'undefined' || !window.performance) {
    return null;
  }
  
  const timing = performance.timing;
  const perf = window.performance as any;
  
  // Obtener métricas de pintura
  let firstPaint, firstContentfulPaint;
  if (perf.getEntriesByType) {
    const paintMetrics = perf.getEntriesByType('paint');
    firstPaint = paintMetrics.find((entry: any) => entry.name === 'first-paint')?.startTime;
    firstContentfulPaint = paintMetrics.find((entry: any) => entry.name === 'first-contentful-paint')?.startTime;
  }
  
  // Obtener info de red
  let networkInfo;
  if ((navigator as any).connection) {
    const connection = (navigator as any).connection;
    networkInfo = {
      effectiveType: connection.effectiveType,
      downlink: connection.downlink,
      rtt: connection.rtt,
      saveData: connection.saveData
    };
  }
  
  // Obtener memoria
  let memoryUsage;
  if (perf.memory) {
    memoryUsage = {
      jsHeapSizeLimit: perf.memory.jsHeapSizeLimit,
      totalJSHeapSize: perf.memory.totalJSHeapSize,
      usedJSHeapSize: perf.memory.usedJSHeapSize
    };
  }
  
  // Detectar si es dispositivo móvil
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  
  return {
    pageLoad: timing.loadEventEnd - timing.navigationStart,
    domContentLoaded: timing.domContentLoadedEventEnd - timing.navigationStart,
    firstPaint,
    firstContentfulPaint,
    memoryUsage,
    networkInfo,
    deviceInfo: {
      isMobile,
      screenWidth: window.screen.width,
      screenHeight: window.screen.height,
      pixelRatio: window.devicePixelRatio,
      isLowEndDevice: isLowEndDevice()
    }
  };
};

/**
 * Aplica optimizaciones automáticas según el dispositivo
 */
export const applyAutoOptimizations = (): void => {
  const metrics = collectPerformanceMetrics();
  
  if (!metrics) return;
  
  // Optimizaciones para dispositivos móviles o de gama baja
  if (metrics.deviceInfo.isMobile || metrics.deviceInfo.isLowEndDevice) {
    document.documentElement.classList.add('optimize-performance');
    
    // Reducir efectos visuales
    document.documentElement.style.setProperty('--transition-speed', '0.15s');
    
    // Deshabilitar animaciones complejas
    if (metrics.deviceInfo.isLowEndDevice) {
      document.documentElement.classList.add('reduce-animations');
    }
    
    console.log('🚀 Optimizaciones automáticas aplicadas para dispositivo móvil o de gama baja');
  }
  
  // Registrar métricas en la consola para depuración
  console.info('📊 Métricas de rendimiento:', {
    pageLoad: `${Math.round(metrics.pageLoad)}ms`,
    DOMContentLoaded: `${Math.round(metrics.domContentLoaded)}ms`,
    ...(metrics.memoryUsage ? {
      memoria: `${Math.round((metrics.memoryUsage.usedJSHeapSize || 0) / (1024 * 1024))}MB / ${Math.round((metrics.memoryUsage.jsHeapSizeLimit || 0) / (1024 * 1024))}MB`
    } : {}),
    dispositivo: metrics.deviceInfo.isMobile ? 'Móvil' : 'Escritorio',
    ...(metrics.networkInfo ? {
      red: `${metrics.networkInfo.effectiveType} (${metrics.networkInfo.downlink}Mbps, ${metrics.networkInfo.rtt}ms RTT)`
    } : {})
  });
};

/**
 * Servicio de caché para mejorar el rendimiento de la aplicación
 * Implementa una estrategia de caché en memoria para datos frecuentemente accedidos
 */

interface CacheOptions {
  ttl?: number; // Tiempo de vida en milisegundos
  maxItems?: number; // Número máximo de elementos en caché
}

interface CacheItem<T> {
  data: T;
  timestamp: number;
  expiry: number;
}

class CacheService {
  private cache: Map<string, CacheItem<any>>;
  private options: CacheOptions;
  private isEnabled: boolean = true;
  
  constructor(options: CacheOptions = {}) {
    this.cache = new Map();
    this.options = {
      ttl: options.ttl || 5 * 60 * 1000, // 5 minutos por defecto
      maxItems: options.maxItems || 100 // 100 items por defecto
    };
    
    // Limpiar la caché periódicamente
    setInterval(() => this.cleanup(), 60 * 1000); // Cada minuto
  }
  
  /**
   * Obtiene un elemento de la caché
   * @param key Clave del elemento
   * @returns El elemento si existe y no ha expirado, undefined en caso contrario
   */
  get<T>(key: string): T | undefined {
    if (!this.isEnabled) return undefined;
    
    const item = this.cache.get(key);
    if (!item) return undefined;
    
    // Comprobar si ha expirado
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return undefined;
    }
    
    return item.data;
  }
  
  /**
   * Almacena un elemento en la caché
   * @param key Clave del elemento
   * @param data Datos a almacenar
   * @param ttl Tiempo de vida opcional (sobrescribe el valor por defecto)
   */
  set<T>(key: string, data: T, ttl?: number): void {
    if (!this.isEnabled) return;
    
    // Controlar el tamaño máximo de la caché
    if (this.cache.size >= (this.options.maxItems || 100)) {
      // Eliminar el elemento más antiguo
      const oldestKey = this.getOldestKey();
      if (oldestKey) this.cache.delete(oldestKey);
    }
    
    const timestamp = Date.now();
    const expiry = timestamp + (ttl || this.options.ttl || 300000);
    
    this.cache.set(key, { data, timestamp, expiry });
  }
  
  /**
   * Elimina un elemento de la caché
   * @param key Clave del elemento
   */
  delete(key: string): void {
    this.cache.delete(key);
  }
  
  /**
   * Vacía la caché completamente
   */
  clear(): void {
    this.cache.clear();
  }
  
  /**
   * Activa o desactiva la caché
   * @param enabled Estado de activación
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    if (!enabled) {
      this.clear();
    }
  }
  
  /**
   * Limpia los elementos expirados de la caché
   */
  private cleanup(): void {
    if (!this.isEnabled) return;
    
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiry) {
        this.cache.delete(key);
      }
    }
  }
  
  /**
   * Obtiene la clave del elemento más antiguo en la caché
   */
  private getOldestKey(): string | undefined {
    let oldestTimestamp = Infinity;
    let oldestKey: string | undefined;
    
    for (const [key, item] of this.cache.entries()) {
      if (item.timestamp < oldestTimestamp) {
        oldestTimestamp = item.timestamp;
        oldestKey = key;
      }
    }
    
    return oldestKey;
  }
  
  /**
   * Obtiene estadísticas de la caché
   */
  getStats(): { size: number; enabled: boolean } {
    return {
      size: this.cache.size,
      enabled: this.isEnabled
    };
  }
}

// Exportar una instancia global del servicio de caché
export const globalCache = new CacheService();

export default CacheService;

import axios from 'axios';

// CURP Validation API configuration - using our backend proxy
const CURP_API_BASE_URL = 'http://localhost:3001'; // Our backend server
const CURP_VALIDATION_ENDPOINT = '/api/curp/validate'; // Our proxy endpoint

export interface CurpValidationResult {
  success: boolean;
  data?: {
    curp: string;
    persona: {
      nombres: string;
      apellidoPaterno: string;
      apellidoMaterno: string;
      nombreCompleto: string;
      sexo: 'H' | 'M';
      fechaNacimiento: string;
    };
    ubicacion: {
      entidadNacimiento: string;
      nacionalidad: string;
    };
    registro: {
      tipoDocumentoProbatorio: number;
      anioRegistro: number;
      numeroActa: number;
      libro?: number;
      folio?: number;
      entidadRegistro: string;
      municipioRegistro: string;
      statusCurp: string;
    };
    metadata: {
      sessionId: string;
      estatusValidacion: string;
      fechaConsulta: string;
      tiempoRespuesta: number;
    };
  };
  error?: string;
  message?: string;
  code?: string;
}

export interface UserDataFromCurp {
  curp: string;
  nombre: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  email: string;
  fechaNacimiento: string;
  sexo: 'HOMBRE' | 'MUJER';
}

/**
 * CURP Validation Service
 * Handles validation of CURPs using the external RENAPO API
 */
export const curpValidationService = {
  /**
   * Validates a CURP using the external RENAPO API
   * @param curp The CURP to validate
   * @returns Promise with validation result
   */
  async validateCurp(curp: string): Promise<CurpValidationResult> {
    try {
      console.log('[CURP_SERVICE] Validating CURP:', curp);
      
      // Basic format validation first
      if (!this.isValidCurpFormat(curp)) {
        return {
          success: false,
          error: 'Formato de CURP inválido',
          message: 'El CURP debe tener 18 caracteres y seguir el formato oficial.',
          code: 'INVALID_FORMAT'
        };
      }

      const response = await axios.post(`${CURP_API_BASE_URL}${CURP_VALIDATION_ENDPOINT}`, {
        curp: curp.toUpperCase()
      }, {
        timeout: 10000, // 10 seconds timeout
        headers: {
          'Content-Type': 'application/json'
        }
      });

      console.log('[CURP_SERVICE] API Response:', {
        status: response.status,
        success: response.data.success,
        hasData: !!response.data.data
      });

      if (response.data.success && response.data.data) {
        return {
          success: true,
          data: response.data.data
        };
      } else {
        return {
          success: false,
          error: response.data.error || 'Error de validación',
          message: response.data.message || 'No se pudo validar el CURP',
          code: response.data.code || 'VALIDATION_ERROR'
        };
      }
    } catch (error: any) {
      console.error('[CURP_SERVICE] Error validating CURP:', error);
      
      if (error.response) {
        // Server responded with error status
        const errorData = error.response.data;
        return {
          success: false,
          error: errorData.error || 'Error del servidor',
          message: errorData.message || `Error HTTP ${error.response.status}`,
          code: errorData.code || `HTTP_${error.response.status}`
        };
      } else if (error.request) {
        // Network error
        return {
          success: false,
          error: 'Error de conexión',
          message: 'No se pudo conectar con el servicio de validación de CURP. Intente más tarde.',
          code: 'NETWORK_ERROR'
        };
      } else {
        // Other error
        return {
          success: false,
          error: 'Error interno',
          message: error.message || 'Error desconocido al validar CURP',
          code: 'INTERNAL_ERROR'
        };
      }
    }
  },

  /**
   * Validates CURP format using regex
   * @param curp The CURP to validate
   * @returns true if format is valid
   */
  isValidCurpFormat(curp: string): boolean {
    if (!curp || typeof curp !== 'string') return false;
    
    // CURP format: 4 letters + 6 digits + H/M + 5 letters + 1 digit/letter + 1 digit
    const curpPattern = /^[A-Z]{4}[0-9]{6}[HM][A-Z]{5}[0-9A-Z][0-9]$/;
    return curpPattern.test(curp.toUpperCase());
  },

  /**
   * Extracts user data from CURP validation result
   * @param validationResult The result from CURP validation
   * @param email User's email address
   * @returns User data formatted for registration
   */
  extractUserDataFromValidation(validationResult: CurpValidationResult, email: string): UserDataFromCurp | null {
    if (!validationResult.success || !validationResult.data) {
      return null;
    }

    const { curp, persona } = validationResult.data;
    
    return {
      curp,
      nombre: persona.nombres,
      apellidoPaterno: persona.apellidoPaterno,
      apellidoMaterno: persona.apellidoMaterno,
      email,
      fechaNacimiento: persona.fechaNacimiento,
      sexo: persona.sexo === 'H' ? 'HOMBRE' : 'MUJER'
    };
  },
  /**
   * Checks if CURP validation service is available
   * @returns Promise<boolean>
   */
  async isServiceAvailable(): Promise<boolean> {
    try {
      // Test our backend proxy endpoint with a simple request
      const response = await axios.post(`${CURP_API_BASE_URL}${CURP_VALIDATION_ENDPOINT}`, {
        curp: 'TEST'
      }, {
        timeout: 5000
      });
      // Even if the CURP is invalid, if we get a response from our proxy, the service is available
      return response.status === 200 || response.status === 400;
    } catch (error) {
      console.error('[CURP_SERVICE] Service health check failed:', error);
      return false;
    }
  },

  /**
   * Gets service status and information
   * @returns Promise with service status
   */
  async getServiceStatus(): Promise<any> {
    try {
      // Since we're using our own proxy, we can return a simple status
      const isAvailable = await this.isServiceAvailable();
      return {
        service: 'CURP Validation Proxy',
        status: isAvailable ? 'available' : 'unavailable',
        proxyEndpoint: `${CURP_API_BASE_URL}${CURP_VALIDATION_ENDPOINT}`,
        timestamp: new Date().toISOString()
      };    } catch (error: any) {
      console.error('[CURP_SERVICE] Failed to get service status:', error);
      return {
        service: 'CURP Validation Proxy',
        status: 'error',
        error: error?.message || 'Unknown error',
        timestamp: new Date().toISOString()
      };
    }
  }
};

export default curpValidationService;

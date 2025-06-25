// Define types for Face API responses
interface FaceDetectionResponse {
  faceId: string;
  faceRectangle: {
    top: number;
    left: number;
    width: number;
    height: number;
  };
  faceAttributes?: {
    qualityForRecognition?: 'low' | 'medium' | 'high';
  };
}

interface FaceAuthCapabilities {
  cameraAvailable: boolean;
  serviceConfigured: boolean;
  browserSupported: boolean;
}

interface FaceAuthResult {
  success: boolean;
  error?: string;
  personId?: string;
  isMatch?: boolean;
  confidence?: number;
}

class FaceAuthService {
  private endpoint: string;
  private apiKey: string;
  private isInitialized: boolean = false;

  constructor() {
    this.endpoint = import.meta.env.VITE_AZURE_FACE_ENDPOINT || process.env.AZURE_FACE_ENDPOINT || 'https://face-api-usiamm.cognitiveservices.azure.com/';
    this.apiKey = import.meta.env.VITE_AZURE_FACE_API_KEY || process.env.AZURE_FACE_API_KEY || '';
    
    // Ensure endpoint ends with /
    if (!this.endpoint.endsWith('/')) {
      this.endpoint += '/';
    }
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    // For browser environment, we'll use fetch API directly
    if (typeof window !== 'undefined') {
      this.isInitialized = true;
    }
  }

  private async makeApiCall(endpoint: string, options: RequestInit = {}): Promise<any> {
    const url = `${this.endpoint}face/v1.0${endpoint}`;
    
    const defaultHeaders = {
      'Ocp-Apim-Subscription-Key': this.apiKey,
      'Content-Type': 'application/json',
    };

    const response = await fetch(url, {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Face API Error: ${response.status} - ${errorText}`);
    }

    // Some endpoints return empty responses
    if (response.status === 202 || response.headers.get('content-length') === '0') {
      return null;
    }

    return response.json();
  }

  async detectFaces(imageBlob: Blob): Promise<FaceDetectionResponse[]> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const formData = new FormData();
    formData.append('image', imageBlob);

    const response = await fetch(`${this.endpoint}face/v1.0/detect?detectionModel=detection_03&recognitionModel=recognition_04&returnFaceId=false&returnFaceAttributes=qualityForRecognition`, {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': this.apiKey,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Face detection failed: ${response.status} - ${errorText}`);
    }

    return response.json();
  }

  // Registration: Only check for a single, high-quality face
  async registerUserFace(userCurp: string, imageBlob: Blob): Promise<FaceAuthResult> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      // First, detect faces in the image
      const faces = await this.detectFaces(imageBlob);
      
      if (faces.length === 0) {
        return { success: false, error: 'No se detectó ningún rostro en la imagen.' };
      }

      if (faces.length > 1) {
        return { success: false, error: 'Se detectaron múltiples rostros. Asegúrate de que solo aparezca una persona.' };
      }

      const face = faces[0];
      if (face.faceAttributes?.qualityForRecognition === 'low') {
        return { success: false, error: 'La calidad de la imagen es muy baja. Intenta con mejor iluminación.' };
      }

      // Success: face detected and quality is sufficient
      return { success: true };
    } catch (error) {
      console.error('Face registration error:', error);
      return { success: false, error: 'Error al detectar el rostro. Intenta de nuevo.' };
    }
  }

  // No-op for login/verification/identification
  async verifyUserFace(): Promise<FaceAuthResult> {
    return { success: false, error: 'La autenticación facial no está disponible en este entorno.' };
  }
  async identifyFaces(): Promise<FaceAuthResult> {
    return { success: false, error: 'La autenticación facial no está disponible en este entorno.' };
  }
}

// Create and export service instance
export const faceAuthService = new FaceAuthService();

// Export capability checker function
export const getFaceAuthCapabilities = (): FaceAuthCapabilities => {
  const hasCamera = typeof navigator !== 'undefined' && 
                   typeof navigator.mediaDevices !== 'undefined' && 
                   typeof navigator.mediaDevices.getUserMedia !== 'undefined';

  const hasCredentials = !!(
    (import.meta.env.VITE_AZURE_FACE_ENDPOINT || process.env.AZURE_FACE_ENDPOINT) && 
    (import.meta.env.VITE_AZURE_FACE_API_KEY || process.env.AZURE_FACE_API_KEY)
  );

  return {
    cameraAvailable: hasCamera,
    serviceConfigured: hasCredentials,
    browserSupported: typeof window !== 'undefined' && typeof fetch !== 'undefined',
  };
};

// Export types
export type { FaceAuthCapabilities, FaceAuthResult };

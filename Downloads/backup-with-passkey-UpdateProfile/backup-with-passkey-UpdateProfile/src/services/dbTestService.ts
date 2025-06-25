
// services/dbTestService.ts

const API_BASE_URL = '/api/db'; // Relative path for DB operations, relies on frontend proxy

interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
}

/**
 * Attempts to connect to the MongoDB database via the backend.
 */
export const connectToDB = async (): Promise<ApiResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/connect`, { method: 'POST' });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Error de conexión desconocido.' }));
      return { success: false, message: errorData.message || `Error del servidor: ${response.status}` };
    }
    return await response.json();
  } catch (error: any) {
    return { success: false, message: `Error de red: ${error.message}` };
  }
};

/**
 * Creates a sample document in a specified collection.
 * The backend should handle creating the collection if it doesn't exist.
 */
export const createSampleData = async (collectionName: string, data: Record<string, any>): Promise<ApiResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ collectionName, data }),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Error al crear datos.' }));
      return { success: false, message: errorData.message || `Error del servidor: ${response.status}` };
    }
    return await response.json();
  } catch (error: any) {
    return { success: false, message: `Error de red: ${error.message}` };
  }
};

/**
 * Reads documents from a specified collection.
 */
export const readSampleData = async (collectionName: string, query: Record<string, any> = {}): Promise<ApiResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/read?collectionName=${encodeURIComponent(collectionName)}&query=${encodeURIComponent(JSON.stringify(query))}`, {
      method: 'GET',
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Error al leer datos.' }));
      return { success: false, message: errorData.message || `Error del servidor: ${response.status}` };
    }
    return await response.json();
  } catch (error: any) {
    return { success: false, message: `Error de red: ${error.message}` };
  }
};

/**
 * Updates a document in a specified collection.
 */
export const updateSampleData = async (collectionName: string, query: Record<string, any>, update: Record<string, any>): Promise<ApiResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/update`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ collectionName, query, update }),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Error al actualizar datos.' }));
      return { success: false, message: errorData.message || `Error del servidor: ${response.status}` };
    }
    return await response.json();
  } catch (error: any) {
    return { success: false, message: `Error de red: ${error.message}` };
  }
};

/**
 * Deletes documents from a specified collection.
 */
export const deleteSampleData = async (collectionName: string, query: Record<string, any>): Promise<ApiResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/delete`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ collectionName, query }),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Error al eliminar datos.' }));
      return { success: false, message: errorData.message || `Error del servidor: ${response.status}` };
    }
    return await response.json();
  } catch (error: any) {
    return { success: false, message: `Error de red: ${error.message}` };
  }
};

/**
 * Drops (deletes) an entire collection.
 */
export const dropCollection = async (collectionName: string): Promise<ApiResponse> => {
    try {
      const response = await fetch(`${API_BASE_URL}/drop-collection`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ collectionName }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Error al eliminar colección.' }));
        return { success: false, message: errorData.message || `Error del servidor: ${response.status}` };
      }
      return await response.json();
    } catch (error: any) {
      return { success: false, message: `Error de red: ${error.message}` };
    }
  };

/**
 * Lists all collections in the database via the backend.
 */
export const listCollections = async (): Promise<ApiResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/collections`, { method: 'GET' });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Error al listar colecciones.' }));
      return { success: false, message: errorData.message || `Error del servidor: ${response.status}` };
    }
    return await response.json();
  } catch (error: any) {
    return { success: false, message: `Error de red: ${error.message}` };
  }
};

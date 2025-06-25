
import React, { useState, useEffect } from 'react';
import { PageTitle, Card, Button, Alert, Input, LoadingSpinner } from '../../components/common/CommonComponents';
import { useAuth } from '../../contexts/AuthContext';
import { UserRole } from '../../types';
import * as dbTestService from '../../services/dbTestService'; // Assuming you create this service

const AdminDBTestPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [connectionStatus, setConnectionStatus] = useState<string>('No intentado');
  const [operationResult, setOperationResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [backendStatus, setBackendStatus] = useState<'checking' | 'online' | 'offline'>('checking');

  const [collectionName, setCollectionName] = useState<string>('test_items');
  const [documentId, setDocumentId] = useState<string>(''); // For targeting specific documents
  const [documentData, setDocumentData] = useState<string>('{\n  "name": "Elemento de Prueba",\n  "value": 123,\n  "timestamp": ""\n}');
  const [queryData, setQueryData] = useState<string>('{}'); // For read, update, delete queries

  // Check backend status on component mount
  useEffect(() => {
    const checkBackendHealth = async () => {
      try {
        // Use relative path, assuming frontend proxy to DB backend
        const response = await fetch('/api/health'); 
        if (response.ok) {
          setBackendStatus('online');
        } else {
          setBackendStatus('offline');
        }
      } catch (error) {
        setBackendStatus('offline');
      }
    };

    checkBackendHealth();
    // Check every 30 seconds
    const interval = setInterval(checkBackendHealth, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const handleAPICall = async (apiCall: () => Promise<any>, successMessage: string) => {
    setIsLoading(true);
    setError(null);
    setOperationResult(null);
    try {
      const result = await apiCall();
      setOperationResult(result);
      if (result.success) {
        // setConnectionStatus might be updated specifically by connect test
        if (successMessage.includes('Conexión')) setConnectionStatus(result.message);
      } else {
        setError(result.message || 'Operación fallida.');
        if (successMessage.includes('Conexión')) setConnectionStatus(`Error: ${result.message}`);
      }
    } catch (err: any) {
      setError(`Error de red o cliente: ${err.message}`);
      if (successMessage.includes('Conexión')) setConnectionStatus(`Error de red: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnect = () => {
    handleAPICall(dbTestService.connectToDB, "Resultado de conexión a MongoDB");
  };
  
  const handleCreate = () => {
    try {
      const parsedData = JSON.parse(documentData);
      if (typeof parsedData.timestamp === "string" && parsedData.timestamp === "") {
        parsedData.timestamp = new Date().toISOString();
      }
      handleAPICall(() => dbTestService.createSampleData(collectionName, parsedData), "Crear Documento");
    } catch (e: any) {
      setError("Error en el formato JSON para los datos del documento: " + e.message);
    }
  };

  const handleRead = () => {
    try {
      const parsedQuery = JSON.parse(queryData);
      handleAPICall(() => dbTestService.readSampleData(collectionName, parsedQuery), "Leer Documentos");
    } catch (e: any) {
      setError("Error en el formato JSON para la consulta de lectura: " + e.message);
    }
  };

  const handleUpdate = () => {
     try {
      const parsedQuery = documentId ? { _id: documentId } : JSON.parse(queryData); // Prioritize ID if provided
      const parsedUpdate = JSON.parse(documentData); // Document data field now used for update content
      // Ensure $set is used for granular updates if not already structured
      const updatePayload = (parsedUpdate.$set || parsedUpdate.$inc || parsedUpdate.$push) ? parsedUpdate : { $set: parsedUpdate };
      
      handleAPICall(() => dbTestService.updateSampleData(collectionName, parsedQuery, updatePayload), "Actualizar Documento");
    } catch (e: any) {
      setError("Error en el formato JSON para la consulta o datos de actualización: " + e.message);
    }
  };
  
  const handleDelete = () => {
    try {
      const parsedQuery = documentId ? { _id: documentId } : JSON.parse(queryData); // Prioritize ID
      handleAPICall(() => dbTestService.deleteSampleData(collectionName, parsedQuery), "Eliminar Documento(s)");
    } catch (e: any) {
      setError("Error en el formato JSON para la consulta de eliminación: " + e.message);
    }
  };
  const handleDropCollection = () => {
    if (window.confirm(`¿Estás seguro de que deseas eliminar TODA la colección "${collectionName}"? Esta acción no se puede deshacer.`)) {
        handleAPICall(() => dbTestService.dropCollection(collectionName), "Eliminar Colección");
    }
  };

  const handleListCollections = () => {
    // Directly use the service function which now uses relative path
    handleAPICall(dbTestService.listCollections, "Listar Colecciones");
  };

  const handleQuickTest = () => {
    handleAPICall(async () => {
      const testData = {
        nombre: "Prueba Rápida",
        fecha: new Date().toISOString(),
        tipo: "test_rapido",
        valor: Math.floor(Math.random() * 1000)
      };
      
      return await dbTestService.createSampleData('test_rapido', testData);
    }, "Prueba Rápida");
  };


  if (!currentUser || currentUser.role !== UserRole.SUPERADMIN) {
    return <Alert type="error" title="Acceso Denegado" message="Esta sección es solo para Superadministradores." />;
  }
  return (
    <div className="space-y-6">
      <PageTitle title="Pruebas de Conexión a Base de Datos" subtitle="Verifica la conectividad y operaciones CRUD con MongoDB (via Backend en puerto 3002)." />
      
      {/* Estado del Backend */}
      <Card title="Estado del Backend (DB API en Puerto 3002)">
        <div className="flex items-center space-x-4 p-4">
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${
              backendStatus === 'online' ? 'bg-green-500' : 
              backendStatus === 'offline' ? 'bg-red-500' : 
              'bg-yellow-500 animate-pulse'
            }`}></div>
            <span className="text-sm font-medium">
              DB Backend API (/api/health): {
                backendStatus === 'online' ? '🟢 En línea' : 
                backendStatus === 'offline' ? '🔴 Desconectado' : 
                '🟡 Verificando...'
              }
            </span>
          </div>
          {backendStatus === 'offline' && (
            <span className="text-xs text-red-600 dark:text-red-400">
              Asegúrate de que el backend (backend-server.js) esté ejecutándose en puerto 3002 Y que el proxy del frontend esté configurado para /api/health y /api/db/.
            </span>
          )}
        </div>
      </Card>
      
      <Alert
        type="info"
        title="Nota Importante"
        message={
          <>
            Esta interfaz ahora interactúa con el backend Node.js (puerto 3002) a través de rutas relativas (ej: <code>/api/db/connect</code>).
            Esto requiere que tu servidor de desarrollo frontend (ej: Vite) esté configurado para hacer proxy de las peticiones <code>/api/db/*</code> y <code>/api/health</code> al backend en <code>http://localhost:3002</code>.
            Asegúrate de que el backend (<code>backend-server.js</code>) y MongoDB estén activos, y el proxy del frontend configurado.
          </>
        }
      />

      <Card title="Estado de Conexión a MongoDB (via Backend)">
        <div className="flex items-center space-x-4 p-4">
          <Button onClick={handleConnect} disabled={isLoading}>
            {isLoading && connectionStatus === 'No intentado' ? <LoadingSpinner size="sm" /> : null}
            Probar Conexión
          </Button>
          <p className={`text-sm font-medium ${connectionStatus.startsWith('Error') || connectionStatus.startsWith('Fallo') ? 'text-error-text' : 'text-success-text'}`}>
            Estado: {connectionStatus}
          </p>
        </div>
      </Card>

      <Card title="Operaciones CRUD de Prueba">
        <div className="p-4 space-y-4">
          <Input 
            label="Nombre de la Colección (ej: 'usuarios', 'votos')" 
            value={collectionName} 
            onChange={(e) => setCollectionName(e.target.value)}
            placeholder="test_items"
            disabled={isLoading}
          />
          <Input 
            label="ID del Documento (Opcional, para Actualizar/Eliminar por ID)" 
            value={documentId} 
            onChange={(e) => setDocumentId(e.target.value)}
            placeholder="ObjectID('xxxx')"
            disabled={isLoading}
          />
          
          <div>
            <label htmlFor="documentData" className="block text-sm font-medium text-text-secondary dark:text-neutral-400 mb-1.5">
              Datos del Documento (JSON - para Crear/Actualizar)
            </label>            <textarea
              id="documentData"
              rows={5}
              className="block w-full p-2.5 bg-gray-50 dark:bg-neutral-700/40 border border-border-gray dark:border-neutral-600 rounded-container-third shadow-apple-sm text-text-primary dark:text-neutral-100 placeholder-text-tertiary dark:placeholder-neutral-400 sm:text-sm apple-focus-ring font-mono text-xs"
              value={documentData}
              onChange={(e) => setDocumentData(e.target.value)}
              placeholder='{ "clave": "valor" }'
              disabled={isLoading}
            />
          </div>
          <div>
            <label htmlFor="queryData" className="block text-sm font-medium text-text-secondary dark:text-neutral-400 mb-1.5">
              Consulta (JSON - para Leer/Actualizar/Eliminar por query, si ID no se usa)
            </label>            <textarea
              id="queryData"
              rows={3}
              className="block w-full p-2.5 bg-gray-50 dark:bg-neutral-700/40 border border-border-gray dark:border-neutral-600 rounded-container-third shadow-apple-sm text-text-primary dark:text-neutral-100 placeholder-text-tertiary dark:placeholder-neutral-400 sm:text-sm apple-focus-ring font-mono text-xs"
              value={queryData}
              onChange={(e) => setQueryData(e.target.value)}
              placeholder='{ "campo": "valor_buscado" } (vacío {} para todos)'
              disabled={isLoading}
            />
          </div>          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 pt-2">
            <Button onClick={handleCreate} disabled={isLoading || !collectionName.trim()} fullWidth>Crear</Button>
            <Button onClick={handleRead} disabled={isLoading || !collectionName.trim()} fullWidth>Leer</Button>
            <Button onClick={handleUpdate} disabled={isLoading || !collectionName.trim()} fullWidth>Actualizar</Button>
            <Button onClick={handleDelete} variant="secondary" disabled={isLoading || !collectionName.trim()} fullWidth>Eliminar Doc.</Button>
            <Button onClick={handleDropCollection} variant="danger" disabled={isLoading || !collectionName.trim()} fullWidth>Eliminar Colección</Button>
          </div>

          {/* Acciones Rápidas */}
          <div className="border-t pt-4 mt-6">
            <h4 className="text-sm font-medium text-text-secondary dark:text-neutral-400 mb-3">Acciones Rápidas</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <Button onClick={handleListCollections} disabled={isLoading} variant="secondary" fullWidth>
                📋 Listar Colecciones
              </Button>
              <Button onClick={handleQuickTest} disabled={isLoading} fullWidth>
                ⚡ Prueba Rápida
              </Button>
              <Button 
                onClick={() => {
                  setCollectionName('test_items');
                  setDocumentData('{\n  "name": "Elemento de Prueba",\n  "value": 123,\n  "timestamp": ""\n}');
                  setQueryData('{}');
                  setDocumentId('');
                  setOperationResult(null);
                  setError(null);
                }} 
                disabled={isLoading} 
                variant="secondary" 
                fullWidth
              >
                🔄 Limpiar Formulario
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {(isLoading && operationResult === null) && (
        <div className="flex justify-center items-center py-8">
            <LoadingSpinner size="md" />
            <p className="ml-3 text-text-secondary dark:text-neutral-400">Procesando operación...</p>
        </div>
      )}

      {error && <Alert type="error" message={error} onClose={() => setError(null)} />}
      
      {operationResult && (
        <Card title="Resultado de la Operación">
          <pre className="p-4 bg-gray-100 dark:bg-neutral-800 rounded-md text-xs overflow-x-auto max-h-96">
            {JSON.stringify(operationResult, null, 2)}
          </pre>
        </Card>
      )}
    </div>
  );
};

export default AdminDBTestPage;

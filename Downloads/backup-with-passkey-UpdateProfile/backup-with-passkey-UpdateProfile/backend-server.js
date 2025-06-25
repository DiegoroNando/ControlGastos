// backend-server.js
// Node.js Backend Server for Database Testing API (Port 3002)

import express from 'express';
import cors from 'cors';
import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.BACKEND_PORT || 3002;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = process.env.DB_NAME || 'sistema_votaciones_etica';

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3001', 'http://localhost:3000'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// MongoDB client
let mongoClient = null;
let database = null;

// Helper function to get MongoDB connection
const getDatabase = async () => {
  if (!mongoClient) {
    mongoClient = new MongoClient(MONGODB_URI, {
      maxPoolSize: parseInt(process.env.MONGODB_MAX_POOL_SIZE || '10'),
      serverSelectionTimeoutMS: parseInt(process.env.MONGODB_SERVER_SELECTION_TIMEOUT || '5000'),
      socketTimeoutMS: 45000,
    });
  }
  
  if (!database) {
    await mongoClient.connect();
    database = mongoClient.db(DB_NAME);
  }
  
  return database;
};

// Helper function to handle API responses
const sendApiResponse = (res, success, message, data = null) => {
  res.json({
    success,
    message,
    ...(data && { data })
  });
};

// Error handler middleware
const errorHandler = (error, req, res, next) => {
  console.error('API Error:', error);
  sendApiResponse(res, false, error.message || 'Error interno del servidor');
};

// Routes

/**
 * POST /api/db/connect
 * Tests the connection to MongoDB database
 */
app.post('/api/db/connect', async (req, res) => {
  try {
    const db = await getDatabase();
    // Test the connection by running a simple command
    await db.admin().ping();
    sendApiResponse(res, true, 'Conexión exitosa a MongoDB');
  } catch (error) {
    console.error('Database connection error:', error);
    sendApiResponse(res, false, `Error de conexión: ${error.message}`);
  }
});

/**
 * POST /api/db/create
 * Creates a document in the specified collection
 * Body: { collectionName: string, data: object }
 */
app.post('/api/db/create', async (req, res) => {
  try {
    const { collectionName, data } = req.body;
    
    if (!collectionName || !data) {
      return sendApiResponse(res, false, 'Nombre de colección y datos son requeridos');
    }

    const db = await getDatabase();
    const collection = db.collection(collectionName);
    
    // Add timestamp to the document
    const documentToInsert = {
      ...data,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const result = await collection.insertOne(documentToInsert);
    
    sendApiResponse(res, true, 'Documento creado exitosamente', {
      insertedId: result.insertedId,
      document: documentToInsert
    });
  } catch (error) {
    console.error('Create document error:', error);
    sendApiResponse(res, false, `Error al crear documento: ${error.message}`);
  }
});

/**
 * GET /api/db/read
 * Reads documents from the specified collection
 * Query params: collectionName (required), query (optional JSON string)
 */
app.get('/api/db/read', async (req, res) => {
  try {
    const { collectionName, query: queryString } = req.query;
    
    if (!collectionName) {
      return sendApiResponse(res, false, 'Nombre de colección es requerido');
    }

    const db = await getDatabase();
    const collection = db.collection(collectionName);
    
    // Parse query parameter
    let query = {};
    if (queryString) {
      try {
        query = JSON.parse(queryString);
      } catch (parseError) {
        return sendApiResponse(res, false, 'Query JSON inválido');
      }
    }
    
    const documents = await collection.find(query).toArray();
    
    sendApiResponse(res, true, `Se encontraron ${documents.length} documento(s)`, {
      documents,
      count: documents.length
    });
  } catch (error) {
    console.error('Read documents error:', error);
    sendApiResponse(res, false, `Error al leer documentos: ${error.message}`);
  }
});

/**
 * PUT /api/db/update
 * Updates documents in the specified collection
 * Body: { collectionName: string, query: object, update: object }
 */
app.put('/api/db/update', async (req, res) => {
  try {
    const { collectionName, query, update } = req.body;
    
    if (!collectionName || !query || !update) {
      return sendApiResponse(res, false, 'Nombre de colección, query y datos de actualización son requeridos');
    }    const db = await getDatabase();
    const collection = db.collection(collectionName);
    
    // Filter out immutable fields that cannot be updated
    const filteredUpdate = { ...update };
    delete filteredUpdate._id;
    delete filteredUpdate.id;
    
    // Add updatedAt timestamp to the update
    const updateOperation = {
      $set: {
        ...filteredUpdate,
        updatedAt: new Date()
      }
    };
    
    const result = await collection.updateMany(query, updateOperation);
    
    sendApiResponse(res, true, `${result.modifiedCount} documento(s) actualizado(s)`, {
      matchedCount: result.matchedCount,
      modifiedCount: result.modifiedCount,
      upsertedId: result.upsertedId
    });
  } catch (error) {
    console.error('Update documents error:', error);
    sendApiResponse(res, false, `Error al actualizar documentos: ${error.message}`);
  }
});

/**
 * DELETE /api/db/delete
 * Deletes documents from the specified collection
 * Body: { collectionName: string, query: object }
 */
app.delete('/api/db/delete', async (req, res) => {
  try {
    const { collectionName, query } = req.body;
    
    if (!collectionName || !query) {
      return sendApiResponse(res, false, 'Nombre de colección y query son requeridos');
    }

    // Safety check to prevent deleting all documents accidentally
    if (Object.keys(query).length === 0) {
      return sendApiResponse(res, false, 'Query vacío no permitido. Especifica criterios de eliminación.');
    }

    const db = await getDatabase();
    const collection = db.collection(collectionName);
    
    const result = await collection.deleteMany(query);
    
    sendApiResponse(res, true, `${result.deletedCount} documento(s) eliminado(s)`, {
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('Delete documents error:', error);
    sendApiResponse(res, false, `Error al eliminar documentos: ${error.message}`);
  }
});

/**
 * DELETE /api/db/drop-collection
 * Drops (deletes) an entire collection
 * Body: { collectionName: string }
 */
app.delete('/api/db/drop-collection', async (req, res) => {
  try {
    const { collectionName } = req.body;
    
    if (!collectionName) {
      return sendApiResponse(res, false, 'Nombre de colección es requerido');
    }

    // Safety check to prevent dropping critical collections
    const protectedCollections = ['users', 'votes', 'posts', 'admin_settings'];
    if (protectedCollections.includes(collectionName.toLowerCase())) {
      return sendApiResponse(res, false, `Colección '${collectionName}' está protegida y no puede ser eliminada`);
    }

    const db = await getDatabase();
    
    // Check if collection exists
    const collections = await db.listCollections({ name: collectionName }).toArray();
    if (collections.length === 0) {
      return sendApiResponse(res, false, `Colección '${collectionName}' no existe`);
    }
    
    const result = await db.collection(collectionName).drop();
    
    sendApiResponse(res, true, `Colección '${collectionName}' eliminada exitosamente`, {
      dropped: result
    });
  } catch (error) {
    console.error('Drop collection error:', error);
    sendApiResponse(res, false, `Error al eliminar colección: ${error.message}`);
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  sendApiResponse(res, true, 'Backend server funcionando correctamente', {
    timestamp: new Date().toISOString(),
    port: PORT,
    mongoUri: MONGODB_URI.replace(/:[^:@]*@/, ':***@') // Hide password in logs
  });
});

// List all collections endpoint (useful for debugging)
app.get('/api/db/collections', async (req, res) => {
  try {
    const db = await getDatabase();
    const collections = await db.listCollections().toArray();
    
    sendApiResponse(res, true, 'Colecciones obtenidas exitosamente', {
      collections: collections.map(c => c.name)
    });
  } catch (error) {
    console.error('List collections error:', error);
    sendApiResponse(res, false, `Error al obtener colecciones: ${error.message}`);
  }
});

// Error handling middleware
app.use(errorHandler);

// 404 handler for unmatched routes
app.use('*', (req, res) => {
  sendApiResponse(res, false, `Ruta no encontrada: ${req.method} ${req.originalUrl}`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n⏳ Cerrando servidor backend...');
  
  if (mongoClient) {
    await mongoClient.close();
    console.log('✅ Conexión MongoDB cerrada');
  }
  
  process.exit(0);
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Backend server corriendo en puerto ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🔗 MongoDB URI: ${MONGODB_URI}`);
  console.log(`💾 Database: ${DB_NAME}`);
});

export default app;

// Backend server for handling email operations
import express from 'express';
import cors from 'cors';
import nodemailer from 'nodemailer';
import bodyParser from 'body-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { dirname } from 'path';
import session from 'express-session';
import { 
  generateRegistrationOptions, 
  verifyRegistrationResponse,
  generateAuthenticationOptions, 
  verifyAuthenticationResponse 
} from '@simplewebauthn/server';
import { MongoClient } from 'mongodb';
import crypto from 'crypto';
import { TextEncoder } from 'util';
import axios from 'axios';

// Initialize dotenv
dotenv.config();

// ES module dirname equivalent 
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Configure middleware
// Enhanced CORS configuration to handle WebAuthn properly
app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, etc)
    if (!origin) return callback(null, true);
    
    // Check if the origin is in our allowed list
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    console.warn(`[CORS] Origin ${origin} not allowed`);
    callback(null, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'dist')));
app.use(express.static(path.join(__dirname, 'public')));

// Setup session middleware for passkeys
app.use(session({
  secret: process.env.SESSION_SECRET || 'sistema-votaciones-passkey-session-secret',
  resave: false,
  saveUninitialized: true,
  cookie: { 
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax', // 'strict' in production, 'lax' for development
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Configure email transport using environment variables
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.resend.com',
  port: parseInt(process.env.SMTP_PORT || '465'),
  secure: true, // use TLS
  auth: {
    user: process.env.SMTP_USER || 'resend',
    pass: process.env.SMTP_PASSWORD || 're_XxAQh7ST_BSmgR2L6atYNr861WWxKvMuH'
  }
});

// Test email connection on startup
transporter.verify((error, success) => {
  if (error) {
    console.error('SMTP connection error:', error);
  } else {
    console.log('SMTP server is ready to send emails');
  }
});

// Simple test endpoint to check if the server is working
app.get('/api/status', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
  });
});

// Debug endpoint for passkey configuration
app.get('/api/passkey/debug-rpid', (req, res) => {
  // Check if all required crypto modules are available
  const cryptoCheck = {
    webcrypto: typeof crypto !== 'undefined',
    subtle: typeof crypto !== 'undefined' && typeof crypto.subtle !== 'undefined',
    randomUUID: typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function',
    getRandomValues: typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function'
  };
  
  res.json({
    rpID,
    allowedOrigins,
    currentOrigin: req.headers.origin || 'No origin header',
    mappedOrigin: checkOrigin(req.headers.origin),
    hasCookies: !!req.cookies,
    hasSession: !!req.session,
    sessionID: req.session?.id || 'No session ID',
    secureContext: true, // Always true on the server
    nodeVersion: process.version,
    cryptoModules: cryptoCheck
  });
});

// --- PASSKEY AUTHENTICATION ENDPOINTS ---
// In-memory store for challenges, for demo purposes
const userChallengeStore = {};

// The RP ID should be your website's domain (use localhost for development)
const rpName = 'Sistema de Votaciones';
// Determine the proper rpID based on environment
// Note: rpID must be set to the domain WITHOUT protocol or port
// For localhost development, just use 'localhost'
const rpID = process.env.NODE_ENV === 'production' 
  ? process.env.RP_ID || 'sistema-votaciones.example.com' // Replace with actual production domain
  : 'localhost';

// Enhanced list of allowed origins for development and production
const allowedOrigins = process.env.NODE_ENV === 'production'
  ? [
      // Production origins
      `https://${rpID}`,
      `https://www.${rpID}`
    ]
  : [
      // Development origins - include all common local development setups
      `http://${rpID}:${PORT}`,     // Default server port (3001)
      `https://${rpID}:${PORT}`,
      'http://localhost:5173',      // Vite dev server (default)
      'https://localhost:5173',
      'http://localhost:4173',      // Vite preview
      'https://localhost:4173',
      'http://127.0.0.1:5173',      // Also support 127.0.0.1
      'https://127.0.0.1:5173',
      'http://127.0.0.1:3001',
      'https://127.0.0.1:3001',
      'http://localhost:3000',      // Common React dev port
      'https://localhost:3000',
    ];

// For passkeys, we need to accept requests from any of the allowed origins
// Since browsers enforce same-origin policy, this is safe
const checkOrigin = (origin) => {
  console.log('[PASSKEY] Checking origin:', origin);
  // During local development, the Origin header might be null for same-origin requests
  if (!origin) {
    console.log('[PASSKEY] No origin, using first allowed origin:', allowedOrigins[0]);
    return allowedOrigins[0]; // Use first allowed origin
  }
  
  // Check if origin is in our allowed list
  if (allowedOrigins.includes(origin)) {
    console.log('[PASSKEY] Origin is allowed:', origin);
    return origin;
  }
  
  // If not in our list, log a warning and use default
  console.warn('[PASSKEY] Origin not in allowed list:', origin, 'Using default:', allowedOrigins[0]);
  return allowedOrigins[0]; 
};

// 1. Generate options for creating a new passkey
app.post('/api/passkey/generate-registration-options', async (req, res) => {
  console.log('[PASSKEY] Registration options requested', { body: req.body, origin: req.headers.origin });
  const { curp, nombre } = req.body;

  if (!curp || !nombre) {
    console.error('[PASSKEY] Missing required fields', { curp, nombre });
    return res.status(400).json({ error: 'CURP y nombre son requeridos.' });
  }
  
  // Store challenge in the user's session instead of in-memory object
  if (!req.session) {
    console.error('[PASSKEY] No session available for storing challenge');
    return res.status(500).json({ error: 'Error de sesión. Intente nuevamente.' });
  }
  try {    console.log('[PASSKEY] Generating registration options with params:', { 
      rpName, 
      rpID, 
      userID: curp,
      userName: nombre,
      origin: req.headers.origin
    });
      // Generate registration options
    // Convert the CURP string to a Uint8Array for userID since recent versions (v13+)
    // no longer support string values for userID - this is REQUIRED
    const textEncoder = new TextEncoder();
    const userIDBuffer = textEncoder.encode(curp);
    
    console.log('[PASSKEY] Created userIDBuffer:', {
      originalCurp: curp,
      bufferType: userIDBuffer.constructor.name,
      bufferLength: userIDBuffer.length,
      bufferSample: Array.from(userIDBuffer.slice(0, 10))
    });
    
    const options = await generateRegistrationOptions({
      rpName,
      rpID,
      userID: userIDBuffer, // Must be a Buffer or Uint8Array in newer versions
      userName: nombre,
      attestationType: 'none',
      authenticatorSelection: {
        residentKey: 'required',
        userVerification: 'preferred',
        // Allow both platform and cross-platform authenticators
        authenticatorAttachment: 'platform', // 'platform' restricts to device-bound authenticators
      },
      // Add a timeout to give users enough time
      timeout: 60000, // 1 minute
    });    console.log('[PASSKEY] Registration options generated', { 
      rpID: options.rp.id,
      challenge: options.challenge.slice(0, 10) + '...',
      userId: options.user.id,
      userName: options.user.name
    });    
    
    // Store the challenge in the session instead of in-memory storage
    req.session.passkeyRegistrationChallenge = options.challenge;
    req.session.passkeyRegistrationCurp = curp;
    
    console.log('[PASSKEY] Stored challenge in session with ID:', req.session.id);

    res.json(options);
  } catch (error) {
    console.error('[PASSKEY] Error generating registration options:', error);
    console.error('[PASSKEY] Error details:', { 
      name: error.name,
      message: error.message,
      stack: error.stack,
      code: error.code
    });
    
    // Ensure we're always returning valid JSON
    try {
      res.status(500).json({ 
        error: error.message || 'Error generating registration options',
        errorType: error.name || 'Unknown',
        errorCode: error.code || 'none'
      });
    } catch (jsonError) {
      console.error('[PASSKEY] Error sending JSON response:', jsonError);
      res.status(500).send('Internal Server Error: ' + (error.message || 'Unknown error'));
    }
  }
});

// 2. Verify the new passkey and save it
app.post('/api/passkey/verify-registration', async (req, res) => {
  console.log('[PASSKEY] Verify registration requested', { 
    body: req.body ? { 
      curp: req.body.curp,
      hasCredential: !!req.body.credential 
    } : 'No body',
    origin: req.headers.origin,
    headers: Object.keys(req.headers),
    cookies: req.cookies ? Object.keys(req.cookies) : 'No cookies',
    session: req.session ? {
      id: req.session.id,
      hasChallenge: !!req.session.passkeyRegistrationChallenge,
      sessionCurp: req.session.passkeyRegistrationCurp,
    } : 'No session'
  });
  
  const { curp, credential } = req.body;
  
  if (!req.session || !req.session.passkeyRegistrationChallenge) {
    console.error('[PASSKEY] No session or challenge found in session', {
      hasSession: !!req.session,
      hasChallenge: req.session ? !!req.session.passkeyRegistrationChallenge : false,
      sessionID: req.session?.id
    });
    return res.status(400).json({ error: 'Sesión no encontrada o expirada. Por favor, intente registrarse nuevamente.' });
  }
  
  // Get challenge from session
  const expectedChallenge = req.session.passkeyRegistrationChallenge;
  const sessionCurp = req.session.passkeyRegistrationCurp;
  
  if (sessionCurp !== curp) {
    console.error('[PASSKEY] CURP mismatch', {
      requestCurp: curp,
      sessionCurp: sessionCurp
    });
    return res.status(400).json({ error: 'Error de identificación. Por favor, intente registrarse nuevamente.' });
  }

  if (!curp || !credential) {
    console.error('[PASSKEY] Missing required fields:', { 
      hasCurp: !!curp, 
      hasCredential: !!credential
    });
    return res.status(400).json({ error: 'Faltan datos requeridos para la verificación.' });
  }
  try {
    const expectedOrigin = checkOrigin(req.headers.origin);
    console.log('[PASSKEY] Verifying registration response with:', {
      expectedOrigin,
      expectedRPID: rpID,
      challengeLength: expectedChallenge.length,
      credentialType: credential.type,
      credentialId: credential.id,
      responseType: credential.response ? Object.keys(credential.response) : 'No response'
    });
    
    // Verify the registration response
    const verification = await verifyRegistrationResponse({
      response: credential,
      expectedChallenge,
      // Look up the proper origin based on the request's origin header
      expectedOrigin,
      expectedRPID: rpID,
      requireUserVerification: false, // Set to false to be more permissive during registration
    });

    console.log('[PASSKEY] Verification result:', { 
      verified: verification.verified,
      registrationInfo: verification.registrationInfo ? 'Present' : 'Missing'
    });    if (verification.verified && verification.registrationInfo) {
      // In @simplewebauthn/server v13+, the structure is different
      const registrationInfo = verification.registrationInfo;
      
      console.log('[PASSKEY] Full registration info structure:', {
        keys: Object.keys(registrationInfo),
        hasCredential: !!registrationInfo.credential,
        credentialKeys: registrationInfo.credential ? Object.keys(registrationInfo.credential) : 'No credential'
      });

      // Extract credential data from the new structure
      const credentialData = registrationInfo.credential || registrationInfo;
      const credentialID = credentialData.id || credentialData.credentialID;
      const credentialPublicKey = credentialData.publicKey || credentialData.credentialPublicKey;
      const counter = credentialData.counter || registrationInfo.counter || 0;

      // Check if required data is present before proceeding
      if (!credentialID || !credentialPublicKey) {
        console.error('[PASSKEY] Missing credential data:', {
          hasCredentialID: !!credentialID,
          hasCredentialPublicKey: !!credentialPublicKey,
          registrationInfoKeys: Object.keys(registrationInfo),
          credentialDataKeys: credentialData ? Object.keys(credentialData) : 'No credentialData'
        });
        return res.status(400).json({ error: 'Datos de credencial incompletos. Intente registrarse nuevamente.' });
      }

      console.log('[PASSKEY] Credential details for DB storage:', {
        idType: typeof credentialID,
        idLength: credentialID.length,
        keyType: typeof credentialPublicKey,
        keyLength: credentialPublicKey.length,
        counter: counter
      });      // Create structure to store in the database
      // Note: credentialID is already base64url encoded by the browser
      const newPasskey = {
        credentialID: credentialID, // Don't double-encode - it's already base64url
        publicKey: Buffer.from(credentialPublicKey).toString('base64url'),
        counter,
        transports: credential.response.transports || [],
        createdAt: Date.now()
      };

      try {
        // Connect to MongoDB
        const client = await MongoClient.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017');
        const db = client.db(process.env.DB_NAME || 'sistema_votaciones_etica');
        const usersCollection = db.collection('users');
          // Let's check if the user exists first
        const existingUser = await usersCollection.findOne({ curp: curp });
        
        if (!existingUser) {
          console.error('[PASSKEY] User not found for passkey registration:', { curp });
          client.close();
          return res.status(404).json({ error: 'Usuario no encontrado' });
        }
        
        console.log('[PASSKEY] Found existing user for passkey registration:', { 
          curp, 
          userId: existingUser._id,
          hasPasskeys: !!existingUser.passkeys,
          passkeysCount: existingUser.passkeys?.length || 0
        });
        
        // Update the user document
        const result = await usersCollection.updateOne(
          { curp: curp },
          { 
            $push: { passkeys: newPasskey },
            $set: { hasPasskeyRegistered: true }
          }
        );
        
        if (result.matchedCount === 0) {
          client.close();
          return res.status(404).json({ error: 'Usuario no encontrado' });
        }
        
        // Log the update result
        console.log('[PASSKEY] User update result:', { 
          matchedCount: result.matchedCount,
          modifiedCount: result.modifiedCount,
          upsertedCount: result.upsertedCount,
          upsertedId: result.upsertedId
        });
        
        client.close();
        // Clean up challenge from session
        delete req.session.passkeyRegistrationChallenge;
        delete req.session.passkeyRegistrationCurp;
        return res.json({ verified: true, message: 'Passkey registrada exitosamente.' });
      } catch (dbError) {
        console.error('Database error when saving passkey:', dbError);
        return res.status(500).json({ error: 'Error al guardar la passkey en la base de datos' });
      }
    }
  } catch (error) {
    console.error('Error verifying registration:', error);
    return res.status(400).json({ error: error.message });
  }

  res.status(400).json({ verified: false, error: 'La verificación falló.' });
});

// 3. Generate options for signing in with a passkey
app.post('/api/passkey/generate-authentication-options', async (req, res) => {
  try {
    const options = await generateAuthenticationOptions({
      rpID,
      allowCredentials: [], // Empty for discoverable credentials (passkeys)
      userVerification: 'preferred',
    });

    // Store the challenge in the session
    req.session.passkeyChallenge = options.challenge;
    
    res.json(options);
  } catch (error) {
    console.error('Error generating authentication options:', error);
    res.status(500).json({ error: error.message });
  }
});

// 4. Verify the passkey sign-in
app.post('/api/passkey/verify-authentication', async (req, res) => {
  console.log('[PASSKEY] Verify authentication requested', { 
    body: req.body ? {
      hasCredential: !!req.body.credential,
      credentialId: req.body.credential?.id,
    } : 'No body',
    session: req.session ? {
      id: req.session.id,
      hasChallenge: !!req.session.passkeyChallenge
    } : 'No session'
  });
  
  const { credential } = req.body;
  const expectedChallenge = req.session?.passkeyChallenge;

  if (!credential) {
    console.error('[PASSKEY] No credential provided for authentication');
    return res.status(400).json({ error: 'No se proporcionó credencial para autenticación.' });
  }

  if (!expectedChallenge) {
    console.error('[PASSKEY] No challenge found in session');
    return res.status(400).json({ error: 'Desafío no encontrado o expirado.' });
  }

  try {
    const credentialID = credential.id;
    console.log('[PASSKEY] Looking up user by credential ID:', credentialID);
    
    try {
      // Connect to MongoDB
      const client = await MongoClient.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017');
      const db = client.db(process.env.DB_NAME || 'sistema_votaciones_etica');
      const usersCollection = db.collection('users');
      
      // First, let's check if we have any users with passkeys at all
      const usersWithPasskeys = await usersCollection.countDocuments({
        "passkeys.0": { $exists: true } // Check if at least one passkey exists
      });
      
      console.log(`[PASSKEY] Found ${usersWithPasskeys} users with passkeys`);
      
      // If we have users with passkeys, let's list all credential IDs in the system
      if (usersWithPasskeys > 0) {
        const allUsers = await usersCollection.find({ "passkeys.0": { $exists: true } }).toArray();
        
        console.log('[PASSKEY] All registered passkey credentials:', 
          allUsers.flatMap(u => (u.passkeys || []).map(p => ({
            user: u.curp,
            credentialID: p.credentialID,
            matches: p.credentialID === credentialID
          })))
        );
      }      // Find the user with this credential ID - try both exact match and double-encoded variants
      let user = await usersCollection.findOne({ 
        "passkeys.credentialID": credentialID 
      });
      
      // If not found, try looking for double-encoded version (backwards compatibility)
      if (!user) {
        const doubleEncodedCredentialID = Buffer.from(credentialID).toString('base64url');
        user = await usersCollection.findOne({ 
          "passkeys.credentialID": doubleEncodedCredentialID 
        });
        
        if (user) {
          console.log('[PASSKEY] Found user with double-encoded credential ID (legacy format)');
        }
      }
      
      // If still not found, let's try manual comparison for debugging
      if (!user) {
        console.log('[PASSKEY] Direct lookup failed, trying alternative lookups...');
        
        // Get all users with passkeys and manually check
        const allUsersWithPasskeys = await usersCollection.find({ 
          "passkeys.0": { $exists: true } 
        }).toArray();
        
        for (const u of allUsersWithPasskeys) {
          for (const p of u.passkeys || []) {
            try {
              // Check if the stored credentialID matches the browser's credentialID
              const storedAsBuffer = Buffer.from(p.credentialID, 'base64url');
              const browserAsBuffer = Buffer.from(credentialID, 'base64url');
              
              console.log('[PASSKEY] Comparing credentials:', {
                storedID: p.credentialID,
                browserID: credentialID,
                storedBuffer: storedAsBuffer.toString('hex'),
                browserBuffer: browserAsBuffer.toString('hex'),
                buffersMatch: storedAsBuffer.equals(browserAsBuffer)
              });
              
              if (storedAsBuffer.equals(browserAsBuffer) || p.credentialID === credentialID) {
                user = u;
                console.log('[PASSKEY] Found matching user via buffer comparison:', u.curp);
                break;
              }
            } catch (compareError) {
              console.log('[PASSKEY] Error comparing credential:', compareError.message);
            }
          }
          if (user) break;
        }
      }
      
      if (!user) {
        client.close();
        return res.status(404).json({ error: 'No se encontró un usuario con esta passkey' });
      }
        // Find the specific passkey credential
      let passkey = user.passkeys.find((p) => p.credentialID === credentialID);
      
      // If not found by direct match, try buffer comparison
      if (!passkey) {
        console.log('[PASSKEY] Direct passkey lookup failed, trying buffer comparison...');
        passkey = user.passkeys.find((p) => {
          try {
            const storedAsBuffer = Buffer.from(p.credentialID, 'base64url');
            const browserAsBuffer = Buffer.from(credentialID, 'base64url');
            return storedAsBuffer.equals(browserAsBuffer);
          } catch (error) {
            return false;
          }
        });
      }
      
      if (!passkey) {
        console.error('[PASSKEY] Passkey not found for user:', { 
          userCurp: user.curp,
          userPasskeys: user.passkeys.map(p => p.credentialID),
          lookingFor: credentialID
        });
        client.close();
        return res.status(404).json({ error: 'Credencial no encontrada' });
      }
      
      console.log('[PASSKEY] Found matching passkey:', {
        credentialID: passkey.credentialID,
        counter: passkey.counter,
        transports: passkey.transports
      });
        // Prepare authenticator data for verification - updated for v13+
      const authenticator = {
        credentialID: Buffer.from(passkey.credentialID, 'base64url'), // Convert back to Uint8Array
        credentialPublicKey: Buffer.from(passkey.publicKey, 'base64url'),
        counter: passkey.counter,
        transports: passkey.transports
      };
      
      console.log('[PASSKEY] Authenticator data prepared:', {
        credentialID: passkey.credentialID,
        hasPublicKey: !!authenticator.credentialPublicKey,
        counter: authenticator.counter,
        transports: authenticator.transports
      });
      
      const verification = await verifyAuthenticationResponse({
        response: credential,
        expectedChallenge,
        expectedOrigin: checkOrigin(req.headers.origin), // Use the checkOrigin function
        expectedRPID: rpID,
        credential: { // Changed from 'authenticator' to 'credential' for v13+
          id: authenticator.credentialID,
          publicKey: authenticator.credentialPublicKey,
          counter: authenticator.counter,
          transports: authenticator.transports
        },
        requireUserVerification: false // Set to false to be more permissive
      });
          // Clear all challenges from the session
      if (req.session) {
        delete req.session.passkeyChallenge;
        delete req.session.passkeyRegistrationChallenge;
        delete req.session.passkeyRegistrationCurp;
      }
      
      if (verification.verified) {
        // Update the authenticator counter
        await usersCollection.updateOne(
          { "passkeys.credentialID": credentialID },
          { $set: { "passkeys.$.counter": verification.authenticationInfo.newCounter } }
        );
          // Create a session BEFORE closing the client
        const sessionId = crypto.randomBytes(32).toString('hex');
        const sessionTimestamp = Date.now();
        
        await db.collection('auth_sessions').insertOne({
          curp: user.curp,
          sessionId: sessionId,
          active: true,
          timestamp: sessionTimestamp
        });
        
        client.close();
        
        return res.json({ 
          verified: true, 
          message: 'Autenticación exitosa.',
          user: {
            curp: user.curp,
            nombre: user.nombre,
            apellidoPaterno: user.apellidoPaterno,
            apellidoMaterno: user.apellidoMaterno,
            email: user.email,
            role: user.role
          },
          sessionId
        });
      }
      
      client.close();
      return res.json({ verified: false, error: 'La verificación falló.' });
    } catch (dbError) {
      console.error('Database error during passkey authentication:', dbError);
      return res.status(500).json({ error: 'Error de base de datos durante la autenticación' });
    }
  } catch (error) {
    console.error('Error verifying authentication:', error);
    res.status(400).json({ error: error.message });
  }
});
// --- END PASSKEY AUTHENTICATION ENDPOINTS ---

// CURP Validation Proxy Endpoint
app.post('/api/curp/validate', async (req, res) => {
  try {
    const { curp } = req.body;
    
    if (!curp) {
      return res.status(400).json({
        success: false,
        error: 'CURP requerido',
        message: 'El CURP es obligatorio para la validación.'
      });
    }

    console.log('[CURP_PROXY] Validating CURP:', curp);

    // Make request to external CURP API
    const response = await axios.post('http://52.7.54.179:3000/api/v1/curp/validate', {
      curp: curp.toUpperCase()
    }, {
      timeout: 15000, // 15 seconds timeout
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('[CURP_PROXY] API Response:', {
      status: response.status,
      success: response.data.success,
      hasData: !!response.data.data
    });

    // Forward the response from the external API
    res.json(response.data);

  } catch (error) {
    console.error('[CURP_PROXY] Error validating CURP:', error);
    
    if (error.response) {
      // Server responded with error status
      const errorData = error.response.data;
      res.status(error.response.status).json({
        success: false,
        error: errorData.error || 'Error del servidor',
        message: errorData.message || `Error HTTP ${error.response.status}`,
        code: errorData.code || `HTTP_${error.response.status}`
      });
    } else if (error.request) {
      // Network error
      res.status(503).json({
        success: false,
        error: 'Error de conexión',
        message: 'No se pudo conectar con el servicio de validación de CURP. Intente más tarde.',
        code: 'NETWORK_ERROR'
      });
    } else {
      // Other error
      res.status(500).json({
        success: false,
        error: 'Error interno',
        message: error.message || 'Error desconocido al validar CURP',
        code: 'INTERNAL_ERROR'
      });
    }
  }
});

// Debug endpoint to check passkey storage and lookup
app.get('/api/passkey/debug-credentials', async (req, res) => {
  try {
    const client = await MongoClient.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017');
    const db = client.db(process.env.DB_NAME || 'sistema_votaciones_etica');
    const usersCollection = db.collection('users');
    
    const usersWithPasskeys = await usersCollection.find({ 
      "passkeys.0": { $exists: true } 
    }).toArray();
    
    const debugInfo = usersWithPasskeys.map(user => ({
      curp: user.curp,
      nombre: user.nombre,
      passkeys: (user.passkeys || []).map(p => ({
        credentialID: p.credentialID,
        credentialIDAsHex: Buffer.from(p.credentialID, 'base64url').toString('hex'),
        counter: p.counter,
        transports: p.transports
      }))
    }));
    
    client.close();
    res.json({
      totalUsers: usersWithPasskeys.length,
      users: debugInfo
    });
  } catch (error) {
    console.error('[PASSKEY] Debug endpoint error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Start the server and listen on the specified port
app.listen(PORT, () => {
  console.log(`
============================================
📧 Servidor principal corriendo en puerto ${PORT}
============================================
🔐 WebAuthn/Passkey endpoints:
  POST /api/passkey/generate-registration-options
  POST /api/passkey/verify-registration
  POST /api/passkey/generate-authentication-options
  POST /api/passkey/verify-authentication

🆔 CURP Validation endpoint:
  POST /api/curp/validate

📝 RPID configurado como: ${rpID}
🌐 Orígenes permitidos: ${JSON.stringify(allowedOrigins)}
============================================
  `);
});

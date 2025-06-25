// services/smtpConfigService.ts
import { SmtpConfiguration } from '../types';
import { insertIntoCollection, getFromCollection, updateInCollection } from './databaseService';

export interface SmtpConfig {
  provider: string;
  host: string;
  port: number;
  secure: boolean;
  username: string;
  password: string;
  fromName: string;
  fromAddress: string;
  isActive: boolean;
  customSettings?: Record<string, any>;
}

export interface SmtpProvider {
  id: string;
  name: string;
  host: string;
  ports: { secure: number; starttls: number };
  secure: boolean;
  description: string;
  authType: 'password' | 'oauth' | 'api-key';
  settings?: Record<string, any>;
}

// Proveedores SMTP predefinidos
export const SMTP_PROVIDERS: SmtpProvider[] = [
  {
    id: 'gmail',
    name: 'Gmail',
    host: 'smtp.gmail.com',
    ports: { secure: 465, starttls: 587 },
    secure: true,
    description: 'Servidor SMTP de Gmail. Requiere contraseña de aplicación (no tu contraseña normal).',
    authType: 'password',
    settings: {
      setupInstructions: 'Habilita la verificación en 2 pasos y genera una contraseña de aplicación en tu cuenta de Google.',
      documentationUrl: 'https://support.google.com/accounts/answer/185833'
    }
  },
  {
    id: 'outlook',
    name: 'Outlook.com / Hotmail',
    host: 'smtp-mail.outlook.com',
    ports: { secure: 465, starttls: 587 },
    secure: false,
    description: 'Servidor SMTP de Outlook.com y Hotmail. Compatible con cuentas personales.',
    authType: 'password',
    settings: {
      setupInstructions: 'Usa tu email y contraseña normal de Outlook.com.',
      documentationUrl: 'https://support.microsoft.com/outlook'
    }
  },
  {
    id: 'office365',
    name: 'Microsoft 365 / Office 365',
    host: 'smtp.office365.com',
    ports: { secure: 465, starttls: 587 },
    secure: false,
    description: 'Servidor SMTP de Microsoft 365 para organizaciones y empresas.',
    authType: 'password',
    settings: {
      setupInstructions: 'Usa tu email corporativo y contraseña. Puede requerir autenticación moderna.',
      documentationUrl: 'https://docs.microsoft.com/exchange/mail-flow-best-practices/how-to-set-up-a-multifunction-device-or-application-to-send-email-using-microsoft-365-or-office-365'
    }
  },
  {
    id: 'yahoo',
    name: 'Yahoo Mail',
    host: 'smtp.mail.yahoo.com',
    ports: { secure: 465, starttls: 587 },
    secure: true,
    description: 'Servidor SMTP de Yahoo Mail. Requiere contraseña de aplicación.',
    authType: 'password',
    settings: {
      setupInstructions: 'Genera una contraseña de aplicación en la configuración de seguridad de Yahoo.',
      documentationUrl: 'https://help.yahoo.com/kb/generate-app-password-sln15241.html'
    }
  },
  {
    id: 'icloud',
    name: 'iCloud Mail',
    host: 'smtp.mail.me.com',
    ports: { secure: 465, starttls: 587 },
    secure: true,
    description: 'Servidor SMTP de iCloud Mail de Apple.',
    authType: 'password',
    settings: {
      setupInstructions: 'Requiere contraseña específica de aplicación desde tu ID de Apple.',
      documentationUrl: 'https://support.apple.com/HT202304'
    }
  },
  {
    id: 'resend',
    name: 'Resend',
    host: 'smtp.resend.com',
    ports: { secure: 465, starttls: 587 },
    secure: true,
    description: 'Servicio SMTP moderno de Resend. Ideal para aplicaciones y desarrollo.',
    authType: 'api-key',
    settings: {
      setupInstructions: 'Usa "resend" como usuario y tu API key como contraseña.',
      documentationUrl: 'https://resend.com/docs/send-with-smtp'
    }
  },
  {
    id: 'sendgrid',
    name: 'SendGrid (Twilio)',
    host: 'smtp.sendgrid.net',
    ports: { secure: 465, starttls: 587 },
    secure: false,
    description: 'Servicio SMTP profesional de SendGrid by Twilio.',
    authType: 'api-key',
    settings: {
      setupInstructions: 'Usa "apikey" como usuario y tu API key de SendGrid como contraseña.',
      documentationUrl: 'https://docs.sendgrid.com/for-developers/sending-email/integrating-with-the-smtp-api'
    }
  },
  {
    id: 'mailgun',
    name: 'Mailgun',
    host: 'smtp.mailgun.org',
    ports: { secure: 465, starttls: 587 },
    secure: false,
    description: 'Servicio SMTP robusto de Mailgun para aplicaciones.',
    authType: 'password',
    settings: {
      setupInstructions: 'Usa tu dominio de Mailgun y las credenciales SMTP de tu panel.',
      documentationUrl: 'https://documentation.mailgun.com/en/latest/user_manual.html#sending-via-smtp'
    }
  },
  {
    id: 'ses',
    name: 'Amazon SES',
    host: 'email-smtp.us-east-1.amazonaws.com',
    ports: { secure: 465, starttls: 587 },
    secure: false,
    description: 'Amazon Simple Email Service. Servicio escalable de AWS.',
    authType: 'password',
    settings: {
      setupInstructions: 'Crea credenciales SMTP en la consola de SES. Cambia la región si es necesario.',
      documentationUrl: 'https://docs.aws.amazon.com/ses/latest/dg/smtp-credentials.html'
    }
  },
  {
    id: 'zoho',
    name: 'Zoho Mail',
    host: 'smtp.zoho.com',
    ports: { secure: 465, starttls: 587 },
    secure: true,
    description: 'Servidor SMTP de Zoho Mail para cuentas profesionales.',
    authType: 'password',
    settings: {
      setupInstructions: 'Usa tu email y contraseña de Zoho Mail.',
      documentationUrl: 'https://www.zoho.com/mail/help/zoho-smtp.html'
    }
  },
  {
    id: 'postmark',
    name: 'Postmark',
    host: 'smtp.postmarkapp.com',
    ports: { secure: 465, starttls: 587 },
    secure: false,
    description: 'Servicio SMTP confiable de Postmark para correos transaccionales.',
    authType: 'api-key',
    settings: {
      setupInstructions: 'Usa tu Server Token como usuario y cualquier valor como contraseña.',
      documentationUrl: 'https://postmarkapp.com/developer/user-guide/sending-email/sending-with-smtp'
    }
  },
  {
    id: 'mailchimp',
    name: 'Mailchimp Transactional',
    host: 'smtp.mandrillapp.com',
    ports: { secure: 465, starttls: 587 },
    secure: false,
    description: 'Servicio SMTP transaccional de Mailchimp (anteriormente Mandrill).',
    authType: 'api-key',
    settings: {
      setupInstructions: 'Usa tu email de Mailchimp como usuario y tu API key como contraseña.',
      documentationUrl: 'https://mailchimp.com/developer/transactional/guides/smtp-integration/'
    }
  },
  {
    id: 'custom',
    name: 'Configuración Personalizada',
    host: '',
    ports: { secure: 465, starttls: 587 },
    secure: false,
    description: 'Configura un servidor SMTP personalizado con tus propios parámetros.',
    authType: 'password',
    settings: {
      setupInstructions: 'Ingresa manualmente la configuración de tu proveedor SMTP.',
      documentationUrl: ''
    }
  }
];

const STORAGE_KEY = 'smtp_configuration';
const COLLECTIONS = {
  SMTP_CONFIGURATIONS: 'smtp_configurations'
};

/**
 * Gets the current SMTP configuration from database (fallback to localStorage)
 */
export const getSmtpConfig = async (): Promise<SmtpConfig | null> => {
  try {
    // Try to get from database first
    const configs = await getFromCollection<SmtpConfiguration>(COLLECTIONS.SMTP_CONFIGURATIONS, { isActive: true });
    if (configs.length > 0) {
      const dbConfig = configs[0];
      return {
        provider: dbConfig.provider,
        host: dbConfig.host,
        port: dbConfig.port,
        secure: dbConfig.secure,
        username: dbConfig.username,
        password: dbConfig.password,
        fromName: dbConfig.fromName,
        fromAddress: dbConfig.fromAddress,
        isActive: dbConfig.isActive,
        customSettings: dbConfig.customSettings
      };
    }
  } catch (error) {
    console.warn('Database unavailable, falling back to localStorage:', error);
  }

  // Fallback to localStorage
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.error('Error reading SMTP config:', error);
    return null;
  }
};

/**
 * Saves SMTP configuration to database and localStorage
 */
export const saveSmtpConfig = async (config: SmtpConfig, createdBy: string = 'system'): Promise<boolean> => {
  try {
    // Save to database
    const dbConfig: SmtpConfiguration = {
      id: 'active_smtp_config',
      provider: config.provider,
      host: config.host,
      port: config.port,
      secure: config.secure,
      username: config.username,
      password: config.password, // In production, this should be encrypted
      fromName: config.fromName,
      fromAddress: config.fromAddress,
      isActive: config.isActive,
      customSettings: config.customSettings || {},
      createdAt: Date.now(),
      updatedAt: Date.now(),
      createdBy
    };

    // First, deactivate any existing configurations
    const existingConfigs = await getFromCollection<SmtpConfiguration>(COLLECTIONS.SMTP_CONFIGURATIONS, { isActive: true });
    for (const existingConfig of existingConfigs) {
      await updateInCollection(COLLECTIONS.SMTP_CONFIGURATIONS, { id: existingConfig.id }, { isActive: false, updatedAt: Date.now() });
    }

    // Check if this config already exists
    const existing = await getFromCollection<SmtpConfiguration>(COLLECTIONS.SMTP_CONFIGURATIONS, { id: dbConfig.id });
    if (existing.length > 0) {
      await updateInCollection(COLLECTIONS.SMTP_CONFIGURATIONS, { id: dbConfig.id }, dbConfig);
    } else {
      await insertIntoCollection(COLLECTIONS.SMTP_CONFIGURATIONS, dbConfig);
    }

    // Also save to localStorage as backup
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    return true;
  } catch (error) {
    console.error('Error saving SMTP config to database, saving to localStorage only:', error);
    // If database fails, at least save to localStorage
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
      return true;
    } catch (localError) {
      console.error('Error saving SMTP config:', localError);
      return false;
    }
  }
};

/**
 * Tests SMTP configuration by sending a test email
 */
export const testSmtpConfig = async (config: SmtpConfig): Promise<{ success: boolean; message: string }> => {
  try {
    const response = await fetch('/api/test-smtp-config', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(config),
    });

    if (!response.ok) {
      const error = await response.text();
      return { success: false, message: `Error del servidor: ${error}` };
    }

    const result = await response.json();
    return { success: true, message: result.message || 'Configuración SMTP válida' };
  } catch (error: any) {
    return { success: false, message: `Error de conexión: ${error.message}` };
  }
};

/**
 * Applies SMTP configuration to the backend and saves to database
 */
export const applySmtpConfig = async (config: SmtpConfig, createdBy: string = 'system'): Promise<{ success: boolean; message: string }> => {
  try {
    const response = await fetch('/api/apply-smtp-config', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(config),
    });

    if (!response.ok) {
      const error = await response.text();
      return { success: false, message: `Error del servidor: ${error}` };
    }

    const result = await response.json();
    
    // Save to database and localStorage if successful
    const saved = await saveSmtpConfig(config, createdBy);
    if (saved) {
      return { success: true, message: result.message || 'Configuración SMTP aplicada correctamente' };
    } else {
      return { success: false, message: 'Configuración aplicada al servidor pero no se pudo guardar en base de datos' };
    }
  } catch (error: any) {
    return { success: false, message: `Error de conexión: ${error.message}` };
  }
};

/**
 * Gets current server SMTP status
 */
export const getSmtpStatus = async (): Promise<{ success: boolean; config?: any; message: string }> => {
  try {
    const response = await fetch('/api/smtp-status');
    
    if (!response.ok) {
      return { success: false, message: 'No se pudo obtener el estado del servidor SMTP' };
    }

    const data = await response.json();
    return { success: true, config: data.config, message: data.message || 'Estado obtenido correctamente' };
  } catch (error: any) {
    return { success: false, message: `Error de conexión: ${error.message}` };
  }
};

/**
 * Gets provider by ID
 */
export const getProviderById = (providerId: string): SmtpProvider | null => {
  return SMTP_PROVIDERS.find(provider => provider.id === providerId) || null;
};

/**
 * Validates SMTP configuration
 */
export const validateSmtpConfig = (config: Partial<SmtpConfig>): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!config.provider) {
    errors.push('Debe seleccionar un proveedor SMTP');
  }

  if (!config.host?.trim()) {
    errors.push('El host SMTP es requerido');
  }

  if (!config.port || config.port < 1 || config.port > 65535) {
    errors.push('El puerto debe ser un número entre 1 y 65535');
  }

  if (!config.username?.trim()) {
    errors.push('El nombre de usuario es requerido');
  }

  if (!config.password?.trim()) {
    errors.push('La contraseña es requerida');
  }

  if (!config.fromAddress?.trim()) {
    errors.push('La dirección de remitente es requerida');
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(config.fromAddress)) {
    errors.push('La dirección de remitente debe ser un email válido');
  }

  if (!config.fromName?.trim()) {
    errors.push('El nombre del remitente es requerido');
  }

  return { valid: errors.length === 0, errors };
};

/**
 * Creates default SMTP configuration based on provider
 */
export const createDefaultConfig = (providerId: string): Partial<SmtpConfig> => {
  const provider = getProviderById(providerId);
  
  if (!provider) {
    return {};
  }

  return {
    provider: providerId,
    host: provider.host,
    port: provider.secure ? provider.ports.secure : provider.ports.starttls,
    secure: provider.secure,
    username: '',
    password: '',
    fromName: 'Sistema de Votaciones',
    fromAddress: '',
    isActive: false
  };
};

// services/emailService.ts

/**
 * Realiza una llamada a un API backend para enviar un correo de verificación.
 *
 * !! IMPORTANTE !!
 * Esta función AHORA INTENTARÁ HACER UNA LLAMADA HTTP REAL a '/api/send-verification-email'.
 * DEBES IMPLEMENTAR UN SERVIDOR BACKEND que escuche en este endpoint y maneje el envío real de correos
 * utilizando tus credenciales SMTP de forma segura.
 *
 * El backend SÍ PUEDE y DEBE usar de forma segura un archivo .env para cargar
 * las credenciales SMTP (ej: process.env.SMTP_HOST, process.env.SMTP_USER, process.env.SMTP_PASSWORD)
 * y utilizar una librería SMTP (como Nodemailer en Node.js) para enviar el correo real.
 *
 * Credenciales SMTP (SOLO para referencia en tu futuro backend, NO USAR EN FRONTEND):
 * Host: smtp.resend.com
 * Port: 465 (TLS) / 587 (STARTTLS)
 * User: resend
 * Password: re_XxAQh7ST_BSmgR2L6atYNr861WWxKvMuH (EJEMPLO - USA TU CREDENCIAL REAL EN EL .ENV DEL BACKEND)
 *
 * @param email La dirección de correo electrónico a la que se enviará el token.
 * @param token El token de verificación.
 * @returns Un Promise que resuelve a `true` si la llamada al backend fue exitosa (HTTP 2xx), `false` en caso contrario.
 */
export const sendVerificationEmail = async (email: string, token: string): Promise<boolean> => {
  console.log(`[EmailService] Intentando enviar correo de verificación a: ${email} con token: ${token} via backend.`);

  try {
    // Asegúrate de que la URL del endpoint sea la correcta para tu backend.
    // Si tu frontend y backend corren en diferentes dominios/puertos durante el desarrollo,
    // necesitarás configurar CORS en tu backend y usar la URL completa del backend aquí.
    // Ejemplo: const backendUrl = 'http://localhost:3001/api/send-verification-email';
    const response = await fetch('/api/send-verification-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, token }),
    });

    if (!response.ok) {
      let errorMessage = `Error del backend: ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage += ` - ${errorData.message || 'Mensaje de error no proporcionado por el backend.'}`;
      } catch (e) {
        // No se pudo parsear JSON del error, usar texto de respuesta si existe
        const textError = await response.text().catch(() => '');
        if(textError) errorMessage += ` - ${textError}`;
      }
      
      console.error(`[EmailService] ${errorMessage}`);
      
      // Notificación al administrador (simulada en consola, idealmente el backend lo haría mejor)
      const adminNotification = `[NOTIFICACIÓN AL ADMINISTRADOR (Frontend)] Fallo el endpoint de backend /api/send-verification-email.
        Destinatario: ${email}, Token: ${token}, Error: ${errorMessage}, Timestamp: ${new Date().toISOString()}`;
      console.warn(adminNotification);
      
      return false;
    }

    // Opcional: procesar respuesta exitosa del backend si es necesario
    // const responseData = await response.json(); 
    // console.log('[EmailService] Correo procesado por el backend:', responseData);
    console.log('[EmailService] Solicitud de envío de correo a backend fue exitosa.');
    return true;

  } catch (networkError: any) {
    console.error('[EmailService] Error de red al intentar contactar el backend para enviar correo:', networkError.message);
    // Notificación al administrador (simulada en consola)
      const adminNotification = `[NOTIFICACIÓN AL ADMINISTRADOR (Frontend)] Error de red al llamar a /api/send-verification-email.
        Destinatario: ${email}, Token: ${token}, Error: ${networkError.message}, Timestamp: ${new Date().toISOString()}`;
      console.warn(adminNotification);
    return false;
  }
};

/**
 * Sends candidacy withdrawal notification to superadministrator
 * @param user The user who withdrew their candidacy
 * @returns Promise<boolean> indicating success
 */
export const sendCandidacyWithdrawalNotification = async (user: any): Promise<boolean> => {
  console.log(`[EmailService] Enviando notificación de retiro de candidatura para: ${user.nombre} ${user.apellidoPaterno}`);

  try {
    const response = await fetch('/api/send-candidacy-withdrawal', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ user }),
    });

    if (!response.ok) {
      console.error(`[EmailService] Error al enviar notificación de retiro: ${response.status}`);
      return false;
    }

    console.log('[EmailService] Notificación de retiro de candidatura enviada exitosamente.');
    return true;

  } catch (error: any) {
    console.error('[EmailService] Error de red al enviar notificación de retiro:', error.message);
    return false;
  }
};

/**
 * Sends mass email to non-voters with configurable content
 * @param nonVoters Array of users who haven't voted
 * @param subject Email subject
 * @param content Email content
 * @returns Promise<boolean> indicating success
 */
export const sendMassEmailToNonVoters = async (nonVoters: any[], subject: string, content: string): Promise<boolean> => {
  console.log(`[EmailService] Enviando correo masivo a ${nonVoters.length} usuarios que no han votado`);

  try {
    const response = await fetch('/api/send-mass-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        recipients: nonVoters,
        subject,
        content,
        type: 'non-voters'
      }),
    });

    if (!response.ok) {
      console.error(`[EmailService] Error al enviar correo masivo: ${response.status}`);
      return false;
    }

    console.log('[EmailService] Correo masivo enviado exitosamente.');
    return true;

  } catch (error: any) {
    console.error('[EmailService] Error de red al enviar correo masivo:', error.message);
    return false;
  }
};

/**
 * Sends automated reminder emails for nomination/voting periods
 * @param recipients Array of users to send reminders to
 * @param reminderType Type of reminder ('nomination' | 'voting')
 * @param daysRemaining Number of days remaining in the period
 * @returns Promise<boolean> indicating success
 */
export const sendAutomatedReminder = async (recipients: any[], reminderType: 'nomination' | 'voting', daysRemaining: number): Promise<boolean> => {
  console.log(`[EmailService] Enviando recordatorio automático de ${reminderType} a ${recipients.length} usuarios`);

  try {
    const response = await fetch('/api/send-automated-reminder', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        recipients,
        reminderType,
        daysRemaining
      }),
    });

    if (!response.ok) {
      console.error(`[EmailService] Error al enviar recordatorio automático: ${response.status}`);
      return false;
    }

    console.log('[EmailService] Recordatorio automático enviado exitosamente.');
    return true;

  } catch (error: any) {
    console.error('[EmailService] Error de red al enviar recordatorio automático:', error.message);
    return false;
  }
};

/**
 * Sends admin registration email with setup instructions
 * @param email The admin's email address
 * @param adminName The admin's full name
 * @param registrationToken The registration token for password setup
 * @returns Promise<boolean> indicating success
 */
export const sendAdminRegistrationEmail = async (
  email: string, 
  adminName: string, 
  registrationToken: string
): Promise<boolean> => {
  console.log(`[EmailService] Enviando correo de registro para administrador: ${adminName} (${email})`);

  try {
    const response = await fetch('/api/send-admin-registration', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        email, 
        adminName, 
        registrationToken 
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[EmailService] Error al enviar correo de registro de administrador: ${response.status} - ${errorText}`);
      return false;
    }

    console.log('[EmailService] Correo de registro de administrador enviado exitosamente.');
    return true;

  } catch (error: any) {
    console.error('[EmailService] Error de red al enviar correo de registro de administrador:', error.message);
    return false;
  }
};

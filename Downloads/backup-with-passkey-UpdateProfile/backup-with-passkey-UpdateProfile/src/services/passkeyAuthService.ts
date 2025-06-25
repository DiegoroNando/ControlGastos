import {
  startRegistration,
  startAuthentication,
} from '@simplewebauthn/browser';

/**
 * Service for handling WebAuthn/passkey functionality on the frontend
 */
export const passkeyAuthService = {
  /**
   * Checks if passkeys are supported in the current browser
   * @returns Boolean indicating if passkeys are supported
   */
  isSupported(): boolean {
    // Check if the browser supports the WebAuthn API
    return (
      typeof window !== 'undefined' && 
      window.PublicKeyCredential !== undefined && 
      typeof window.PublicKeyCredential === 'function'
    );
  },
    /**
   * Begins the passkey registration process
   * @param curp User's CURP
   * @param nombre User's name
   * @returns Registration result from the WebAuthn process
   */
  async registerPasskey(curp: string, nombre: string) {
    try {
      console.log('Starting passkey registration for:', { curp, nombre });

      // Check if browser supports WebAuthn
      if (!this.isSupported()) {
        throw new Error('Tu navegador no soporta passkeys. Por favor, utiliza un navegador moderno como Chrome, Edge o Safari.');
      }
      
      // 1. Get registration options from the server
      console.log('Requesting registration options from server...');
      
      // Add a diagnostic ping to the server first to check connectivity
      try {
        const pingResponse = await fetch('/api/status', {
          method: 'GET',
          credentials: 'include',
        });
        console.log('Server ping status:', pingResponse.status, pingResponse.ok ? 'OK' : 'Failed');
      } catch (error) {
        const pingError = error as Error;
        console.error('Server ping failed:', pingError);
        throw new Error(`Error de conectividad con el servidor: ${pingError.message || 'Error desconocido'}`);
      }
      
      const optionsResponse = await fetch('/api/passkey/generate-registration-options', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ curp, nombre }),
        credentials: 'include', // Important for cookie session
      });
      
      console.log('Registration options response status:', optionsResponse.status);
      
      if (!optionsResponse.ok) {
        let errorMessage;
        try {
          // Try to parse as JSON first
          const errorData = await optionsResponse.json();
          errorMessage = errorData.error || `Error del servidor: ${optionsResponse.status}`;
          console.error('Server returned error:', errorData);
        } catch (e) {
          // If not JSON, try to get the raw text
          try {
            const textResponse = await optionsResponse.clone().text();
            errorMessage = `Error del servidor: ${optionsResponse.status} - ${textResponse.substring(0, 100)}`;
            console.error('Server returned non-JSON response:', textResponse);
          } catch (textError) {
            errorMessage = `Failed to parse error response: ${optionsResponse.status} ${optionsResponse.statusText}`;
            console.error('Failed to read error response:', textError);
          }
        }
        throw new Error(errorMessage);
      }
      
      // 2. Get the options from the server
      const options = await optionsResponse.json();
      console.log('Received registration options from server:', {
        rpID: options.rp?.id,
        timeout: options.timeout,
        challenge: options.challenge ? '[present]' : '[missing]',
        userID: options.user?.id,
        userName: options.user?.name,
        authenticatorSelection: options.authenticatorSelection
      });
      
      if (!options.challenge) {
        throw new Error('El servidor no proporcionó un challenge válido para el registro de passkey.');
      }      // 3. Start the registration process in the browser
      console.log('Starting browser registration process...');
        // Check if rpID is properly configured and matches the current domain
      const currentHost = window.location.hostname;
      console.log('WebAuthn validation check:', {
        rpID: options.rp?.id,
        currentHost,
        isMatching: options.rp?.id === currentHost || 
                    options.rp?.id === 'localhost' && (currentHost === 'localhost' || currentHost === '127.0.0.1'),
      });
      
      // SimpleWebAuthn v13+ requires passing options wrapped in an object with 'optionsJSON' property
      console.log('Starting WebAuthn registration with options:', {
        rpID: options.rp?.id,
        challenge: options.challenge ? '[present]' : '[missing]',
        userID: options.user?.id ? `Type: ${typeof options.user.id}, length: ${options.user.id.length}` : 'missing',
        userName: options.user?.name || 'missing',
        timeout: options.timeout
      });
      
      const registrationResponse = await startRegistration({ 
        optionsJSON: options
      });
      console.log('Browser registration process completed', {
        id: registrationResponse.id,
        type: registrationResponse.type,
        hasResponse: !!registrationResponse.response,
        responseType: registrationResponse.response ? Object.keys(registrationResponse.response) : []
      });
        // 4. Send the registration response to the server for verification
      console.log('Sending registration response to server for verification...');
      
      // Deep clone and log the registration response to ensure nothing is lost in serialization
      const responseForLog = JSON.parse(JSON.stringify(registrationResponse));
      console.log('Registration response being sent to server:', responseForLog);
      
      const verificationResponse = await fetch('/api/passkey/verify-registration', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          curp,
          credential: registrationResponse,
        }),
        credentials: 'include', // Important for cookie session
      });
      
      console.log('Verification response status:', verificationResponse.status);
      
      if (!verificationResponse.ok) {
        let errorMessage;
        try {
          const errorData = await verificationResponse.json();
          errorMessage = errorData.error || `Server verification error: ${verificationResponse.status}`;
        } catch (e) {
          errorMessage = `Failed to parse verification error: ${verificationResponse.status} ${verificationResponse.statusText}`;
        }
        throw new Error(errorMessage);
      }
      
      // 5. Return the verification result
      const result = await verificationResponse.json();
      console.log('Registration verification result:', result);
      return result;
    } catch (error) {
      console.error('Error during passkey registration:', error);
      throw error;
    }
  },
  
  /**
   * Begins the passkey authentication process
   * @returns Authentication result and user info if successful
   */  async authenticateWithPasskey() {
    try {
      // 1. Get authentication options from the server
      const optionsResponse = await fetch('/api/passkey/generate-authentication-options', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Important for cookie session
      });
      
      if (!optionsResponse.ok) {
        const errorData = await optionsResponse.json();
        throw new Error(errorData.error || 'Failed to get authentication options');
      }
      
      // 2. Get the options from the server
      const options = await optionsResponse.json();      // 3. Start the authentication process in the browser
      // SimpleWebAuthn v13+ requires passing options wrapped in an object with 'optionsJSON' property
      const authenticationResponse = await startAuthentication({ 
        optionsJSON: options 
      });
      
      // 4. Send the authentication response to the server for verification
      const verificationResponse = await fetch('/api/passkey/verify-authentication', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          credential: authenticationResponse,
        }),
        credentials: 'include', // Important for cookie session
      });
      
      if (!verificationResponse.ok) {
        const errorData = await verificationResponse.json();
        throw new Error(errorData.error || 'Failed to verify passkey authentication');
      }
      
      // 5. Return the verification result
      return await verificationResponse.json();
    } catch (error) {
      console.error('Error during passkey authentication:', error);
      throw error;
    }  }
};

/**
 * Helper function to check if WebAuthn/passkeys are supported in the current browser
 * @returns Boolean indicating if passkeys are supported
 */
export const isPasskeySupported = () => {
  return passkeyAuthService.isSupported();
};

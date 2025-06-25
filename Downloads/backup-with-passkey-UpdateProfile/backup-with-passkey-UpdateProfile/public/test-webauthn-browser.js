// Test WebAuthn in Browser

// Function to convert hex to ArrayBuffer
function hexToArrayBuffer(hex) {
  const hexRegExp = /^[0-9a-fA-F]+$/;
  if (!hexRegExp.test(hex)) {
    throw new Error('Not a valid hex string');
  }
  
  if (hex.length % 2 !== 0) {
    hex = '0' + hex;
  }
  
  const byteArray = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    byteArray[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  
  return byteArray.buffer;
}

// Function to convert ArrayBuffer to hex
function arrayBufferToHex(buffer) {
  return Array.from(new Uint8Array(buffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

async function testWebAuthnRegistration() {
  try {
    // Check if WebAuthn is supported
    if (!window.PublicKeyCredential) {
      console.error('WebAuthn is not supported in this browser');
      return;
    }
    
    console.log('Creating a test credential...');
    
    const challenge = new Uint8Array(32);
    window.crypto.getRandomValues(challenge);
    
    const userID = new Uint8Array(16); 
    window.crypto.getRandomValues(userID);
    
    const publicKey = {
      challenge,
      rp: {
        name: 'Passkey Test',
        id: window.location.hostname
      },
      user: {
        id: userID,
        name: 'test@example.com',
        displayName: 'Test User'
      },
      pubKeyCredParams: [
        { type: 'public-key', alg: -7 }, // ES256
        { type: 'public-key', alg: -257 } // RS256
      ],
      timeout: 60000,
      attestation: 'none',
      authenticatorSelection: {
        authenticatorAttachment: 'platform',
        userVerification: 'preferred',
        residentKey: 'required'
      }
    };
    
    console.log('Registration options:', publicKey);
    
    try {
      const credential = await navigator.credentials.create({ publicKey });
      
      console.log('Registration successful!');
      console.log('Credential ID:', credential.id);
      console.log('Raw ID (hex):', arrayBufferToHex(credential.rawId));
      console.log('Type:', credential.type);
      console.log('Response:', credential.response);
      
      return credential;
    } catch (error) {
      console.error('Error creating credential:', error);
      throw error;
    }
  } catch (e) {
    console.error('Error during test:', e);
  }
}

// Export the test function to window
window.testWebAuthnRegistration = testWebAuthnRegistration;
console.log('WebAuthn test ready! Run window.testWebAuthnRegistration() to test.');

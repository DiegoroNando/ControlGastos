// This file helps check if your environment is properly set up for WebAuthn/Passkeys

import {
  generateRegistrationOptions,
} from '@simplewebauthn/server';

// Simple function to test if WebAuthn can be properly initialized
async function testWebAuthnCompat() {
  try {
    console.log('Testing WebAuthn compatibility...');
      // Try to generate registration options
    // Note: userID must be a Buffer or Uint8Array in newer versions
    const options = await generateRegistrationOptions({
      rpName: 'WebAuthn Test',
      rpID: 'localhost',
      userID: new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]), // Generate a suitable user ID
      userName: 'Test User',
      attestationType: 'none',
      authenticatorSelection: {
        residentKey: 'required',
        userVerification: 'preferred',
        authenticatorAttachment: 'platform',
      },
      timeout: 60000,
    });
    
    console.log('WebAuthn compatibility test succeeded!');
    console.log('Generated options structure:', 
      Object.keys(options).length > 0 ? 'Valid' : 'Invalid');
    
    return true;
  } catch (error) {
    console.error('WebAuthn compatibility test failed:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
      code: error.code
    });
    
    return false;
  }
}

// Run the test
testWebAuthnCompat().then(result => {
  console.log('WebAuthn compatibility:', result ? 'COMPATIBLE' : 'NOT COMPATIBLE');
  
  if (!result) {
    console.log('\nPossible solutions:');
    console.log('1. Make sure the required NPM packages are installed');
    console.log('2. Check if your Node.js version is compatible (Node.js v14+ recommended)');
    console.log('3. Ensure crypto modules are available in your environment');
    console.log('4. Try updating @simplewebauthn/server to the latest version');
  }
});

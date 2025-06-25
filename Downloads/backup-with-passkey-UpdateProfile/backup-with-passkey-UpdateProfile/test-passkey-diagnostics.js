// Test script for passkey diagnostics
// Run this in your browser console when attempting to register a passkey

console.log('=== Passkey Diagnostic Tool ===');

// Check if we have PublicKeyCredential object
if (window.PublicKeyCredential) {
  console.log('✅ WebAuthn is supported in this browser');
  
  // Check if isUserVerifyingPlatformAuthenticatorAvailable is available
  if (typeof window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable === 'function') {
    console.log('✅ isUserVerifyingPlatformAuthenticatorAvailable method is available');
    
    // Check if we have platform authenticator
    window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
      .then(result => {
        if (result) {
          console.log('✅ Platform authenticator is available');
        } else {
          console.log('❌ Platform authenticator is NOT available');
        }
      })
      .catch(error => {
        console.error('❌ Error checking platform authenticator:', error);
      });
  } else {
    console.log('❌ isUserVerifyingPlatformAuthenticatorAvailable method is NOT available');
  }
  
  // Check if credential creation is available
  if (typeof window.navigator.credentials.create === 'function') {
    console.log('✅ Credential creation is available');
  } else {
    console.log('❌ Credential creation is NOT available');
  }
} else {
  console.log('❌ WebAuthn is NOT supported in this browser');
}

// Check if we're running in a secure context
if (window.isSecureContext) {
  console.log('✅ Running in a secure context');
} else {
  console.log('❌ NOT running in a secure context - WebAuthn requires HTTPS or localhost');
}

// Check current origin
console.log('Current origin:', window.location.origin);

// Check available cookies
console.log('Cookies:', document.cookie ? document.cookie : 'No cookies available');

// Check CORS settings for fetch
console.log('Testing CORS with fetch credentials...');
fetch('/api/health', { credentials: 'include' })
  .then(response => {
    console.log('CORS test response status:', response.status);
    return response.text();
  })
  .then(data => {
    console.log('CORS test response data:', data);
  })
  .catch(error => {
    console.error('CORS test error:', error);
  });

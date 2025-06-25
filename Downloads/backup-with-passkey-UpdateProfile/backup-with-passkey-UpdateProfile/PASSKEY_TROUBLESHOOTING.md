# Passkey Registration Diagnostic Guide

This document provides a comprehensive guide to diagnosing and fixing passkey registration issues in the voting system.

## Troubleshooting Steps

### 1. Verify Browser Support

First, ensure your browser fully supports WebAuthn:

- Chrome: Version 67 or later
- Firefox: Version 60 or later
- Safari: Version 13 or later
- Edge: Version 79 or later (Chromium-based)

You can test your browser's support by running the diagnostic script:

```
// Open browser console and paste this:
const script = document.createElement('script');
script.src = '/test-passkey-diagnostics.js';
document.body.appendChild(script);
```

### 2. Check Server Environment

The following server-side issues could be causing problems:

- **rpID mismatch**: The rpID must match your domain exactly (without protocol or port)
- **Origin validation**: The origin must be in the allowed origins list
- **Session cookies**: Session cookies must be properly configured and transmitted

### 3. Check Network Requests

When attempting passkey registration, monitor these network requests:

1. POST to `/api/passkey/generate-registration-options`
2. POST to `/api/passkey/verify-registration`

Look for:
- HTTP status codes (should be 200)
- Response content (check for error messages)
- Request headers (especially Origin and Cookie)

### 4. Common Issues and Solutions

#### Origin Mismatch

If you see errors related to origin validation:
- Ensure you're accessing the site via a URL that matches the rpID
- For localhost development, use `localhost` instead of `127.0.0.1`

#### Session/Cookie Issues

If the challenge is not found during verification:
- Check that cookies are being properly set and transmitted
- Ensure `credentials: 'include'` is set in fetch calls
- Check that CORS is properly configured with `credentials: true`

#### WebAuthn Availability

If the browser doesn't support platform authenticators:
- Try a different device or browser
- Ensure your operating system is up to date
- For Windows, check that Windows Hello is enabled

## Latest Fixes Applied

We've implemented the following fixes:

1. Made rpID configuration more robust to handle both dev and prod environments
2. Enhanced session cookie configuration for better cross-origin support
3. Improved CORS configuration to ensure credentials are included
4. Made origin validation more robust and added better logging
5. Added detailed diagnostics for troubleshooting client-side issues
6. Enhanced error handling and logging in both frontend and backend

## Troubleshooting Process

To effectively troubleshoot passkey registration:

1. Run the diagnostic script in your browser console
2. Monitor the browser console for detailed logs
3. Check the server console for verbose error logs
4. Verify network requests in the browser Network tab
5. Compare error logs between client and server

If issues persist after following these steps, gather the detailed logs and report them for further investigation.

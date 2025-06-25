# Face Authentication Testing Guide

## ✅ **Current Status**

**COMPLETED**: All test CURPs have been successfully added to the whitelist database!

**COMPLETED**: All base user records have been created in the database!

**COMPLETED**: Email verification bypassed for testing purposes!

**READY FOR TESTING**: All servers are running and test users can now complete registration and test face authentication.

**Active Services**:
- Frontend: http://localhost:5173/
- Main Server: http://localhost:3001/
- Backend Database API: http://localhost:3002/
- MongoDB: Running on port 27017

---

## 🎭 **Quick Test Credentials**

### Test User 1 (Administrative)
- **CURP**: `MARL850315HDFRTC01`
- **Password**: `TestPass123!`
- **Name**: Marco Antonio Rodriguez Lopez
- **Email**: marco.rodriguez@test.com

### Test User 2 (Academic)
- **CURP**: `SAGL900822MDFRNN02`
- **Password**: `TestPass456!`
- **Name**: Sofia Alejandra Garcia Luna
- **Email**: sofia.garcia@test.com

### Test User 3 (Technical)
- **CURP**: `JUCR881205HDFRLS03`
- **Password**: `TestPass789!`
- **Name**: Juan Carlos Cruz Ramirez
- **Email**: juan.cruz@test.com

### Test User 4 (Coordination)
- **CURP**: `MELH920718MDFRNL04`
- **Password**: `TestPass321!`
- **Name**: Maria Elena Lopez Hernandez
- **Email**: maria.lopez@test.com

---

## 🧪 **Testing Procedure**

### Step 1: Registration with Face
1. Navigate to: http://localhost:5173/
2. Click "Register" or go to registration page
3. Fill in the form using any test credentials above
4. Complete all required fields:
   - Basic info (name, CURP, email, etc.)
   - Work information
   - Eligibility questions (answer "Yes" to all)
5. **Face Registration Step**:
   - Allow camera access when prompted
   - Position your face clearly in the camera frame
   - Click "Capture Face" when ready
   - System will detect and register your face
   - Complete registration

### Step 2: Test Standard Login
1. Go to login page
2. Enter CURP and password from test credentials
3. Should successfully log in

### Step 3: Test Face Authentication Login
1. Go to login page
2. Click "Iniciar sesión con reconocimiento facial"
3. Allow camera access
4. Position your face in the camera frame
5. System should recognize your registered face
6. Should successfully log in

### Step 4: Test Multiple Accounts
- You can register multiple test accounts using your same face
- Each will have a unique face ID in Azure Face API
- All accounts can be accessed via face authentication

---

## ✅ **Expected Results**

### Successful Face Registration:
- Camera activates and shows live feed
- Face detection works (green outline around face)
- "Face registered successfully" message
- Redirected to dashboard/completion

### Successful Face Login:
- Camera activates for authentication
- Face recognition works quickly (1-3 seconds)
- "Authentication successful" message  
- Logged into dashboard

### Fallback Options:
- If face auth fails, "Use CURP and password" button available
- Standard login always works as backup

---

## 🔧 **Troubleshooting**

### Camera Issues:
- Check browser permissions for camera access
- Try refreshing the page
- Ensure good lighting conditions

### Face Detection Issues:
- Ensure face is clearly visible and centered
- Remove glasses/hats if detection fails
- Try different lighting conditions

### Service Issues:
- Check that all servers are running:
  - Frontend: http://localhost:5173/
  - Backend: http://localhost:3001/api
  - Database API: http://localhost:3002/api
- Verify Azure Face API credentials in .env file

---

## 🎯 **Test Scenarios**

1. **Happy Path**: Register → Face Auth Login → Success
2. **Fallback Path**: Register → Face Auth Fails → CURP Login → Success  
3. **Multiple Users**: Register 2+ accounts with same face → Both work
4. **Error Handling**: Block camera → Should show error + fallback option

---

## 📝 **Notes**

- Same person can test multiple accounts
- Face data is stored securely in Azure Face API
- Each registration creates a unique face ID
- System supports fallback to traditional login
- All test data is isolated and safe for testing

---

## 🛠️ **Testing Modifications**

### Email Verification Bypass
- **For testing purposes**, email verification has been temporarily bypassed
- The system will skip sending verification emails and proceed directly to the next step
- This allows testing without needing to configure SMTP settings

### Verification Code Bypass
- **Default verification code**: `000000` (pre-filled automatically)
- **Code validation bypassed** for testing purposes  
- Users can proceed directly without waiting for email codes
- **Note**: In production, proper email verification should be configured

### Ready for End-to-End Testing
The system now supports complete registration and face authentication testing without external dependencies.

---

# Face Authentication Testing Checklist

## 📋 **Pre-Test Setup**
- [ ] All servers running (Frontend, Backend, Database, MongoDB)
- [ ] Camera permissions enabled in browser
- [ ] Good lighting conditions for face capture
- [ ] Azure Face API credentials configured

## 🧪 **Test Account 1: Marco Rodriguez**
### Registration Test
- [ ] Navigate to registration page
- [ ] Fill form with: `MARL850315HDFRTC01` / `TestPass123!`
- [ ] Complete all required fields 
- [ ] Pass eligibility questions
- [ ] **Face Registration**: Capture YOUR face
- [ ] Complete registration successfully

### Login Tests
- [ ] **Standard Login**: CURP + Password works
- [ ] **Face Login**: Face authentication works
- [ ] **Fallback**: Can switch from face to CURP login

## 🧪 **Test Account 2: Sofia Garcia** 
### Registration Test
- [ ] Use: `SAGL900822MDFRNN02` / `TestPass456!`
- [ ] Register with YOUR SAME face (tests multiple accounts)
- [ ] Complete registration

### Login Tests  
- [ ] Both login methods work
- [ ] Face recognition works with same face as Account 1

## 🧪 **Test Account 3: Juan Cruz**
### Registration Test
- [ ] Use: `JUCR881205HDFRLS03` / `TestPass789!`
- [ ] Register with YOUR face again
- [ ] Complete registration

### Login Tests
- [ ] Face authentication works
- [ ] Can distinguish between all 3 accounts

## 🧪 **Error Handling Tests**
- [ ] Block camera access → Shows error + fallback
- [ ] Poor lighting → Shows quality warning
- [ ] No face detected → Shows "no face" message
- [ ] Multiple faces → Shows "multiple faces" warning

## 🎯 **Success Criteria**
- [ ] Can register multiple accounts with same face
- [ ] Face authentication works consistently  
- [ ] Fallback to CURP/password always available
- [ ] Error messages are clear and helpful
- [ ] Face data stored securely in Azure

## 📝 **Notes Section**
```
Account 1 Face ID: _______________
Account 2 Face ID: _______________  
Account 3 Face ID: _______________

Issues Found:
- 
- 
-

Working Features:
- 
- 
-
```

---

## 🚀 **Ready to Test!**

**Start Here**: http://localhost:5173/

**First Test Credentials**:
- CURP: `MARL850315HDFRTC01`
- Password: `TestPass123!`
- Name: Marco Antonio Rodriguez Lopez

**Key Point**: Use YOUR actual face for all test registrations! The system will create unique face IDs for each account while using the same physical face.

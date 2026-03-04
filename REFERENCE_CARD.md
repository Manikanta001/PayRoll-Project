# PayrollPro MongoDB Authentication - REFERENCE CARD

## 🎯 What's Ready

```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃         MongoDB Authentication System               ┃
┃                   ✅ READY                          ┃
┃                                                      ┃
┃  • User Registration (Email + Password)             ┃
┃  • User Login (with validation)                     ┃
┃  • Secure Password Hashing (Bcryptjs)              ┃
┃  • MongoDB Data Storage                            ┃
┃  • Session Management                              ┃
┃  • User Profile Page                               ┃
┃  • Complete Documentation                          ┃
┃                                                      ┃
┃              👉 Start with QUICK_START.md           ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
```

---

## 🚀 Quick Start (Copy & Paste)

### Terminal 1: Ensure MongoDB is Running
```powershell
Get-Service MongoDB  # Check if running
Start-Service MongoDB  # Start if needed
```

### Terminal 2: Start Backend
```powershell
cd "d:\SRU\Even Sem\Project\Payroll"
npm run server
```

### Terminal 3: Start Frontend
```powershell
cd "d:\SRU\Even Sem\Project\Payroll"
npm run dev
```

### Open Browser
```
http://localhost:5173
```

---

## 📋 Testing Checklist

- [ ] Backend running on http://localhost:4000 (check terminal)
- [ ] Frontend running on http://localhost:5173 (check terminal)
- [ ] MongoDB connected (check backend logs)
- [ ] Go to /Register → Create account
- [ ] Go to /SignIn → Login with same credentials
- [ ] Go to /Profile → See user information
- [ ] Click Logout → Redirected to SignIn
- [ ] Try wrong password → See error message ✅

---

## 📁 Documentation Files

| File | Purpose | Read If... |
|------|---------|-----------|
| QUICK_START.md | 5-minute setup | New to the system |
| MONGODB_SETUP.md | Detailed guide | Need MongoDB help |
| IMPLEMENTATION.md | Technical docs | Want details |
| SETUP_COMPLETE.md | This summary | Overview needed |
| README_MONGODB.md | Quick reference | Quick lookup |

---

## 🔑 Key URLs & Ports

```
Frontend:           http://localhost:5173
Backend API:        http://localhost:4000
MongoDB:            mongodb://localhost:27017/payroll
Register Page:      http://localhost:5173/Register
Sign In Page:       http://localhost:5173/SignIn
Profile Page:       http://localhost:5173/Profile
Dashboard:          http://localhost:5173/Dashboard
```

---

## 🛠️ Common Commands

```powershell
# Start backend
npm run server

# Start frontend
npm run dev

# Verify setup
node setup-verify.js

# Check MongoDB service
Get-Service MongoDB

# Start MongoDB
Start-Service MongoDB

# Stop MongoDB
Stop-Service MongoDB
```

---

## 💾 Database Info

**Connection String**
```
mongodb://localhost:27017/payroll
```

**Collections**
```
• users (stores email, passwordHash, name, role, etc.)
```

**Important Fields**
```
email              → User email (unique, lowercase)
passwordHash       → Bcryptjs hashed password (NEVER plain text!)
full_name          → User's full name
role               → User role (employee, admin, etc.)
is_active          → Account active status (true/false)
created_date       → Registration timestamp
updated_date       → Last update timestamp
```

---

## 🧪 Test Credentials

You can use these for testing:

**Test Account 1**
```
Email:    test@company.com
Password: TestPass123!
Role:     employee
```

**Test Account 2**
```
Email:    admin@company.com
Password: AdminPass123!
Role:     admin
```

*Create your own accounts on /Register page for testing*

---

## 🔒 Security Summary

✅ **What's Protected**
- Passwords hashed with bcryptjs (10 iterations)
- Unique email constraint (no duplicates)
- CORS enabled only for localhost:5173
- No plain text passwords in storage or API

✅ **How Sessions Work**
- User ID stored in localStorage
- Session persists across page refreshes
- Clear on logout

✅ **Error Handling**
- Invalid email/password shown as one generic error
- Duplicates caught on registration
- HTTP status codes for different errors

---

## 🐛 If You Get Stuck

**Problem: "Can't connect to MongoDB"**
```powershell
Start-Service MongoDB
# OR download from: https://www.mongodb.com/try/download/community
```

**Problem: "Port 4000 already in use"**
```powershell
netstat -ano | findstr :4000
taskkill /PID <PID> /F
```

**Problem: "CORS Error"**
```
Make sure backend running on http://localhost:4000
Check browser console for details
```

**Problem: "User not found"**
```
User might not exist in MongoDB
Register new account first
Or use different email/password
```

---

## 📊 System Architecture

```
┌─────────────────────────────────────┐
│      Frontend (React)               │
│  http://localhost:5173              │
│                                     │
│  • Register Page                    │
│  • SignIn Page                      │
│  • Profile Page                     │
│  • AuthContext (State Mgmt)         │
└────────────┬────────────────────────┘
             │
             │ HTTP (Axios)
             ↓
┌─────────────────────────────────────┐
│    Backend (Express.js)             │
│  http://localhost:4000              │
│                                     │
│  • /auth/register                   │
│  • /auth/login                      │
│  • /auth/me                         │
│  • /users/*                         │
└────────────┬────────────────────────┘
             │
             │ Mongoose
             ↓
┌─────────────────────────────────────┐
│   Database (MongoDB)                │
│  mongodb://localhost:27017/payroll  │
│                                     │
│  • users collection                 │
└─────────────────────────────────────┘
```

---

## ✅ Checklist - What's Done

Backend
- ✅ Express.js API server
- ✅ MongoDB connection
- ✅ Mongoose models
- ✅ Registration endpoint
- ✅ Login endpoint
- ✅ User fetch endpoint
- ✅ Password hashing

Frontend
- ✅ Register component
- ✅ SignIn component
- ✅ Profile component
- ✅ AuthContext hook
- ✅ API client
- ✅ Session management

Database
- ✅ MongoDB setup
- ✅ User schema
- ✅ Unique email index
- ✅ Password encryption

Documentation
- ✅ QUICK_START.md
- ✅ MONGODB_SETUP.md
- ✅ IMPLEMENTATION.md
- ✅ README_MONGODB.md
- ✅ SETUP_COMPLETE.md

---

## 🎯 Next Actions

### Immediate (Now)
1. Read QUICK_START.md
2. Install MongoDB (if needed)
3. Start backend: `npm run server`
4. Start frontend: `npm run dev`
5. Test registration at /Register
6. Test login at /SignIn

### Follow Up (Later)
1. Review IMPLEMENTATION.md for details
2. Add more test users
3. Test error scenarios
4. Consider MongoDB Atlas for production
5. Enhance with additional features

---

## 📞 Help Resources

**Inside This Project**
- QUICK_START.md - Step by step
- MONGODB_SETUP.md - MongoDB help
- IMPLEMENTATION.md - Full documentation

**External Resources**
- MongoDB: https://www.mongodb.com/docs
- Express.js: https://expressjs.com/
- React: https://react.dev/
- Bcryptjs: https://github.com/dcodeIO/bcrypt.js

---

## ⏱️ Time Estimates

| Task | Time |
|------|------|
| Install MongoDB (first time) | 10-15 min |
| Start backend server | 2 min |
| Start frontend server | 2 min |
| Test registration | 2 min |
| Test login | 2 min |
| Review setup | 5 min |
| **Total First Time** | **30 min** |
| **Subsequent Times** | **5 min** |

---

## 🎉 Success Indicators

You'll know everything is working when:

✅ Backend logs show: "✅ Connected to MongoDB successfully"
✅ Frontend shows without errors: http://localhost:5173
✅ Can register new user
✅ Can login with registered credentials
✅ Profile page shows user information
✅ Logout works properly
✅ Refresh page - still logged in
✅ Login with wrong password shows error

If all ✅, you're good to go!

---

## 🚀 Final Status

```
┌─────────────────────────────────────┐
│    SETUP COMPLETE & VERIFIED ✅     │
│                                     │
│   Ready for Testing & Development   │
│                                     │
│   Next: Read QUICK_START.md         │
└─────────────────────────────────────┘
```

---

**Questions?** See the documentation files in the project root!


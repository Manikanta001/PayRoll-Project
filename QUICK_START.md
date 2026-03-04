# PayrollPro MongoDB Authentication System - QUICK START

## What's Already Set Up ✅

Your application now has a complete MongoDB-based authentication system:

### Backend Components (server/index.js)
- ✅ Express.js API server on port 4000
- ✅ MongoDB connection with Mongoose ODM
- ✅ User model with email, password hash, name, role fields
- ✅ Bcryptjs password hashing (10 salt rounds)
- ✅ Authentication endpoints:
  - `POST /auth/register` - Create new account with email & password
  - `POST /auth/login` - Sign in with email & password
  - `GET /auth/me` - Get current user info
  - `POST /auth/verify-password` - Verify password
- ✅ User management endpoints

### Frontend Components
- ✅ AuthContext (src/lib/AuthContext.jsx) - Manages user state
- ✅ Register page (src/pages/Register.jsx) - Account creation
- ✅ SignIn page (src/pages/SignIn.jsx) - Login form
- ✅ Profile page (src/pages/Profile.jsx) - View user info
- ✅ API client (src/api/base44Client.js) - Backend communication

---

## Quick Start (3 Steps)

### Step 1: Install & Start MongoDB Locally

**Download & Install:**
1. Go to: https://www.mongodb.com/try/download/community
2. Download for Windows
3. Run installer and complete setup
4. MongoDB will automatically start as a Windows service

**Verify it's running:**
```powershell
Get-Service MongoDB
# Status should show "Running"
```

### Step 2: Start Backend Server

Open PowerShell in the `Payroll` folder:
```powershell
npm run server
```

Expected output:
```
Connected to MongoDB mongodb://localhost:27017/payroll
API server listening on http://localhost:4000
```

### Step 3: Start Frontend & Test

Open another PowerShell in the `Payroll` folder:
```powershell
npm run dev
```

Then open: http://localhost:5173

---

## Testing the Authentication

1. **Register New Account**
   - Go to http://localhost:5173/Register
   - Enter:
     - Full Name: John Doe
     - Email: john@company.com
     - Password: YourPassword123
     - Confirm Password: YourPassword123
     - Role: employee
   - Click "Create account"
   - ✅ Should redirect to Dashboard
   - ✅ Data saved in MongoDB!

2. **Sign In**
   - Go to http://localhost:5173/SignIn
   - Enter email: john@company.com
   - Enter password: YourPassword123
   - Click "Sign in"
   - ✅ Should redirect to Dashboard

3. **View Profile**
   - Click "Profile" in navigation
   - ✅ See your registered information
   - ✅ Email and name from MongoDB displayed

4. **Sign Out**
   - Click logout button
   - ✅ Redirected to sign-in page

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React)                          │
│  http://localhost:5173                                       │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Components: Register, SignIn, Profile               │   │
│  │ State: AuthContext (user, isAuthenticating)         │   │
│  └──────────────────────────────────────────────────────┘   │
│                         ↕ (axios)                            │
└─────────────────────────────────────────────────────────────┘
                           ↕
                    CORS Enabled
                           ↕
┌─────────────────────────────────────────────────────────────┐
│                  Backend (Express.js)                        │
│  http://localhost:4000                                       │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ /auth/register - POST                               │   │
│  │ /auth/login - POST                                  │   │
│  │ /auth/me - GET                                      │   │
│  │ /auth/verify-password - POST                        │   │
│  │ /users/* - User management                          │   │
│  └──────────────────────────────────────────────────────┘   │
│                         ↕ (Mongoose)                        │
└─────────────────────────────────────────────────────────────┘
                           ↕
┌─────────────────────────────────────────────────────────────┐
│                   MongoDB Database                           │
│  mongodb://localhost:27017/payroll                           │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Database: payroll                                    │   │
│  │ Collection: users                                    │   │
│  │ Fields: full_name, email, passwordHash, role, etc.  │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## Data Flow - Registration

```
User fills form
    ↓
/Register page validates input
    ↓
registerWithEmailPassword() called (AuthContext)
    ↓
POST /auth/register → Backend
    ↓
Backend validates email (not duplicate)
    ↓
Password hashed with bcryptjs
    ↓
User saved to MongoDB
    ↓
User ID stored in localStorage
    ↓
Redirect to /Dashboard
```

---

## Data Flow - Login

```
User enters email & password
    ↓
/SignIn page validates input
    ↓
signInWithEmailPassword() called (AuthContext)
    ↓
POST /auth/login → Backend
    ↓
Backend finds user by email
    ↓
bcryptjs compares password with hash
    ↓
If match: Return user object with ID
If no match: Return 401 Unauthorized
    ↓
User ID stored in localStorage
    ↓
Redirect to /Dashboard
```

---

## Database Schema

**Users Collection:**
```javascript
{
  _id: ObjectId,              // Auto-generated by MongoDB
  full_name: String,          // User's full name
  email: String,              // Unique, case-insensitive
  passwordHash: String,       // Bcrypt hashed (never plain text!)
  role: String,               // "employee", "admin", etc.
  is_active: Boolean,         // true/false
  created_date: Date,         // Registration timestamp
  updated_date: Date          // Last update timestamp
}
```

---

## User Flows

### Flow 1: First-Time User
1. App loads → Check /auth/me → No user found
2. Redirected to Sign-In page
3. User clicks "Register" → Goes to Register page
4. User fills form & registers
5. Email & password hash saved to MongoDB
6. User logged in & redirected to Dashboard

### Flow 2: Returning User
1. App loads → Check /auth/me → User ID found in localStorage
2. Fetch user from MongoDB → User object returned
3. Shows Dashboard page
4. User can access Profile, Payroll, etc.

### Flow 3: Wrong Password
1. User enters wrong password
2. Backend bcryptjs.compare fails
3. Returns 401 error
4. Show error message: "Invalid email or password"
5. User can retry

---

## Environment Configuration (.env file)

```env
MONGO_URI=mongodb://localhost:27017/payroll
PORT=4000
```

**For MongoDB Atlas (Cloud):**
```env
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/payroll
PORT=4000
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "MongoDB connection failed" | Start MongoDB service: `Start-Service MongoDB` |
| "Port 4000 already in use" | Kill process: `Stop-Process -Id <PID> -Force` |
| "CORS error" | Check backend is running on http://localhost:4000 |
| "Email already registered" | This email exists in MongoDB, use different email |
| "Invalid email or password" | Check email/password, ensure they match MongoDB entry |
| "User not found" | User account doesn't exist in MongoDB, register first |

---

## Security Features ✅

- ✅ Passwords hashed with bcryptjs (10 iterations)
- ✅ Plain text passwords NEVER stored
- ✅ Emails stored as unique index (no duplicates)
- ✅ Case-insensitive email matching
- ✅ CORS protection (only localhost:5173 allowed)
- ✅ HTTP status codes for auth failures (401, 409)
- ✅ Environment variables for sensitive config

---

## Next Steps

1. ✅ Install MongoDB locally (or use Atlas)
2. ✅ Run: `npm run server` (backend)
3. ✅ Run: `npm run dev` (frontend)
4. ✅ Test registration at /Register
5. ✅ Test login at /SignIn
6. ✅ View profile at /Profile
7. ✅ Test logout

**Everything is ready to go!** 🚀


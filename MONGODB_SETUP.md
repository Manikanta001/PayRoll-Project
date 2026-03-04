# MongoDB Setup Guide for PayrollPro

## Overview
Your PayrollPro application uses MongoDB to store user authentication data (email, password). The backend is already configured to handle user registration and login.

## Setup Options

### Option 1: Local MongoDB (Recommended for Development)

#### Step 1: Install MongoDB Community Edition
1. Download from: https://www.mongodb.com/try/download/community
2. Run the installer and follow the setup wizard
3. MongoDB will be installed and running as a Windows service

#### Step 2: Verify MongoDB is Running
```powershell
# Check MongoDB service status
Get-Service MongoDB
```

You should see the MongoDB service running.

#### Step 3: Start Backend Server
```powershell
cd Payroll
npm run server
```

Expected output:
```
Connected to MongoDB mongodb://localhost:27017/payroll
API server listening on http://localhost:4000
```

---

### Option 2: MongoDB Atlas (Cloud - Free Tier Available)

#### Step 1: Create MongoDB Atlas Account
1. Visit: https://www.mongodb.com/cloud/atlas
2. Sign up for a free account
3. Create a new project and cluster

#### Step 2: Get Connection String
1. In Atlas, go to "Connect" → "Drivers"
2. Copy the connection string (looks like):
   ```
   mongodb+srv://username:password@cluster.mongodb.net/payroll
   ```

#### Step 3: Update .env File
```
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/payroll
```

#### Step 4: Start Backend Server
```powershell
cd Payroll
npm run server
```

---

## Database Schema

The User collection stores:
- **full_name**: User's full name
- **email**: User's email (unique, case-insensitive)
- **passwordHash**: Bcrypt hashed password (never stored plain text)
- **role**: User role (e.g., "employee", "admin")
- **is_active**: Account status (true/false)
- **created_date**: Registration timestamp
- **updated_date**: Last update timestamp

## How Authentication Works

### Registration Flow
1. User enters: Full Name, Email, Password, Role
2. Password is hashed using bcrypt with 10 salt rounds
3. User document is created in MongoDB
4. User ID is stored in browser localStorage
5. User is redirected to Dashboard

### Login Flow
1. User enters: Email, Password
2. Backend queries MongoDB for user by email
3. Password is compared with stored hash using bcrypt
4. If valid, user ID is stored in localStorage
5. User is redirected to Dashboard

### Session Management
- User ID is stored in browser localStorage with key: `local_base44_mock_v1:auth_user_id`
- On app load, `AuthContext` fetches user data from `/auth/me` endpoint
- User remains logged in until explicitly logging out

---

## API Endpoints

### Authentication Endpoints

**POST /auth/register**
```json
{
  "full_name": "John Doe",
  "email": "john@company.com",
  "password": "securePassword123",
  "role": "employee"
}
```
Returns: User object with `_id`

**POST /auth/login**
```json
{
  "email": "john@company.com",
  "password": "securePassword123"
}
```
Returns: User object with `_id`

**GET /auth/me?userId=<id>**
Returns: Current user object

**POST /auth/verify-password**
```json
{
  "userId": "<id>",
  "password": "securePassword123"
}
```
Returns: `{ ok: true/false }`

---

## Troubleshooting

### MongoDB Connection Failed
- **Local**: Ensure MongoDB service is running
  ```powershell
  # Start MongoDB service
  Start-Service MongoDB
  ```
- **Atlas**: Verify connection string in `.env` file includes username and password

### Port 4000 Already in Use
```powershell
# Find process using port 4000
Get-NetTCPConnection -LocalPort 4000
# Kill the process
Stop-Process -Id <PID> -Force
```

### Passwords Not Matching During Login
- Passwords are case-sensitive
- Ensure MongoDB is running and accessible
- Check browser console for detailed error messages

### CORS Issues
- The server is configured to accept requests from `http://localhost:5173`
- Make sure the frontend is running on this port

---

## Running the Complete Stack

### Terminal 1: MongoDB (if using local)
```powershell
# MongoDB should auto-start as service
# Verify: Get-Service MongoDB
```

### Terminal 2: Backend API Server
```powershell
cd Payroll
npm run server
```

### Terminal 3: Frontend Dev Server
```powershell
cd Payroll
npm run dev
```

Then open: http://localhost:5173

---

## Testing the Authentication

1. **Sign Up**
   - Go to http://localhost:5173/Register
   - Fill in: Name, Email, Password, Role
   - Click "Create account"

2. **Sign In**
   - Go to http://localhost:5173/SignIn
   - Enter email and password
   - Should be redirected to Dashboard

3. **View Profile**
   - Click on Profile page
   - See your registered information

---

## Important Security Notes

- ⚠️ Never commit `.env` file with real credentials
- ⚠️ Passwords are hashed with bcryptjs before storage
- ⚠️ Use HTTPS in production (not HTTP)
- ⚠️ Store MongoDB Atlas password securely
- ⚠️ Use environment variables for sensitive data


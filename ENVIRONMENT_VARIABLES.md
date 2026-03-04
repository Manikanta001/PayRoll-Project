# Environment Variables for Production Deployment

This guide explains all environment variables needed for deploying PayrollPro to Vercel + Render.

## Backend (Render) Environment Variables

Set these in your Render Web Service → Settings → Environment:

```env
# Required: MongoDB Atlas Cloud Connection String
MONGO_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/payroll

# Required: Your Vercel frontend URL (for CORS)
FRONTEND_URL=https://your-payroll-app.vercel.app

# Optional: Environment mode
NODE_ENV=production

# Auto-assigned by Render (don't set manually)
PORT=<auto>
```

### Getting MONGO_URI:
1. Go to [MongoDB Atlas](https://cloud.mongodb.com)
2. Click "Connect" → "Drivers" (Node.js)
3. Copy the connection string
4. Format: `mongodb+srv://username:password@cluster.mongodb.net/payroll`

---

## Frontend (Vercel) Environment Variables

Set these in your Vercel Project → Settings → Environment Variables:

```env
# Required: Backend API URL (your Render service URL)
VITE_API_BASE=https://payroll-backend-xxxx.onrender.com
```

### Getting VITE_API_BASE:
1. Deploy backend to Render first (follow RENDER_DEPLOYMENT.md)
2. Get the URL from Render dashboard (e.g., `https://payroll-backend-xxxxx.onrender.com`)
3. Add it as `VITE_API_BASE` in Vercel

---

## Vite Configuration

The frontend automatically reads `VITE_API_BASE`:

**File: [src/api/base44Client.js](src/api/base44Client.js)**
```javascript
const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:4000";
```

- **Local development**: Uses `http://localhost:4000` (default)
- **Production**: Uses `VITE_API_BASE` (from Vercel environment variable)

---

## Deployment Steps

### 1. Deploy Backend (Render)
- See [RENDER_DEPLOYMENT.md](RENDER_DEPLOYMENT.md)
- Get your backend URL: `https://payroll-backend-xxxx.onrender.com`

### 2. Deploy Frontend (Vercel)
```bash
npm run build  # Build frontend
# Then push to GitHub
git push origin main
```

### 3. Add Environment Variables to Vercel
1. Go to your Vercel project
2. **Settings** → **Environment Variables**
3. Add:
   - **Name**: `VITE_API_BASE`
   - **Value**: `https://payroll-backend-xxxx.onrender.com`
4. Re-deploy

### 4. Update Render Backend URL
1. Go to your Render service
2. **Settings** → **Environment**
3. Update `FRONTEND_URL` to your Vercel URL
4. Save (auto-redeploys)

---

## Local Development

For local development, you don't need environment variables:

```bash
# Terminal 1: Start backend (uses local MongoDB)
npm run server

# Terminal 2: Start frontend (uses http://localhost:4000)
npm run dev
```

---

## Verification Checklist

✅ Backend URL works: Visit `https://payroll-backend-xxxx.onrender.com/users`  
✅ Frontend loads: Visit `https://your-vercel-app.vercel.app`  
✅ Login works: Try registering a user  
✅ Data persists: Refresh page - user should still be there  
✅ MongoDB connected: Check Render logs - should say "✅ Connected to MongoDB successfully"

---

## Troubleshooting

### "Cannot reach API"
- Check `VITE_API_BASE` is set correctly in Vercel
- Verify Render backend is running (check Render logs)

### "CORS error"
- Make sure `FRONTEND_URL` in Render matches your Vercel URL exactly
- Check no trailing slashes in URLs

### "Connection refused"
- Verify `MONGO_URI` is correct in Render
- Check MongoDB Atlas IP whitelist includes Render's IPs

---

## Security Notes

🔒 Never commit `.env` files to GitHub  
🔒 Always use environment variables in Render and Vercel dashboards  
🔒 MongoDB password should only be in `MONGO_URI` (kept secure)  
🔒 Never expose backend URL in published code - use environment variables

---

For more details:
- Render Docs: https://render.com/docs
- Vercel Docs: https://vercel.com/docs
- MongoDB Atlas: https://www.mongodb.com/docs/atlas/

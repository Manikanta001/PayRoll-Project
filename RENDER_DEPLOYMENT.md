# Deploy PayrollPro Backend to Render

This guide walks you through deploying your backend to **Render** with MongoDB Atlas.

## Prerequisites

✅ MongoDB Atlas account with connection string ready  
✅ GitHub repository (your code pushed to GitHub)  
✅ Render account (free at https://render.com)

---

## Step 1: Get Your MongoDB Atlas Connection String

1. Go to [MongoDB Atlas](https://cloud.mongodb.com)
2. Select your cluster → **Connect** → **Drivers**
3. Copy the connection string (looks like):
   ```
   mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/payroll
   ```
4. Save this - you'll need it for Render

---

## Step 2: Push Code to GitHub

Make sure your code is pushed to GitHub:

```powershell
git add .
git commit -m "Prepare backend for Render deployment"
git push origin main
```

---

## Step 3: Create Render Web Service

1. **Go to [Render Dashboard](https://dashboard.render.com)**
2. Click **+ New** → **Web Service**
3. Select **Deploy from a Git repository**
4. Connect your GitHub account and select your **Payroll** repository
5. Fill in the deployment settings:

   | Setting | Value |
   |---------|-------|
   | **Name** | `payroll-backend` (or your choice) |
   | **Environment** | Node |
   | **Build Command** | `npm install` |
   | **Start Command** | `node server/index.js` |
   | **Instance Type** | Free (or paid if you want) |

6. Click **Create Web Service** → Wait for deployment (2-3 minutes)

---

## Step 4: Add Environment Variables in Render

1. After deployment, go to **Settings** → **Environment**
2. Add these variables:

   ```
   MONGO_URI = mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/payroll
   NODE_ENV = production
   PORT = (leave blank - Render assigns automatically)
   ```

3. Click **Save Changes** → Render auto-redeploys

---

## Step 5: Get Your Backend URL

1. In Render Settings, find **Onboard** section
2. Copy your web service URL (looks like):
   ```
   https://payroll-backend-xxxx.onrender.com
   ```

---

## Step 6: Update Frontend to Use Backend URL

1. In your frontend code: [src/api/base44Client.js](src/api/base44Client.js)
2. Find this line:
   ```javascript
   const API_BASE = "http://localhost:4000";
   ```
3. Update it for production:
   ```javascript
   const API_BASE = process.env.NODE_ENV === "production" 
     ? "https://payroll-backend-xxxx.onrender.com"
     : "http://localhost:4000";
   ```

Or set it as an environment variable in Vite config for cleaner setup.

---

## Step 7: Deploy Frontend to Vercel

1. Go to [Vercel](https://vercel.com)
2. Import your GitHub repository
3. Add environment variable:
   ```
   VITE_API_BASE = https://payroll-backend-xxxx.onrender.com
   ```
4. Deploy!

---

## Step 8: Update CORS in Vercel URL

After Vercel deployment, update Render environment variables:

1. Go to Render → **Settings** → **Environment**
2. Add:
   ```
   FRONTEND_URL = https://your-vercel-app.vercel.app
   ```
3. Save - Render redeploys automatically

---

## Step 9: Test Everything

1. Visit your Vercel frontend URL
2. Try login/register:
   - ✅ Should connect to MongoDB Atlas
   - ✅ User data saved to cloud
   - ✅ Works every time you visit

---

## Troubleshooting

### Backend won't start
- Check Render logs: **Settings** → **Logs**
- Ensure `MONGO_URI` is correct in environment variables
- Verify MongoDB Atlas IP whitelist includes Render's IPs

### Login not working
- Check browser console for errors
- Ensure `FRONTEND_URL` matches your Vercel URL in Render
- Verify `API_BASE` is correct in your frontend

### "Cold start" delays
- Free tier Render instances sleep after inactivity
- First request takes 10-30 seconds to restart
- Upgrade to Free tier with auto-sleep disabled or use Paid tier for instant response

---

## Cost Summary

- **Render**: Free tier (or $7/month for no cold starts)
- **MongoDB Atlas**: Free tier (up to 512MB)
- **Vercel**: Free tier for frontend
- **Total**: Free or ~$7/month if you want instant responses

---

## Important Notes

✅ **MongoDB stays connected** - No need to reconnect daily  
✅ **Data persists** - Stored in MongoDB Atlas cloud  
✅ **Auto-deploys** - Push to GitHub → automatic update  
✅ **Always running** - Backend stays alive 24/7

---

Need help? Check Render documentation: https://render.com/docs

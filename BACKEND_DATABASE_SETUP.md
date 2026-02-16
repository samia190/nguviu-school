# Backend Database & Deployment Configuration

## Overview
Your backend needs proper configuration for the database connection and deployment environment. This guide ensures your MongoDB connection is properly wired and your app is ready for production.

---

## Current Configuration

### Database Setup ✅
- **MongoDB Atlas**: Connected via `MONGO_URI`
- **Database Name**: `kangaru_girls_db`
- **Cluster**: `cluster0.7bmfdr8.mongodb.net`

### Environment Variables Required
```env
# DATABASE
MONGO_URI=mongodb+srv://kangach:kangach19%4019@cluster0.7bmfdr8.mongodb.net/kangaru_girls_db?retryWrites=true&w=majority

# AUTHENTICATION
JWT_SECRET=de3a3d92e5f44e87b8fa2cc4c2123b7cf3a09d0e7b6a69c4bba45fee29f8b3494tf5hj7knjhhg3
JWT_EXPIRES_IN=7d

# APPLICATION
NODE_ENV=production
PORT=4000
CLIENT_ORIGIN=https://kangarugirlsschool-sc-ke.onrender.com
CORS_ORIGINS=https://kangarugirlsschool-sc-ke.onrender.com

# EMAIL (if needed)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=mukundisam19@gmail.com
SMTP_PASS=your-app-password-here

# RATE LIMITING
RESET_TOKEN_EXPIRES_MS=3600000
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=5
```

---

## Render Deployment Setup

### Step 1: Set Environment Variables in Render

1. Go to your Render dashboard
2. Select your backend service
3. Click **Environment**
4. Add all variables from above (see exact values in `.env`)

### Step 2: Verify Database Connection
```bash
# Test connection locally:
node -e "
const mongoose = require('mongoose');
const MONGO_URI = 'mongodb+srv://kangach:kangach19%4019@cluster0.7bmfdr8.mongodb.net/kangaru_girls_db?retryWrites=true&w=majority';
mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ Database connected'))
  .catch(err => console.error('❌ Connection failed:', err.message))
"
```

### Step 3: MongoDB Atlas Whitelist
1. Go to MongoDB Atlas console
2. Click **Network Access**
3. Add Render's IP range: `0.0.0.0/0` (for simplicity)
4. Or add Render's specific IP from deployment logs

### Step 4: Deploy Code
```bash
cd kscbackend
git add .
git commit -m "chore: Configure database and CORS for production"
git push
```

---

## Development vs Production Configuration

### Local Development
```env
NODE_ENV=development
CLIENT_ORIGIN=http://localhost:5173
CORS_ORIGINS=http://localhost:5173,http://localhost:4000
```

### Production (Render)
```env
NODE_ENV=production
CLIENT_ORIGIN=https://kangarugirlsschool-sc-ke.onrender.com
CORS_ORIGINS=https://kangarugirlsschool-sc-ke.onrender.com
```

---

## Middleware Check

Verify your backend has CORS configured:

```javascript
// In kscbackend/index.js or middleware
const corsOrigins = (process.env.CORS_ORIGINS || 'http://localhost:5173').split(',');

app.use(cors({
  origin: function(origin, callback) {
    if (!origin || corsOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
```

---

## Database Connection Pooling

For optimal performance, ensure connection pooling is enabled:

```javascript
// In kscbackend/index.js
const mongoose = require('mongoose');

const mongooseOptions = {
  maxPoolSize: 10,          // Connection pool size
  minPoolSize: 5,           // Minimum connections
  maxIdleTimeMS: 45000,     // Timeout for idle connections
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
};

mongoose.connect(process.env.MONGO_URI, mongooseOptions)
  .then(() => console.log('✅ MongoDB connected with pooling'))
  .catch(err => console.error('❌ MongoDB connection failed:', err.message));
```

---

## Health Check Endpoint

Add a health check endpoint for monitoring:

```javascript
// Add this to your routes
app.get('/health', (req, res) => {
  const health = {
    status: 'UP',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: mongoose.connection.readyState === 1 ? 'CONNECTED' : 'DISCONNECTED'
  };
  
  if (mongoose.connection.readyState !== 1) {
    res.status(503).json(health);
  } else {
    res.status(200).json(health);
  }
});
```

Test: `curl https://kangarugirlsschool-sc-ke.onrender.com/health`

---

## Monitoring Checklist

After deployment:

- [ ] Database connection logs show "✅ MongoDB connected"
- [ ] CORS errors are gone from browser console
- [ ] API requests from frontend return 200 status
- [ ] Health check endpoint responds with `"status": "UP"`
- [ ] Database writes/reads working (test login, content updates)
- [ ] No connection timeout errors in logs

---

## Troubleshooting

### "Cannot connect to database"
1. Verify `MONGO_URI` in Render environment
2. Check MongoDB Atlas IP whitelist
3. Verify cluster is running (not paused)
4. Check credentials are correct

### "CORS error: Not allowed"
1. Verify `CORS_ORIGINS` matches frontend domain
2. Ensure `NODE_ENV=production` is set
3. Check that frontend URL has https protocol
4. Clear browser cache and hard refresh

### "Connection timeout"
1. Increase `serverSelectionTimeoutMS` to 10000
2. Check Render memory/CPU allocation
3. Verify network connectivity in Render logs

---

## Security Notes

🔒 **Keep `.env` private** - Never commit this file
- Add `.env` to `.gitignore`
- Only set variables in Render dashboard

🔒 **JWT Secret** - Should be strong and random
- Generated value is good
- Change it if you suspect exposure

🔒 **Admin Password** - Hash always stored
- Current: bcrypt hash, never plain text
- Good!

---

## Related Documentation
- See `POST_DEPLOYMENT_FIX.md` for frontend fixes
- See `.env` file for all current configuration
- MongoDB Atlas: https://cloud.mongodb.com
- Render Docs: https://render.com/docs

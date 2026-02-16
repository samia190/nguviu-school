# Database Configuration & Deployment Guide

Complete guide for wiring MongoDB to your application for local development and production deployment.

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Environment Configuration](#environment-configuration)
3. [MongoDB Setup](#mongodb-setup)
4. [Database Connection](#database-connection)
5. [Deployment Configuration](#deployment-configuration)
6. [Troubleshooting](#troubleshooting)
7. [Database Initialization](#database-initialization)
8. [Security Best Practices](#security-best-practices)

---

## Quick Start

### Local Development

```bash
# 1. Copy environment Template
cp .env.example .env

# 2. Add your MongoDB Atlas connection string to .env
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/kangaru_girls_db

# 3. Install dependencies
npm install

# 4. Create initial admin user
npm run create-admin

# 5. Start development server
npm run dev
```

### Production (Railway/Render)

```bash
# 1. Set MONGO_URI environment variable in deployment platform
# 2. Set JWT_SECRET, ADMIN_PASSWORD_HASH, and other secrets
# 3. Deploy your code
# 4. Run database initialization: node scripts/create-admin.js
```

---

## Environment Configuration

### Required Variables

The application checks for MongoDB URI in this order:

```
1. MONGO_URI           ← Preferred (Railway plugin compatibility)
2. MONGO_URL
3. MONGODB_URI         ← MongoDB Atlas standard
4. DATABASE_URL        ← Render/Heroku standard
```

You only need to set ONE of these.

### Configuration File

All settings are in `.env` (local) or deployment platform variables (production).

| Variable | Required | Default | Purpose |
|----------|----------|---------|---------|
| `MONGO_URI` | ✅ Yes | - | MongoDB connection string |
| `JWT_SECRET` | ✅ Yes | - | Token signing secret (64 hex chars) |
| `NODE_ENV` | ⭕ Optional | development | Environment mode |
| `CLIENT_ORIGIN` | ✅ Yes | localhost | Frontend URL for CORS & reset links |
| `CORS_ORIGINS` | ✅ Yes | localhost | Comma-separated allowed origins |
| `PORT` | ⭕ Optional | 4000 | Server port |

---

## MongoDB Setup

### Option 1: MongoDB Atlas (Recommended for Production)

1. **Create Account & Cluster**
   - Go to [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
   - Sign up (free tier available)
   - Create a new project
   - Create a free cluster

2. **Create Database & User**
   - Go to **Databases** → Click your cluster
   - Go to **Database Access** → **Add New Database User**
   - Username: `your-username`
   - Password: Generate secure password
   - Database: `kangaru_girls_db`

3. **Get Connection String**
   - Go to **Databases** → Click **Connect**
   - Choose **Connect with application drivers**
   - Select **Node.js**
   - Copy connection string (replace `<password>` and `<username>`)

   Format:
   ```
   mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/kangaru_girls_db?retryWrites=true&w=majority
   ```

4. **Whitelist IP Addresses**
   - Go to **Network Access**
   - Click **Add IP Address**
   - For development: Add your IP
   - For production: Add `0.0.0.0/0` (all IPs) or your deployment platform's IP

### Option 2: Local MongoDB (Development Only)

```bash
# macOS with Homebrew
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community

# Windows
# Download from: https://www.mongodb.com/try/download/community

# Docker
docker run -d --name mongodb -p 27017:27017 mongo:latest
```

Connection string: `mongodb://localhost:27017/kangaru_girls_db`

### Option 3: Railway MongoDB Plugin (Easiest for Railway)

1. Create a new service in Railway
2. Click **"Add Service"** → **"MongoDB"**
3. Railway automatically provides `DATABASE_URL`
4. Use `DATABASE_URL` in your app (no manual connection string needed)

---

## Database Connection

### Architecture

```
┌─────────────────────────────────┐
│       Application Start         │
│           (index.js)            │
└──────────────┬──────────────────┘
               │
               ▼
    ┌─────────────────────────┐
    │  Load Environment       │
    │  Variables (.env)       │
    └──────────────┬──────────┘
                   │
                   ▼
    ┌─────────────────────────────┐
    │ connectToDatabase()          │
    │ (services/dbConnection.js)   │
    └──────────────┬──────────────┘
                   │
       ┌───────────┴───────────┐
       │                       │
       ▼                       ▼
   SUCCESS              CONNECTION ERROR
     │                       │
     ├─ dbConnected=true     ├─ Log error & tips
     ├─ Start routes         ├─ Dev: Continue
     └─ Listen on PORT       └─ Prod: Exit with error
```

### Connection Service

Location: `services/dbConnection.js`

Features:
- ✅ Connection pooling (max 10 connections)
- ✅ Automatic retry handling
- ✅ Socket timeout configuration
- ✅ URI validation with helpful error messages
- ✅ Masking of credentials in logs
- ✅ Connection event tracking
- ✅ Production vs development modes

### Key Configuration Parameters

```javascript
// Connection pooling
maxPoolSize: 10,      // Maximum simultaneous connections
minPoolSize: 2,       // Maintain at least 2 connections

// Timeout settings
socketTimeoutMS: 45000,        // Socket timeout
serverSelectionTimeoutMS: 5000, // Connection timeout

// Automatic features
retryWrites: true,  // Automatic write retries
retryReads: true,   // Automatic read retries
autoIndex: true     // Auto-create indexes (false in prod)
```

---

## Deployment Configuration

### Railway Deployment

1. **Set Environment Variables**
   - Go to your backend service → **Variables**
   - Add these variables:

   ```
   MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/kangaru_girls_db
   JWT_SECRET=(generate with: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
   NODE_ENV=production
   CLIENT_ORIGIN=https://your-domain.com
   CORS_ORIGINS=https://your-domain.com
   ADMIN_EMAIL=admin@kangaru-girls.ac.ke
   ADMIN_PASSWORD_HASH=(bcrypt hash of your password)
   ```

2. **Initialize Database**

   After deployment, manually run:
   ```bash
   # SSH into Railway environment
   node scripts/create-admin.js
   ```

   Or add to Railway settings for automatic execution.

### Render Deployment

1. **Set Environment Variables**
   - Go to your service → **Environment**
   - Add same variables as Railway

2. **Build & Deploy**
   - Render will run `npm install`
   - Backend root directory: `kscbackend`
   - Start command: `npm start`

### Database Selection

| Platform | Recommendation |
|----------|---|
| Railway | Use Railway's MongoDB plugin (auto-configured) |
| Render | Use MongoDB Atlas (free tier works) |
| Heroku | MongoDB Atlas (Heroku doesn't offer MongoDB) |
| Vercel | MongoDB Atlas (for serverless) |

---

## Troubleshooting

### Connection Won't Establish

**Error**: `MongoDB connection failed`

Solutions:

```bash
# 1. Check URI format
# ✅ Correct:
mongodb+srv://user:pass@cluster.mongodb.net/db?retryWrites=true&w=majority

# ❌ Wrong:
mongodb+srv://user:pass@cluster.mongodb.net/db/

# 2. Verify credentials
# Test in MongoDB Atlas shell:
mongosh "mongodb+srv://user:pass@cluster.mongodb.net/db"

# 3. Check whitelist
# In Atlas Network Access, verify your IP is added

# 4. Check timezone
# Ensure server and MongoDB server are in sync
```

### Authentication Failed

**Error**: `authentication failed`

```bash
# 1. Regenerate password in MongoDB Atlas
# User → Database Access → Edit user → Update password

# 2. URL-encode special characters
# @ = %40
# Example: password123@ becomes password123%40
```

### Connection Timeout

**Error**: `serverSelectionTimeoutMS`

```bash
# 1. Check network/firewall
ping cluster.mongodb.net

# 2. Verify IP whitelist in MongoDB Atlas
# Network Access → check your IP

# 3. Check MongoDB cluster status
# Go to Clusters → check cluster status
```

### IndexError on Startup

**Error**: `index not found`

```bash
# In production, set:
NODE_ENV=production

# This disables autoIndex
# Create indexes manually via MongoDB Atlas UI or script
```

---

## Database Initialization

### Create Admin User

```bash
# Development
npm run create-admin

# This reads ADMIN_EMAIL and creates/updates the admin user
# Default password: admin123 (CHANGE AFTER LOGIN!)

# Production - after deployment
node scripts/create-admin.js
```

### Seed Data

```bash
# Seed Students
node scripts/migrateContentJsonToMongo.js

# Seed Results
node scripts/seedStudentResults2025.js

# Seed Content
node scripts/seedContent.js
```

### Schema/Data Migrations

Run migrations before deploying:

```bash
# Check migrations
node scripts/migrate-users.js

# Verify data integrity
node scripts/checkContent.js
```

---

## Security Best Practices

### 1. Credentials Management ✅

```bash
# ✅ DO: Use environment variables
MONGO_URI=mongodb+srv://user:pass@...

# ❌ DON'T: Hardcode in code
const uri = "mongodb+srv://user:pass@...";

# ✅ DO: Never commit .env
echo ".env" >> .gitignore

# ✅ DO: Use .env.example for templates
cp .env.example .env
```

### 2. JWT Secrets ✅

```bash
# Generate strong JWT secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Results in: a1b2c3d4e5f6... (128 hex characters)

# Update every 6 months in production
# Store in deployment platform, NOT in code
```

### 3. Database User Permissions ✅

```javascript
// Principle of Least Privilege:
// - Create DB user for each application
// - Grant only necessary permissions
// - Use separate users for read-only vs admin operations

// Read-only user:
// - readWrite on kantaru_girls_db only

// Admin user:
// - readWrite + admin on kantaru_girls_db
```

### 4. Network Security ✅

```javascript
// IP Whitelist in MongoDB Atlas:

// Development:
// - Add your development machine IP
// - Add Railway/Render IP ranges

// Production:
// - Never use 0.0.0.0/0 (unless no other option)
// - Whitelist only deployment platform IPs
// - Use VPC peering if available
```

### 5. Backup Strategy ✅

```bash
# MongoDB Atlas automatic backups:
// - Enabled by default in paid tier
// - Point-in-time recovery
// - Download backups from Atlas UI

# Manual backup:
mongodump --uri "mongodb+srv://user:pass@..." --out ./backup

# Restore:
mongorestore --uri "mongodb+srv://user:pass@..." ./backup
```

### 6. Connection Pooling ✅

```javascript
// Configured in dbConnection.js:
maxPoolSize: 10   // Prevent connection exhaustion
minPoolSize: 2    // Maintain healthy connections
socketTimeoutMS: 45000  // Timeout hung connections
```

---

## Useful Commands

```bash
# Test connection locally
node -e "require('dotenv').config(); const url = process.env.MONGO_URI; console.log('Testing:', url.substring(0, 20) + '...' + url.substring(url.length-10));"

# Generate secrets
node -e "console.log('JWT:', require('crypto').randomBytes(64).toString('hex')); console.log('ID Card:', require('crypto').randomBytes(32).toString('hex'))"

# Check MongoDB version
mongosh --version

# Exit code 0
import + console checks ✅
```

---

## Additional Resources

- [MongoDB Connection String Format](https://www.mongodb.com/docs/manual/reference/connection-string/)
- [MongoDB Atlas Documentation](https://www.mongodb.com/docs/atlas/)
- [Railway MongoDB Plugin](https://docs.railway.app/plugins/mongodb)
- [Render Database Documentation](https://render.com/docs/databases)
- [Mongoose Connection Options](https://mongoosejs.com/docs/connections.html)

---

**Last Updated**: February 16, 2026
**Database**: MongoDB
**ORM**: Mongoose v8.23.0

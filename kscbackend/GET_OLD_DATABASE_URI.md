# 🔑 How to Get Your Old Database Connection String

Guide to locate and obtain your old database URI for migration.

---

## 🎯 Quick Summary

Your old database URI should look like:
```
mongodb+srv://username:password@cluster-name.mongodb.net/database-name
```
OR
```
mongodb://localhost:27017/database-name
```

---

## 📍 Where to Find It

### If Using MongoDB Atlas (Cloud)

**Easiest way - Follow these steps:**

1. Go to [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Log in to your account
3. Click on **Clusters** in the left sidebar
4. Find your old cluster (the one with the old data)
5. Click the **Connect** button
6. Select **Drivers** (or **Connection String**)
7. Copy the connection string

**It will look like:**
```
mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/database_name?retryWrites=true&w=majority
```

**Note:** Replace:
- `username` - Your actual username
- `password` - Your actual password (URL encoded if special characters)
- `cluster0.xxxxx` - Your actual cluster identifier
- `database_name` - Your database name

---

### If Using Local MongoDB

**For localhost MongoDB:**
```
mongodb://localhost:27017/database_name
```

**Replace:**
- `database_name` - Your actual database name

---

### If Using MongoDB Deployed to Render/Railway

**Check these locations:**

**Render:**
1. Go to [dashboard.render.com](https://dashboard.render.com)
2. Click your MongoDB service
3. Go to **Environment**
4. Look for `MONGO_URI` or `DATABASE_URL`
5. Copy the value

**Railway:**
1. Go to [railway.app](https://railway.app)
2. Click your project
3. Select MongoDB service
4. Click **Data** tab
5. Copy the connection string

---

### If You've Forgotten Your Credentials

**For MongoDB Atlas:**

1. Go to [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Click your cluster
3. Go to **Security** → **Database Access**
4. You'll see your database users listed
5. If you forgot the password, click **Edit** and set a new one

**For Local MongoDB:**
- Typically no authentication required
- Default: `mongodb://localhost:27017`

---

## 🔐 Special Characters in Password

If your password contains special characters, URL encode them:

| Character | Encoded |
|-----------|---------|
| `@` | `%40` |
| `:` | `%3A` |
| `/` | `%2F` |
| `#` | `%23` |
| `?` | `%3F` |
| `&` | `%26` |

**Example:**
- Raw password: `pass@word#123`
- Encoded password: `pass%40word%23123`
- Full URI: `mongodb+srv://user:pass%40word%23123@cluster.mongodb.net/db`

---

## ✅ Testing Your Connection String

Before using it for migration, test it:

### Option 1: MongoDB Compass (Easy)
1. Download [MongoDB Compass](https://www.mongodb.com/products/tools/compass)
2. Click **New Connection**
3. Paste your URI
4. Click **Connect**
5. If successful, you're good!

### Option 2: Command Line
```bash
# Install mongosh if you don't have it
npm install -g mongosh

# Test your connection
mongosh "<your-connection-string>"

# If connected, you'll see:
# Current Mongosh version: x.x.x
# Connecting to: mongodb+srv://...
# Using MongoDB: x.x.x
```

### Option 3: Node.js Script
```bash
# Create a test file
cat > test-connection.mjs << 'EOF'
import mongoose from 'mongoose';

const uri = process.env.SOURCE_MONGO_URI;
if (!uri) {
  console.error('Please set SOURCE_MONGO_URI');
  process.exit(1);
}

console.log('Testing connection to:', uri.split('@')[1] || uri);

try {
  const conn = await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
  const db = conn.connection.db;
  
  const collections = await db.listCollections().toArray();
  console.log('✅ Connected! Collections:', collections.map(c => c.name));
  
  await conn.disconnect();
} catch (error) {
  console.error('❌ Connection failed:', error.message);
  process.exit(1);
}
EOF

# Run the test
SOURCE_MONGO_URI="<your-uri>" node test-connection.mjs
```

---

## 📋 Common Connection String Examples

### MongoDB Atlas Example
```
mongodb+srv://john_user:SecurePass123@cluster0.h4j2k.mongodb.net/my_school_db?retryWrites=true&w=majority
```
- Host: `john_user`
- Password: `SecurePass123`
- Cluster: `cluster0.h4j2k`
- Database: `my_school_db`

### Local MongoDB Example
```
mongodb://localhost:27017/old_database
```
- No authentication
- Local server
- Database: `old_database`

### Render/Railway Example
```
mongodb+srv://railway_user:auto_generated_pass@railway-cluster.mongodb.net/railway_db
```

---

## 🆘 Troubleshooting Connection Issues

### "Connection refused"
- MongoDB server not running (if local)
- Wrong host/port
- Firewall blocking connection

### "Authentication failed"
- Wrong username or password
- User doesn't have access to database
- Password needs URL encoding

### "Server selection timed out"
- Cluster might be down
- Network connectivity issue
- IP not whitelisted (MongoDB Atlas)

---

## 🔒 Security Best Practices

1. **Never commit credentials to Git**
   - Use environment variables
   - Use `.env` file (in `.gitignore`)

2. **Use strong passwords**
   - Mix upper/lowercase, numbers, symbols
   - At least 16 characters

3. **Limit database user permissions**
   - Read-only access for migrations
   - Separate users for different purposes

4. **Rotate credentials regularly**
   - Change passwords periodically
   - Especially after migration

---

## 📝 Quick Reference

When you're ready to migrate, you'll use:

```bash
SOURCE_MONGO_URI="<your-old-database-uri>" node migrate-data-unified.mjs --dry-run
```

**Example (replace with your actual URI):**
```bash
SOURCE_MONGO_URI="mongodb+srv://user:pass@oldcluster.mongodb.net/old_db" node migrate-data-unified.mjs --dry-run
```

---

## 🎓 Understanding Connection Strings

A MongoDB connection string has this format:

```
mongodb[+srv]://[username[:password]@]host[:port][/[database][?options]]
```

Breaking it down:
- `mongodb+srv` - Use DNS lookup (for Atlas)
- `username:password` - Credentials (optional)
- `@host` - Database server address
- `/database` - Specific database to use
- `?options` - Connection options

---

## 📞 Still Need Help?

1. **Check MongoDB Atlas documentation** - See "Connect to Your Cluster"
2. **Verify credentials** - Login to MongoDB Atlas
3. **Test with MongoDB Compass** - Visual way to test connections
4. **Check firewall/network** - Ensure connection is allowed

---

Once you have your old database URI, proceed to [MIGRATION_QUICKSTART.md](./MIGRATION_QUICKSTART.md) to start the migration! 🚀

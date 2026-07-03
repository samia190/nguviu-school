# Data Migration Guide - Old Database to New

Complete guide for migrating Users, Gallery Items, and Staff/Teachers data to the new MongoDB Atlas cluster.

---

## 📋 Prerequisites

Before starting, ensure:

- ✅ Node.js 20+ installed
- ✅ Access to old database (connection string)
- ✅ Access to new MongoDB Atlas cluster
- ✅ Network access from your machine to both databases
- ✅ Backup of old database (automated by migration script)

---

## 🔍 Step 1: Identify Database Connection Strings

### Old Database Connection String

**If from MongoDB Atlas (old cluster):**
```
MongoDB Atlas → cluster → Connect → connection string
Example: mongodb+srv://user:password@oldcluster.mongodb.net/dbname
```

**If from Local/Self-hosted:**
```
Example: mongodb://localhost:27017/old_database
```

### New Database Connection String (Already Set)

In your `.env` file:
```
MONGO_URI=mongodb+srv://mukundisam19_db_user:q8y242zVFaJl8Qk6@cluster0.2cl2d2a.mongodb.net/kangaru_girls_db
```

---

## 🚀 Step 2: Run the Migration

### Option A: Quick Test (DRY RUN - No Changes)

Test without modifying any data:

```bash
cd kscbackend

# Using environment variable
SOURCE_MONGO_URI="<your-old-database-uri>" node migrate-data-unified.mjs --dry-run

# Example:
SOURCE_MONGO_URI="mongodb+srv://user:pass@oldcluster.mongodb.net/old_db" node migrate-data-unified.mjs --dry-run
```

**Expected Output:**
```
✅ Database Migration Tool
ℹ️  Mode: DRY RUN
ℹ️  Collections: users, gallerytems, staff

✅ Connected to source database
✅ Connected to target database

ℹ️  Starting migration of users...
ℹ️  Source: 45 documents | Target: 12 documents
...
```

### Option B: Execute Real Migration

**WARNING: This will modify the target database. Ensure you have backups!**

```bash
cd kscbackend

SOURCE_MONGO_URI="<your-old-database-uri>" node migrate-data-unified.mjs
```

### Option C: Migrate Specific Collections

```bash
cd kscbackend

SOURCE_MONGO_URI="<your-old-database-uri>" node migrate-data-unified.mjs --collections users,staff
```

---

## 📊 Step 3: Monitor Migration

During migration, you'll see:

```
ℹ️  Starting migration of users...
ℹ️  Source: 45 documents | Target: 12 documents

✅ Backed up users to migration-backups/users-backup-2026-06-19T10-30-45.json
  Progress: 100/45 (100%)
✅ Migrated 45 documents from users
```

### What's Happening

1. **Connection**: Script connects to both databases
2. **Backup**: Creates backup of source data in `migration-backups/` folder
3. **Transfer**: Copies documents from old to new database
4. **Upsert**: Uses `_id` to avoid duplicates
5. **Validation**: Compares document counts

---

## ✅ Step 4: Verify Migration

### Quick Check - Count Documents

```bash
cd kscbackend

# Check each collection count
node << 'EOF'
import 'dotenv/config';
import mongoose from 'mongoose';

const uri = process.env.MONGO_URI;
const conn = await mongoose.connect(uri);
const db = conn.connection.db;

const collections = ['users', 'gallerytems', 'staff'];
for (const col of collections) {
  const count = await db.collection(col).countDocuments();
  console.log(`${col}: ${count} documents`);
}

await conn.disconnect();
EOF
```

### Detailed Verification

```bash
cd kscbackend

# Run verification script
node verify-migration.mjs
```

---

## 🔄 Step 5: Check Migration Report

After migration completes, a report is automatically created:

```bash
# Find the latest report
ls -ltr kscbackend/migration-backups/migration-report-*.json | tail -1

# View the report
cat kscbackend/migration-backups/migration-report-<timestamp>.json
```

**Report contains:**
- Source and target databases
- Document counts per collection
- Any errors or warnings
- Migration duration
- Backup file locations

---

## 🛠️ Troubleshooting

### Error: "ECONNREFUSED - connection refused"

**Cause**: Can't reach the source database

**Solution**:
1. Verify connection string is correct
2. Check IP whitelist in MongoDB Atlas (if using Atlas)
3. Verify VPN/firewall allows connection
4. Test with: `mongosh "<your-connection-string>"`

### Error: "Authentication failed"

**Cause**: Invalid credentials

**Solution**:
1. Verify username and password in connection string
2. Check for special characters (URL encode: `@` → `%40`)
3. Verify user has necessary permissions
4. Check user exists in source database

### Error: "Collection not found" or "0 documents"

**Cause**: Collections don't exist in source database

**Solution**:
1. Verify collection names are correct
2. Check if data exists: `db.collection.countDocuments()`
3. Use different collection names if needed

### Migration Stops or Hangs

**Solution**:
1. Press Ctrl+C to stop
2. Check migration report for partial progress
3. Retry - script will resume from where data matches by `_id`

---

## 🔒 Data Validation Checklist

After migration, verify:

- [ ] Document counts match between old and new (or new has more)
- [ ] User accounts can still login
- [ ] Gallery items display correctly
- [ ] Staff/Teacher profiles accessible
- [ ] No 404 errors for related documents
- [ ] Image URLs/files still work
- [ ] Timestamps are preserved

---

## 📝 Manual Data Verification

```bash
cd kscbackend

# Connect to MongoDB and manually check
mongosh "<your-new-database-uri>"

# List all collections
show collections

# Count documents
db.users.countDocuments()
db.gallerytems.countDocuments()
db.staff.countDocuments()

# View sample document
db.users.findOne()

# Check specific user
db.users.findOne({ email: "admin@example.com" })
```

---

## 🔄 Rollback (If Needed)

If migration fails or you need to restore:

1. **Use MongoDB Atlas backup:**
   - Go to MongoDB Atlas → Cluster → Backup
   - Restore to a point-in-time before migration

2. **Or use script backup:**
   - Backups are in `kscbackend/migration-backups/`
   - Each collection is backed up as JSON
   - Can be re-imported if needed

---

## 📚 Reference: Collection Structures

### Users Collection
```javascript
{
  _id: ObjectId,
  email: string,
  passwordHash: string,
  role: string, // 'admin', 'teacher', 'parent', 'student'
  profile: {
    firstName: string,
    lastName: string,
    phone: string
  },
  createdAt: Date,
  updatedAt: Date
}
```

### Gallery Items Collection
```javascript
{
  _id: ObjectId,
  title: string,
  description: string,
  attachments: [{
    fileName: string,
    url: string,
    size: number
  }],
  createdAt: Date,
  updatedAt: Date
}
```

### Staff Collection
```javascript
{
  _id: ObjectId,
  name: string,
  title: string,
  department: string,
  email: string,
  phone: string,
  image: string,
  bio: string,
  createdAt: Date,
  updatedAt: Date
}
```

---

## 💡 Best Practices

1. **Always test with --dry-run first** - See what will happen without changes
2. **Create backups** - Script automatically backs up old data
3. **Verify after migration** - Check document counts and sample data
4. **Test in development** - Ensure everything works before production
5. **Keep migration logs** - The report shows exactly what happened
6. **Schedule for low-traffic time** - Minimize impact on users

---

## 🎯 Quick Command Reference

```bash
# Test without making changes
SOURCE_MONGO_URI="<old-db>" node migrate-data-unified.mjs --dry-run

# Migrate all default collections
SOURCE_MONGO_URI="<old-db>" node migrate-data-unified.mjs

# Migrate specific collections
SOURCE_MONGO_URI="<old-db>" node migrate-data-unified.mjs --collections users,staff

# Verify migration
node verify-migration.mjs

# View latest report
cat migration-backups/migration-report-*.json | tail -1
```

---

## ❓ Need Help?

If you encounter issues:

1. Check the migration report: `migration-backups/migration-report-*.json`
2. Review backups: `migration-backups/`
3. Check database connection: `node scripts/db-setup.js --connect-only`
4. Verify source database has data: Use MongoDB Compass or mongosh

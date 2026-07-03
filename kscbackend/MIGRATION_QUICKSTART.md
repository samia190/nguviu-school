# 🚀 Data Migration Quick Start

Step-by-step guide to migrate your data from old database to new MongoDB Atlas cluster.

---

## 📋 What Will Be Migrated

- **Users** - All user accounts and authentication data
- **Gallery Items** - All gallery images and metadata
- **Staff/Teachers** - All staff profiles

---

## ✅ Pre-Migration Checklist

Before you start, gather:

- [ ] **Old Database URI** - Connection string to your old MongoDB/database
  - Example: `mongodb+srv://user:pass@oldcluster.mongodb.net/old_db`
- [ ] **New Database URI** - Already configured in `.env`:
  - `MONGO_URI=mongodb+srv://mukundisam19_db_user:q8y242zVFaJl8Qk6@cluster0.2cl2d2a.mongodb.net/kangaru_girls_db`

---

## 🔧 Step 1: Install Dependencies

```bash
cd kscbackend
npm install
```

**This installs required packages including the new `chalk` dependency for colored output.**

---

## 🧪 Step 2: Test Migration (DRY RUN - Safe!)

First, test without making any changes:

```bash
cd kscbackend

# Replace <YOUR-OLD-DATABASE-URI> with your actual old database connection string
SOURCE_MONGO_URI="<YOUR-OLD-DATABASE-URI>" node migrate-data-unified.mjs --dry-run
```

**Example:**
```bash
SOURCE_MONGO_URI="mongodb+srv://user:pass@oldcluster.mongodb.net/old_db" node migrate-data-unified.mjs --dry-run
```

### Expected Output:
```
✅ Database Migration Tool
ℹ️  Mode: DRY RUN
ℹ️  Collections: users, gallerytems, staff

✅ Connected to source database
✅ Connected to target database

ℹ️  Starting migration of users...
ℹ️  Source: 45 documents | Target: 12 documents
✅ Backed up users to migration-backups/users-backup-...json
  Progress: 100/45 (100%)
✅ Migrated 45 documents from users

ℹ️  Starting migration of gallerytems...
...
```

**If you see errors:**
- Check your old database URI is correct
- Verify you have network access to the old database
- See Troubleshooting section below

---

## ✨ Step 3: Execute Real Migration

Once the dry run succeeds, run the actual migration:

```bash
cd kscbackend

SOURCE_MONGO_URI="<YOUR-OLD-DATABASE-URI>" node migrate-data-unified.mjs
```

### What Happens:
1. ✅ Connects to old database
2. ✅ Connects to new database
3. ✅ Backs up each collection
4. ✅ Transfers documents (with upsert to avoid duplicates)
5. ✅ Validates migration
6. ✅ Creates migration report

**⏱️ Duration**: Depends on data size
- Small dataset (< 1000 docs): ~10 seconds
- Medium dataset (1000-10000 docs): ~30 seconds
- Large dataset (> 10000 docs): 1-5 minutes

---

## ✅ Step 4: Verify Migration Success

After migration completes:

```bash
cd kscbackend
node verify-data-migration.mjs
```

### Example Output:
```
✅ Connected to target database

ℹ️  users: 45 documents (123 KB)
ℹ️  gallerytems: 156 documents (45 MB)
ℹ️  staff: 12 documents (234 KB)

Total Documents: 213
Total Size: 45.36 MB

✅ Data exists in target database
✅ Users collection: 45 documents
✅ Gallery Items collection: 156 documents
✅ Staff collection: 12 documents

✅ All users have email field (45)
✅ All gallery items have title (156)
✅ All staff have name (12)

✅ Migration appears successful! ✨
Total: 213 documents migrated to target database
```

---

## 📊 Step 5: Check Migration Report

A detailed report is automatically created:

```bash
# View the latest migration report
cat kscbackend/migration-backups/migration-report-*.json | head -50
```

**Report includes:**
- ✅ Document counts before/after
- ✅ Collections migrated
- ✅ Any errors or warnings
- ✅ Migration duration
- ✅ Backup file locations

---

## 🔍 Common Issues & Solutions

### ❌ Error: "Connection refused"

**Problem**: Can't reach the old database

**Solutions**:
1. Double-check your old database URI (copy-paste carefully)
2. If MongoDB Atlas: check IP whitelist in cluster settings
3. Verify you have internet access
4. Try connecting manually first: `mongosh "<your-old-database-uri>"`

### ❌ Error: "Authentication failed"

**Problem**: Wrong credentials

**Solutions**:
1. Verify username and password are correct
2. Check for special characters (need URL encoding: `@` → `%40`)
3. Ensure user exists in old database
4. Verify user has read permissions

### ❌ Error: "Collection not found" or "0 documents"

**Problem**: Old database doesn't have the collections

**Solutions**:
1. Verify the collections exist in old database
2. Use different collection names if they're named differently
3. Run `mongosh` and check: `show collections`

### ❌ Script hangs/doesn't respond

**Problem**: Connection timeout

**Solutions**:
1. Press Ctrl+C to stop
2. Verify database is accessible
3. Check firewall/VPN settings
4. Try with smaller batch sizes

---

## 🎯 Advanced Options

### Migrate Only Specific Collections

```bash
SOURCE_MONGO_URI="<old-db>" node migrate-data-unified.mjs --collections users,staff
```

### Migrate with Custom Target Database

```bash
SOURCE_MONGO_URI="<old-db>" \
TARGET_MONGO_URI="<new-db>" \
node migrate-data-unified.mjs
```

---

## 📁 File Locations

After migration, check these folders:

```
kscbackend/
├── migrate-data-unified.mjs           ← Main migration script
├── verify-data-migration.mjs          ← Verification script
├── MIGRATION_GUIDE.md                 ← Detailed guide
└── migration-backups/
    ├── users-backup-2026-06-19...json
    ├── gallerytems-backup-2026-06-19...json
    ├── staff-backup-2026-06-19...json
    └── migration-report-2026-06-19...json
```

---

## 🚨 Need to Rollback?

If something goes wrong:

### Option 1: MongoDB Atlas Automatic Backup
1. Go to MongoDB Atlas → Your Cluster → Backup tab
2. Find a backup from before the migration
3. Restore to Point-in-Time (PITR)

### Option 2: Manual Restore from Script Backup
The script automatically creates backups of old data. If needed, they can be re-imported.

---

## 💡 Next Steps After Migration

1. ✅ Verify migration with `verify-data-migration.mjs`
2. ✅ Test login with user accounts
3. ✅ Check gallery images display correctly
4. ✅ Verify staff profiles load
5. ✅ Run application tests
6. ✅ Test in browser
7. ✅ Update any documentation
8. ✅ Notify users if needed

---

## 📞 Need Help?

1. **Check the error message** - Often says exactly what's wrong
2. **Look at the migration report** - Shows what happened
3. **Review backups** - Located in `migration-backups/`
4. **Manual database check**:
   ```bash
   mongosh "<your-database-uri>"
   show collections
   db.users.countDocuments()
   ```

---

## 🎓 Understanding the Process

### What the Script Does

1. **Connects to Both Databases**
   - Opens connection to old database
   - Opens connection to new database

2. **Creates Backups**
   - Exports each collection to JSON file
   - Stored in `migration-backups/` folder
   - Acts as safety net for rollback

3. **Transfers Data**
   - Reads documents from old database in batches
   - Writes to new database using upsert (update or insert)
   - If document exists (by `_id`), updates it
   - If document is new, inserts it
   - Prevents duplicate documents

4. **Validates**
   - Counts documents in both databases
   - Checks data integrity
   - Reports any discrepancies

5. **Creates Report**
   - Documents entire migration process
   - Records any errors or warnings
   - Timestamps and statistics

---

## 🎯 Success Criteria

Migration is successful when:

- ✅ No connection errors to either database
- ✅ All collections migrated (users, gallery, staff)
- ✅ Document counts match expectations
- ✅ No data integrity errors
- ✅ Migration report shows 0 errors
- ✅ `verify-data-migration.mjs` returns success

---

## 📝 Command Reference

```bash
# 1. Install dependencies
npm install

# 2. Test without changes (safe!)
SOURCE_MONGO_URI="<old-db>" node migrate-data-unified.mjs --dry-run

# 3. Run actual migration
SOURCE_MONGO_URI="<old-db>" node migrate-data-unified.mjs

# 4. Verify success
node verify-data-migration.mjs

# 5. View migration report
cat migration-backups/migration-report-*.json

# 6. View backups
ls -lh migration-backups/
```

---

**You're ready! Proceed with Step 2 (Dry Run) above.** 🚀

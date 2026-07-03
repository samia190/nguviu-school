# ✅ Data Migration Checklist

Use this checklist to track your progress through the data migration process.

---

## 📋 Pre-Migration Preparation

### Get Your Old Database Connection
- [ ] Read [GET_OLD_DATABASE_URI.md](./GET_OLD_DATABASE_URI.md)
- [ ] Located old database connection string
- [ ] Tested connection (optional but recommended)
- [ ] Connection string format verified:
  - [ ] Looks like: `mongodb+srv://user:pass@cluster.mongodb.net/db`
  - [ ] OR: `mongodb://localhost:27017/db`
  - [ ] Special characters URL encoded (if needed)

### Verify New Database Access
- [ ] Confirmed new database URI in `.env`:
  ```
  MONGO_URI=mongodb+srv://mukundisam19_db_user:q8y242zVFaJl8Qk6@cluster0.2cl2d2a.mongodb.net/kangaru_girls_db
  ```
- [ ] New database is accessible
- [ ] Have backup of new database (optional but safe)

### Environment Setup
- [ ] Node.js 20+ installed (`node --version`)
- [ ] In correct directory: `cd kscbackend`
- [ ] `.env` file exists and configured
- [ ] Package.json is up to date

---

## 🔧 Installation & Setup

### Install Dependencies
- [ ] Ran `npm install` in kscbackend directory
- [ ] No installation errors
- [ ] Chalk package installed (for colored output)

### Verify Scripts Are Present
- [ ] `migrate-data-unified.mjs` exists
- [ ] `verify-data-migration.mjs` exists
- [ ] `MIGRATION_GUIDE.md` accessible
- [ ] `migration-backups/` folder created (if not exists)

---

## 🧪 Testing Phase (DRY RUN)

### Run Dry Run Test
```bash
SOURCE_MONGO_URI="<your-old-database-uri>" node migrate-data-unified.mjs --dry-run
```

- [ ] Command executed without errors
- [ ] Connected to source database: ✅
- [ ] Connected to target database: ✅
- [ ] Collections found in source:
  - [ ] users - Count: ____
  - [ ] gallerytems - Count: ____
  - [ ] staff - Count: ____

### Review Dry Run Output
- [ ] No connection errors
- [ ] No authentication errors
- [ ] Showed document counts from source database
- [ ] Migration plan looks reasonable
- [ ] Ready to proceed with real migration

### Troubleshoot If Needed
- [ ] Check connection string (copy-paste carefully)
- [ ] Verify credentials are correct
- [ ] Ensure network access to old database
- [ ] Check if collections exist in source DB

---

## 🚀 Execution Phase (Real Migration)

### Run Real Migration
```bash
SOURCE_MONGO_URI="<your-old-database-uri>" node migrate-data-unified.mjs
```

- [ ] Command started successfully
- [ ] Connected to source database: ✅
- [ ] Connected to target database: ✅
- [ ] Began backing up collections
- [ ] Migration in progress...

### Monitor Migration
- [ ] Progress indicator shows 0-100% for each collection
- [ ] No unexpected errors or warnings
- [ ] Migration completes without timeout

### Post-Migration Activity
- [ ] Backups created in `migration-backups/`:
  - [ ] users-backup-*.json
  - [ ] gallerytems-backup-*.json
  - [ ] staff-backup-*.json
- [ ] Migration report generated:
  - [ ] migration-report-*.json
- [ ] All collections show migrated count

---

## ✅ Verification Phase

### Run Verification Script
```bash
cd kscbackend
node verify-data-migration.mjs
```

- [ ] Connected to target database: ✅
- [ ] Can read from all collections
- [ ] No permission errors

### Check Collection Counts
- [ ] Users count displayed
- [ ] Gallery Items count displayed  
- [ ] Staff count displayed
- [ ] Total documents matches expected

### Verify Data Integrity
- [ ] All users have email field
- [ ] All gallery items have title
- [ ] All staff have name
- [ ] All required fields present

### Migration Result
- [ ] Verification script output: ✅ SUCCESS
- [ ] Or if warnings, noted and acceptable

---

## 📊 Review Migration Report

### Locate Report
```bash
ls -lh migration-backups/migration-report-*.json
```

- [ ] Found latest migration report
- [ ] Opened and reviewed the JSON file

### Check Report Contents
- [ ] Source database identified
- [ ] Target database identified
- [ ] Collections listed: users, gallerytems, staff
- [ ] Document counts recorded:
  - [ ] Users: ____ → ____
  - [ ] Gallery Items: ____ → ____
  - [ ] Staff: ____ → ____
- [ ] Migration duration: ______ seconds
- [ ] Errors count: ____ (should be 0)
- [ ] Warnings count: ____ (should be 0 or acceptable)
- [ ] All documents migrated successfully

---

## 🧪 Application Testing

### Test User Authentication
- [ ] Can log in with existing user account
- [ ] Login creates valid JWT token
- [ ] User profile loads correctly
- [ ] Role/permissions working

### Test Gallery Access
- [ ] Gallery items page loads
- [ ] All gallery items display
- [ ] Images load without 404 errors
- [ ] Gallery metadata displays correctly

### Test Staff Section
- [ ] Staff page loads
- [ ] All staff members display
- [ ] Staff photos/images load
- [ ] Staff information displays correctly

### Test Related Data
- [ ] Student records load
- [ ] Results display correctly
- [ ] Links still functional
- [ ] Events display properly

### Overall Application Check
- [ ] No 404 errors
- [ ] No database connection errors
- [ ] No missing data
- [ ] Performance acceptable
- [ ] All features working

---

## 🔒 Post-Migration

### Backup Verification
- [ ] All backup files present:
  - [ ] users-backup-*.json
  - [ ] gallerytems-backup-*.json
  - [ ] staff-backup-*.json
  - [ ] migration-report-*.json
- [ ] Backups stored safely
- [ ] Can access backups if needed for reference

### Documentation
- [ ] Migration date recorded: __/__/____
- [ ] Old database archived/documented
- [ ] New database confirmed
- [ ] Any data differences noted
- [ ] Migration notes saved

### Cleanup (Optional)
- [ ] Old database no longer needed? Backed up safely?
- [ ] Old database access credentials secured
- [ ] Migration scripts documented for future reference
- [ ] Team notified of migration completion

---

## 🎯 Success Criteria - ALL CHECKED?

✅ Migration completed without errors
✅ All collections migrated (users, gallery, staff)
✅ Document counts verified
✅ Data integrity checks passed
✅ Application tests successful
✅ No 404 or database errors
✅ Backups created and verified
✅ Migration report documented
✅ Team notified/aware

---

## 📝 Additional Notes

Use this space to record any issues, resolutions, or observations:

```
Date: ____/____/____
Time: ____:____ AM/PM

Observations:
_________________________________________________________________

_________________________________________________________________

_________________________________________________________________

Issues Encountered:
_________________________________________________________________

_________________________________________________________________

Resolutions Applied:
_________________________________________________________________

_________________________________________________________________

Final Status: ☐ SUCCESS  ☐ PARTIAL  ☐ FAILED

Notes for Future Reference:
_________________________________________________________________

_________________________________________________________________
```

---

## 🔄 If Migration Failed

### Rollback Steps
- [ ] Stop current process (if running)
- [ ] Review migration report for errors
- [ ] Check MongoDB Atlas backup (automatic)
- [ ] Consider restoring from pre-migration backup
- [ ] Note issues encountered
- [ ] Contact support if needed

### Try Again
- [ ] Fix identified issue(s)
- [ ] Backup new database (if modified)
- [ ] Run dry run test again: `--dry-run`
- [ ] Verify results
- [ ] Re-run migration

---

## 🎓 Common Scenarios

### Scenario 1: Everything Works First Try
✅ Congratulations! Mark all sections complete
✅ Update team documentation
✅ Archive this checklist with date

### Scenario 2: Small Warnings/Issues
✅ Note issues in "Additional Notes" section
✅ If not critical, proceed to testing phase
✅ Verify in application if warning items work
✅ Document resolution

### Scenario 3: Significant Issues
❌ DO NOT SKIP VERIFICATION STEPS
❌ Investigate before proceeding
❌ Use backups to rollback if needed
❌ Retry migration after fixes

---

## 📞 Help Resources

If stuck:
1. Read [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md) - Detailed reference
2. Check [GET_OLD_DATABASE_URI.md](./GET_OLD_DATABASE_URI.md) - Connection issues
3. Review migration report for specific errors
4. Check MongoDB documentation
5. Verify database connections manually

---

## ✨ Migration Complete!

When all checkboxes are marked:

✅ Data successfully migrated
✅ Verified and tested
✅ Application working correctly
✅ Team aware and ready
✅ Backups secured
✅ Documentation complete

**🎉 Your data migration is complete and verified! 🎉**

---

**Date Completed**: ____/____/____
**Migrated By**: ________________________
**Verified By**: ________________________

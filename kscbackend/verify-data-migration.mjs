#!/usr/bin/env node
/**
 * Data Migration Verification Script
 * Validates that Users, Gallery Items, and Staff were successfully migrated
 */

import 'dotenv/config';
import mongoose from 'mongoose';
import chalk from 'chalk';

const log = {
  success: (msg) => console.log(chalk.green('✅ ' + msg)),
  error: (msg) => console.log(chalk.red('❌ ' + msg)),
  warning: (msg) => console.log(chalk.yellow('⚠️  ' + msg)),
  info: (msg) => console.log(chalk.blue('ℹ️  ' + msg)),
  header: (msg) => console.log(chalk.cyan.bold('\n' + msg)),
};

async function verifyDataMigration() {
  const mongoUri = process.env.MONGO_URI;

  if (!mongoUri) {
    log.error('MONGO_URI environment variable not set');
    process.exit(1);
  }

  log.header('Data Migration Verification Tool');
  log.info(`Target Database: ${mongoUri.split('@')[1] || mongoUri}`);

  try {
    const conn = await mongoose.connect(mongoUri);
    const db = conn.connection.db;

    log.success('Connected to target database');

    log.header('Collection Statistics');

    const collections = ['users', 'gallerytems', 'staff'];
    const stats = {};

    for (const colName of collections) {
      try {
        const collection = db.collection(colName);
        const count = await collection.countDocuments();
        const size = await collection.stats().then(s => s.size).catch(() => 0);

        stats[colName] = { count, size };

        const sizeKB = (size / 1024).toFixed(2);
        log.info(`${colName}: ${count} documents (${sizeKB} KB)`);

        // Show sample document
        const sample = await collection.findOne();
        if (sample) {
          log.info(`  Sample: ${JSON.stringify(sample).substring(0, 80)}...`);
        }
      } catch (error) {
        if (error.message.includes('ns does not exist')) {
          log.warning(`${colName}: Collection not found (empty/not created)`);
          stats[colName] = { count: 0, size: 0 };
        } else {
          log.warning(`${colName}: Error - ${error.message}`);
        }
      }
    }

    log.header('Summary');

    const totalDocs = Object.values(stats).reduce((sum, s) => sum + s.count, 0);
    const totalSize = Object.values(stats).reduce((sum, s) => sum + s.size, 0);
    const totalSizeMB = (totalSize / 1024 / 1024).toFixed(2);

    log.info(`Total Documents: ${totalDocs}`);
    log.info(`Total Size: ${totalSizeMB} MB`);

    // Verification checks
    log.header('Verification Checks');

    // Check 1: At least some data
    if (totalDocs > 0) {
      log.success('Data exists in target database');
    } else {
      log.error('No data found in target database');
    }

    // Check 2: All collections have data
    if (stats.users.count > 0) {
      log.success(`Users collection: ${stats.users.count} documents`);
    } else {
      log.warning('Users collection is empty');
    }

    if (stats.gallerytems.count > 0) {
      log.success(`Gallery Items collection: ${stats.gallerytems.count} documents`);
    } else {
      log.warning('Gallery Items collection is empty');
    }

    if (stats.staff.count > 0) {
      log.success(`Staff collection: ${stats.staff.count} documents`);
    } else {
      log.warning('Staff collection is empty');
    }

    // Check 3: Data consistency
    log.header('Data Integrity Checks');

    try {
      const usersCol = db.collection('users');
      const validUsers = await usersCol.countDocuments({ email: { $exists: true } });
      const invalidUsers = stats.users.count - validUsers;
      
      if (invalidUsers === 0) {
        log.success(`All users have email field (${validUsers})`);
      } else {
        log.warning(`${invalidUsers} users missing email field`);
      }
    } catch (error) {
      log.warning(`Could not validate users: ${error.message}`);
    }

    try {
      const galleryCol = db.collection('gallerytems');
      const validGallery = await galleryCol.countDocuments({ title: { $exists: true } });
      const invalidGallery = stats.gallerytems.count - validGallery;
      
      if (invalidGallery === 0) {
        log.success(`All gallery items have title (${validGallery})`);
      } else {
        log.warning(`${invalidGallery} gallery items missing title`);
      }
    } catch (error) {
      log.warning(`Could not validate gallery: ${error.message}`);
    }

    try {
      const staffCol = db.collection('staff');
      const validStaff = await staffCol.countDocuments({ name: { $exists: true } });
      const invalidStaff = stats.staff.count - validStaff;
      
      if (invalidStaff === 0) {
        log.success(`All staff have name (${validStaff})`);
      } else {
        log.warning(`${invalidStaff} staff members missing name`);
      }
    } catch (error) {
      log.warning(`Could not validate staff: ${error.message}`);
    }

    // Final status
    log.header('Verification Result');
    if (totalDocs > 0) {
      log.success('Migration appears successful! ✨');
      log.info(`Total: ${totalDocs} documents migrated to target database`);
    } else {
      log.error('Migration verification failed - no data in target');
    }

    await conn.disconnect();
    process.exit(0);

  } catch (error) {
    log.error(`Verification failed: ${error.message}`);
    log.error(error.stack);
    process.exit(1);
  }
}

verifyDataMigration();

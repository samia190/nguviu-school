#!/usr/bin/env node
/**
 * Unified Database Migration Script
 * Migrates Users, Gallery Items, and Staff/Teachers from old databases to new
 * 
 * Usage: node migrate-data-unified.mjs --source <uri> --target <uri> [--dry-run] [--collections <list>]
 */

import 'dotenv/config';
import mongoose from 'mongoose';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Color helpers
const log = {
  success: (msg) => console.log(chalk.green('✅ ' + msg)),
  error: (msg) => console.log(chalk.red('❌ ' + msg)),
  warning: (msg) => console.log(chalk.yellow('⚠️  ' + msg)),
  info: (msg) => console.log(chalk.blue('ℹ️  ' + msg)),
  header: (msg) => console.log(chalk.cyan.bold('\n' + msg)),
};

// Configuration
const config = {
  sourceUri: process.env.SOURCE_MONGO_URI || null,
  targetUri: process.env.MONGO_URI || 'mongodb+srv://mukundisam19_db_user:q8y242zVFaJl8Qk6@cluster0.2cl2d2a.mongodb.net/kangaru_girls_db',
  dryRun: process.argv.includes('--dry-run'),
  collections: ['users', 'gallerytems', 'staff'], // Default collections
  backupDir: path.join(__dirname, 'migration-backups'),
  timestamp: new Date().toISOString().replace(/[:.]/g, '-'),
};

// Parse command line arguments
const parseArgs = () => {
  const sourceIdx = process.argv.indexOf('--source');
  if (sourceIdx !== -1) config.sourceUri = process.argv[sourceIdx + 1];
  
  const targetIdx = process.argv.indexOf('--target');
  if (targetIdx !== -1) config.targetUri = process.argv[targetIdx + 1];
  
  const collectionsIdx = process.argv.indexOf('--collections');
  if (collectionsIdx !== -1) {
    config.collections = process.argv[collectionsIdx + 1].split(',').map(c => c.trim());
  }
};

// Migration state tracking
class MigrationTracker {
  constructor() {
    this.results = {
      startTime: new Date(),
      endTime: null,
      source: null,
      target: null,
      collections: {},
      errors: [],
      warnings: [],
      stats: {
        totalDocuments: 0,
        migratedDocuments: 0,
        failedDocuments: 0,
      },
    };
  }

  addCollection(name, sourceCount, targetCount) {
    this.results.collections[name] = {
      sourceCount,
      targetCount,
      documentsAdded: targetCount - sourceCount,
      status: 'pending',
    };
  }

  completeCollection(name, migratedCount, failedCount = 0) {
    if (this.results.collections[name]) {
      this.results.collections[name].status = 'completed';
      this.results.collections[name].migratedCount = migratedCount;
      this.results.collections[name].failedCount = failedCount;
      this.results.stats.migratedDocuments += migratedCount;
      this.results.stats.failedDocuments += failedCount;
    }
  }

  addError(message) {
    this.results.errors.push({ message, timestamp: new Date() });
  }

  addWarning(message) {
    this.results.warnings.push({ message, timestamp: new Date() });
  }

  async saveReport() {
    this.results.endTime = new Date();
    this.results.duration = this.results.endTime - this.results.startTime;
    
    await fs.mkdir(config.backupDir, { recursive: true });
    const reportPath = path.join(config.backupDir, `migration-report-${config.timestamp}.json`);
    await fs.writeFile(reportPath, JSON.stringify(this.results, null, 2));
    return reportPath;
  }
}

// Database connections
class DatabaseConnector {
  constructor() {
    this.sourceConn = null;
    this.targetConn = null;
  }

  async connectSource() {
    if (!config.sourceUri) {
      log.error('Source database URI not provided');
      throw new Error('SOURCE_MONGO_URI environment variable or --source argument required');
    }

    log.info('Connecting to source database...');
    this.sourceConn = await mongoose.createConnection(config.sourceUri, {
      serverSelectionTimeoutMS: 5000,
    }).asPromise();
    log.success('Connected to source database');
    return this.sourceConn;
  }

  async connectTarget() {
    if (!config.targetUri) {
      throw new Error('Target MongoDB URI required');
    }

    log.info('Connecting to target database...');
    this.targetConn = await mongoose.createConnection(config.targetUri, {
      serverSelectionTimeoutMS: 5000,
    }).asPromise();
    log.success('Connected to target database');
    return this.targetConn;
  }

  async closeAll() {
    if (this.sourceConn) await this.sourceConn.close();
    if (this.targetConn) await this.targetConn.close();
  }
}

// Migration executor
class DataMigrator {
  constructor(sourceConn, targetConn, tracker) {
    this.source = sourceConn;
    this.target = targetConn;
    this.tracker = tracker;
  }

  async migrateCollection(collectionName) {
    log.info(`Starting migration of ${collectionName}...`);

    try {
      const sourceCollection = this.source.collection(collectionName);
      const targetCollection = this.target.collection(collectionName);

      // Get counts before migration
      const sourceCount = await sourceCollection.countDocuments();
      const targetCount = await targetCollection.countDocuments();

      log.info(`Source: ${sourceCount} documents | Target: ${targetCount} documents`);

      this.tracker.addCollection(collectionName, sourceCount, targetCount);

      if (sourceCount === 0) {
        log.warning(`No documents to migrate in ${collectionName}`);
        this.tracker.completeCollection(collectionName, 0);
        return;
      }

      // Backup source data
      await this.backupCollection(sourceCollection, collectionName, sourceCount);

      // Migrate documents
      const batchSize = 1000;
      let totalMigrated = 0;
      let totalFailed = 0;

      for (let i = 0; i < sourceCount; i += batchSize) {
        const documents = await sourceCollection
          .find({})
          .skip(i)
          .limit(batchSize)
          .toArray();

        for (const doc of documents) {
          try {
            if (config.dryRun) {
              totalMigrated++;
            } else {
              // Use updateOne with upsert to handle duplicates
              await targetCollection.updateOne(
                { _id: doc._id },
                { $set: doc },
                { upsert: true }
              );
              totalMigrated++;
            }
          } catch (error) {
            log.warning(`Failed to migrate document in ${collectionName}: ${error.message}`);
            this.tracker.addWarning(`Document ${doc._id} failed: ${error.message}`);
            totalFailed++;
          }
        }

        const progress = Math.min(i + batchSize, sourceCount);
        console.log(`  Progress: ${progress}/${sourceCount} (${Math.round((progress / sourceCount) * 100)}%)`);
      }

      this.tracker.completeCollection(collectionName, totalMigrated, totalFailed);
      log.success(`Migrated ${totalMigrated} documents from ${collectionName}` + 
        (totalFailed > 0 ? `, ${totalFailed} failed` : ''));

    } catch (error) {
      log.error(`Failed to migrate ${collectionName}: ${error.message}`);
      this.tracker.addError(`${collectionName}: ${error.message}`);
      this.tracker.completeCollection(collectionName, 0, 0);
    }
  }

  async backupCollection(collection, name, count) {
    try {
      await fs.mkdir(config.backupDir, { recursive: true });
      
      const documents = await collection.find({}).toArray();
      const backupPath = path.join(
        config.backupDir,
        `${name}-backup-${config.timestamp}.json`
      );
      
      await fs.writeFile(backupPath, JSON.stringify(documents, null, 2));
      log.success(`Backed up ${name} (${count} documents) to ${backupPath}`);
    } catch (error) {
      log.warning(`Failed to backup ${name}: ${error.message}`);
      this.tracker.addWarning(`Backup failed for ${name}: ${error.message}`);
    }
  }

  async validateMigration() {
    log.header('Validating Migration');
    
    for (const collectionName of config.collections) {
      try {
        const sourceCollection = this.source.collection(collectionName);
        const targetCollection = this.target.collection(collectionName);

        const sourceCount = await sourceCollection.countDocuments();
        const targetCount = await targetCollection.countDocuments();

        const difference = targetCount - sourceCount;
        
        if (difference >= 0) {
          log.success(`${collectionName}: Source=${sourceCount}, Target=${targetCount}`);
        } else {
          log.warning(`${collectionName}: Data loss detected! Source=${sourceCount}, Target=${targetCount}`);
          this.tracker.addWarning(`${collectionName}: Possible data loss (${Math.abs(difference)} documents)`);
        }
      } catch (error) {
        log.warning(`Could not validate ${collectionName}: ${error.message}`);
      }
    }
  }
}

// Main execution
async function main() {
  parseArgs();

  log.header('Database Migration Tool');
  log.info(`Mode: ${config.dryRun ? 'DRY RUN' : 'EXECUTE'}`);
  log.info(`Collections: ${config.collections.join(', ')}`);

  const tracker = new MigrationTracker();
  const connector = new DatabaseConnector();

  try {
    // Connect to databases
    log.header('Establishing Connections');
    await connector.connectSource();
    await connector.connectTarget();

    tracker.results.source = config.sourceUri.split('@')[1] || config.sourceUri;
    tracker.results.target = config.targetUri.split('@')[1] || config.targetUri;

    // Migrate collections
    log.header('Starting Data Migration');
    const migrator = new DataMigrator(connector.sourceConn, connector.targetConn, tracker);

    for (const collection of config.collections) {
      await migrator.migrateCollection(collection);
    }

    // Validate
    await migrator.validateMigration();

    // Save report
    log.header('Migration Complete');
    const reportPath = await tracker.saveReport();
    log.success(`Report saved to ${reportPath}`);

    // Summary
    log.info(`Total documents migrated: ${tracker.results.stats.migratedDocuments}`);
    if (tracker.results.errors.length > 0) {
      log.warning(`Errors encountered: ${tracker.results.errors.length}`);
    }
    if (tracker.results.warnings.length > 0) {
      log.warning(`Warnings: ${tracker.results.warnings.length}`);
    }

  } catch (error) {
    log.error(`Migration failed: ${error.message}`);
    log.error(error.stack);
    process.exit(1);
  } finally {
    await connector.closeAll();
    log.info('Database connections closed');
  }
}

// Run
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

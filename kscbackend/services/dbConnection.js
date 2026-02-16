/**
 * MongoDB Connection Service
 * Handles database connections with proper error handling and configuration
 */
import mongoose from 'mongoose';

let dbConnected = false;

/**
 * Get MongoDB connection URI from environment variables
 * Checks multiple variable names for compatibility with different PaaS providers
 */
function getMongoUri() {
  return (
    process.env.MONGO_URI ||
    process.env.MONGO_URL ||
    process.env.MONGODB_URI ||
    process.env.DATABASE_URL
  );
}

/**
 * Configure mongoose for production
 */
function configureMongoose() {
  // Connection pooling configuration
  const mongooseOptions = {
    // Connection pooling - important for production
    maxPoolSize: 10, // Maximum number of connections
    minPoolSize: 2,  // Minimum connections to maintain
    
    // Socket settings to prevent hanging connections
    socketTimeoutMS: 45000,
    serverSelectionTimeoutMS: 5000,
    
    // Retry settings
    retryWrites: true,
    retryReads: true,
    
    // Automatic index creation (disable in production if using migrations)
    autoIndex: process.env.NODE_ENV !== 'production',
  };

  return mongooseOptions;
}

/**
 * Connect to MongoDB
 * @returns {Promise<boolean>} true if connection successful, false otherwise
 */
export async function connectToDatabase() {
  const mongoUri = getMongoUri();

  if (!mongoUri) {
    console.warn(
      '⚠️  MongoDB URI not found. Checked: MONGO_URI, MONGO_URL, MONGODB_URI, DATABASE_URL'
    );
    console.warn('⚠️  Server running in degraded mode without database');
    return false;
  }

  try {
    // Log connection attempt (mask credentials)
    const maskedUri = mongoUri.replace(/([^:]+):([^@]+)@/, '$1:***@');
    console.log('🔗 Connecting to MongoDB...');
    console.log('📍 URI:', maskedUri);

    const options = configureMongoose();
    
    await mongoose.connect(mongoUri, options);

    dbConnected = true;
    console.log('✅ Connected to MongoDB successfully');
    
    // Log connection details
    const db = mongoose.connection;
    console.log(`📊 Database: ${db.name}`);
    console.log(`🖥️  Host: ${db.host}:${db.port}`);

    // Handle connection events
    db.on('disconnected', () => {
      console.warn('⚠️  MongoDB disconnected');
      dbConnected = false;
    });

    db.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err.message);
      dbConnected = false;
    });

    return true;
  } catch (error) {
    dbConnected = false;
    console.error('❌ MongoDB connection failed');
    console.error('Error:', error.message);
    
    // Provide helpful error messages
    if (error.message.includes('authentication failed')) {
      console.error('💡 Tip: Check your credentials in MONGO_URI');
    } else if (error.message.includes('expected')) {
      console.error('💡 Tip: Check your URI format. Format should be:');
      console.error('   mongodb+srv://username:password@cluster.mongodb.net/database-name');
    }

    // In production, you might want to exit
    if (process.env.NODE_ENV === 'production') {
      console.error('❌ Cannot start in production without database. Exiting.');
      process.exit(1);
    }

    return false;
  }
}

/**
 * Disconnect from MongoDB
 * @returns {Promise<void>}
 */
export async function disconnectFromDatabase() {
  if (!dbConnected) {
    return;
  }

  try {
    console.log('🔌 Disconnecting from MongoDB...');
    await mongoose.disconnect();
    dbConnected = false;
    console.log('✅ Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Error disconnecting from MongoDB:', error.message);
  }
}

/**
 * Get database connection status
 * @returns {boolean} true if connected, false otherwise
 */
export function isDbConnected() {
  return dbConnected;
}

/**
 * Get mongoose instance
 * @returns {Object} mongoose object
 */
export function getMongoose() {
  return mongoose;
}

/**
 * Wait for database to be ready (useful for migrations)
 * @param {number} timeout - Maximum time to wait in milliseconds
 * @returns {Promise<boolean>} true if ready, false if timeout
 */
export async function waitForDatabase(timeout = 30000) {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    if (dbConnected && mongoose.connection.readyState === 1) {
      return true;
    }
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  return false;
}

export default {
  connectToDatabase,
  disconnectFromDatabase,
  isDbConnected,
  getMongoose,
  waitForDatabase,
};

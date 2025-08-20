// lib/mongodb.ts - Fixed MongoDB configuration
import { MongoClient, Db } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
}

interface GlobalMongo {
  client: MongoClient | null;
  db: Db | null;
  promise: Promise<MongoClient> | null;
}

// Use global variable to maintain connection across hot reloads in development
declare global {
  var _mongoClientPromise: GlobalMongo | undefined;
}

let cached = global._mongoClientPromise;

if (!cached) {
  cached = global._mongoClientPromise = {
    client: null,
    db: null,
    promise: null
  };
}

async function connectToDatabase(): Promise<{ client: MongoClient; db: Db }> {
  if (cached!.client && cached!.db) {
    return { client: cached!.client, db: cached!.db };
  }

  if (!cached!.promise) {
    const opts = {
      // Remove all deprecated options that cause the error
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
      minPoolSize: 2,
      // DO NOT include these deprecated options:
      // bufferMaxEntries, bufferCommands, useNewUrlParser, useUnifiedTopology
    };

    cached!.promise = MongoClient.connect(MONGODB_URI!, opts);
  }

  try {
    cached!.client = await cached!.promise;
    cached!.db = cached!.client.db(process.env.MONGODB_DB_NAME || 'todoapp');
    
    console.log('✅ MongoDB connected successfully');
    return { client: cached!.client, db: cached!.db };
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    // Reset the cache on connection failure
    cached!.client = null;
    cached!.db = null;
    cached!.promise = null;
    throw error;
  }
}

export async function getDatabase(): Promise<Db> {
  const { db } = await connectToDatabase();
  return db;
}

export async function testConnection(): Promise<boolean> {
  try {
    const { client } = await connectToDatabase();
    // Test the connection
    await client.db().admin().ping();
    console.log('✅ Database connection test successful');
    return true;
  } catch (error) {
    console.error('❌ Database connection test failed:', error);
    return false;
  }
}

// Graceful shutdown
if (process.env.NODE_ENV === 'production') {
  process.on('SIGINT', async () => {
    if (cached?.client) {
      await cached.client.close();
      console.log('MongoDB connection closed.');
    }
    process.exit(0);
  });
}

export default connectToDatabase;
import { MongoClient, Db } from 'mongodb';

if (!process.env.MONGODB_URI) {
  throw new Error('Please add your Mongo URI to .env.local');
}

const uri: string = process.env.MONGODB_URI;

// MongoDB connection options
const options = {
  maxPoolSize: 10, // Maintain up to 10 socket connections
  serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
  socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
  bufferMaxEntries: 0, // Disable mongoose buffering
  bufferCommands: false, // Disable mongoose buffering
};

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === 'development') {
  // In development mode, use a global variable so that the value
  // is preserved across module reloads caused by HMR (Hot Module Replacement).
  const globalWithMongoClientPromise = global as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>;
  };

  if (!globalWithMongoClientPromise._mongoClientPromise) {
    client = new MongoClient(uri, options);
    globalWithMongoClientPromise._mongoClientPromise = client.connect();
    console.log('🔥 New MongoDB connection created for development');
  } else {
    console.log('♻️ Reusing existing MongoDB connection');
  }
  clientPromise = globalWithMongoClientPromise._mongoClientPromise;
} else {
  // In production mode, it's best to not use a global variable.
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
  console.log('🚀 New MongoDB connection created for production');
}

// Test connection function
export async function testConnection(): Promise<boolean> {
  try {
    const client = await clientPromise;
    await client.db('admin').command({ ping: 1 });
    console.log('✅ MongoDB connection successful');
    return true;
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    return false;
  }
}

// Export a module-scoped MongoClient promise. By doing this in a
// separate module, the client can be shared across functions.
export default clientPromise;

// Utility function to get database
export async function getDatabase(): Promise<Db> {
  try {
    const client = await clientPromise;
    const db = client.db('todoapp');
    console.log('📊 Connected to database: todoapp');
    return db;
  } catch (error) {
    console.error('❌ Failed to connect to database:', error);
    throw new Error('Database connection failed');
  }
}
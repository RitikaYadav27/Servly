import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  var mongooseCache: MongooseCache | undefined;
}

let cached: MongooseCache = global.mongooseCache || { conn: null, promise: null };

if (!global.mongooseCache) {
  global.mongooseCache = cached;
}

export async function connectToDatabase() {
  if (!MONGODB_URI) {
    throw new Error('Missing MONGODB_URI environment variable');
  }

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    let uri = MONGODB_URI;
    if (uri.includes('.mongodb.net/') && uri.includes('.mongodb.net/?')) {
      uri = uri.replace('.mongodb.net/?', '.mongodb.net/servly?');
    } else if (uri.includes('.mongodb.net/') && !uri.includes('.mongodb.net/servly')) {
      // Already has a db name, leave it
    } else if (uri.endsWith('.mongodb.net/')) {
      uri = uri + 'servly';
    }

    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      family: 4,
    };

    cached.promise = mongoose.connect(uri, opts).then((m) => {
      console.log('MongoDB connected successfully');
      return m;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

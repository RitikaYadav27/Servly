import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('Missing MONGODB_URI environment variable');
}

declare global {
  var _mongooseConn: typeof mongoose | null;
  var _mongoosePromise: Promise<typeof mongoose> | null;
}

global._mongooseConn = global._mongooseConn ?? null;
global._mongoosePromise = global._mongoosePromise ?? null;

export async function connectToDatabase() {
  if (global._mongooseConn && mongoose.connection.readyState === 1) {
    return global._mongooseConn;
  }

  if (mongoose.connection.readyState === 0 || mongoose.connection.readyState === 3) {
    global._mongooseConn = null;
    global._mongoosePromise = null;
  }

  if (!global._mongoosePromise) {
    global._mongoosePromise = mongoose
      .connect(MONGODB_URI as string, {
        serverSelectionTimeoutMS: 10000,
        socketTimeoutMS: 45000,
        connectTimeoutMS: 10000,
      })
      .then((m) => {
        console.log('MongoDB connected');
        return m;
      })
      .catch((err) => {
        global._mongoosePromise = null;
        global._mongooseConn = null;
        throw err;
      });
  }

  global._mongooseConn = await global._mongoosePromise;
  return global._mongooseConn;
}

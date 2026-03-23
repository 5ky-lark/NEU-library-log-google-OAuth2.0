import mongoose from "mongoose";

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/neu-library";
const MONGODB_URI_FALLBACK = process.env.MONGODB_URI_FALLBACK || "";

if (!MONGODB_URI) {
  throw new Error("Please define the MONGODB_URI environment variable");
}

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var _mongooseCache: MongooseCache | undefined;
}

const cached: MongooseCache = global._mongooseCache ?? {
  conn: null,
  promise: null,
};

if (!global._mongooseCache) {
  global._mongooseCache = cached;
}

async function connectDB(): Promise<typeof mongoose> {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    const err = e as NodeJS.ErrnoException;

    // Some networks block SRV DNS lookups; allow a standard URI fallback.
    if (
      MONGODB_URI.startsWith("mongodb+srv://") &&
      err?.code === "ECONNREFUSED" &&
      MONGODB_URI_FALLBACK
    ) {
      cached.promise = mongoose.connect(MONGODB_URI_FALLBACK, {
        bufferCommands: false,
      });
      cached.conn = await cached.promise;
      return cached.conn;
    }

    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export default connectDB;

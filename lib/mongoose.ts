import mongoose from "mongoose";
import dns from "dns";

// Fix for Windows / ISP DNS servers failing on MongoDB Atlas SRV lookups (querySrv ESERVFAIL)
try {
  dns.setServers(["8.8.8.8", "1.1.1.1"]);
} catch {
  // Ignore in environments where setting DNS servers is not permitted
}

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections growing exponentially
 * during API Route usage.
 */
let cached = (global as any).mongoose;

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null };
}

let lastFailureTime = 0;
const FAILURE_RETRY_COOLDOWN_MS = 15000; // 15 seconds cooldown

async function dbConnect() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error(
      "Please define the MONGODB_URI environment variable inside .env"
    );
  }

  if (cached.conn) {
    return cached.conn;
  }

  // If connection failed recently, fast-fail so fallback data renders instantly
  if (Date.now() - lastFailureTime < FAILURE_RETRY_COOLDOWN_MS) {
    throw new Error("MongoDB connection recently failed. In cooldown.");
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 4000,
    };

    cached.promise = mongoose
      .connect(uri, opts)
      .then((mongoose) => {
        lastFailureTime = 0;
        return mongoose;
      })
      .catch((err) => {
        lastFailureTime = Date.now();
        cached.promise = null;
        throw err;
      });
  }
  cached.conn = await cached.promise;
  return cached.conn;
}

export default dbConnect;

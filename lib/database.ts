import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI as string;

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable');
}

let cached = global as any;

if (!cached.mongoose) {
  cached.mongoose = { conn: null, promise: null };
}

export async function connectDB() {
  if (cached.mongoose.conn) {
    console.log('📦 Using cached MongoDB connection');
    return cached.mongoose.conn;
  }

  if (!cached.mongoose.promise) {
    console.log('🔌 Establishing new MongoDB connection...');
    const opts = {
      bufferCommands: false,
    };

    cached.mongoose.promise = mongoose
      .connect(MONGODB_URI, opts)
      .then((mongoose) => {
        console.log('✅ MongoDB connected successfully');
        return mongoose;
      });
  }

  try {
    cached.mongoose.conn = await cached.mongoose.promise;
  } catch (e) {
    console.error('❌ MongoDB connection error:', e);
    cached.mongoose.promise = null;
    throw e;
  }

  return cached.mongoose.conn;
}

export default connectDB;

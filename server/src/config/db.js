import mongoose from 'mongoose';
import { env } from './env.js';

export const dbStatus = {
  connected: false,
  inMemoryFallback: false,
};

export async function connectDB() {
  try {
    mongoose.set('strictQuery', false);
    
    // Set a timeout for connection attempt
    await mongoose.connect(env.MONGODB_URI, {
      serverSelectionTimeoutMS: 3000,
    });
    
    dbStatus.connected = true;
    console.log('MongoDB Connected Successfully.');
  } catch (error) {
    dbStatus.connected = false;
    dbStatus.inMemoryFallback = true;
    console.warn('\n==================================================');
    console.warn('WARNING: Failed to connect to MongoDB.');
    console.warn(`Error: ${error.message}`);
    console.warn('Backend is starting with in-memory store fallback.');
    console.warn('==================================================\n');
  }
}

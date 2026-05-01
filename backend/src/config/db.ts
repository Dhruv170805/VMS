import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI;
    
    if (!mongoUri) {
      console.warn('⚠️  MONGODB_URI not found in environment variables. Falling back to local MongoDB.');
    } else if (!mongoUri.includes('mongodb+srv://')) {
      console.warn('⚠️  Current MONGODB_URI does not appear to be a MongoDB Atlas connection string.');
    } else {
      console.log('🌐 Connecting to MongoDB Atlas...');
    }

    const conn = await mongoose.connect(mongoUri || 'mongodb://localhost:27017/vms');
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ Database Connection Error: ${(error as Error).message}`);
    process.exit(1);
  }
};

export default connectDB;

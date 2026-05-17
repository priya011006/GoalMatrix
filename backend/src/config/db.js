import mongoose from 'mongoose';

export async function connectDB() {
  try {
    const uri =
      process.env.MONGODB_URI ||
      'mongodb://localhost:27017/goalmatrix';

    console.log('Connecting to MongoDB...');

    await mongoose.connect(uri);

    console.log('MongoDB connected');
  } catch (err) {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  }
}
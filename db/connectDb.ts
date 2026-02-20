import mongoose from 'mongoose';
import { config } from '@config/index';
import { seedAdmin } from './seedAdmin';

const connectDb = async (): Promise<void> => {
  try {
    const connection = await mongoose.connect(config.MONGO_URI);
    console.log('Database connected successfully 🥳 on', connection.connection.host);
    await seedAdmin();
  } catch (error) {
    console.error('Database connection error 😢', error);
    process.exit(1);
  }
};

connectDb();

export default connectDb;

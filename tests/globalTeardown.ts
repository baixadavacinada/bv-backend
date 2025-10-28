import mongoose from 'mongoose';

export default async (): Promise<void> => {
  await mongoose.disconnect();
  
  const mongod = (global as any).__MONGOD__;
  if (mongod) {
    await mongod.stop();
  }
  
  console.log('🧹 Test environment cleanup completed');
};
import mongoose from 'mongoose';

export default async (): Promise<void> => {
  // Close all mongoose connections
  await mongoose.disconnect();
  
  // Stop MongoDB Memory Server
  const mongod = (global as any).__MONGOD__;
  if (mongod) {
    await mongod.stop();
  }
  
  console.log('🧹 Test environment cleanup completed');
};
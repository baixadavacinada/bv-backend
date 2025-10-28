import { MongoMemoryServer } from 'mongodb-memory-server';

let mongod: MongoMemoryServer;

export default async (): Promise<void> => {
  console.log('🚀 Setting up test environment...');
  
  mongod = await MongoMemoryServer.create({
    binary: {
      version: '6.0.0',
    },
    instance: {
      dbName: 'baixada-vacinada-test',
    },
  });

  const uri = mongod.getUri();
  
  process.env.MONGODB_URI = uri;
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test-jwt-secret-for-integration-tests';
  process.env.FIREBASE_PROJECT_ID = 'baixada-vacinada-test';
  process.env.PORT = '0'; // Let the system assign a random port
  
  (global as any).__MONGOD__ = mongod;
  
  console.log(`✅ MongoDB Memory Server started at: ${uri}`);
};
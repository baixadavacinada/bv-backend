import admin from 'firebase-admin';
import { Logger } from '../middlewares/logging';

const logger = Logger.getInstance();

let firebaseApp: admin.app.App;

export function initializeFirebase(): admin.app.App {
  if (firebaseApp) {
    return firebaseApp;
  }

  try {
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    
    if (!serviceAccount) {
      throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY environment variable is required');
    }

    // Parse the service account key from environment variable
    const serviceAccountKey = JSON.parse(serviceAccount);

    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccountKey),
      projectId: serviceAccountKey.project_id
    });

    logger.info('Firebase Admin SDK initialized successfully', {
      projectId: serviceAccountKey.project_id
    });

    return firebaseApp;
  } catch (error) {
    logger.error('Failed to initialize Firebase Admin SDK', error instanceof Error ? error : new Error(String(error)));
    throw error;
  }
}

export function getFirebaseAuth(): admin.auth.Auth {
  if (!firebaseApp) {
    initializeFirebase();
  }
  return admin.auth(firebaseApp);
}

export function getFirebaseApp(): admin.app.App {
  if (!firebaseApp) {
    initializeFirebase();
  }
  return firebaseApp;
}

// Initialize Firebase on module load
initializeFirebase();
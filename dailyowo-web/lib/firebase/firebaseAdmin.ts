// lib/firebase/firebaseAdmin.ts
import * as admin from 'firebase-admin';

// Ensure your service account key JSON file path is correctly set up
// or that GOOGLE_APPLICATION_CREDENTIALS environment variable is set.
// For Vercel/Next.js, it's common to store the service account key
// as a JSON string in an environment variable.

const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

let cred: admin.ServiceAccount;

if (serviceAccountJson) {
  try {
    cred = JSON.parse(serviceAccountJson) as admin.ServiceAccount;
  } catch (e: any) {
    console.error('Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY:', e.message);
    // Fallback or error handling if JSON parsing fails
    // For now, we'll let it potentially fail at initializeApp if cred is undefined
    // and GOOGLE_APPLICATION_CREDENTIALS is also not set.
  }
}

if (!admin.apps.length) {
  try {
    admin.initializeApp({
      // The SDK will automatically try to use GOOGLE_APPLICATION_CREDENTIALS if `credential` is not explicitly set.
      // If `cred` is defined from FIREBASE_SERVICE_ACCOUNT_KEY, it will use that.
      credential: cred! ? admin.credential.cert(cred) : admin.credential.applicationDefault(),
      // Add your databaseURL if you use Realtime Database and it's not auto-discovered
      // databaseURL: process.env.FIREBASE_DATABASE_URL || 'https://<YOUR_PROJECT_ID>.firebaseio.com',
    });
    console.log('Firebase Admin SDK Initialized');
  } catch (error: any) {
    console.error('Firebase Admin SDK initialization error:', error.stack);
    // Optionally, rethrow or handle more gracefully depending on your app's needs
  }
}

export const auth = admin.auth();
export const firestore = admin.firestore();
// Export other admin services if needed, e.g., admin.storage()

export default admin;

import admin from 'firebase-admin';

if (!admin.apps.length) {
  try {
    const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\n/g, '\n');


    if (!projectId || !clientEmail || !privateKey) {
      throw new Error('Missing Firebase Admin credentials');
    }

    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey,
      }),
      databaseURL: `https://${projectId}.firebaseio.com`,
    });

    console.log('🔧 [Firebase Admin] ✅ Initialized successfully');
  } catch (error) {
    console.error('🔧 [Firebase Admin] ❌ Initialization error:', error);
    throw error;
  }
}

const db = admin.firestore();
const auth = admin.auth();

export { db, auth };
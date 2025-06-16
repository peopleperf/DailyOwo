import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  enableNetwork, 
  disableNetwork,
  waitForPendingWrites,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  Timestamp
} from 'firebase/firestore';
import { getAuth, signInAnonymously } from 'firebase/auth';
import dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

console.log('\n🔍 Firebase Connection Debugger\n');

// Step 1: Check environment variables
console.log('1️⃣ Checking environment variables...');
const requiredVars = [
  'NEXT_PUBLIC_FIREBASE_API_KEY',
  'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
  'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  'NEXT_PUBLIC_FIREBASE_APP_ID'
];

const firebaseConfig = {};
let missingVars = [];

requiredVars.forEach(varName => {
  const value = process.env[varName];
  if (!value) {
    missingVars.push(varName);
  } else {
    // Map to Firebase config keys
    const configKey = varName.replace('NEXT_PUBLIC_FIREBASE_', '').toLowerCase().replace(/_/g, '');
    if (configKey === 'apikey') firebaseConfig.apiKey = value;
    else if (configKey === 'authdomain') firebaseConfig.authDomain = value;
    else if (configKey === 'projectid') firebaseConfig.projectId = value;
    else if (configKey === 'storagebucket') firebaseConfig.storageBucket = value;
    else if (configKey === 'messagingsenderid') firebaseConfig.messagingSenderId = value;
    else if (configKey === 'appid') firebaseConfig.appId = value;
  }
});

if (missingVars.length > 0) {
  console.error('❌ Missing environment variables:', missingVars);
  process.exit(1);
}

console.log('✅ All environment variables present');
console.log('   Project ID:', firebaseConfig.projectId);

// Step 2: Initialize Firebase
console.log('\n2️⃣ Initializing Firebase...');
let app, db, auth;

try {
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  auth = getAuth(app);
  console.log('✅ Firebase initialized successfully');
} catch (error) {
  console.error('❌ Failed to initialize Firebase:', error.message);
  process.exit(1);
}

// Step 3: Test authentication
console.log('\n3️⃣ Testing authentication...');
try {
  const userCredential = await signInAnonymously(auth);
  console.log('✅ Anonymous authentication successful');
  console.log('   User ID:', userCredential.user.uid);
} catch (error) {
  console.error('❌ Authentication failed:', error.message);
  console.log('   Make sure anonymous authentication is enabled in Firebase Console');
}

// Step 4: Test Firestore connection
console.log('\n4️⃣ Testing Firestore connection...');

// Explicitly enable network
try {
  await enableNetwork(db);
  console.log('✅ Network enabled');
} catch (error) {
  console.error('❌ Failed to enable network:', error.message);
}

// Test read operation
console.log('\n5️⃣ Testing Firestore read...');
try {
  const testCollection = collection(db, 'test');
  const snapshot = await getDocs(testCollection);
  console.log('✅ Firestore read successful');
  console.log('   Documents found:', snapshot.size);
} catch (error) {
  console.error('❌ Firestore read failed:', error.message);
  console.log('\n💡 Possible solutions:');
  console.log('   1. Check Firestore rules in Firebase Console');
  console.log('   2. Make sure the project ID is correct');
  console.log('   3. Verify network connectivity');
  console.log('   4. Check if Firestore is enabled for this project');
}

// Test write operation
console.log('\n6️⃣ Testing Firestore write...');
try {
  const testDoc = doc(db, 'test', 'debug-' + Date.now());
  await setDoc(testDoc, {
    message: 'Debug test',
    timestamp: Timestamp.now(),
    userId: auth.currentUser?.uid || 'anonymous'
  });
  console.log('✅ Firestore write successful');
  
  // Try to read it back
  const written = await getDoc(testDoc);
  if (written.exists()) {
    console.log('✅ Document verified:', written.data());
  }
} catch (error) {
  console.error('❌ Firestore write failed:', error.message);
}

// Step 7: Check Firestore rules
console.log('\n7️⃣ Suggested Firestore rules for development:');
console.log(`
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow all reads and writes for development
    // ⚠️ WARNING: Change this before production!
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
`);

console.log('\n8️⃣ Next steps:');
console.log('   1. Go to https://console.firebase.google.com');
console.log('   2. Select your project:', firebaseConfig.projectId);
console.log('   3. Go to Firestore Database → Rules');
console.log('   4. Update rules to allow access (see above)');
console.log('   5. Go to Authentication → Sign-in method');
console.log('   6. Enable "Anonymous" authentication');

// Clean up
process.exit(0); 
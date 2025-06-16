#!/usr/bin/env node

// Test Firebase Authentication
// Run: node scripts/test-firebase-auth.js

const { initializeApp } = require('firebase/app');
const { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } = require('firebase/auth');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

async function testAuth() {
  console.log('🔧 Testing Firebase Authentication...\n');
  
  console.log('Firebase Config:');
  console.log('- Project ID:', firebaseConfig.projectId);
  console.log('- Auth Domain:', firebaseConfig.authDomain);
  console.log('- API Key:', firebaseConfig.apiKey ? '✓ Present' : '✗ Missing');
  
  try {
    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    
    console.log('\n✅ Firebase Auth initialized successfully');
    
    // Test with a random email
    const testEmail = `test-${Date.now()}@dailyowo.com`;
    const testPassword = 'testPassword123!';
    
    console.log('\n📝 Creating test user...');
    const userCredential = await createUserWithEmailAndPassword(auth, testEmail, testPassword);
    console.log('✅ User created successfully!');
    console.log('- UID:', userCredential.user.uid);
    console.log('- Email:', userCredential.user.email);
    
    console.log('\n🔑 Testing login...');
    await signInWithEmailAndPassword(auth, testEmail, testPassword);
    console.log('✅ Login successful!');
    
    console.log('\n🎉 Firebase Authentication is working properly!');
    console.log('\n📋 Next steps for Firestore:');
    console.log('1. Wait 2-3 more minutes for Firestore to fully initialize');
    console.log('2. Make sure you selected a region when creating the database');
    console.log('3. Check the Firebase Console > Firestore to see if it shows as ready');
    console.log('4. Try running the app and creating a goal - it might work even with the script errors');
    
  } catch (error) {
    console.error('\n❌ Error:', error.code || error.message);
    
    if (error.code === 'auth/network-request-failed') {
      console.error('Network error - check your internet connection');
    } else if (error.code === 'auth/invalid-api-key') {
      console.error('Invalid API key - check your .env.local file');
    }
  }
}

// Run the test
testAuth(); 
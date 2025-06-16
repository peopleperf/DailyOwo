#!/usr/bin/env node

// Simple test script to verify Firestore is accessible
// Run: node scripts/test-firestore-simple.js

const { initializeApp } = require('firebase/app');
const { getFirestore, doc, setDoc, getDoc } = require('firebase/firestore');
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

async function testFirestore() {
  console.log('🔧 Simple Firestore Test...\n');
  
  console.log('Project ID:', firebaseConfig.projectId);
  
  try {
    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    
    console.log('✅ Firebase initialized successfully');
    
    // Try to write to a test collection with a simple document
    const testDoc = {
      test: true,
      timestamp: new Date().toISOString(),
      message: 'Testing Firestore connection'
    };
    
    console.log('\n📝 Writing test document...');
    await setDoc(doc(db, 'public-test', 'test-doc'), testDoc);
    console.log('✅ Write successful!');
    
    // Try to read it back
    console.log('\n📖 Reading test document...');
    const docSnap = await getDoc(doc(db, 'public-test', 'test-doc'));
    
    if (docSnap.exists()) {
      console.log('✅ Read successful:', docSnap.data());
    } else {
      console.log('❌ Document not found');
    }
    
    console.log('\n🎉 Firestore is working! Now update your security rules.');
    
  } catch (error) {
    console.error('\n❌ Error:', error.code || error.message);
    
    if (error.code === 'permission-denied') {
      console.error('\n🔒 Permission denied. Update your Firestore rules to allow this test:');
      console.error(`
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Temporary rule for testing
    match /public-test/{document} {
      allow read, write: if true;
    }
    
    // Your other rules here...
  }
}
      `);
    } else if (error.message && error.message.includes('NOT_FOUND')) {
      console.error('\n❗ Firestore database may still be initializing. Please:');
      console.error('1. Wait a minute for the database to fully initialize');
      console.error('2. Make sure you\'ve selected a region for your database');
      console.error('3. Check that your project ID is correct: ' + firebaseConfig.projectId);
    }
  }
}

// Run the test
testFirestore(); 
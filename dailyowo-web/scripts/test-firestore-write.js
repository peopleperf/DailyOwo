#!/usr/bin/env node

// Test script to verify Firestore write permissions
// Run: node scripts/test-firestore-write.js

const { initializeApp } = require('firebase/app');
const { getFirestore, doc, setDoc, getDoc, serverTimestamp } = require('firebase/firestore');
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

async function testFirestoreWrite() {
  console.log('🔧 Testing Firestore Write Permissions...\n');
  
  // Check configuration
  console.log('Firebase Config:');
  console.log('- Project ID:', firebaseConfig.projectId);
  console.log('- Auth Domain:', firebaseConfig.authDomain);
  console.log('- API Key:', firebaseConfig.apiKey ? '✓ Present' : '✗ Missing');
  console.log('- App ID:', firebaseConfig.appId ? '✓ Present' : '✗ Missing');
  
  if (!firebaseConfig.projectId || !firebaseConfig.apiKey) {
    console.error('\n❌ Missing required Firebase configuration!');
    console.error('Please check your .env.local file');
    return;
  }
  
  try {
    // Initialize Firebase
    console.log('\n📱 Initializing Firebase...');
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    
    // Test document ID
    const testId = 'test-' + Date.now();
    
    // Try to write a test document
    console.log('\n📝 Attempting to write test document...');
    const testDoc = {
      test: true,
      timestamp: serverTimestamp(),
      message: 'Testing Firestore write permissions'
    };
    
    await setDoc(doc(db, 'test-collection', testId), testDoc);
    console.log('✅ Successfully wrote test document!');
    
    // Try to read it back
    console.log('\n📖 Reading test document back...');
    const docSnap = await getDoc(doc(db, 'test-collection', testId));
    
    if (docSnap.exists()) {
      console.log('✅ Successfully read test document:', docSnap.data());
    } else {
      console.log('❌ Could not read test document');
    }
    
    console.log('\n✨ Firestore connection is working properly!');
    console.log('\n📋 Next steps:');
    console.log('1. Copy the rules from lib/firebase/firestore-rules.txt');
    console.log('2. Go to Firebase Console > Firestore > Rules');
    console.log('3. Replace the existing rules and publish');
    console.log('4. Make sure Firestore is in the correct region (preferably us-central1 or europe-west1)');
    
  } catch (error) {
    console.error('\n❌ Error testing Firestore:', error.message);
    
    if (error.code === 'permission-denied') {
      console.error('\n🔒 Permission denied! Please update your Firestore security rules.');
      console.error('Copy the rules from lib/firebase/firestore-rules.txt to your Firebase Console.');
    } else if (error.code === 'unavailable') {
      console.error('\n🌐 Firestore is unavailable. Check your internet connection and Firebase project status.');
    } else if (error.message.includes('projectId')) {
      console.error('\n🆔 Invalid project ID. Please check your Firebase configuration.');
    }
  }
}

// Run the test
testFirestoreWrite(); 
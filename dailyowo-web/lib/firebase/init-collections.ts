import { 
  collection, 
  doc, 
  setDoc, 
  getDoc,
  enableNetwork,
  disableNetwork,
  waitForPendingWrites
} from 'firebase/firestore';
import { getFirebaseDb } from './config';

/**
 * Ensures Firestore is online and connected
 */
export async function ensureFirestoreConnection() {
  const db = getFirebaseDb();
  if (!db) {
    throw new Error('Firestore not initialized');
  }

  try {
    // Try to enable network to ensure we're online
    await enableNetwork(db);
    console.log('Firestore network enabled');
    
    // Small delay to ensure connection is established
    await new Promise(resolve => setTimeout(resolve, 100));
    
    return true;
  } catch (error: any) {
    console.error('Firestore connection error:', error);
    // Don't throw, just return false - let the caller handle it
    return false;
  }
}

/**
 * Creates initial user document when a user registers
 */
export async function createUserDocument(userId: string, userData: any) {
  const db = getFirebaseDb();
  if (!db) {
    throw new Error('Firestore not initialized');
  }

  try {
    const userRef = doc(db, 'users', userId);
    
    // Create the user document without checking if it exists first
    // This avoids the read operation that might be causing issues
    await setDoc(userRef, {
      ...userData,
      createdAt: new Date(),
      updatedAt: new Date()
    }, { merge: true }); // merge: true will update if exists, create if not
    
    console.log('User document created/updated successfully');
    return userRef;
  } catch (error) {
    console.error('Error creating user document:', error);
    throw error;
  }
}

/**
 * Initialize collections with proper structure
 */
export async function initializeCollections(userId: string) {
  const db = getFirebaseDb();
  if (!db) {
    console.warn('Firestore not initialized, skipping collection initialization');
    return false;
  }

  try {
    // Collections will be automatically created when we add the first document
    // For now, we'll just ensure the user has the basic structure
    console.log('Collections ready for user:', userId);
    return true;
  } catch (error) {
    console.error('Error initializing collections:', error);
    return false;
  }
}

/**
 * Force sync any pending writes
 */
export async function syncPendingWrites() {
  const db = getFirebaseDb();
  if (!db) return;
  
  try {
    await waitForPendingWrites(db);
    console.log('All pending writes synced');
  } catch (error) {
    console.error('Error syncing writes:', error);
  }
} 
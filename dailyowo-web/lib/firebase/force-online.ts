import { enableNetwork, disableNetwork } from 'firebase/firestore';
import { getFirebaseDb } from './config';

/**
 * Forces Firestore to reconnect by cycling the network connection
 */
export async function forceFirestoreOnline() {
  const db = await getFirebaseDb();
  if (!db) return false;

  try {
    console.log('Forcing Firestore online...');
    
    // First disable network
    await disableNetwork(db);
    console.log('Network disabled');
    
    // Wait a moment
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Re-enable network
    await enableNetwork(db);
    console.log('Network re-enabled');
    
    // Wait for connection to establish
    await new Promise(resolve => setTimeout(resolve, 500));
    
    console.log('Firestore forced online');
    return true;
  } catch (error) {
    console.error('Error forcing online:', error);
    return false;
  }
}

/**
 * Clears all Firestore cache and forces reconnection
 */
export async function clearFirestoreCache() {
  try {
    // Clear IndexedDB (where Firestore stores offline data)
    if ('indexedDB' in window) {
      const databases = await indexedDB.databases();
      const firestoreDBs = databases.filter(db => 
        db.name?.includes('firestore') || 
        db.name?.includes('firebase')
      );
      
      for (const db of firestoreDBs) {
        if (db.name) {
          indexedDB.deleteDatabase(db.name);
          console.log(`Cleared database: ${db.name}`);
        }
      }
    }
    
    // Clear localStorage
    Object.keys(localStorage).forEach(key => {
      if (key.includes('firebase') || key.includes('firestore')) {
        localStorage.removeItem(key);
      }
    });
    
    console.log('Firestore cache cleared');
    return true;
  } catch (error) {
    console.error('Error clearing cache:', error);
    return false;
  }
}

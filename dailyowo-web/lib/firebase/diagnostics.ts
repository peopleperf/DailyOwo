import { getFirebaseDb, terminateFirestore } from './config';
import { getActiveListenerCount, getFailedListeners, cleanupAllListeners } from './firestore-helpers';
import { enableNetwork, disableNetwork } from 'firebase/firestore';

export interface FirestoreDiagnostics {
  isInitialized: boolean;
  activeListeners: number;
  failedListeners: string[];
  connectionStatus: 'online' | 'offline' | 'unknown';
  lastError: string | null;
}

let lastError: string | null = null;
let isClient = false;

// Initialize client detection and error override only on client
if (typeof window !== 'undefined') {
  isClient = true;
  const originalError = console.error;
  console.error = (...args) => {
    if (args[0]?.includes && args[0].includes('FIRESTORE')) {
      lastError = args[0];
    }
    originalError.apply(console, args);
  };
}

/**
 * Get current Firestore diagnostics
 */
export function getFirestoreDiagnostics(): FirestoreDiagnostics {
  if (!isClient) {
    return {
      isInitialized: false,
      activeListeners: 0,
      failedListeners: [],
      connectionStatus: 'unknown',
      lastError: null
    };
  }

  // NOTE: getFirebaseDb is async, but diagnostics is sync, so check for initialization only
  const db = null; // Can't await in sync function
  return {
    isInitialized: false, // Can't guarantee in sync context
    activeListeners: getActiveListenerCount(),
    failedListeners: getFailedListeners(),
    connectionStatus: navigator.onLine ? 'online' : 'offline',
    lastError
  };
}

/**
 * Force Firestore to go offline
 */
export async function forceOffline(): Promise<void> {
  if (!isClient) return;
  try {
    const db = await getFirebaseDb();
    if (db) {
      await disableNetwork(db);
      console.log('Firestore forced offline');
    }
  } catch (error) {
    console.warn('Failed to force Firestore offline:', error);
  }
}

/**
 * Force Firestore to go online
 */
export async function forceOnline(): Promise<void> {
  if (!isClient) return;
  try {
    const db = await getFirebaseDb();
    if (db) {
      await enableNetwork(db);
      console.log('Firestore forced online');
    }
  } catch (error) {
    console.warn('Failed to force Firestore online:', error);
  }
}

/**
 * Reset Firestore connection
 */
export async function resetFirestoreConnection(): Promise<void> {
  if (!isClient) return;
  console.log('Resetting Firestore connection...');
  try {
    cleanupAllListeners();
    await forceOffline();
    await new Promise(resolve => setTimeout(resolve, 1000));
    await forceOnline();
    console.log('Firestore connection reset complete');
  } catch (error) {
    console.warn('Failed to reset Firestore connection:', error);
    throw error;
  }
}

/**
 * Complete Firestore restart
 */
export async function restartFirestore(): Promise<void> {
  if (!isClient) return;
  console.log('Restarting Firestore...');
  try {
    try {
      cleanupAllListeners();
      console.log('✅ Listeners cleaned up');
    } catch (error) {
      console.warn('⚠️ Failed to cleanup listeners:', error);
    }
    try {
      await terminateFirestore();
      console.log('✅ Firestore terminated');
    } catch (error) {
      console.warn('⚠️ Firestore termination failed (this is often expected):', error);
    }
    await new Promise(resolve => setTimeout(resolve, 2000));
    try {
      const db = await getFirebaseDb();
      if (db) {
        console.log('✅ Firestore restarted successfully');
      } else {
        console.warn('⚠️ Firestore restart incomplete - no database instance');
      }
    } catch (error) {
      console.warn('⚠️ Failed to reinitialize Firestore:', error);
      throw new Error(`Firestore restart failed: ${error}`);
    }
  } catch (error) {
    const errorMessage = `Firestore restart failed: ${error}`;
    console.warn('❌', errorMessage);
    return;
  }
}

/**
 * Soft restart - less aggressive approach
 */
export async function softRestartFirestore(): Promise<void> {
  if (!isClient) return;
  console.log('Performing soft Firestore restart...');
  try {
    await resetFirestoreConnection();
    console.log('✅ Soft restart complete');
  } catch (error) {
    console.warn('❌ Soft restart failed:', error);
  }
}

/**
 * Clear last error
 */
export function clearLastError(): void {
  lastError = null;
}

/**
 * Log diagnostics to console
 */
export function logDiagnostics(): void {
  if (!isClient) return;
  
  const diagnostics = getFirestoreDiagnostics();
  console.group('🔥 Firestore Diagnostics');
  console.log('Initialized:', diagnostics.isInitialized);
  console.log('Active Listeners:', diagnostics.activeListeners);
  console.log('Failed Listeners:', diagnostics.failedListeners);
  console.log('Connection Status:', diagnostics.connectionStatus);
  console.log('Last Error:', diagnostics.lastError);
  console.groupEnd();
}

// Export global helpers for console access - only on client
if (typeof window !== 'undefined') {
  (window as any).firestoreDiag = {
    getDiagnostics: getFirestoreDiagnostics,
    logDiagnostics,
    resetConnection: resetFirestoreConnection,
    restart: restartFirestore,
    softRestart: softRestartFirestore,
    forceOffline,
    forceOnline,
    clearError: clearLastError,
    cleanupListeners: cleanupAllListeners,
    help: () => {
      console.log(`
🔥 Firestore Diagnostic Tools
=============================

Available commands:

firestoreDiag.getDiagnostics()   - Get current diagnostics
firestoreDiag.logDiagnostics()   - Log diagnostics to console
firestoreDiag.resetConnection()  - Reset Firestore connection
firestoreDiag.restart()          - Full Firestore restart
firestoreDiag.softRestart()      - Gentle restart (recommended)
firestoreDiag.forceOffline()     - Force Firestore offline
firestoreDiag.forceOnline()      - Force Firestore online
firestoreDiag.clearError()       - Clear last error
firestoreDiag.cleanupListeners() - Clean up all listeners
firestoreDiag.help()             - Show this help

Example usage:
  firestoreDiag.logDiagnostics()
  await firestoreDiag.softRestart()    // Try this first
  await firestoreDiag.resetConnection()
      `);
    }
  };
  
  console.log('🔥 Firestore diagnostics loaded. Type `firestoreDiag.help()` for available commands.');
}
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, connectAuthEmulator, Auth, browserLocalPersistence, setPersistence } from 'firebase/auth';
import { 
  getFirestore, 
  connectFirestoreEmulator, 
  enableIndexedDbPersistence,
  clearIndexedDbPersistence,
  terminate,
  Firestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager
} from 'firebase/firestore';
import { getStorage, connectStorageEmulator, FirebaseStorage } from 'firebase/storage';
import { getFunctions, Functions } from 'firebase/functions';
import { getAnalytics, isSupported, Analytics } from 'firebase/analytics';
import { firestoreDiagnostics } from './firestore-diagnostics';

const firebaseConfig = process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
} : null;

// Initialize Firebase only on client side and when actually needed
let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let storage: FirebaseStorage | null = null;
let functions: Functions | null = null;
let analytics: Analytics | null = null;
let initialized = false;
let initializationPromise: Promise<any> | null = null;

// Suppress specific console warnings
if (typeof window !== 'undefined') {
  const originalWarn = console.warn;
  const originalError = console.error;
  
  console.warn = (...args) => {
    // Suppress the specific deprecation warning about enableIndexedDbPersistence
    if (args[0]?.includes && args[0].includes('enableIndexedDbPersistence() will be deprecated')) {
      return;
    }
    originalWarn.apply(console, args);
  };
  
  // Track Firestore errors to prevent infinite loops
  // Initialize error tracking variables
  let firestoreErrorCount = 0;
  let lastErrorTime = 0;
  let isRecovering = false;
  
  // Log Firestore internal errors and provide recovery options
  console.error = async (...args) => {
    if (args[0]?.includes && args[0].includes('FIRESTORE (11.9.0) INTERNAL ASSERTION FAILED')) {
      const now = Date.now();
      
      // Extract error ID for tracking
      const errorIdMatch = args[0].match(/\(ID: ([^)]+)\)/);
      const errorId = errorIdMatch ? errorIdMatch[1] : 'unknown';
      
      // Log to diagnostics with specific error ID
      firestoreDiagnostics.logError({
        code: `INTERNAL_ASSERTION_${errorId}`,
        message: args[0],
        timestamp: now
      });
      
      // Prevent rapid error logging
      if (now - lastErrorTime < 1000) {
        return; // Skip logging if errors are too rapid
      }
      
      lastErrorTime = now;
      firestoreErrorCount++;
      
      // Set bypass flag immediately on first error
      if (firestoreErrorCount === 1) {
        sessionStorage.setItem('firestore_bypass_persistence', 'true');
        // For da08 errors, also force clear cache immediately
        if (errorId === 'da08') {
          localStorage.setItem('firestore_needs_cache_clear', 'true');
          try {
            if (db) {
              await terminate(db);
              db = null;
            }
          } catch (e) {
            console.warn('Error terminating Firestore:', e);
          }
        }
        originalError.apply(console, [
          `[Firestore Recovery] Internal error detected (ID: ${errorId}). Persistence will be disabled on next load.`
        ]);
      }
      
      // Log recovery suggestion after multiple errors
      if (firestoreErrorCount > 2 && !isRecovering) {
        isRecovering = true;
        // Special handling for da08 errors
        if (errorId === 'da08') {
          originalError.apply(console, [
            `[Firestore Recovery] Critical internal error detected (ID: ${errorId}).`,
            '\n\n⚠️ This is a known Firestore SDK issue. Recommended actions:',
            '\n1. Clear browser cache completely',
            '\n2. Try in a different browser',
            '\n3. If issue persists, consider updating Firebase SDK version'
          ]);
        } else {
          originalError.apply(console, [
            `[Firestore Recovery] Multiple internal errors detected (ID: ${errorId}).`,
            '\n\n🔧 QUICK FIX: Visit http://localhost:3001/clear-cache to automatically clear your cache.',
            '\n\nOr manually:',
            '\n1. Open Developer Tools (F12)',
            '\n2. Go to Application/Storage tab',
            '\n3. Clear Site Data',
            '\n4. Refresh the page'
          ]);
        }
        
        // Dispatch event for app to handle
        window.dispatchEvent(new CustomEvent('firestore-error', { 
          detail: { 
            errorId, 
            count: firestoreErrorCount,
            message: 'Multiple Firestore errors detected. Please visit /clear-cache or clear browser data manually.'
          } 
        }));
      }
      
      return;
    }
    originalError.apply(console, args);
  };
}

// Lazy initialization function
export function initializeFirebaseIfNeeded() {
  if (initialized) {
    return { app, auth, db, storage, functions, analytics };
  }

  if (!firebaseConfig) {
    return { app, auth, db, storage, functions, analytics };
  }

  // If initialization is already in progress, wait for it
  if (initializationPromise) {
    return { app, auth, db, storage, functions, analytics };
  }

  // Start initialization
  initializationPromise = (async () => {
    try {
      // Check if all required config values are present
      const requiredFields = ['apiKey', 'authDomain', 'projectId'] as const;
      const missingFields = requiredFields.filter(field => !firebaseConfig[field]);
      
      if (missingFields.length > 0) {
        console.error('Missing Firebase configuration:', missingFields);
        console.log('Please check your .env.local file');
        return { app, auth, db, storage, functions, analytics };
      }

      console.log('Initializing Firebase with project:', firebaseConfig.projectId);

      // Initialize app
      app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
      
      // Initialize auth with persistence
      auth = getAuth(app);
      
      // Initialize services differently for client and server
      if (typeof window !== 'undefined') {
        // CLIENT-SIDE INITIALIZATION
        console.log('Performing client-side Firebase initialization...');

        // Set auth persistence to local (survives browser restarts)
        try {
          await setPersistence(auth, browserLocalPersistence);
          console.log('Auth persistence set to local');
        } catch (error) {
          console.warn('Failed to set auth persistence:', error);
        }

        // Initialize Firestore with persistence and recovery logic
        try {
          const shouldClearCache = localStorage.getItem('firestore_needs_cache_clear') === 'true';
          const bypassPersistence = sessionStorage.getItem('firestore_bypass_persistence') === 'true';

          if (shouldClearCache || window.location.search.includes('clear_cache=true') || bypassPersistence) {
            console.log('Cache issues detected or bypass requested, using memory-only cache');
            db = initializeFirestore(app, { localCache: undefined });
            if (shouldClearCache) {
              localStorage.removeItem('firestore_needs_cache_clear');
            }
            console.log('Firestore initialized with memory cache only (no persistence)');
          } else {
            try {
              db = initializeFirestore(app, {
                localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
              });
              console.log('Firestore initialized with persistent cache');
            } catch (persistError) {
              console.warn('Persistence failed, falling back to memory cache:', persistError);
              localStorage.setItem('firestore_needs_cache_clear', 'true');
              db = initializeFirestore(app, { localCache: undefined });
              console.log('Firestore initialized with memory cache only');
            }
          }
        } catch (error) {
          console.error('Unable to initialize Firestore on client:', error);
          try {
            db = getFirestore(app);
            console.log('Firestore initialized with basic settings as a fallback on client');
          } catch (finalError) {
            console.error('Complete client Firestore initialization failure:', finalError);
            db = null;
          }
        }
      } else {
        // SERVER-SIDE INITIALIZATION
        console.log('Performing server-side Firebase initialization...');
        try {
          db = getFirestore(app);
          console.log('Firestore initialized for server-side.');
        } catch (error) {
          console.error('Unable to initialize Firestore on server:', error);
          db = null;
        }
      }
      
      storage = getStorage(app);
      functions = getFunctions(app);
      
      console.log('Firebase services initialized');
      
      // Initialize Analytics
      isSupported().then(supported => {
        if (supported && firebaseConfig.measurementId && app) {
          analytics = getAnalytics(app);
        }
      });
      
      // Connect to emulators in development
      if (process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === 'true') {
        try {
          if (auth) connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
          if (db) connectFirestoreEmulator(db, 'localhost', 8080);
          if (storage) connectStorageEmulator(storage, 'localhost', 9199);
          console.log('Connected to Firebase emulators');
        } catch (error) {
          // Emulators might already be connected
          console.log('Emulators connection skipped (may already be connected)');
        }
      }
      
      initialized = true;
      initializationPromise = null;
      console.log('Firebase initialization complete');
    } catch (error) {
      console.error('Firebase initialization error:', error);
      initializationPromise = null;
    }
  })();

  // Wait for initialization
  initializationPromise.catch(() => {
    // Reset promise on error
    initializationPromise = null;
  });
  
  return { app, auth, db, storage, functions, analytics };
}

// Export getters that initialize on first use
export function getFirebaseAuth() {
  const { auth: firebaseAuth } = initializeFirebaseIfNeeded();
  return firebaseAuth;
}

export async function getFirebaseDb() {
  // Ensure initialization is triggered and wait for it if necessary
  const { db: initialDb } = initializeFirebaseIfNeeded();
  
  if (initialDb) {
    return initialDb;
  }

  // If initialization is in progress, wait for the promise
  if (initializationPromise) {
    await initializationPromise;
  }

  // Return the initialized db (will be null if initialization failed)
  return db;
}

export function getFirebaseStorage() {
  const { storage: firebaseStorage } = initializeFirebaseIfNeeded();
  return firebaseStorage;
}

// Legacy exports for backward compatibility
export { app, auth, db, storage, functions, analytics };

// Helper to check if Firebase is configured
export const isFirebaseConfigured = () => !!firebaseConfig;

// Helper to cleanly terminate Firestore (useful for cleanup)
export async function terminateFirestore() {
  if (db) {
    try {
      await terminate(db);
      db = null;
      initialized = false;
      console.log('Firestore terminated successfully');
    } catch (error) {
      // Termination errors are common and usually not critical
      // Log as warning instead of error to avoid triggering error handlers
      console.warn('Firestore termination encountered an issue (this is often expected):', error);
      
      // Reset the variables anyway since termination was attempted
      db = null;
      initialized = false;
      
      // Don't throw the error - let the caller handle it
      throw error;
    }
  }
}

// Instructions for setting up Firebase
export const FIREBASE_SETUP_INSTRUCTIONS = `
To set up Firebase:
1. Create a Firebase project at https://console.firebase.google.com
2. Enable Authentication (Email/Password and Google)
3. Enable Firestore Database
4. Get your config from Project Settings
5. Create a .env.local file with:
   NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-auth-domain
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-storage-bucket
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
   NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
   NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your-measurement-id (optional)
`; 
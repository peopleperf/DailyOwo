import { 
  doc, 
  getDoc, 
  updateDoc, 
  setDoc,
  serverTimestamp,
  Timestamp 
} from 'firebase/firestore';
import { getFirebaseDb } from '@/lib/firebase/config';

/**
 * Optimistic Locking System
 * Prevents data corruption when multiple users edit the same data simultaneously
 */

export interface LockableDocument {
  version: number;
  lastModified: Date | Timestamp;
  lastModifiedBy: string;
  lockedBy?: string;
  lockedAt?: Date | Timestamp;
  lockExpiry?: Date | Timestamp;
}

export interface ConflictResolution<T> {
  strategy: 'merge' | 'overwrite' | 'reject' | 'custom';
  resolver?: (current: T, incoming: T, base?: T) => T;
}

export interface UpdateResult<T> {
  success: boolean;
  data?: T;
  conflict?: {
    type: 'version_mismatch' | 'locked' | 'not_found';
    currentVersion?: number;
    attemptedVersion?: number;
    lockedBy?: string;
    suggestion?: string;
  };
  error?: string;
}

/**
 * Update a document with optimistic locking
 */
export async function updateWithLock<T extends LockableDocument>(
  collectionName: string,
  documentId: string,
  userId: string,
  updates: Partial<T>,
  expectedVersion: number,
  conflictResolution?: ConflictResolution<T>
): Promise<UpdateResult<T>> {
  const db = await getFirebaseDb();
  if (!db) {
    return { success: false, error: 'Firebase is not initialized' };
  }

  try {
    const docRef = doc(db, collectionName, documentId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return {
        success: false,
        conflict: {
          type: 'not_found',
          suggestion: 'Document does not exist. It may have been deleted.',
        },
      };
    }

    const currentData = docSnap.data() as T;
    
    // Check if document is locked by another user
    if (currentData.lockedBy && currentData.lockedBy !== userId) {
      const lockExpiry = currentData.lockExpiry instanceof Timestamp 
        ? currentData.lockExpiry.toDate() 
        : currentData.lockExpiry;
      
      if (lockExpiry && lockExpiry > new Date()) {
        return {
          success: false,
          conflict: {
            type: 'locked',
            lockedBy: currentData.lockedBy,
            suggestion: `Document is locked by another user until ${lockExpiry.toLocaleString()}`,
          },
        };
      }
    }

    // Check version mismatch
    if (currentData.version !== expectedVersion) {
      // Handle conflict based on resolution strategy
      if (conflictResolution) {
        switch (conflictResolution.strategy) {
          case 'overwrite':
            // Force update with new version
            break;
          
          case 'merge':
            // Attempt to merge changes
            if (conflictResolution.resolver) {
              const mergedData = conflictResolution.resolver(
                currentData,
                { ...currentData, ...updates },
                currentData
              );
              updates = mergedData as Partial<T>;
            }
            break;
          
          case 'reject':
          default:
            return {
              success: false,
              conflict: {
                type: 'version_mismatch',
                currentVersion: currentData.version,
                attemptedVersion: expectedVersion,
                suggestion: 'Your version is outdated. Please refresh and try again.',
              },
            };
        }
      } else {
        // Default to reject on conflict
        return {
          success: false,
          conflict: {
            type: 'version_mismatch',
            currentVersion: currentData.version,
            attemptedVersion: expectedVersion,
            suggestion: 'Your version is outdated. Please refresh and try again.',
          },
        };
      }
    }

    // Perform the update
    const updatedData = {
      ...updates,
      version: currentData.version + 1,
      lastModified: serverTimestamp(),
      lastModifiedBy: userId,
      lockedBy: null,
      lockedAt: null,
      lockExpiry: null,
    };

    await updateDoc(docRef, updatedData);

    return {
      success: true,
      data: Object.assign({}, currentData, updatedData) as T,
    };
  } catch (error) {
    console.error('Error updating with lock:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Acquire a lock on a document
 */
export async function acquireLock(
  collectionName: string,
  documentId: string,
  userId: string,
  durationMs: number = 5 * 60 * 1000 // 5 minutes default
): Promise<boolean> {
  const db = await getFirebaseDb();
  if (!db) {
    return false;
  }

  try {
    const docRef = doc(db, collectionName, documentId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return false;
    }

    const currentData = docSnap.data() as LockableDocument;
    
    // Check if already locked by another user
    if (currentData.lockedBy && currentData.lockedBy !== userId) {
      const lockExpiry = currentData.lockExpiry instanceof Timestamp 
        ? currentData.lockExpiry.toDate() 
        : currentData.lockExpiry;
      
      if (lockExpiry && lockExpiry > new Date()) {
        return false; // Still locked
      }
    }

    // Acquire lock
    const lockExpiry = new Date(Date.now() + durationMs);
    
    await updateDoc(docRef, {
      lockedBy: userId,
      lockedAt: serverTimestamp(),
      lockExpiry,
    });

    return true;
  } catch (error) {
    console.error('Error acquiring lock:', error);
    return false;
  }
}

/**
 * Release a lock on a document
 */
export async function releaseLock(
  collectionName: string,
  documentId: string,
  userId: string
): Promise<boolean> {
  const db = await getFirebaseDb();
  if (!db) {
    return false;
  }

  try {
    const docRef = doc(db, collectionName, documentId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return false;
    }

    const currentData = docSnap.data() as LockableDocument;
    
    // Only release if locked by the same user
    if (currentData.lockedBy !== userId) {
      return false;
    }

    await updateDoc(docRef, {
      lockedBy: null,
      lockedAt: null,
      lockExpiry: null,
    });

    return true;
  } catch (error) {
    console.error('Error releasing lock:', error);
    return false;
  }
}

/**
 * Check if a document has conflicts
 */
export async function checkForConflicts<T extends LockableDocument>(
  collectionName: string,
  documentId: string,
  localVersion: number,
  userId: string
): Promise<{
  hasConflict: boolean;
  conflictType?: 'version' | 'lock';
  remoteVersion?: number;
  lockedBy?: string;
}> {
  const db = await getFirebaseDb();
  if (!db) {
    return { hasConflict: true, conflictType: 'version' };
  }

  try {
    const docRef = doc(db, collectionName, documentId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return { hasConflict: true, conflictType: 'version' };
    }

    const remoteData = docSnap.data() as T;
    
    // Check for lock conflict
    if (remoteData.lockedBy && remoteData.lockedBy !== userId) {
      const lockExpiry = remoteData.lockExpiry instanceof Timestamp 
        ? remoteData.lockExpiry.toDate() 
        : remoteData.lockExpiry;
      
      if (lockExpiry && lockExpiry > new Date()) {
        return {
          hasConflict: true,
          conflictType: 'lock',
          lockedBy: remoteData.lockedBy,
        };
      }
    }

    // Check for version conflict
    if (remoteData.version !== localVersion) {
      return {
        hasConflict: true,
        conflictType: 'version',
        remoteVersion: remoteData.version,
      };
    }

    return { hasConflict: false };
  } catch (error) {
    console.error('Error checking conflicts:', error);
    return { hasConflict: true, conflictType: 'version' };
  }
}

/**
 * Merge strategy for transactions
 */
export function createTransactionMerger<T extends Record<string, any>>(): (
  current: T,
  incoming: T,
  base: T
) => T {
  return (current: T, incoming: T, base: T) => {
    const merged: T = { ...current };
    
    // For each field in incoming
    (Object.keys(incoming) as Array<keyof T>).forEach(key => {
      // Skip system fields
      const keyStr = String(key);
      if (['version', 'lastModified', 'lastModifiedBy', 'lockedBy', 'lockedAt', 'lockExpiry'].includes(keyStr)) {
        return;
      }
      
      const currentValue = current[key];
      const incomingValue = incoming[key];
      const baseValue = base[key];
      
      // If the field hasn't changed in current, take incoming
      if (JSON.stringify(currentValue) === JSON.stringify(baseValue)) {
        merged[key] = incomingValue;
      }
      // If the field hasn't changed in incoming, keep current
      else if (JSON.stringify(incomingValue) === JSON.stringify(baseValue)) {
        merged[key] = currentValue;
      }
      // Both changed - need conflict resolution
      else {
        // For amounts, take the most recent
        if (keyStr === 'amount' && typeof incomingValue === 'number' && typeof currentValue === 'number') {
          // Could implement more sophisticated merge (e.g., sum of deltas)
          merged[key] = incomingValue;
        }
        // For arrays, merge unique values
        else if (Array.isArray(currentValue) && Array.isArray(incomingValue)) {
          merged[key] = [...new Set([...currentValue, ...incomingValue])] as T[keyof T];
        }
        // Default to incoming for other conflicts
        else {
          merged[key] = incomingValue;
        }
      }
    });
    
    return merged;
  };
}

/**
 * Create a conflict-aware update function
 */
export function createConflictAwareUpdater<T extends LockableDocument>(
  collectionName: string,
  conflictResolution: ConflictResolution<T> = { strategy: 'reject' }
) {
  return async (
    documentId: string,
    userId: string,
    updates: Partial<T>,
    expectedVersion: number
  ): Promise<UpdateResult<T>> => {
    return updateWithLock(
      collectionName,
      documentId,
      userId,
      updates,
      expectedVersion,
      conflictResolution
    );
  };
}

/**
 * Monitor for external changes to a document
 */
export function createChangeMonitor(
  onExternalChange: (documentId: string, newVersion: number, changedBy: string) => void
) {
  const monitoredDocs = new Map<string, { version: number; userId: string }>();
  
  return {
    startMonitoring(documentId: string, version: number, userId: string) {
      monitoredDocs.set(documentId, { version, userId });
    },
    
    stopMonitoring(documentId: string) {
      monitoredDocs.delete(documentId);
    },
    
    async checkForChanges(collectionName: string) {
      const db = await getFirebaseDb();
      if (!db) return;
      
      for (const [documentId, localInfo] of monitoredDocs.entries()) {
        try {
          const docRef = doc(db, collectionName, documentId);
          const docSnap = await getDoc(docRef);
          
          if (docSnap.exists()) {
            const remoteData = docSnap.data() as LockableDocument;
            
            if (remoteData.version > localInfo.version && 
                remoteData.lastModifiedBy !== localInfo.userId) {
              onExternalChange(documentId, remoteData.version, remoteData.lastModifiedBy);
            }
          }
        } catch (error) {
          console.error(`Error checking changes for ${documentId}:`, error);
        }
      }
    },
  };
}

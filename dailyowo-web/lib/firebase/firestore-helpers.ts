import { 
  onSnapshot, 
  Query, 
  DocumentReference, 
  QuerySnapshot, 
  DocumentSnapshot,
  FirestoreError,
  Unsubscribe
} from 'firebase/firestore';

// Track active listeners to prevent duplicates
const activeListeners = new Map<string, Unsubscribe>();

// Track failed listener IDs for potential retry
const failedListeners = new Set<string>();

/**
 * Safe wrapper for onSnapshot that handles errors and prevents duplicate listeners
 */
export function safeOnSnapshot<T>(
  query: Query<T> | DocumentReference<T>,
  listenerId: string,
  onNext: (snapshot: QuerySnapshot<T> | DocumentSnapshot<T>) => void,
  onError?: (error: FirestoreError) => void
): Unsubscribe {
  // Clean up any existing listener with the same ID
  const existingListener = activeListeners.get(listenerId);
  if (existingListener) {
    console.log(`Cleaning up existing listener: ${listenerId}`);
    existingListener();
    activeListeners.delete(listenerId);
  }

  // Remove from failed listeners if retrying
  failedListeners.delete(listenerId);

  // Create error handler with recovery logic
  const errorHandler = (error: FirestoreError) => {
    console.error(`Firestore listener error (${listenerId}):`, error);
    
    // Handle specific error codes
    if (error.code === 'permission-denied') {
      console.log('Permission denied - user may need to re-authenticate');
      failedListeners.add(listenerId);
    } else if (error.code === 'unavailable') {
      console.log('Firestore unavailable - will retry when connection restored');
      failedListeners.add(listenerId);
    } else if (error.message?.includes('INTERNAL ASSERTION FAILED')) {
      console.log('Internal Firestore error detected');
      // Remove this listener from active listeners
      activeListeners.delete(listenerId);
      failedListeners.add(listenerId);
      
      // Don't automatically retry for internal errors
      // Let the component handle re-subscription if needed
    }
    
    // Call custom error handler if provided
    if (onError) {
      onError(error);
    }
  };

  let retryCount = 0;
  const maxRetries = 3;

  const createListener = (): Unsubscribe => {
    try {
      // Create the listener with error handling
      const unsubscribe = onSnapshot(
        query as any,
        {
          // Don't include metadata changes for better performance and stability
          includeMetadataChanges: false,
          // Add source option to prefer cache when offline
          source: 'default'
        },
        (snapshot) => {
          try {
            // Reset retry count on successful snapshot
            retryCount = 0;
            onNext(snapshot as any);
          } catch (error) {
            console.error(`Error in snapshot handler (${listenerId}):`, error);
          }
        },
        (error) => {
          errorHandler(error);
          
          // Retry logic for specific errors
          if (error.code === 'unavailable' && retryCount < maxRetries) {
            retryCount++;
            console.log(`Retrying listener ${listenerId} (attempt ${retryCount}/${maxRetries})`);
            
            // Clean up current listener
            activeListeners.delete(listenerId);
            unsubscribe();
            
            // Retry after a delay
            setTimeout(() => {
              if (!activeListeners.has(listenerId)) {
                const newUnsubscribe = createListener();
                activeListeners.set(listenerId, newUnsubscribe);
              }
            }, Math.min(1000 * Math.pow(2, retryCount), 10000)); // Exponential backoff, max 10s
          }
        }
      );

      return unsubscribe;
    } catch (error) {
      console.error(`Failed to create listener ${listenerId}:`, error);
      throw error;
    }
  };

  const unsubscribe = createListener();

  // Track the listener
  activeListeners.set(listenerId, unsubscribe);

  // Return a wrapped unsubscribe function that also cleans up tracking
  return () => {
    activeListeners.delete(listenerId);
    failedListeners.delete(listenerId);
    unsubscribe();
  };
}

/**
 * Clean up all active listeners (useful for cleanup on unmount or error recovery)
 */
export function cleanupAllListeners() {
  console.log(`Cleaning up ${activeListeners.size} active listeners`);
  activeListeners.forEach((unsubscribe, id) => {
    console.log(`Unsubscribing listener: ${id}`);
    unsubscribe();
  });
  activeListeners.clear();
  failedListeners.clear();
}

/**
 * Get count of active listeners (useful for debugging)
 */
export function getActiveListenerCount(): number {
  return activeListeners.size;
}

/**
 * Check if a specific listener is active
 */
export function isListenerActive(listenerId: string): boolean {
  return activeListeners.has(listenerId);
}

/**
 * Get list of failed listeners (useful for debugging)
 */
export function getFailedListeners(): string[] {
  return Array.from(failedListeners);
}

/**
 * Retry all failed listeners
 */
export function retryFailedListeners(
  getListenerConfig: (listenerId: string) => {
    query: Query<any> | DocumentReference<any>;
    onNext: (snapshot: any) => void;
    onError?: (error: FirestoreError) => void;
  } | null
) {
  const failed = Array.from(failedListeners);
  console.log(`Retrying ${failed.length} failed listeners`);
  
  failed.forEach(listenerId => {
    const config = getListenerConfig(listenerId);
    if (config) {
      safeOnSnapshot(config.query, listenerId, config.onNext, config.onError);
    }
  });
} 
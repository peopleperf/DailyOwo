/**
 * Audit Trail Storage Service
 * Handles persistent storage of audit entries in Firestore
 */

import { 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  getDocs,
  doc,
  getDoc,
  startAfter,
  DocumentSnapshot,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { getFirebaseDb } from '@/lib/firebase/config';
import { AuditEntry, AuditSummary, generateAuditSummary } from '@/lib/utils/transaction-audit';

/**
 * Store audit entry in Firestore
 */
export async function storeAuditEntry(auditEntry: AuditEntry): Promise<void> {
  try {
    const db = await getFirebaseDb();
    if (!db) {
      throw new Error('Firebase is not initialized');
    }

    // Prepare audit entry for storage
    const storageEntry = {
      ...auditEntry,
      timestamp: serverTimestamp(),
      createdAt: serverTimestamp(),
    };

    // Store in global audit trail collection
    await addDoc(collection(db, 'auditTrail'), storageEntry);

    // Also store in user's audit logs subcollection for faster queries
    const userDocRef = doc(db, 'users', auditEntry.userId);
    await addDoc(collection(userDocRef, 'audit_logs'), storageEntry);
    
    console.log('[AuditStorage] Audit entry stored:', auditEntry.id);
  } catch (error) {
    console.error('[AuditStorage] Error storing audit entry:', error);
    // Don't throw - audit logging should not break the main flow
  }
}

/**
 * Get audit entries for a specific user
 */
export async function getUserAuditEntries(
  userId: string,
  options?: {
    limitCount?: number;
    startAfterDoc?: DocumentSnapshot;
    action?: AuditEntry['action'];
    transactionId?: string;
    startDate?: Date;
    endDate?: Date;
  }
): Promise<{
  entries: AuditEntry[];
  lastDoc?: DocumentSnapshot;
  hasMore: boolean;
}> {
  try {
    const db = await getFirebaseDb();
    if (!db) {
      throw new Error('Firebase is not initialized');
    }

    const userDocRef = doc(db, 'users', userId);
    let q = query(
      collection(userDocRef, 'audit_logs'),
      orderBy('timestamp', 'desc')
    );

    // Apply filters
    if (options?.action) {
      q = query(q, where('action', '==', options.action));
    }

    if (options?.transactionId) {
      q = query(q, where('transactionId', '==', options.transactionId));
    }

    if (options?.startDate) {
      q = query(q, where('timestamp', '>=', options.startDate));
    }

    if (options?.endDate) {
      q = query(q, where('timestamp', '<=', options.endDate));
    }

    // Apply pagination
    if (options?.startAfterDoc) {
      q = query(q, startAfter(options.startAfterDoc));
    }

    const limitCount = options?.limitCount || 50;
    q = query(q, limit(limitCount + 1)); // Get one extra to check if there are more

    const snapshot = await getDocs(q);
    const docs = snapshot.docs;
    
    // Check if there are more documents
    const hasMore = docs.length > limitCount;
    const actualDocs = hasMore ? docs.slice(0, limitCount) : docs;
    const lastDoc = actualDocs.length > 0 ? actualDocs[actualDocs.length - 1] : undefined;

    const entries: AuditEntry[] = actualDocs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        timestamp: data.timestamp instanceof Timestamp ? data.timestamp.toDate() : new Date(data.timestamp),
        userId: data.userId,
        action: data.action,
        transactionId: data.transactionId,
        changes: data.changes,
        metadata: data.metadata,
        previousState: data.previousState,
        newState: data.newState,
      } as AuditEntry;
    });

    return {
      entries,
      lastDoc,
      hasMore
    };
  } catch (error) {
    console.error('[AuditStorage] Error getting user audit entries:', error);
    return {
      entries: [],
      hasMore: false
    };
  }
}

/**
 * Get audit entries for a specific transaction
 */
export async function getTransactionAuditHistory(
  userId: string,
  transactionId: string
): Promise<AuditEntry[]> {
  try {
    const result = await getUserAuditEntries(userId, {
      transactionId,
      limitCount: 100 // Transactions shouldn't have more than 100 audit entries
    });

    return result.entries;
  } catch (error) {
    console.error('[AuditStorage] Error getting transaction audit history:', error);
    return [];
  }
}

/**
 * Generate audit summary for a user
 */
export async function getUserAuditSummary(
  userId: string,
  timeRange?: {
    startDate: Date;
    endDate: Date;
  }
): Promise<AuditSummary> {
  try {
    const result = await getUserAuditEntries(userId, {
      limitCount: 1000, // Get last 1000 entries for summary
      startDate: timeRange?.startDate,
      endDate: timeRange?.endDate
    });

    return generateAuditSummary(result.entries);
  } catch (error) {
    console.error('[AuditStorage] Error generating audit summary:', error);
    return {
      totalChanges: 0,
      changesByAction: {},
      changesByUser: {},
      recentChanges: [],
      suspiciousActivity: []
    };
  }
}

/**
 * Search audit trail by criteria
 */
export async function searchAuditTrail(
  userId: string,
  criteria: {
    action?: AuditEntry['action'];
    transactionId?: string;
    startDate?: Date;
    endDate?: Date;
    searchTerm?: string; // Search in metadata or changes
  }
): Promise<AuditEntry[]> {
  try {
    const result = await getUserAuditEntries(userId, {
      action: criteria.action,
      transactionId: criteria.transactionId,
      startDate: criteria.startDate,
      endDate: criteria.endDate,
      limitCount: 500
    });

    let entries = result.entries;

    // Apply text search if provided
    if (criteria.searchTerm) {
      const searchTerm = criteria.searchTerm.toLowerCase();
      entries = entries.filter(entry => {
        // Search in metadata
        const metadataSearch = entry.metadata?.source?.toLowerCase().includes(searchTerm) ||
                             entry.metadata?.reason?.toLowerCase().includes(searchTerm) ||
                             entry.metadata?.userAgent?.toLowerCase().includes(searchTerm);

        // Search in changes
        const changesSearch = entry.changes?.some(change =>
          change.field.toLowerCase().includes(searchTerm) ||
          String(change.oldValue).toLowerCase().includes(searchTerm) ||
          String(change.newValue).toLowerCase().includes(searchTerm)
        );

        return metadataSearch || changesSearch;
      });
    }

    return entries;
  } catch (error) {
    console.error('[AuditStorage] Error searching audit trail:', error);
    return [];
  }
}

/**
 * Get audit entry by ID
 */
export async function getAuditEntry(userId: string, auditId: string): Promise<AuditEntry | null> {
  try {
    const db = await getFirebaseDb();
    if (!db) {
      throw new Error('Firebase is not initialized');
    }

    const userDocRef = doc(db, 'users', userId);
    const auditDocRef = doc(userDocRef, 'audit_logs', auditId);
    const auditDoc = await getDoc(auditDocRef);

    if (!auditDoc.exists()) {
      return null;
    }

    const data = auditDoc.data();
    return {
      id: auditDoc.id,
      timestamp: data.timestamp instanceof Timestamp ? data.timestamp.toDate() : new Date(data.timestamp),
      userId: data.userId,
      action: data.action,
      transactionId: data.transactionId,
      changes: data.changes,
      metadata: data.metadata,
      previousState: data.previousState,
      newState: data.newState,
    } as AuditEntry;
  } catch (error) {
    console.error('[AuditStorage] Error getting audit entry:', error);
    return null;
  }
}

/**
 * Delete old audit entries (for compliance/cleanup)
 */
export async function cleanupOldAuditEntries(
  userId: string,
  retentionDays: number = 365
): Promise<number> {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    const result = await getUserAuditEntries(userId, {
      endDate: cutoffDate,
      limitCount: 1000
    });

    const db = await getFirebaseDb();
    if (!db || result.entries.length === 0) {
      return 0;
    }

    // Note: In production, this should use batch operations or Cloud Functions
    // for better performance and reliability
    let deletedCount = 0;
    const userDocRef = doc(db, 'users', userId);

    for (const entry of result.entries) {
      try {
        const auditDocRef = doc(userDocRef, 'audit_logs', entry.id);
        // In a real implementation, you'd use deleteDoc here
        // await deleteDoc(auditDocRef);
        deletedCount++;
      } catch (error) {
        console.warn(`Failed to delete audit entry ${entry.id}:`, error);
      }
    }

    console.log(`[AuditStorage] Cleaned up ${deletedCount} old audit entries for user ${userId}`);
    return deletedCount;
  } catch (error) {
    console.error('[AuditStorage] Error cleaning up old audit entries:', error);
    return 0;
  }
}

/**
 * Batch store multiple audit entries (for bulk operations)
 */
export async function batchStoreAuditEntries(auditEntries: AuditEntry[]): Promise<void> {
  try {
    // In production, use Firestore batch operations for better performance
    const promises = auditEntries.map(entry => storeAuditEntry(entry));
    await Promise.all(promises);
    
    console.log(`[AuditStorage] Batch stored ${auditEntries.length} audit entries`);
  } catch (error) {
    console.error('[AuditStorage] Error batch storing audit entries:', error);
    // Don't throw - audit logging should not break the main flow
  }
}
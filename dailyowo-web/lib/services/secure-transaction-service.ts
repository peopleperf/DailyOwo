import { Transaction } from '@/types/transaction';
import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  getDocs,
  DocumentData,
  QuerySnapshot,
  serverTimestamp,
  getDoc
} from 'firebase/firestore';
import { getFirebaseDb } from '@/lib/firebase/config';
import { prepareForStorage, prepareForDisplay, hashValue } from '@/lib/utils/encryption';
import { createAuditEntry } from '@/lib/utils/transaction-audit';

/**
 * Secure Transaction Service
 * Handles encryption/decryption of sensitive transaction data
 */

// Define types for creating and updating transactions
export type CreateTransactionData = Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'> & {
  accountNumber?: string;
  cardNumber?: string;
  routingNumber?: string;
  notes?: string;
};

export type UpdateTransactionData = Partial<CreateTransactionData>;

/**
 * Create a new transaction with encrypted sensitive fields
 */
export async function createSecureTransaction(
  userId: string,
  data: CreateTransactionData
): Promise<string> {
  try {
    const db = getFirebaseDb();
    if (!db) {
      throw new Error('Firebase is not initialized');
    }

    // Prepare transaction data with encryption
    const transactionData = {
      ...data,
      userId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    // Encrypt sensitive fields
    const encryptedData = prepareForStorage(transactionData, 'transaction');

    // Create searchable hashes for encrypted fields
    const searchableData = {
      ...encryptedData,
      // Add hashed versions for searching
      ...(data.accountNumber && { accountNumberHash: hashValue(data.accountNumber) }),
      ...(data.cardNumber && { cardNumberHash: hashValue(data.cardNumber) }),
    };

    // Add to Firestore
    const docRef = await addDoc(collection(db, 'transactions'), searchableData);

    // Audit the creation
    const auditEntry = createAuditEntry(
      'CREATE',
      userId,
      docRef.id,
      {
        newState: data as Partial<Transaction>,
        metadata: {
          source: 'secure-transaction-service',
        }
      }
    );
    
    // TODO: Save audit entry to Firestore
    // await addDoc(collection(db, 'auditTrail'), auditEntry);

    return docRef.id;
  } catch (error) {
    console.error('Error creating secure transaction:', error);
    throw error;
  }
}

/**
 * Get transactions with decrypted sensitive fields
 */
export async function getSecureTransactions(
  userId: string,
  filters?: {
    startDate?: Date;
    endDate?: Date;
    category?: string;
    type?: 'income' | 'expense';
    accountNumber?: string; // Will search by hash
  }
): Promise<Transaction[]> {
  try {
    const db = getFirebaseDb();
    if (!db) {
      throw new Error('Firebase is not initialized');
    }

    let q = query(
      collection(db, 'transactions'),
      where('userId', '==', userId),
      orderBy('date', 'desc')
    );

    // Add filters if provided
    if (filters?.type) {
      q = query(q, where('type', '==', filters.type));
    }
    if (filters?.category) {
      q = query(q, where('category', '==', filters.category));
    }
    if (filters?.startDate) {
      q = query(q, where('date', '>=', filters.startDate));
    }
    if (filters?.endDate) {
      q = query(q, where('date', '<=', filters.endDate));
    }
    
    // Search by account number hash if provided
    if (filters?.accountNumber) {
      const accountHash = hashValue(filters.accountNumber);
      q = query(q, where('accountNumberHash', '==', accountHash));
    }

    const snapshot: QuerySnapshot<DocumentData> = await getDocs(q);
    
    const transactions: Transaction[] = [];
    
    snapshot.forEach((doc) => {
      const data = doc.data();
      // Decrypt sensitive fields
      const decryptedData = prepareForDisplay(data, 'transaction');
      
      transactions.push({
        id: doc.id,
        ...decryptedData,
        // Ensure dates are properly converted
        date: data.date?.toDate() || new Date(),
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as Transaction);
    });

    return transactions;
  } catch (error) {
    console.error('Error getting secure transactions:', error);
    throw error;
  }
}

/**
 * Get a single transaction with decrypted data
 */
export async function getSecureTransaction(
  transactionId: string,
  userId: string
): Promise<Transaction | null> {
  try {
    const db = getFirebaseDb();
    if (!db) {
      throw new Error('Firebase is not initialized');
    }

    const docRef = doc(db, 'transactions', transactionId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return null;
    }

    const data = docSnap.data();
    
    // Verify ownership
    if (data.userId !== userId) {
      throw new Error('Unauthorized access to transaction');
    }

    // Decrypt sensitive fields
    const decryptedData = prepareForDisplay(data, 'transaction');

    return {
      id: docSnap.id,
      ...decryptedData,
      date: data.date?.toDate() || new Date(),
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
    } as Transaction;
  } catch (error) {
    console.error('Error getting secure transaction:', error);
    throw error;
  }
}

/**
 * Update a transaction with encrypted sensitive fields
 */
export async function updateSecureTransaction(
  transactionId: string,
  userId: string,
  updates: UpdateTransactionData
): Promise<void> {
  try {
    const db = getFirebaseDb();
    if (!db) {
      throw new Error('Firebase is not initialized');
    }

    // Get current transaction for audit trail
    const current = await getSecureTransaction(transactionId, userId);
    if (!current) {
      throw new Error('Transaction not found');
    }

    // Prepare updates with encryption
    const updateData = {
      ...updates,
      updatedAt: serverTimestamp(),
    };

    // Encrypt sensitive fields in updates
    const encryptedUpdates = prepareForStorage(updateData, 'transaction');

    // Update searchable hashes if needed
    const searchableUpdates = {
      ...encryptedUpdates,
      ...(updates.accountNumber && { accountNumberHash: hashValue(updates.accountNumber) }),
      ...(updates.cardNumber && { cardNumberHash: hashValue(updates.cardNumber) }),
    };

    // Update in Firestore
    await updateDoc(doc(db, 'transactions', transactionId), searchableUpdates);

    // Audit the update
    const auditEntry = createAuditEntry(
      'UPDATE',
      userId,
      transactionId,
      {
        previousState: current as Partial<Transaction>,
        newState: { ...current, ...updates } as Partial<Transaction>,
        metadata: {
          source: 'secure-transaction-service',
        }
      }
    );
    
    // TODO: Save audit entry to Firestore
    // await addDoc(collection(db, 'auditTrail'), auditEntry);
  } catch (error) {
    console.error('Error updating secure transaction:', error);
    throw error;
  }
}

/**
 * Delete a transaction (soft delete with encryption)
 */
export async function deleteSecureTransaction(
  transactionId: string,
  userId: string
): Promise<void> {
  try {
    const db = getFirebaseDb();
    if (!db) {
      throw new Error('Firebase is not initialized');
    }

    // Get transaction for audit trail
    const transaction = await getSecureTransaction(transactionId, userId);
    if (!transaction) {
      throw new Error('Transaction not found');
    }

    // Soft delete by marking as deleted
    await updateDoc(doc(db, 'transactions', transactionId), {
      deleted: true,
      deletedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    // Audit the deletion
    const auditEntry = createAuditEntry(
      'DELETE',
      userId,
      transactionId,
      {
        previousState: transaction as Partial<Transaction>,
        metadata: {
          source: 'secure-transaction-service',
        }
      }
    );
    
    // TODO: Save audit entry to Firestore
    // await addDoc(collection(db, 'auditTrail'), auditEntry);
  } catch (error) {
    console.error('Error deleting secure transaction:', error);
    throw error;
  }
}

/**
 * Bulk import transactions with encryption
 */
export async function bulkImportSecureTransactions(
  userId: string,
  transactions: CreateTransactionData[]
): Promise<{ successful: number; failed: number; errors: string[] }> {
  const results = {
    successful: 0,
    failed: 0,
    errors: [] as string[],
  };

  for (const transaction of transactions) {
    try {
      await createSecureTransaction(userId, transaction);
      results.successful++;
    } catch (error) {
      results.failed++;
      results.errors.push(
        `Failed to import transaction: ${transaction.description || 'Unknown'} - ${error}`
      );
    }
  }

  return results;
}

/**
 * Export transactions with option to include encrypted data
 */
export async function exportSecureTransactions(
  userId: string,
  includeEncrypted: boolean = false,
  filters?: {
    startDate?: Date;
    endDate?: Date;
  }
): Promise<{
  transactions: Transaction[];
  metadata: {
    exportDate: Date;
    count: number;
    encrypted: boolean;
  };
}> {
  try {
    const transactions = await getSecureTransactions(userId, filters);

    // If not including encrypted data, mask sensitive fields
    const exportData = includeEncrypted 
      ? transactions 
      : transactions.map(t => {
          const masked: any = { ...t };
          // Only mask fields if they exist
          if ('accountNumber' in masked && masked.accountNumber) {
            masked.accountNumber = `****${masked.accountNumber.slice(-4)}`;
          }
          if ('cardNumber' in masked && masked.cardNumber) {
            masked.cardNumber = `****${masked.cardNumber.slice(-4)}`;
          }
          if ('notes' in masked && masked.notes) {
            masked.notes = '[REDACTED]';
          }
          return masked;
        });

    return {
      transactions: exportData,
      metadata: {
        exportDate: new Date(),
        count: exportData.length,
        encrypted: !includeEncrypted,
      },
    };
  } catch (error) {
    console.error('Error exporting secure transactions:', error);
    throw error;
  }
} 
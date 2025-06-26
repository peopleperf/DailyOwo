import { 
  getFirestore, 
  collection, 
  query, 
  getDocs, 
  doc, 
  setDoc, 
  deleteDoc,
  writeBatch,
  where,
  Timestamp 
} from 'firebase/firestore';
import { initializeApp } from 'firebase/app';

// Your Firebase config
const firebaseConfig = {
  // Add your config here
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

interface Transaction {
  id: string;
  userId: string;
  amount: number;
  description: string;
  category?: string;
  categoryId?: string;
  date: any;
  type: string;
  [key: string]: any;
}

/**
 * Migration script to consolidate transactions from root collection to user subcollections
 */
export async function migrateTransactionsToSubcollections() {
  console.log('🔄 Starting transaction migration...');
  
  try {
    // Get all transactions from root collection
    const rootTransactionsRef = collection(db, 'transactions');
    const rootSnapshot = await getDocs(rootTransactionsRef);
    
    console.log(`📊 Found ${rootSnapshot.docs.length} transactions in root collection`);
    
    if (rootSnapshot.docs.length === 0) {
      console.log('✅ No transactions to migrate');
      return;
    }
    
    // Group transactions by userId
    const transactionsByUser: Record<string, Transaction[]> = {};
    
    rootSnapshot.docs.forEach(doc => {
      const data = doc.data() as Transaction;
      const userId = data.userId;
      
      if (!userId) {
        console.warn(`⚠️ Transaction ${doc.id} has no userId, skipping`);
        return;
      }
      
      if (!transactionsByUser[userId]) {
        transactionsByUser[userId] = [];
      }
      
      transactionsByUser[userId].push({
        ...data,
        id: doc.id
      });
    });
    
    const userIds = Object.keys(transactionsByUser);
    console.log(`👥 Found transactions for ${userIds.length} users`);
    
    // Migrate transactions for each user
    for (const userId of userIds) {
      const userTransactions = transactionsByUser[userId];
      console.log(`🔄 Migrating ${userTransactions.length} transactions for user ${userId}`);
      
      // Check if subcollection already has transactions
      const userTransactionsRef = collection(db, 'users', userId, 'transactions');
      const existingSnapshot = await getDocs(userTransactionsRef);
      
      if (existingSnapshot.docs.length > 0) {
        console.log(`⚠️ User ${userId} already has ${existingSnapshot.docs.length} transactions in subcollection`);
        
        // Check for duplicates and only migrate new ones
        const existingIds = new Set(existingSnapshot.docs.map(doc => doc.id));
        const newTransactions = userTransactions.filter(t => !existingIds.has(t.id));
        
        console.log(`📝 Found ${newTransactions.length} new transactions to migrate`);
        
        if (newTransactions.length === 0) {
          console.log(`✅ No new transactions to migrate for user ${userId}`);
          continue;
        }
        
        // Migrate only new transactions
        for (const transaction of newTransactions) {
          await migrateTransaction(userId, transaction);
        }
      } else {
        // Migrate all transactions
        for (const transaction of userTransactions) {
          await migrateTransaction(userId, transaction);
        }
      }
      
      console.log(`✅ Completed migration for user ${userId}`);
    }
    
    console.log('🎉 Transaction migration completed successfully!');
    console.log('⚠️ IMPORTANT: Please verify the migration before deleting root transactions');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

async function migrateTransaction(userId: string, transaction: Transaction) {
  try {
    // Remove userId from transaction data (not needed in subcollection)
    const { userId: _, id, ...transactionData } = transaction;
    
    // Ensure date is properly formatted
    if (transactionData.date && typeof transactionData.date === 'string') {
      transactionData.date = Timestamp.fromDate(new Date(transactionData.date));
    }
    
    // Write to user subcollection
    const userTransactionRef = doc(db, 'users', userId, 'transactions', id);
    await setDoc(userTransactionRef, transactionData);
    
    console.log(`  ✅ Migrated transaction ${id} for user ${userId}`);
  } catch (error) {
    console.error(`  ❌ Failed to migrate transaction ${transaction.id} for user ${userId}:`, error);
    throw error;
  }
}

/**
 * Verification function to check migration results
 */
export async function verifyMigration() {
  console.log('🔍 Verifying migration...');
  
  try {
    // Count root transactions
    const rootTransactionsRef = collection(db, 'transactions');
    const rootSnapshot = await getDocs(rootTransactionsRef);
    
    console.log(`📊 Root collection has ${rootSnapshot.docs.length} transactions`);
    
    // Count subcollection transactions by user
    const usersRef = collection(db, 'users');
    const usersSnapshot = await getDocs(usersRef);
    
    let totalSubcollectionTransactions = 0;
    
    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id;
      const userTransactionsRef = collection(db, 'users', userId, 'transactions');
      const userTransactionsSnapshot = await getDocs(userTransactionsRef);
      
      if (userTransactionsSnapshot.docs.length > 0) {
        console.log(`👤 User ${userId}: ${userTransactionsSnapshot.docs.length} transactions`);
        totalSubcollectionTransactions += userTransactionsSnapshot.docs.length;
      }
    }
    
    console.log(`📊 Total subcollection transactions: ${totalSubcollectionTransactions}`);
    
    if (totalSubcollectionTransactions >= rootSnapshot.docs.length) {
      console.log('✅ Migration verification successful - all transactions appear to be migrated');
      return true;
    } else {
      console.log('⚠️ Migration verification failed - some transactions may be missing');
      return false;
    }
    
  } catch (error) {
    console.error('❌ Verification failed:', error);
    return false;
  }
}

/**
 * Clean up root transactions after successful migration
 * ONLY run this after verifying migration was successful
 */
export async function cleanupRootTransactions() {
  console.log('🧹 Starting cleanup of root transactions...');
  console.log('⚠️ THIS WILL DELETE ALL ROOT TRANSACTIONS - MAKE SURE MIGRATION WAS SUCCESSFUL!');
  
  // Double confirmation
  const confirmed = confirm('Are you sure you want to delete all root transactions? This cannot be undone!');
  if (!confirmed) {
    console.log('❌ Cleanup cancelled');
    return;
  }
  
  try {
    const rootTransactionsRef = collection(db, 'transactions');
    const rootSnapshot = await getDocs(rootTransactionsRef);
    
    console.log(`🗑️ Deleting ${rootSnapshot.docs.length} transactions from root collection`);
    
    // Delete in batches of 500 (Firestore limit)
    const batch = writeBatch(db);
    let batchCount = 0;
    
    for (const doc of rootSnapshot.docs) {
      batch.delete(doc.ref);
      batchCount++;
      
      if (batchCount === 500) {
        await batch.commit();
        batchCount = 0;
      }
    }
    
    // Commit remaining
    if (batchCount > 0) {
      await batch.commit();
    }
    
    console.log('✅ Root transactions cleanup completed');
    
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
    throw error;
  }
}

// Example usage
if (require.main === module) {
  (async () => {
    try {
      await migrateTransactionsToSubcollections();
      
      const isVerified = await verifyMigration();
      
      if (isVerified) {
        console.log('🎉 Migration completed and verified!');
        console.log('💡 You can now run cleanupRootTransactions() to remove duplicates');
      } else {
        console.log('⚠️ Migration verification failed - please check manually before cleanup');
      }
      
    } catch (error) {
      console.error('Migration process failed:', error);
    }
  })();
}
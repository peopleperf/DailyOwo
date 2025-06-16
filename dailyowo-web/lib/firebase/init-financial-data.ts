import { 
  collection, 
  doc, 
  setDoc, 
  addDoc,
  serverTimestamp,
  Timestamp,
  getDocs,
  query,
  limit
} from 'firebase/firestore';
import { getFirebaseDb } from './config';
import { Asset } from '@/types/asset';
import { Liability } from '@/types/liability';

/**
 * Initialize user's financial data from their onboarding profile
 * This creates initial assets and liabilities ONLY - no transactions
 * Onboarding data represents their current financial state, not transactions
 */
export async function initializeFinancialDataFromProfile(userId: string, profile: any): Promise<void> {
  const db = getFirebaseDb();
  if (!db) {
    console.warn('Firestore not initialized, skipping financial data initialization');
    return;
  }

  try {
    console.log('Initializing financial data for user:', userId);
    
    // Create initial asset if they have savings
    const currentSavings = typeof profile.currentSavings === 'string' 
      ? parseFloat(profile.currentSavings) 
      : profile.currentSavings;
      
    if (currentSavings && currentSavings > 0) {
      const asset: Omit<Asset, 'id'> = {
        name: 'Current Savings',
        type: 'cash',
        value: currentSavings,
        currency: profile.currency || 'USD',
        description: 'Initial savings balance from onboarding',
      };
      
      await addDoc(collection(db, 'users', userId, 'assets'), asset);
      console.log('Created initial savings asset');
    }
    
    // Create initial liability if they have debt
    const currentDebt = typeof profile.currentDebt === 'string' 
      ? parseFloat(profile.currentDebt) 
      : profile.currentDebt;
      
    if (currentDebt && currentDebt > 0) {
      const liability: Omit<Liability, 'id'> = {
        name: 'Current Debt',
        type: 'other',
        balance: currentDebt,
        currency: profile.currency || 'USD',
        interestRate: 0, // They can update this later
        minimumPayment: Math.max(50, currentDebt * 0.02), // 2% minimum or $50
        description: 'Initial debt balance from onboarding',
      };
      
      await addDoc(collection(db, 'users', userId, 'liabilities'), liability);
      console.log('Created initial debt liability');
    }
    
    console.log('Financial data initialization complete - assets and liabilities only');
  } catch (error) {
    console.error('Error initializing financial data:', error);
    // Don't throw - this is not critical for app functionality
  }
}

/**
 * Check if user has any financial data
 */
export async function hasFinancialData(userId: string): Promise<boolean> {
  const db = getFirebaseDb();
  if (!db) return false;
  
  try {
    const [transactionsSnap, assetsSnap, liabilitiesSnap] = await Promise.all([
      getDocs(query(collection(db, 'users', userId, 'transactions'), limit(1))),
      getDocs(query(collection(db, 'users', userId, 'assets'), limit(1))),
      getDocs(query(collection(db, 'users', userId, 'liabilities'), limit(1)))
    ]);
    
    return !transactionsSnap.empty || !assetsSnap.empty || !liabilitiesSnap.empty;
  } catch (error) {
    console.error('Error checking financial data:', error);
    return false;
  }
} 
import { db } from '@/lib/firebase/config';
import { doc, getDoc } from 'firebase/firestore';

/**
 * Get user's preferred locale from their profile or browser settings
 */
export async function getUserLocale(userId: string): Promise<string> {
  if (!db) {
    console.warn('Database not initialized, using default locale');
    return 'en';
  }
  
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    const userData = userDoc.data();
    
    // Check user preferences
    if (userData?.preferences?.locale) {
      return userData.preferences.locale;
    }
    
    // Check regional settings
    if (userData?.regionalSettings?.locale) {
      return userData.regionalSettings.locale;
    }
    
    // Fallback to browser locale or default
    if (typeof window !== 'undefined') {
      return navigator.language || 'en';
    }
    
    return 'en';
  } catch (error) {
    console.error('Error getting user locale:', error);
    return 'en';
  }
} 
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { getFirebaseDb } from './config';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  firstName?: string;
  lastName?: string;
  age?: number;
  bio?: string;
  onboardingCompleted?: boolean;
  passwordLastChanged: Date;
  twoFactorEnabled: boolean;
  profileCreated: Date;
  profileUpdated: Date;
}

class UserProfileService {
  /**
   * Get user profile with password metadata
   */
  async getUserProfile(uid: string): Promise<UserProfile | null> {
    const db = await getFirebaseDb();
    if (!db) throw new Error('Firestore not initialized');

    try {
      const docRef = doc(db, 'userProfiles', uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          uid,
          email: data.email,
          displayName: data.displayName,
          firstName: data.firstName,
          lastName: data.lastName,
          age: data.age,
          bio: data.bio,
          onboardingCompleted: data.onboardingCompleted || false,
          passwordLastChanged: data.passwordLastChanged?.toDate() || new Date(),
          twoFactorEnabled: data.twoFactorEnabled || false,
          profileCreated: data.profileCreated?.toDate() || new Date(),
          profileUpdated: data.profileUpdated?.toDate() || new Date(),
        };
      }

      return null;
    } catch (error) {
      console.error('Error getting user profile:', error);
      throw error;
    }
  }

  /**
   * Create initial user profile
   */
  async createUserProfile(uid: string, email: string, displayName: string): Promise<void> {
    const db = await getFirebaseDb();
    if (!db) throw new Error('Firestore not initialized');

    try {
      const now = serverTimestamp();
      const docRef = doc(db, 'userProfiles', uid);
      
      await setDoc(docRef, {
        uid,
        email,
        displayName,
        passwordLastChanged: now,
        twoFactorEnabled: false,
        profileCreated: now,
        profileUpdated: now,
      });
    } catch (error) {
      console.error('Error creating user profile:', error);
      throw error;
    }
  }

  /**
   * Update password change timestamp
   */
  async updatePasswordChanged(uid: string): Promise<void> {
    const db = await getFirebaseDb();
    if (!db) throw new Error('Firestore not initialized');

    try {
      const docRef = doc(db, 'userProfiles', uid);
      await updateDoc(docRef, {
        passwordLastChanged: serverTimestamp(),
        profileUpdated: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error updating password timestamp:', error);
      throw error;
    }
  }

  /**
   * Update 2FA status
   */
  async update2FAStatus(uid: string, enabled: boolean): Promise<void> {
    const db = await getFirebaseDb();
    if (!db) throw new Error('Firestore not initialized');

    try {
      const docRef = doc(db, 'userProfiles', uid);
      await updateDoc(docRef, {
        twoFactorEnabled: enabled,
        profileUpdated: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error updating 2FA status:', error);
      throw error;
    }
  }

  /**
   * Update user profile information
   */
  async updateUserProfile(uid: string, updates: Partial<UserProfile>): Promise<void> {
    const db = await getFirebaseDb();
    if (!db) throw new Error('Firestore not initialized');

    try {
      const docRef = doc(db, 'userProfiles', uid);
      await updateDoc(docRef, {
        ...updates,
        profileUpdated: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  }

  /**
   * Format relative time for password changes
   */
  formatPasswordAge(lastChanged: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - lastChanged.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);
    const diffWeeks = Math.floor(diffDays / 7);
    const diffMonths = Math.floor(diffDays / 30);

    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    if (diffWeeks < 4) return `${diffWeeks} week${diffWeeks > 1 ? 's' : ''} ago`;
    return `${diffMonths} month${diffMonths > 1 ? 's' : ''} ago`;
  }
}

// Export singleton instance
export const userProfileService = new UserProfileService();
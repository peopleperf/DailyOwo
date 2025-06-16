import { doc, setDoc, getDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { getFirebaseDb } from '@/lib/firebase/config';
import { sendEmail } from './email-service';

interface VerificationToken {
  token: string;
  userId: string;
  email: string;
  createdAt: any;
  expiresAt: Date;
  used: boolean;
}

/**
 * Custom email verification service using Resend
 * This replaces Firebase's built-in email verification
 */
export class CustomEmailVerificationService {
  private static readonly COLLECTION = 'emailVerificationTokens';
  private static readonly TOKEN_EXPIRY_HOURS = 24;

  /**
   * Generate and send verification email via Resend
   */
  static async sendVerificationEmail(userId: string, email: string, displayName?: string) {
    const db = getFirebaseDb();
    if (!db) throw new Error('Firestore not initialized');

    // Generate secure token using Web Crypto API (browser-compatible)
    const tokenArray = new Uint8Array(32);
    crypto.getRandomValues(tokenArray);
    const token = Array.from(tokenArray, byte => byte.toString(16).padStart(2, '0')).join('');
    const expiresAt = new Date(Date.now() + this.TOKEN_EXPIRY_HOURS * 60 * 60 * 1000);

    // Store token in Firestore
    const tokenData: VerificationToken = {
      token,
      userId,
      email,
      createdAt: serverTimestamp(),
      expiresAt,
      used: false
    };

    await setDoc(doc(db, this.COLLECTION, token), tokenData);

    // Generate verification link
    const verificationLink = `${process.env.NEXT_PUBLIC_APP_URL}/api/verify-email?token=${token}`;

    // Send email via Resend
    await sendEmail({
      to: email,
      subject: 'Verify your DailyOwo email address',
      template: 'verification',
      data: {
        userName: displayName || email.split('@')[0],
        verificationLink,
        expiryHours: this.TOKEN_EXPIRY_HOURS
      },
      userId
    });

    // Also send a welcome email after verification email
    try {
      await sendEmail({
        to: email,
        subject: 'Welcome to DailyOwo',
        template: 'welcome',
        data: {
          userName: displayName || email.split('@')[0],
        },
        userId
      });
    } catch (error) {
      console.warn('Failed to send welcome email:', error);
      // Don't fail if welcome email fails
    }

    return token;
  }

  /**
   * Verify email token
   */
  static async verifyEmail(token: string): Promise<{ success: boolean; userId?: string; error?: string }> {
    const db = getFirebaseDb();
    if (!db) throw new Error('Firestore not initialized');

    try {
      // Get token document
      const tokenDoc = await getDoc(doc(db, this.COLLECTION, token));
      
      if (!tokenDoc.exists()) {
        return { success: false, error: 'Invalid verification token' };
      }

      const tokenData = tokenDoc.data() as VerificationToken;

      // Check if token is already used
      if (tokenData.used) {
        return { success: false, error: 'This verification link has already been used' };
      }

      // Check if token is expired
      if (new Date() > new Date(tokenData.expiresAt)) {
        return { success: false, error: 'This verification link has expired' };
      }

      // Mark token as used
      await setDoc(doc(db, this.COLLECTION, token), { ...tokenData, used: true });

      // Update user's email verification status in your user profile
      // Note: This would need to be implemented since Firebase Auth won't know about this
      await this.updateUserEmailVerificationStatus(tokenData.userId, true);

      // Clean up the token
      await deleteDoc(doc(db, this.COLLECTION, token));

      return { success: true, userId: tokenData.userId };
    } catch (error) {
      console.error('Error verifying email:', error);
      return { success: false, error: 'Failed to verify email' };
    }
  }

  /**
   * Update user's email verification status
   * This would need to be integrated with your auth system
   */
  private static async updateUserEmailVerificationStatus(userId: string, verified: boolean) {
    const db = getFirebaseDb();
    if (!db) throw new Error('Firestore not initialized');

    await setDoc(doc(db, 'users', userId), {
      emailVerified: verified,
      emailVerifiedAt: verified ? serverTimestamp() : null
    }, { merge: true });
  }

  /**
   * Clean up expired tokens (run periodically)
   */
  static async cleanupExpiredTokens() {
    const db = getFirebaseDb();
    if (!db) return;

    // This would need to be implemented with a query to find expired tokens
    // Firebase doesn't support inequality queries on different fields easily
    // So this would typically be done via a Cloud Function
    console.log('Cleanup would be implemented via Cloud Function');
  }
} 
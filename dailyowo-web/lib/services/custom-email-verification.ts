import { doc, setDoc, getDoc, deleteDoc, serverTimestamp, Firestore } from 'firebase/firestore';
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
  private static db: Firestore;

  /**
   * Initialize Firestore connection
   */
  private static async ensureInitialized(): Promise<Firestore> {
    if (!this.db) {
      try {
        const db = await getFirebaseDb();
        if (!db) {
          throw new Error('Firestore not initialized');
        }
        this.db = db;
      } catch (error) {
        console.error('Firestore initialization error:', error);
        throw new Error('Failed to initialize Firestore - check Firebase configuration and internet connection');
      }
    }
    return this.db;
  }

  /**
   * Generate and send verification email via Resend
   */
  static async sendVerificationEmail(userId: string, email: string, displayName?: string) {
    const db = await this.ensureInitialized();

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
    const emailSent = await sendEmail({
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

    if (!emailSent) {
      throw new Error('Failed to send verification email');
    }

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
    try {
      console.log('Starting email verification for token:', token);
      const db = await this.ensureInitialized();

      // Get token document
      const tokenDoc = await getDoc(doc(db, this.COLLECTION, token));
      
      if (!tokenDoc.exists()) {
        console.error('Token verification failed - document not found:', token);
        return { success: false, error: 'Invalid verification token' };
      }

      const tokenData = tokenDoc.data() as VerificationToken;
      console.log('Token data retrieved:', {
        userId: tokenData.userId,
        email: tokenData.email,
        expiresAt: tokenData.expiresAt,
        used: tokenData.used
      });

      // Check if token is already used
      if (tokenData.used) {
        console.error('Token verification failed - already used:', token);
        return { success: false, error: 'This verification link has already been used' };
      }

      // Check if token is expired
      const now = new Date();
      const expiresAt = new Date(tokenData.expiresAt);
      if (now > expiresAt) {
        console.error('Token verification failed - expired:', {
          token,
          now,
          expiresAt,
          differenceHours: (now.getTime() - expiresAt.getTime()) / (1000 * 60 * 60)
        });
        return { success: false, error: 'This verification link has expired' };
      }

      // Mark token as used
      await setDoc(doc(db, this.COLLECTION, token), { ...tokenData, used: true });
      console.log('Token marked as used:', token);

      // Verify with Admin SDK
      const { auth } = await import('../firebase/firebaseAdmin');
      try {
        await auth.updateUser(tokenData.userId, { emailVerified: true });
        console.log('Admin SDK verified email for user:', tokenData.userId);
      } catch (error) {
        console.error('Admin SDK verification failed:', error);
        throw new Error('Failed to verify email with Firebase Auth');
      }

      // Clean up the token
      await deleteDoc(doc(db, this.COLLECTION, token));
      console.log('Token document deleted:', token);

      return { success: true, userId: tokenData.userId };
    } catch (error) {
      console.error('Error verifying email:', {
        token,
        error: error instanceof Error ? error.stack : error,
        timestamp: new Date().toISOString()
      });
      return {
        success: false,
        error: 'Failed to verify email - please try again or contact support'
      };
    }
  }

  /**
   * Update user's email verification status
   * This would need to be integrated with your auth system
   */
  private static async updateUserEmailVerificationStatus(userId: string, verified: boolean) {
    const db = await this.ensureInitialized();

    await setDoc(doc(db, 'users', userId), {
      emailVerified: verified,
      emailVerifiedAt: verified ? serverTimestamp() : null
    }, { merge: true });
  }

  /**
   * Clean up expired tokens (run periodically)
   */
  static async cleanupExpiredTokens() {
    const db = await getFirebaseDb();
    if (!db) return;

    // This would need to be implemented with a query to find expired tokens
    // Firebase doesn't support inequality queries on different fields easily
    // So this would typically be done via a Cloud Function
    console.log('Cleanup would be implemented via Cloud Function');
  }
}

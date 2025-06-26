import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  deleteDoc,
  Timestamp 
} from 'firebase/firestore';
import { getFirebaseDb } from './config';
import * as crypto from 'crypto';

export interface TwoFactorSettings {
  id: string;
  userId: string;
  isEnabled: boolean;
  secret: string;
  backupCodes: string[];
  createdAt: Date;
  lastUsed?: Date;
  method: 'totp' | 'sms';
  phoneNumber?: string;
}

export interface TwoFactorBackupCode {
  code: string;
  isUsed: boolean;
  usedAt?: Date;
}

class TwoFactorService {
  private db: any = null;

  constructor() {
    this.initializeDb();
  }

  private async initializeDb() {
    if (typeof window === 'undefined') return;
    this.db = await getFirebaseDb();
  }

  private async getDb() {
    if (!this.db) {
      await this.initializeDb();
    }
    return this.db;
  }

  // ============= TOTP FUNCTIONS =============

  /**
   * Generate a TOTP secret for the user
   */
  generateSecret(): string {
    const buffer = crypto.randomBytes(20);
    return this.base32Encode(buffer);
  }

  /**
   * Generate QR code URL for TOTP setup
   */
  generateQRCodeURL(userEmail: string, secret: string, issuer: string = 'DailyOwo'): string {
    const encodedSecret = encodeURIComponent(secret);
    const encodedIssuer = encodeURIComponent(issuer);
    const encodedEmail = encodeURIComponent(userEmail);
    
    return `otpauth://totp/${encodedIssuer}:${encodedEmail}?secret=${encodedSecret}&issuer=${encodedIssuer}`;
  }

  /**
   * Verify TOTP code with improved time sync handling
   */
  verifyTOTP(secret: string, token: string, window: number = 2): boolean {
    // Clean and validate the token
    const cleanToken = token.replace(/\s/g, '').trim();
    if (!/^\d{6}$/.test(cleanToken)) {
      console.warn('Invalid token format:', token);
      return false;
    }

    const timeStep = 30; // 30 seconds
    const currentTime = Math.floor(Date.now() / 1000);
    const timeCounter = Math.floor(currentTime / timeStep);

    console.log('TOTP Verification Debug:', {
      secret: secret.substring(0, 8) + '...',
      token: cleanToken,
      currentTime,
      timeCounter,
      window
    });

    // Check current time and ±window time steps (increased window during setup)
    for (let i = -window; i <= window; i++) {
      const testCounter = timeCounter + i;
      const expectedToken = this.generateHOTP(secret, testCounter);
      
      console.log(`Testing time window ${i}: expected=${expectedToken}, provided=${cleanToken}`);
      
      if (expectedToken === cleanToken) {
        console.log('TOTP verification successful at time window:', i);
        return true;
      }
    }

    console.warn('TOTP verification failed for all time windows');
    return false;
  }

  /**
   * Generate HOTP (HMAC-based One-Time Password)
   */
  private generateHOTP(secret: string, counter: number): string {
    const key = this.base32Decode(secret);
    const counterBuffer = Buffer.alloc(8);
    counterBuffer.writeUInt32BE(Math.floor(counter / 0x100000000), 0);
    counterBuffer.writeUInt32BE(counter & 0xffffffff, 4);

    const hmac = crypto.createHmac('sha1', key);
    hmac.update(counterBuffer);
    const digest = hmac.digest();

    const offset = digest[digest.length - 1] & 0xf;
    const code = ((digest[offset] & 0x7f) << 24) |
                 ((digest[offset + 1] & 0xff) << 16) |
                 ((digest[offset + 2] & 0xff) << 8) |
                 (digest[offset + 3] & 0xff);

    return (code % 1000000).toString().padStart(6, '0');
  }

  // ============= BACKUP CODES =============

  /**
   * Generate backup codes
   */
  generateBackupCodes(count: number = 10): string[] {
    const codes: string[] = [];
    
    for (let i = 0; i < count; i++) {
      const code = crypto.randomBytes(4).toString('hex').toUpperCase();
      const formattedCode = `${code.slice(0, 4)}-${code.slice(4, 8)}`;
      codes.push(formattedCode);
    }

    return codes;
  }

  // ============= DATABASE OPERATIONS =============

  /**
   * Setup 2FA for a user
   */
  async setup2FA(userId: string, userEmail: string): Promise<{ secret: string; qrCodeURL: string; backupCodes: string[] }> {
    const db = await this.getDb();
    if (!db) throw new Error('Database not initialized');

    const secret = this.generateSecret();
    const qrCodeURL = this.generateQRCodeURL(userEmail, secret);
    const backupCodes = this.generateBackupCodes();

    const twoFactorSettings: TwoFactorSettings = {
      id: `2fa-${userId}`,
      userId,
      isEnabled: false, // Will be enabled after verification
      secret,
      backupCodes,
      createdAt: new Date(),
      method: 'totp'
    };

    const settingsDoc = {
      ...twoFactorSettings,
      createdAt: Timestamp.fromDate(twoFactorSettings.createdAt)
    };

    await setDoc(doc(db, 'users', userId, 'security', '2fa'), settingsDoc);

    return {
      secret,
      qrCodeURL,
      backupCodes
    };
  }

  /**
   * Enable 2FA after verification
   */
  async enable2FA(userId: string, verificationCode: string): Promise<boolean> {
    const db = await this.getDb();
    if (!db) throw new Error('Database not initialized');

    const settings = await this.get2FASettings(userId);
    if (!settings) {
      throw new Error('2FA not set up');
    }

    // Verify the code
    const isValid = this.verifyTOTP(settings.secret, verificationCode);
    if (!isValid) {
      throw new Error('Invalid verification code');
    }

    // Enable 2FA
    await updateDoc(doc(db, 'users', userId, 'security', '2fa'), {
      isEnabled: true,
      lastUsed: Timestamp.fromDate(new Date())
    });

    return true;
  }

  /**
   * Disable 2FA
   */
  async disable2FA(userId: string, verificationCode: string): Promise<boolean> {
    const db = await this.getDb();
    if (!db) throw new Error('Database not initialized');

    const settings = await this.get2FASettings(userId);
    if (!settings) {
      throw new Error('2FA not set up');
    }

    // Verify the code or backup code
    const isValidTOTP = this.verifyTOTP(settings.secret, verificationCode);
    const isValidBackup = settings.backupCodes.includes(verificationCode);

    if (!isValidTOTP && !isValidBackup) {
      throw new Error('Invalid verification code');
    }

    // Disable 2FA by deleting the settings
    await deleteDoc(doc(db, 'users', userId, 'security', '2fa'));

    return true;
  }

  /**
   * Verify 2FA code
   */
  async verify2FACode(userId: string, code: string): Promise<boolean> {
    const db = await this.getDb();
    if (!db) throw new Error('Database not initialized');

    const settings = await this.get2FASettings(userId);
    if (!settings || !settings.isEnabled) {
      return false;
    }

    // Check TOTP first
    if (this.verifyTOTP(settings.secret, code)) {
      // Update last used
      await updateDoc(doc(db, 'users', userId, 'security', '2fa'), {
        lastUsed: Timestamp.fromDate(new Date())
      });
      return true;
    }

    // Check backup codes
    const backupCodeIndex = settings.backupCodes.indexOf(code);
    if (backupCodeIndex !== -1) {
      // Remove used backup code
      const updatedBackupCodes = settings.backupCodes.filter(c => c !== code);
      await updateDoc(doc(db, 'users', userId, 'security', '2fa'), {
        backupCodes: updatedBackupCodes,
        lastUsed: Timestamp.fromDate(new Date())
      });
      return true;
    }
    return false;
  }

  /**
   * Get 2FA settings for a user
   */
  async get2FASettings(userId: string): Promise<TwoFactorSettings | null> {
    const db = await this.getDb();
    if (!db) throw new Error('Database not initialized');

    const settingsDoc = await getDoc(doc(db, 'users', userId, 'security', '2fa'));
    
    if (!settingsDoc.exists()) {
      return null;
    }

    const data = settingsDoc.data();
    return {
      id: settingsDoc.id,
      userId: data.userId,
      isEnabled: data.isEnabled,
      secret: data.secret,
      backupCodes: data.backupCodes || [],
      createdAt: data.createdAt.toDate(),
      lastUsed: data.lastUsed?.toDate(),
      method: data.method || 'totp',
      phoneNumber: data.phoneNumber
    };
  }

  /**
   * Check if 2FA is enabled for a user
   */
  async is2FAEnabled(userId: string): Promise<boolean> {
    const settings = await this.get2FASettings(userId);
    return settings?.isEnabled || false;
  }

  /**
   * Generate new backup codes
   */
  async generateNewBackupCodes(userId: string, verificationCode: string): Promise<string[]> {
    const db = await this.getDb();
    if (!db) throw new Error('Database not initialized');

    const settings = await this.get2FASettings(userId);
    if (!settings || !settings.isEnabled) {
      throw new Error('2FA not enabled');
    }

    // Verify the code
    const isValid = this.verifyTOTP(settings.secret, verificationCode);
    if (!isValid) {
      throw new Error('Invalid verification code');
    }

    const newBackupCodes = this.generateBackupCodes();

    await updateDoc(doc(db, 'users', userId, 'security', '2fa'), {
      backupCodes: newBackupCodes
    });

    return newBackupCodes;
  }

  // ============= UTILITY FUNCTIONS =============

  /**
   * Base32 encode
   */
  private base32Encode(buffer: Buffer): string {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let result = '';
    let bits = 0;
    let value = 0;

    for (let i = 0; i < buffer.length; i++) {
      value = (value << 8) | buffer[i];
      bits += 8;

      while (bits >= 5) {
        result += alphabet[(value >>> (bits - 5)) & 31];
        bits -= 5;
      }
    }

    if (bits > 0) {
      result += alphabet[(value << (5 - bits)) & 31];
    }

    return result;
  }

  /**
   * Base32 decode
   */
  private base32Decode(encoded: string): Buffer {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    const cleanInput = encoded.replace(/[=]/g, '').toUpperCase();
    
    let bits = 0;
    let value = 0;
    const result: number[] = [];

    for (let i = 0; i < cleanInput.length; i++) {
      const index = alphabet.indexOf(cleanInput[i]);
      if (index === -1) {
        throw new Error('Invalid base32 character');
      }

      value = (value << 5) | index;
      bits += 5;

      if (bits >= 8) {
        result.push((value >>> (bits - 8)) & 255);
        bits -= 8;
      }
    }

    return Buffer.from(result);
  }

  /**
   * Format secret for display (with spaces every 4 characters)
   */
  formatSecret(secret: string): string {
    return secret.replace(/(.{4})/g, '$1 ').trim();
  }
}

export const twoFactorService = new TwoFactorService();
/**
 * Enhanced Key Management Service
 * Provides secure key rotation, derivation, and management for encryption
 */

import CryptoJS from 'crypto-js';

interface KeyMetadata {
  id: string;
  created: Date;
  algorithm: string;
  version: number;
  rotationDate?: Date;
  status: 'active' | 'rotating' | 'deprecated' | 'revoked';
}

interface DerivedKey {
  key: string;
  salt: string;
  iterations: number;
}

class KeyManagementService {
  private masterKey: string;
  private currentKeyId: string;
  private keyHistory: Map<string, KeyMetadata> = new Map();
  private readonly defaultIterations = 100000; // PBKDF2 iterations

  constructor() {
    this.masterKey = this.getMasterKey();
    this.currentKeyId = this.generateKeyId();
    this.initializeCurrentKey();
  }

  /**
   * Get master key from secure storage or environment
   */
  private getMasterKey(): string {
    // In production, this should come from:
    // 1. AWS KMS, Azure Key Vault, or Google Cloud KMS
    // 2. HashiCorp Vault
    // 3. Secure environment variables with proper access controls
    
    const key = process.env.ENCRYPTION_MASTER_KEY || 
                process.env.NEXT_PUBLIC_ENCRYPTION_KEY;
    
    if (!key) {
      console.warn('No master key found. Using generated key - NOT SECURE FOR PRODUCTION');
      // In production, this should throw an error
      return this.generateSecureKey();
    }
    
    // Validate key strength
    if (key.length < 32) {
      throw new Error('Master key must be at least 32 characters long');
    }
    
    return key;
  }

  /**
   * Generate a cryptographically secure key
   */
  private generateSecureKey(): string {
    return CryptoJS.lib.WordArray.random(256 / 8).toString();
  }

  /**
   * Generate a unique key ID
   */
  private generateKeyId(): string {
    return `key_${Date.now()}_${CryptoJS.lib.WordArray.random(64 / 8).toString().substr(0, 8)}`;
  }

  /**
   * Initialize the current key metadata
   */
  private initializeCurrentKey(): void {
    this.keyHistory.set(this.currentKeyId, {
      id: this.currentKeyId,
      created: new Date(),
      algorithm: 'AES-256',
      version: 1,
      status: 'active'
    });
  }

  /**
   * Derive encryption key using PBKDF2
   */
  deriveKey(purpose: string, salt?: string): DerivedKey {
    const actualSalt = salt || CryptoJS.lib.WordArray.random(128 / 8).toString();
    const iterations = this.defaultIterations;
    
    // Combine master key with purpose to create unique keys
    const keyMaterial = `${this.masterKey}:${purpose}:${this.currentKeyId}`;
    
    const derivedKey = CryptoJS.PBKDF2(keyMaterial, actualSalt, {
      keySize: 256 / 32,
      iterations: iterations
    }).toString();

    return {
      key: derivedKey,
      salt: actualSalt,
      iterations: iterations
    };
  }

  /**
   * Get encryption key for specific purpose
   */
  getEncryptionKey(purpose: 'transactions' | 'users' | 'accounts' | 'temporary' = 'transactions'): string {
    const derived = this.deriveKey(purpose);
    return derived.key;
  }

  /**
   * Encrypt data with purpose-specific key
   */
  encrypt(data: string, purpose: string = 'transactions'): {
    encrypted: string;
    keyId: string;
    salt: string;
  } {
    if (!data) return { encrypted: data, keyId: this.currentKeyId, salt: '' };
    
    try {
      const derived = this.deriveKey(purpose);
      const encrypted = CryptoJS.AES.encrypt(data, derived.key).toString();
      
      return {
        encrypted,
        keyId: this.currentKeyId,
        salt: derived.salt
      };
    } catch (error) {
      console.error('Encryption error:', error);
      throw new Error('Failed to encrypt data');
    }
  }

  /**
   * Decrypt data with specific key and salt
   */
  decrypt(encryptedData: string, keyId: string, salt: string, purpose: string = 'transactions'): string {
    if (!encryptedData) return encryptedData;
    
    try {
      // Check if key is still valid
      const keyMetadata = this.keyHistory.get(keyId);
      if (!keyMetadata) {
        throw new Error(`Key ${keyId} not found in key history`);
      }
      
      if (keyMetadata.status === 'revoked') {
        throw new Error(`Key ${keyId} has been revoked`);
      }
      
      // Derive the same key used for encryption
      const keyMaterial = `${this.masterKey}:${purpose}:${keyId}`;
      const derivedKey = CryptoJS.PBKDF2(keyMaterial, salt, {
        keySize: 256 / 32,
        iterations: this.defaultIterations
      }).toString();
      
      const decrypted = CryptoJS.AES.decrypt(encryptedData, derivedKey);
      return decrypted.toString(CryptoJS.enc.Utf8);
    } catch (error) {
      console.error('Decryption error:', error);
      throw new Error('Failed to decrypt data');
    }
  }

  /**
   * Rotate encryption keys
   */
  async rotateKeys(reason: string = 'scheduled_rotation'): Promise<string> {
    console.log(`[KeyManagement] Starting key rotation: ${reason}`);
    
    // Mark current key as rotating
    const currentKey = this.keyHistory.get(this.currentKeyId);
    if (currentKey) {
      currentKey.status = 'rotating';
      currentKey.rotationDate = new Date();
    }
    
    // Generate new key
    const newKeyId = this.generateKeyId();
    this.keyHistory.set(newKeyId, {
      id: newKeyId,
      created: new Date(),
      algorithm: 'AES-256',
      version: (currentKey?.version || 0) + 1,
      status: 'active'
    });
    
    // Update current key
    const oldKeyId = this.currentKeyId;
    this.currentKeyId = newKeyId;
    
    // Mark old key as deprecated (keep for decryption of old data)
    if (currentKey) {
      currentKey.status = 'deprecated';
    }
    
    console.log(`[KeyManagement] Key rotation completed: ${oldKeyId} -> ${newKeyId}`);
    return newKeyId;
  }

  /**
   * Re-encrypt data with new key during rotation
   */
  async reencryptData(
    encryptedData: string,
    oldKeyId: string,
    oldSalt: string,
    purpose: string = 'transactions'
  ): Promise<{
    encrypted: string;
    keyId: string;
    salt: string;
  }> {
    // Decrypt with old key
    const decrypted = this.decrypt(encryptedData, oldKeyId, oldSalt, purpose);
    
    // Encrypt with current key
    return this.encrypt(decrypted, purpose);
  }

  /**
   * Get key metadata
   */
  getKeyMetadata(keyId?: string): KeyMetadata | undefined {
    const id = keyId || this.currentKeyId;
    return this.keyHistory.get(id);
  }

  /**
   * List all keys with their status
   */
  listKeys(): KeyMetadata[] {
    return Array.from(this.keyHistory.values());
  }

  /**
   * Revoke a key (emergency use only)
   */
  revokeKey(keyId: string, reason: string): void {
    const key = this.keyHistory.get(keyId);
    if (key) {
      key.status = 'revoked';
      console.warn(`[KeyManagement] Key ${keyId} revoked: ${reason}`);
    }
  }

  /**
   * Validate encryption/decryption works correctly
   */
  validateEncryption(purpose: string = 'transactions'): boolean {
    try {
      const testData = 'test_encryption_validation_data';
      const encrypted = this.encrypt(testData, purpose);
      const decrypted = this.decrypt(encrypted.encrypted, encrypted.keyId, encrypted.salt, purpose);
      return decrypted === testData;
    } catch (error) {
      console.error('Encryption validation failed:', error);
      return false;
    }
  }

  /**
   * Generate hash for searchable encryption
   */
  generateSearchableHash(data: string, purpose: string = 'search'): string {
    if (!data) return data;
    
    // Use HMAC for searchable hashing to prevent rainbow table attacks
    const derived = this.deriveKey(purpose);
    return CryptoJS.HmacSHA256(data, derived.key).toString();
  }

  /**
   * Get key derivation info for audit purposes
   */
  getKeyDerivationInfo(): {
    currentKeyId: string;
    algorithm: string;
    iterations: number;
    totalKeys: number;
    activeKeys: number;
  } {
    const keys = this.listKeys();
    const activeKeys = keys.filter(k => k.status === 'active').length;
    
    return {
      currentKeyId: this.currentKeyId,
      algorithm: 'PBKDF2-SHA256',
      iterations: this.defaultIterations,
      totalKeys: keys.length,
      activeKeys
    };
  }

  /**
   * Check if key rotation is needed
   */
  needsRotation(maxAgeHours: number = 24 * 30): boolean { // Default: 30 days
    const currentKey = this.keyHistory.get(this.currentKeyId);
    if (!currentKey) return true;
    
    const ageMs = Date.now() - currentKey.created.getTime();
    const ageHours = ageMs / (1000 * 60 * 60);
    
    return ageHours > maxAgeHours;
  }

  /**
   * Clean up old deprecated keys (after data re-encryption)
   */
  cleanupOldKeys(retainCount: number = 3): number {
    const deprecatedKeys = this.listKeys()
      .filter(k => k.status === 'deprecated')
      .sort((a, b) => b.created.getTime() - a.created.getTime());
    
    const keysToRemove = deprecatedKeys.slice(retainCount);
    let removedCount = 0;
    
    keysToRemove.forEach(key => {
      this.keyHistory.delete(key.id);
      removedCount++;
    });
    
    if (removedCount > 0) {
      console.log(`[KeyManagement] Cleaned up ${removedCount} old keys`);
    }
    
    return removedCount;
  }
}

// Create singleton instance
export const keyManagementService = new KeyManagementService();

// Export types
export type { KeyMetadata, DerivedKey };

// Backward compatibility functions that use the key management service
export function encryptValue(value: string, purpose?: string): string {
  if (!value) return value;
  const result = keyManagementService.encrypt(value, purpose);
  // For backward compatibility, return just the encrypted value
  // In new implementations, store keyId and salt separately
  return result.encrypted;
}

export function decryptValue(encryptedValue: string, purpose?: string): string {
  if (!encryptedValue) return encryptedValue;
  // For backward compatibility, use current key
  const currentKeyId = keyManagementService.getKeyDerivationInfo().currentKeyId;
  const derived = keyManagementService.deriveKey(purpose || 'transactions');
  return keyManagementService.decrypt(encryptedValue, currentKeyId, derived.salt, purpose);
}

export function hashValue(value: string): string {
  if (!value) return value;
  return keyManagementService.generateSearchableHash(value);
}
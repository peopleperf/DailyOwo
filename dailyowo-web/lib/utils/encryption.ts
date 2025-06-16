import CryptoJS from 'crypto-js';

/**
 * Encryption utilities for sensitive financial data
 * Implements field-level encryption for PII and sensitive financial information
 */

// List of fields that should be encrypted
export const SENSITIVE_FIELDS = {
  transaction: ['accountNumber', 'routingNumber', 'cardNumber', 'notes'],
  bankAccount: ['accountNumber', 'routingNumber', 'loginCredentials'],
  investment: ['accountNumber', 'apiKey', 'apiSecret'],
  user: ['ssn', 'taxId', 'dob', 'phoneNumber'],
  income: ['employerTaxId', 'payrollId'],
} as const;

// Fields that contain amounts or sensitive numbers
export const AMOUNT_FIELDS = [
  'amount',
  'balance',
  'currentAmount',
  'targetAmount',
  'monthlyPayment',
  'interestRate',
  'principal',
  'netWorth',
  'totalAssets',
  'totalLiabilities',
];

/**
 * Get encryption key from environment or generate one
 * In production, this should come from a secure key management service
 */
function getEncryptionKey(): string {
  const key = process.env.NEXT_PUBLIC_ENCRYPTION_KEY || process.env.ENCRYPTION_KEY;
  
  if (!key) {
    console.warn('No encryption key found. Using default key - NOT SECURE FOR PRODUCTION');
    // In production, this should throw an error
    return 'DEFAULT_ENCRYPTION_KEY_CHANGE_IN_PRODUCTION';
  }
  
  return key;
}

/**
 * Encrypt a string value
 */
export function encryptValue(value: string): string {
  if (!value) return value;
  
  try {
    const key = getEncryptionKey();
    const encrypted = CryptoJS.AES.encrypt(value, key).toString();
    return encrypted;
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt data');
  }
}

/**
 * Decrypt a string value
 */
export function decryptValue(encryptedValue: string): string {
  if (!encryptedValue) return encryptedValue;
  
  try {
    const key = getEncryptionKey();
    const decrypted = CryptoJS.AES.decrypt(encryptedValue, key);
    return decrypted.toString(CryptoJS.enc.Utf8);
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt data');
  }
}

/**
 * Encrypt sensitive fields in an object
 */
export function encryptObject<T extends Record<string, any>>(
  obj: T,
  fieldsToEncrypt: readonly string[]
): T {
  const encrypted: any = { ...obj };
  
  for (const field of fieldsToEncrypt) {
    if (field in encrypted && encrypted[field]) {
      const value = encrypted[field];
      if (typeof value === 'string') {
        encrypted[field] = encryptValue(value);
      } else if (typeof value === 'number') {
        encrypted[field] = encryptValue(value.toString());
      }
    }
  }
  
  return encrypted as T;
}

/**
 * Decrypt sensitive fields in an object
 */
export function decryptObject<T extends Record<string, any>>(
  obj: T,
  fieldsToDecrypt: readonly string[]
): T {
  const decrypted: any = { ...obj };
  
  for (const field of fieldsToDecrypt) {
    if (field in decrypted && decrypted[field]) {
      try {
        const decryptedValue = decryptValue(decrypted[field]);
        // Try to parse back to number if it was originally a number
        if (AMOUNT_FIELDS.includes(field)) {
          const parsed = parseFloat(decryptedValue);
          decrypted[field] = isNaN(parsed) ? decryptedValue : parsed;
        } else {
          decrypted[field] = decryptedValue;
        }
      } catch (error) {
        console.error(`Failed to decrypt field ${field}:`, error);
        // Keep original value if decryption fails
      }
    }
  }
  
  return decrypted as T;
}

/**
 * Hash a value for searching (one-way encryption)
 * Used for creating searchable indexes of encrypted data
 */
export function hashValue(value: string): string {
  if (!value) return value;
  return CryptoJS.SHA256(value).toString();
}

/**
 * Create a masked version of sensitive data for display
 */
export function maskSensitiveData(value: string, type: 'account' | 'card' | 'ssn' | 'phone' | 'default' = 'default'): string {
  if (!value) return value;
  
  switch (type) {
    case 'account':
      // Show last 4 digits of account number
      return value.length > 4 ? `****${value.slice(-4)}` : '****';
    
    case 'card':
      // Show first 4 and last 4 digits
      if (value.length >= 8) {
        return `${value.slice(0, 4)} **** **** ${value.slice(-4)}`;
      }
      return '****';
    
    case 'ssn':
      // Show last 4 digits of SSN
      return value.length > 4 ? `***-**-${value.slice(-4)}` : '***-**-****';
    
    case 'phone':
      // Show area code and last 4 digits
      if (value.length >= 10) {
        return `(${value.slice(0, 3)}) ***-${value.slice(-4)}`;
      }
      return '(***) ***-****';
    
    default:
      // Show first and last character only
      if (value.length > 2) {
        return `${value[0]}${'*'.repeat(value.length - 2)}${value[value.length - 1]}`;
      }
      return '*'.repeat(value.length);
  }
}

/**
 * Encrypt data before storing in Firestore
 */
export function prepareForStorage<T extends Record<string, any>>(
  data: T,
  documentType: keyof typeof SENSITIVE_FIELDS
): T {
  const fieldsToEncrypt = SENSITIVE_FIELDS[documentType] || [];
  return encryptObject(data, fieldsToEncrypt);
}

/**
 * Decrypt data after retrieving from Firestore
 */
export function prepareForDisplay<T extends Record<string, any>>(
  data: T,
  documentType: keyof typeof SENSITIVE_FIELDS
): T {
  const fieldsToDecrypt = SENSITIVE_FIELDS[documentType] || [];
  return decryptObject(data, fieldsToDecrypt);
}

/**
 * Generate a secure random key for client-side use
 * This should only be used for temporary encryption, not for persistent storage
 */
export function generateTemporaryKey(): string {
  return CryptoJS.lib.WordArray.random(256 / 8).toString();
}

/**
 * Validate that encryption is properly configured
 */
export function validateEncryption(): boolean {
  try {
    const testValue = 'test_encryption_value';
    const encrypted = encryptValue(testValue);
    const decrypted = decryptValue(encrypted);
    return decrypted === testValue;
  } catch (error) {
    console.error('Encryption validation failed:', error);
    return false;
  }
}

/**
 * Encrypt an entire document for backup/export
 */
export function encryptDocument(document: any): string {
  const jsonString = JSON.stringify(document);
  return encryptValue(jsonString);
}

/**
 * Decrypt an entire document from backup/import
 */
export function decryptDocument(encryptedDocument: string): any {
  const decrypted = decryptValue(encryptedDocument);
  return JSON.parse(decrypted);
} 
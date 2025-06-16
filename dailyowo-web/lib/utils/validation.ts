/**
 * Comprehensive validation utilities for DailyOwo
 * Handles sanitization and validation for all input types
 */

// Email validation with international support
export const validateEmail = (email: string): { isValid: boolean; error?: string } => {
  const trimmed = email.trim().toLowerCase();
  
  if (!trimmed) {
    return { isValid: false, error: 'Email is required' };
  }
  
  // RFC 5322 compliant email regex
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  
  if (!emailRegex.test(trimmed)) {
    return { isValid: false, error: 'Please enter a valid email address' };
  }
  
  if (trimmed.length > 254) {
    return { isValid: false, error: 'Email address is too long' };
  }
  
  return { isValid: true };
};

// Password validation with security requirements
export const validatePassword = (password: string): { isValid: boolean; error?: string; strength?: number } => {
  if (!password) {
    return { isValid: false, error: 'Password is required' };
  }
  
  if (password.length < 8) {
    return { isValid: false, error: 'Password must be at least 8 characters' };
  }
  
  if (password.length > 128) {
    return { isValid: false, error: 'Password is too long' };
  }
  
  // Calculate password strength
  let strength = 0;
  if (password.length >= 12) strength++;
  if (/[a-z]/.test(password)) strength++;
  if (/[A-Z]/.test(password)) strength++;
  if (/[0-9]/.test(password)) strength++;
  if (/[^A-Za-z0-9]/.test(password)) strength++;
  
  // For financial app, require at least medium strength
  if (strength < 3) {
    return { 
      isValid: false, 
      error: 'Password must contain at least 3 of: lowercase, uppercase, numbers, special characters',
      strength 
    };
  }
  
  return { isValid: true, strength };
};

// Name validation (for display names, etc.)
export const validateName = (name: string): { isValid: boolean; error?: string } => {
  const trimmed = name.trim();
  
  if (!trimmed) {
    return { isValid: false, error: 'Name is required' };
  }
  
  if (trimmed.length < 2) {
    return { isValid: false, error: 'Name must be at least 2 characters' };
  }
  
  if (trimmed.length > 50) {
    return { isValid: false, error: 'Name is too long (max 50 characters)' };
  }
  
  // Allow letters, spaces, hyphens, apostrophes (for international names)
  const nameRegex = /^[a-zA-ZÀ-ÿĀ-žА-я\s\-']+$/;
  if (!nameRegex.test(trimmed)) {
    return { isValid: false, error: 'Name contains invalid characters' };
  }
  
  return { isValid: true };
};

// Currency amount validation
export const validateAmount = (amount: string | number): { isValid: boolean; error?: string; value?: number } => {
  // Convert to string for processing
  const amountStr = String(amount).trim();
  
  if (!amountStr || amountStr === '0') {
    return { isValid: false, error: 'Amount must be greater than 0' };
  }
  
  // Remove currency symbols and spaces
  const cleanAmount = amountStr.replace(/[₦€$£¥₹,\s]/g, '');
  
  // Check if valid number
  const numAmount = parseFloat(cleanAmount);
  if (isNaN(numAmount)) {
    return { isValid: false, error: 'Please enter a valid amount' };
  }
  
  // Check reasonable limits
  if (numAmount < 0.01) {
    return { isValid: false, error: 'Amount must be at least 0.01' };
  }
  
  if (numAmount > 999999999.99) {
    return { isValid: false, error: 'Amount is too large' };
  }
  
  // Check decimal places (max 2 for currency)
  const decimalPlaces = (cleanAmount.split('.')[1] || '').length;
  if (decimalPlaces > 2) {
    return { isValid: false, error: 'Maximum 2 decimal places allowed' };
  }
  
  return { isValid: true, value: numAmount };
};

// Transaction description validation
export const validateDescription = (description: string): { isValid: boolean; error?: string; sanitized?: string } => {
  const trimmed = description.trim();
  
  if (!trimmed) {
    return { isValid: false, error: 'Description is required' };
  }
  
  if (trimmed.length < 2) {
    return { isValid: false, error: 'Description too short (min 2 characters)' };
  }
  
  if (trimmed.length > 200) {
    return { isValid: false, error: 'Description too long (max 200 characters)' };
  }
  
  // Sanitize HTML and script tags
  const sanitized = trimmed
    .replace(/<[^>]*>?/gm, '') // Remove HTML tags
    .replace(/[<>]/g, '') // Remove < > characters
    .trim();
  
  return { isValid: true, sanitized };
};

// Sanitize input for XSS prevention
export const sanitizeInput = (input: string): string => {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential XSS characters
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, ''); // Remove event handlers
}; 
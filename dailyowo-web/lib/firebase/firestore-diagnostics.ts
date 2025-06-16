import { Firestore } from 'firebase/firestore';

interface FirestoreError {
  timestamp: number;
  errorCode: string;
  errorMessage: string;
  stackTrace?: string;
  context?: any;
}

class FirestoreDiagnostics {
  private errors: FirestoreError[] = [];
  private maxErrors = 100;
  private errorPatterns = new Map<string, number>();
  private lastRecoveryAttempt = 0;
  private recoveryAttempts = 0;
  
  logError(error: any) {
    const errorEntry: FirestoreError = {
      timestamp: Date.now(),
      errorCode: error.code || 'UNKNOWN',
      errorMessage: error.message || String(error),
      stackTrace: error.stack,
      context: error.context
    };
    
    // Add to error list
    this.errors.push(errorEntry);
    if (this.errors.length > this.maxErrors) {
      this.errors.shift();
    }
    
    // Track error patterns
    const pattern = this.getErrorPattern(errorEntry);
    this.errorPatterns.set(pattern, (this.errorPatterns.get(pattern) || 0) + 1);
    
    // Check if we need recovery
    if (this.shouldAttemptRecovery()) {
      this.attemptRecovery();
    }
  }
  
  private getErrorPattern(error: FirestoreError): string {
    // Extract pattern from error message
    if (error.errorMessage.includes('INTERNAL ASSERTION FAILED')) {
      const match = error.errorMessage.match(/\(ID: ([^)]+)\)/);
      return `INTERNAL_ASSERTION_${match?.[1] || 'UNKNOWN'}`;
    }
    
    // Track "Target ID already exists" errors
    if (error.errorMessage.includes('Target ID already exists')) {
      const match = error.errorMessage.match(/Target ID already exists: (\d+)/);
      return `TARGET_ID_EXISTS_${match?.[1] || 'UNKNOWN'}`;
    }
    
    return error.errorCode;
  }
  
  private shouldAttemptRecovery(): boolean {
    const now = Date.now();
    const timeSinceLastRecovery = now - this.lastRecoveryAttempt;
    
    // Don't attempt recovery too frequently
    if (timeSinceLastRecovery < 30000) return false;
    
    // Check if we have repeating internal errors
    const internalErrors = Array.from(this.errorPatterns.entries())
      .filter(([pattern]) => pattern.startsWith('INTERNAL_ASSERTION'))
      .reduce((sum, [, count]) => sum + count, 0);
    
    return internalErrors > 5;
  }
  
  private attemptRecovery() {
    this.lastRecoveryAttempt = Date.now();
    this.recoveryAttempts++;
    
    console.log('[FirestoreDiagnostics] Attempting recovery...', {
      attemptNumber: this.recoveryAttempts,
      errorPatterns: Object.fromEntries(this.errorPatterns)
    });
    
    // Signal that recovery is needed
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('firestore-recovery-needed', {
        detail: {
          errors: this.getRecentErrors(),
          patterns: Object.fromEntries(this.errorPatterns),
          attemptNumber: this.recoveryAttempts
        }
      }));
    }
  }
  
  getRecentErrors(count = 10): FirestoreError[] {
    return this.errors.slice(-count);
  }
  
  getErrorSummary() {
    const summary = {
      totalErrors: this.errors.length,
      errorPatterns: Object.fromEntries(this.errorPatterns),
      recentErrors: this.getRecentErrors(5),
      recoveryAttempts: this.recoveryAttempts,
      lastRecoveryAttempt: this.lastRecoveryAttempt
    };
    
    return summary;
  }
  
  clearErrors() {
    this.errors = [];
    this.errorPatterns.clear();
  }
  
  isFirestoreHealthy(): boolean {
    // Check if we've had recent errors
    const recentErrorCount = this.errors.filter(
      e => Date.now() - e.timestamp < 60000 // errors in last minute
    ).length;
    
    return recentErrorCount < 3;
  }
}

// Export singleton instance
export const firestoreDiagnostics = new FirestoreDiagnostics();

// Helper to wrap Firestore operations with diagnostics
export function withDiagnostics<T>(
  operation: () => Promise<T>,
  operationName: string
): Promise<T> {
  return operation().catch(error => {
    console.error(`[Firestore] ${operationName} failed:`, error);
    firestoreDiagnostics.logError({
      ...error,
      context: { operation: operationName }
    });
    throw error;
  });
} 
/**
 * Transaction Audit Trail System
 * Tracks all changes to transactions for data integrity and compliance
 */

import { Transaction } from '@/types/transaction';

export interface AuditEntry {
  id: string;
  timestamp: Date;
  userId: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'RESTORE';
  transactionId: string;
  changes?: ChangeRecord[];
  metadata?: {
    ip?: string;
    userAgent?: string;
    source?: string;
    reason?: string;
  };
  previousState?: Partial<Transaction>;
  newState?: Partial<Transaction>;
}

export interface ChangeRecord {
  field: string;
  oldValue: any;
  newValue: any;
}

export interface AuditSummary {
  totalChanges: number;
  changesByAction: Record<string, number>;
  changesByUser: Record<string, number>;
  recentChanges: AuditEntry[];
  suspiciousActivity: string[];
}

export interface TransactionSnapshot {
  id: string;
  snapshotDate: Date;
  transactions: Transaction[];
  metadata: {
    totalCount: number;
    totalIncome: number;
    totalExpenses: number;
    totalAssets: number;
    totalLiabilities: number;
    checksum: string;
  };
}

/**
 * Create an audit entry for a transaction action
 */
export function createAuditEntry(
  action: AuditEntry['action'],
  userId: string,
  transactionId: string,
  options?: {
    previousState?: Partial<Transaction>;
    newState?: Partial<Transaction>;
    metadata?: AuditEntry['metadata'];
  }
): AuditEntry {
  const entry: AuditEntry = {
    id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date(),
    userId,
    action,
    transactionId,
    metadata: options?.metadata,
  };

  // Calculate changes for updates
  if (action === 'UPDATE' && options?.previousState && options?.newState) {
    entry.changes = calculateChanges(options.previousState, options.newState);
    entry.previousState = options.previousState;
    entry.newState = options.newState;
  } else if (action === 'CREATE' && options?.newState) {
    entry.newState = options.newState;
  } else if (action === 'DELETE' && options?.previousState) {
    entry.previousState = options.previousState;
  }

  return entry;
}

/**
 * Calculate field-level changes between two transaction states
 */
export function calculateChanges(
  previousState: Partial<Transaction>,
  newState: Partial<Transaction>
): ChangeRecord[] {
  const changes: ChangeRecord[] = [];
  const allKeys = new Set([
    ...Object.keys(previousState),
    ...Object.keys(newState)
  ]);

  allKeys.forEach(field => {
    const oldValue = (previousState as any)[field];
    const newValue = (newState as any)[field];

    // Deep comparison for objects
    if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
      changes.push({
        field,
        oldValue,
        newValue
      });
    }
  });

  return changes;
}

/**
 * Verify transaction integrity using checksums
 */
export function calculateTransactionChecksum(transaction: Transaction): string {
  // Create a deterministic string representation
  const checksumData = [
    transaction.id,
    transaction.type,
    transaction.amount.toFixed(2),
    transaction.categoryId,
    transaction.date instanceof Date ? transaction.date.toISOString() : transaction.date,
    transaction.description
  ].join('|');

  // Simple checksum using base64 encoding
  return btoa(checksumData).substring(0, 16);
}

/**
 * Verify a collection of transactions
 */
export function verifyTransactionIntegrity(
  transactions: Transaction[],
  expectedChecksum?: string
): {
  isValid: boolean;
  actualChecksum: string;
  issues: string[];
} {
  const issues: string[] = [];
  
  // Check for duplicate IDs
  const idSet = new Set<string>();
  transactions.forEach(t => {
    if (idSet.has(t.id)) {
      issues.push(`Duplicate transaction ID found: ${t.id}`);
    }
    idSet.add(t.id);
  });

  // Calculate collection checksum
  const sortedTransactions = [...transactions].sort((a, b) => a.id.localeCompare(b.id));
  const collectionString = sortedTransactions
    .map(t => calculateTransactionChecksum(t))
    .join('');
  const actualChecksum = btoa(collectionString).substring(0, 32);

  // Verify against expected checksum if provided
  const isValid = !expectedChecksum || actualChecksum === expectedChecksum;
  if (!isValid) {
    issues.push('Checksum mismatch - data may have been tampered with');
  }

  return {
    isValid: isValid && issues.length === 0,
    actualChecksum,
    issues
  };
}

/**
 * Create a snapshot of current transaction state
 */
export function createTransactionSnapshot(
  transactions: Transaction[]
): TransactionSnapshot {
  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalAssets = transactions
    .filter(t => t.type === 'asset')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalLiabilities = transactions
    .filter(t => t.type === 'liability')
    .reduce((sum, t) => sum + t.amount, 0);

  const integrity = verifyTransactionIntegrity(transactions);

  return {
    id: `snapshot_${Date.now()}`,
    snapshotDate: new Date(),
    transactions: [...transactions], // Deep copy
    metadata: {
      totalCount: transactions.length,
      totalIncome,
      totalExpenses,
      totalAssets,
      totalLiabilities,
      checksum: integrity.actualChecksum
    }
  };
}

/**
 * Detect suspicious patterns in audit trail
 */
export function detectSuspiciousActivity(
  auditEntries: AuditEntry[],
  timeWindowMs: number = 3600000 // 1 hour
): string[] {
  const suspiciousPatterns: string[] = [];
  const now = Date.now();

  // Group by user
  const entriesByUser = new Map<string, AuditEntry[]>();
  auditEntries.forEach(entry => {
    if (!entriesByUser.has(entry.userId)) {
      entriesByUser.set(entry.userId, []);
    }
    entriesByUser.get(entry.userId)!.push(entry);
  });

  // Check each user's activity
  entriesByUser.forEach((userEntries, userId) => {
    // Sort by timestamp
    const sorted = userEntries.sort((a, b) => 
      a.timestamp.getTime() - b.timestamp.getTime()
    );

    // Check for rapid deletions
    const recentDeletions = sorted.filter(e => 
      e.action === 'DELETE' && 
      (now - e.timestamp.getTime()) < timeWindowMs
    );

    if (recentDeletions.length >= 5) {
      suspiciousPatterns.push(
        `User ${userId} deleted ${recentDeletions.length} transactions in the last hour`
      );
    }

    // Check for bulk updates
    const recentUpdates = sorted.filter(e => 
      e.action === 'UPDATE' && 
      (now - e.timestamp.getTime()) < timeWindowMs
    );

    if (recentUpdates.length >= 10) {
      suspiciousPatterns.push(
        `User ${userId} updated ${recentUpdates.length} transactions in the last hour`
      );
    }

    // Check for amount changes
    const amountChanges = sorted.filter(e => 
      e.action === 'UPDATE' && 
      e.changes?.some(c => c.field === 'amount')
    );

    if (amountChanges.length >= 3) {
      const totalChange = amountChanges.reduce((sum, entry) => {
        const change = entry.changes?.find(c => c.field === 'amount');
        if (change) {
          return sum + (change.newValue - change.oldValue);
        }
        return sum;
      }, 0);

      if (Math.abs(totalChange) > 10000) {
        suspiciousPatterns.push(
          `User ${userId} changed transaction amounts by ${totalChange.toFixed(2)} in total`
        );
      }
    }
  });

  return suspiciousPatterns;
}

/**
 * Generate audit summary
 */
export function generateAuditSummary(
  auditEntries: AuditEntry[],
  limit: number = 10
): AuditSummary {
  const changesByAction: Record<string, number> = {};
  const changesByUser: Record<string, number> = {};

  auditEntries.forEach(entry => {
    // Count by action
    changesByAction[entry.action] = (changesByAction[entry.action] || 0) + 1;

    // Count by user
    changesByUser[entry.userId] = (changesByUser[entry.userId] || 0) + 1;
  });

  // Get recent changes
  const recentChanges = [...auditEntries]
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    .slice(0, limit);

  // Detect suspicious activity
  const suspiciousActivity = detectSuspiciousActivity(auditEntries);

  return {
    totalChanges: auditEntries.length,
    changesByAction,
    changesByUser,
    recentChanges,
    suspiciousActivity
  };
}

/**
 * Export audit trail to CSV format
 */
export function exportAuditTrailToCSV(auditEntries: AuditEntry[]): string {
  const headers = [
    'Timestamp',
    'User ID',
    'Action',
    'Transaction ID',
    'Changes',
    'IP Address',
    'Source'
  ];

  const rows = auditEntries.map(entry => {
    const changes = entry.changes
      ? entry.changes.map(c => `${c.field}: ${c.oldValue} → ${c.newValue}`).join('; ')
      : '';

    return [
      entry.timestamp.toISOString(),
      entry.userId,
      entry.action,
      entry.transactionId,
      changes,
      entry.metadata?.ip || '',
      entry.metadata?.source || ''
    ];
  });

  // Create CSV content
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');

  return csvContent;
} 
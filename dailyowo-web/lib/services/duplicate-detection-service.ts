/**
 * Enhanced Duplicate Detection Service
 * Intelligently detects and prevents duplicate transactions with configurable rules
 */

import { Transaction } from '@/types/transaction';
import { getUserTransactions } from '@/services/transaction-service';
import { storeAuditEntry } from '@/lib/services/audit-storage-service';
import { createAuditEntry } from '@/lib/utils/transaction-audit';

interface DuplicateMatch {
  transactionId: string;
  score: number; // 0-100, higher = more likely duplicate
  reasons: string[];
  transaction: Transaction;
}

interface DuplicateDetectionResult {
  isDuplicate: boolean;
  confidence: number; // 0-100
  matches: DuplicateMatch[];
  suggestion: 'block' | 'warn' | 'allow';
  reasons: string[];
}

interface DuplicateDetectionOptions {
  timeWindowHours?: number; // How far back to check (default: 24 hours)
  amountTolerance?: number; // Percentage tolerance for amount differences (default: 0%)
  enableFuzzyMatching?: boolean; // Enable fuzzy description matching (default: true)
  minimumScore?: number; // Minimum score to consider a duplicate (default: 75)
  strictMode?: boolean; // Strict mode requires exact matches (default: false)
}

interface DuplicateRule {
  name: string;
  weight: number; // How much this rule contributes to the score
  check: (transaction1: Transaction, transaction2: Transaction) => {
    matches: boolean;
    score: number;
    reason?: string;
  };
}

class DuplicateDetectionService {
  private defaultOptions: Required<DuplicateDetectionOptions> = {
    timeWindowHours: 24,
    amountTolerance: 0,
    enableFuzzyMatching: true,
    minimumScore: 75,
    strictMode: false
  };

  private rules: DuplicateRule[] = [
    {
      name: 'exact_amount',
      weight: 30,
      check: (t1, t2) => {
        const matches = Math.abs(t1.amount - t2.amount) < 0.01;
        return {
          matches,
          score: matches ? 30 : 0,
          reason: matches ? 'Exact amount match' : undefined
        };
      }
    },
    {
      name: 'similar_amount',
      weight: 20,
      check: (t1, t2) => {
        const diff = Math.abs(t1.amount - t2.amount);
        const avgAmount = (t1.amount + t2.amount) / 2;
        const percentDiff = (diff / avgAmount) * 100;
        
        if (percentDiff <= 1) {
          return { matches: true, score: 20, reason: 'Very similar amount (within 1%)' };
        } else if (percentDiff <= 5) {
          return { matches: true, score: 15, reason: 'Similar amount (within 5%)' };
        }
        
        return { matches: false, score: 0 };
      }
    },
    {
      name: 'same_category',
      weight: 15,
      check: (t1, t2) => {
        const matches = t1.categoryId === t2.categoryId;
        return {
          matches,
          score: matches ? 15 : 0,
          reason: matches ? 'Same category' : undefined
        };
      }
    },
    {
      name: 'same_merchant',
      weight: 25,
      check: (t1, t2) => {
        if (!t1.merchant || !t2.merchant) {
          return { matches: false, score: 0 };
        }
        
        const matches = t1.merchant.toLowerCase() === t2.merchant.toLowerCase();
        return {
          matches,
          score: matches ? 25 : 0,
          reason: matches ? 'Same merchant' : undefined
        };
      }
    },
    {
      name: 'similar_description',
      weight: 20,
      check: (t1, t2) => {
        const desc1 = t1.description.toLowerCase().trim();
        const desc2 = t2.description.toLowerCase().trim();
        
        // Exact match
        if (desc1 === desc2) {
          return { matches: true, score: 20, reason: 'Exact description match' };
        }
        
        // Fuzzy matching using Levenshtein distance
        const similarity = this.calculateStringSimilarity(desc1, desc2);
        
        if (similarity >= 0.9) {
          return { matches: true, score: 18, reason: 'Very similar description (90%+)' };
        } else if (similarity >= 0.8) {
          return { matches: true, score: 15, reason: 'Similar description (80%+)' };
        } else if (similarity >= 0.7) {
          return { matches: true, score: 10, reason: 'Somewhat similar description (70%+)' };
        }
        
        return { matches: false, score: 0 };
      }
    },
    {
      name: 'same_payment_method',
      weight: 10,
      check: (t1, t2) => {
        if (!t1.paymentMethod || !t2.paymentMethod) {
          return { matches: false, score: 0 };
        }
        
        const matches = t1.paymentMethod === t2.paymentMethod;
        return {
          matches,
          score: matches ? 10 : 0,
          reason: matches ? 'Same payment method' : undefined
        };
      }
    },
    {
      name: 'same_location',
      weight: 15,
      check: (t1, t2) => {
        if (!t1.location?.name || !t2.location?.name) {
          return { matches: false, score: 0 };
        }
        
        const matches = t1.location.name.toLowerCase() === t2.location.name.toLowerCase();
        return {
          matches,
          score: matches ? 15 : 0,
          reason: matches ? 'Same location' : undefined
        };
      }
    },
    {
      name: 'close_time',
      weight: 10,
      check: (t1, t2) => {
        const timeDiff = Math.abs(t1.date.getTime() - t2.date.getTime());
        const minutesDiff = timeDiff / (1000 * 60);
        
        if (minutesDiff <= 5) {
          return { matches: true, score: 10, reason: 'Very close time (within 5 minutes)' };
        } else if (minutesDiff <= 30) {
          return { matches: true, score: 8, reason: 'Close time (within 30 minutes)' };
        } else if (minutesDiff <= 120) {
          return { matches: true, score: 5, reason: 'Somewhat close time (within 2 hours)' };
        }
        
        return { matches: false, score: 0 };
      }
    }
  ];

  /**
   * Detect potential duplicates for a new transaction
   */
  async detectDuplicates(
    newTransaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>,
    options?: DuplicateDetectionOptions
  ): Promise<DuplicateDetectionResult> {
    const opts = { ...this.defaultOptions, ...options };
    
    try {
      // Get existing transactions within the time window
      const endDate = new Date(newTransaction.date);
      const startDate = new Date(endDate.getTime() - (opts.timeWindowHours * 60 * 60 * 1000));
      
      const existingTransactions = await getUserTransactions(newTransaction.userId, {
        startDate,
        endDate,
        type: newTransaction.type
      });

      // Filter out transactions that are too different in amount (if tolerance is set)
      const candidateTransactions = existingTransactions.filter(t => {
        if (opts.amountTolerance === 0) return true;
        
        const amountDiff = Math.abs(t.amount - newTransaction.amount);
        const tolerance = newTransaction.amount * (opts.amountTolerance / 100);
        return amountDiff <= tolerance;
      });

      // Check each candidate transaction against the rules
      const matches: DuplicateMatch[] = [];

      for (const candidate of candidateTransactions) {
        const matchResult = this.evaluateTransactionMatch(
          newTransaction as Transaction,
          candidate,
          opts
        );

        if (matchResult.score >= opts.minimumScore) {
          matches.push({
            transactionId: candidate.id,
            score: matchResult.score,
            reasons: matchResult.reasons,
            transaction: candidate
          });
        }
      }

      // Sort matches by score (highest first)
      matches.sort((a, b) => b.score - a.score);

      // Determine overall result
      const highestScore = matches.length > 0 ? matches[0].score : 0;
      const isDuplicate = highestScore >= opts.minimumScore;
      
      let suggestion: 'block' | 'warn' | 'allow' = 'allow';
      if (highestScore >= 90) {
        suggestion = 'block';
      } else if (highestScore >= opts.minimumScore) {
        suggestion = 'warn';
      }

      const result: DuplicateDetectionResult = {
        isDuplicate,
        confidence: highestScore,
        matches: matches.slice(0, 5), // Return top 5 matches
        suggestion,
        reasons: matches.length > 0 ? matches[0].reasons : []
      };

      // Audit the duplicate detection
      await this.auditDuplicateCheck(newTransaction, result);

      return result;
    } catch (error) {
      console.error('[DuplicateDetection] Error detecting duplicates:', error);
      
      // Return safe default on error
      return {
        isDuplicate: false,
        confidence: 0,
        matches: [],
        suggestion: 'allow',
        reasons: ['Error during duplicate detection']
      };
    }
  }

  /**
   * Evaluate how well two transactions match
   */
  private evaluateTransactionMatch(
    transaction1: Transaction,
    transaction2: Transaction,
    options: Required<DuplicateDetectionOptions>
  ): { score: number; reasons: string[] } {
    let totalScore = 0;
    const reasons: string[] = [];

    for (const rule of this.rules) {
      // Skip fuzzy matching rules if disabled
      if (!options.enableFuzzyMatching && rule.name === 'similar_description') {
        continue;
      }

      const result = rule.check(transaction1, transaction2);
      
      if (result.matches) {
        totalScore += result.score;
        if (result.reason) {
          reasons.push(result.reason);
        }
      }
    }

    // In strict mode, require certain exact matches
    if (options.strictMode) {
      const hasExactAmount = Math.abs(transaction1.amount - transaction2.amount) < 0.01;
      const hasSameCategory = transaction1.categoryId === transaction2.categoryId;
      
      if (!hasExactAmount || !hasSameCategory) {
        totalScore = Math.min(totalScore, 50); // Cap score in strict mode
      }
    }

    return { score: Math.min(totalScore, 100), reasons };
  }

  /**
   * Calculate string similarity using Levenshtein distance
   */
  private calculateStringSimilarity(str1: string, str2: string): number {
    if (str1 === str2) return 1;
    if (str1.length === 0 || str2.length === 0) return 0;

    const matrix = Array(str2.length + 1).fill(null).map(() => 
      Array(str1.length + 1).fill(null)
    );

    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;

    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,     // deletion
          matrix[j - 1][i] + 1,     // insertion
          matrix[j - 1][i - 1] + cost // substitution
        );
      }
    }

    const maxLength = Math.max(str1.length, str2.length);
    return (maxLength - matrix[str2.length][str1.length]) / maxLength;
  }

  /**
   * Check for duplicates with flexible criteria
   */
  async findPotentialDuplicates(
    userId: string,
    timeWindowDays: number = 30,
    minimumScore: number = 70
  ): Promise<Array<{
    original: Transaction;
    duplicates: DuplicateMatch[];
  }>> {
    try {
      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - (timeWindowDays * 24 * 60 * 60 * 1000));
      
      const transactions = await getUserTransactions(userId, {
        startDate,
        endDate
      });

      const potentialDuplicates: Array<{
        original: Transaction;
        duplicates: DuplicateMatch[];
      }> = [];

      // Compare each transaction with others
      for (let i = 0; i < transactions.length; i++) {
        const current = transactions[i];
        const matches: DuplicateMatch[] = [];

        for (let j = i + 1; j < transactions.length; j++) {
          const candidate = transactions[j];
          
          // Skip if transactions are too far apart in time
          const timeDiff = Math.abs(current.date.getTime() - candidate.date.getTime());
          if (timeDiff > (7 * 24 * 60 * 60 * 1000)) continue; // More than 7 days apart

          const matchResult = this.evaluateTransactionMatch(
            current,
            candidate,
            this.defaultOptions
          );

          if (matchResult.score >= minimumScore) {
            matches.push({
              transactionId: candidate.id,
              score: matchResult.score,
              reasons: matchResult.reasons,
              transaction: candidate
            });
          }
        }

        if (matches.length > 0) {
          potentialDuplicates.push({
            original: current,
            duplicates: matches.sort((a, b) => b.score - a.score)
          });
        }
      }

      return potentialDuplicates;
    } catch (error) {
      console.error('[DuplicateDetection] Error finding potential duplicates:', error);
      return [];
    }
  }

  /**
   * Auto-merge duplicate transactions (use with caution)
   */
  async mergeDuplicateTransactions(
    keepTransactionId: string,
    duplicateTransactionIds: string[],
    userId: string
  ): Promise<{ success: boolean; mergedCount: number; errors: string[] }> {
    const errors: string[] = [];
    let mergedCount = 0;

    try {
      // This would require implementation of transaction merging logic
      // For now, we'll just audit the merge request
      
      const auditEntry = createAuditEntry(
        'UPDATE',
        userId,
        keepTransactionId,
        {
          metadata: {
            source: 'duplicate-detection-service'
          }
        }
      );

      await storeAuditEntry(auditEntry);

      // Implement actual transaction merging logic
      for (const duplicateId of duplicateTransactionIds) {
        try {
          // Import transaction service dynamically to avoid circular dependencies
          const { deleteTransaction } = await import('@/services/transaction-service');
          
          // Soft delete the duplicate transaction
          await deleteTransaction(duplicateId);
          mergedCount++;
          
          console.log(`[DuplicateDetection] Merged duplicate transaction ${duplicateId} into ${keepTransactionId}`);
        } catch (error) {
          errors.push(`Failed to merge transaction ${duplicateId}: ${error}`);
          console.error(`[DuplicateDetection] Error merging ${duplicateId}:`, error);
        }
      }

      return {
        success: true,
        mergedCount,
        errors
      };
    } catch (error) {
      console.error('[DuplicateDetection] Error merging duplicates:', error);
      return {
        success: false,
        mergedCount: 0,
        errors: [`Failed to merge duplicates: ${error}`]
      };
    }
  }

  /**
   * Audit duplicate detection for compliance
   */
  private async auditDuplicateCheck(
    transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>,
    result: DuplicateDetectionResult
  ): Promise<void> {
    try {
      const auditEntry = createAuditEntry(
        'CREATE',
        transaction.userId,
        'duplicate-check',
        {
          metadata: {
            source: 'duplicate-detection-service'
          }
        }
      );

      await storeAuditEntry(auditEntry);
    } catch (error) {
      console.error('[DuplicateDetection] Error auditing duplicate check:', error);
      // Don't throw - audit failures shouldn't break the main flow
    }
  }

  /**
   * Get duplicate detection statistics
   */
  async getDuplicateStats(userId: string, days: number = 30): Promise<{
    totalChecks: number;
    duplicatesFound: number;
    blockedTransactions: number;
    falsePositives: number;
    averageConfidence: number;
  }> {
    // This would require querying audit logs
    // For now, return placeholder data
    return {
      totalChecks: 0,
      duplicatesFound: 0,
      blockedTransactions: 0,
      falsePositives: 0,
      averageConfidence: 0
    };
  }

  /**
   * Update duplicate detection rules (for admin use)
   */
  updateRules(newRules: Partial<DuplicateRule>[]): void {
    // This would allow dynamic rule updates
    console.log('[DuplicateDetection] Rule updates requested:', newRules);
  }
}

// Create singleton instance
export const duplicateDetectionService = new DuplicateDetectionService();

// Export types
export type { 
  DuplicateDetectionResult, 
  DuplicateMatch, 
  DuplicateDetectionOptions, 
  DuplicateRule 
};
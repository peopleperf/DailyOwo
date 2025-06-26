import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  query, 
  where,
  writeBatch,
  documentId
} from 'firebase/firestore';
import { getFirebaseDb } from '@/lib/firebase/config';

/**
 * Referential Integrity System
 * Ensures all document references are valid and prevents orphaned data
 */

export interface ReferenceRule {
  sourceCollection: string;
  sourceField: string;
  targetCollection: string;
  targetField?: string; // defaults to document ID
  onDelete: 'cascade' | 'restrict' | 'set_null';
  isRequired: boolean;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  orphanedReferences?: OrphanedReference[];
}

export interface ValidationError {
  collection: string;
  documentId: string;
  field: string;
  message: string;
  invalidReference?: string;
}

export interface ValidationWarning {
  collection: string;
  documentId: string;
  field: string;
  message: string;
}

export interface OrphanedReference {
  sourceCollection: string;
  sourceDocumentId: string;
  sourceField: string;
  invalidReference: string;
  targetCollection: string;
}

// Define referential integrity rules for the application
export const REFERENCE_RULES: ReferenceRule[] = [
  // Transactions must reference valid categories
  {
    sourceCollection: 'transactions',
    sourceField: 'categoryId',
    targetCollection: 'categories',
    onDelete: 'restrict',
    isRequired: true,
  },
  // Transactions may reference valid budgets
  {
    sourceCollection: 'transactions',
    sourceField: 'budgetId',
    targetCollection: 'budgets',
    onDelete: 'set_null',
    isRequired: false,
  },
  // Goals may reference valid categories
  {
    sourceCollection: 'goals',
    sourceField: 'categoryId',
    targetCollection: 'categories',
    onDelete: 'set_null',
    isRequired: false,
  },
  // Budgets must reference valid categories
  {
    sourceCollection: 'budgets',
    sourceField: 'categoryId',
    targetCollection: 'categories',
    onDelete: 'restrict',
    isRequired: true,
  },
  // Debt payments reference debt transactions
  {
    sourceCollection: 'transactions',
    sourceField: 'debtId',
    targetCollection: 'transactions',
    onDelete: 'set_null',
    isRequired: false,
  },
];

/**
 * Validate references for a single document
 */
export async function validateDocumentReferences(
  collectionName: string,
  documentId: string,
  documentData: Record<string, any>
): Promise<ValidationResult> {
  const db = await getFirebaseDb();
  if (!db) {
    return {
      isValid: false,
      errors: [{
        collection: collectionName,
        documentId,
        field: '',
        message: 'Firebase is not initialized',
      }],
      warnings: [],
    };
  }

  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  const orphanedReferences: OrphanedReference[] = [];

  // Find all rules that apply to this collection
  const applicableRules = REFERENCE_RULES.filter(
    rule => rule.sourceCollection === collectionName
  );

  // Validate each rule
  for (const rule of applicableRules) {
    const referenceValue = documentData[rule.sourceField];

    // Check if required field is missing
    if (rule.isRequired && !referenceValue) {
      errors.push({
        collection: collectionName,
        documentId,
        field: rule.sourceField,
        message: `Required reference field '${rule.sourceField}' is missing`,
      });
      continue;
    }

    // Skip validation if field is not present and not required
    if (!referenceValue) {
      continue;
    }

    // Validate the reference exists
    try {
      const targetDocRef = doc(db, rule.targetCollection, referenceValue);
      const targetDoc = await getDoc(targetDocRef);

      if (!targetDoc.exists()) {
        if (rule.isRequired) {
          errors.push({
            collection: collectionName,
            documentId,
            field: rule.sourceField,
            message: `Invalid reference: ${rule.targetCollection}/${referenceValue} does not exist`,
            invalidReference: referenceValue,
          });
        } else {
          warnings.push({
            collection: collectionName,
            documentId,
            field: rule.sourceField,
            message: `Reference to ${rule.targetCollection}/${referenceValue} is invalid`,
          });
        }

        orphanedReferences.push({
          sourceCollection: collectionName,
          sourceDocumentId: documentId,
          sourceField: rule.sourceField,
          invalidReference: referenceValue,
          targetCollection: rule.targetCollection,
        });
      }
    } catch (error) {
      errors.push({
        collection: collectionName,
        documentId,
        field: rule.sourceField,
        message: `Error validating reference: ${error}`,
      });
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    orphanedReferences: orphanedReferences.length > 0 ? orphanedReferences : undefined,
  };
}

/**
 * Validate all documents in a collection
 */
export async function validateCollectionIntegrity(
  collectionName: string,
  limit?: number
): Promise<ValidationResult> {
  const db = await getFirebaseDb();
  if (!db) {
    return {
      isValid: false,
      errors: [{
        collection: collectionName,
        documentId: '',
        field: '',
        message: 'Firebase is not initialized',
      }],
      warnings: [],
    };
  }

  const allErrors: ValidationError[] = [];
  const allWarnings: ValidationWarning[] = [];
  const allOrphaned: OrphanedReference[] = [];

  try {
    const collectionRef = collection(db, collectionName);
    const snapshot = await getDocs(collectionRef);
    
    let processed = 0;
    for (const docSnap of snapshot.docs) {
      if (limit && processed >= limit) break;
      
      const result = await validateDocumentReferences(
        collectionName,
        docSnap.id,
        docSnap.data()
      );
      
      allErrors.push(...result.errors);
      allWarnings.push(...result.warnings);
      if (result.orphanedReferences) {
        allOrphaned.push(...result.orphanedReferences);
      }
      
      processed++;
    }
  } catch (error) {
    allErrors.push({
      collection: collectionName,
      documentId: '',
      field: '',
      message: `Error validating collection: ${error}`,
    });
  }

  return {
    isValid: allErrors.length === 0,
    errors: allErrors,
    warnings: allWarnings,
    orphanedReferences: allOrphaned.length > 0 ? allOrphaned : undefined,
  };
}

/**
 * Check if a document can be deleted based on referential integrity rules
 */
export async function canDeleteDocument(
  collectionName: string,
  documentId: string
): Promise<{
  canDelete: boolean;
  blockingReferences?: Array<{
    collection: string;
    count: number;
    rule: ReferenceRule;
  }>;
}> {
  const db = await getFirebaseDb();
  if (!db) {
    return { canDelete: false };
  }

  const blockingReferences: Array<{
    collection: string;
    count: number;
    rule: ReferenceRule;
  }> = [];

  // Find rules where this collection is the target
  const incomingRules = REFERENCE_RULES.filter(
    rule => rule.targetCollection === collectionName && rule.onDelete === 'restrict'
  );

  for (const rule of incomingRules) {
    try {
      // Check if any documents reference this one
      const referencingQuery = query(
        collection(db, rule.sourceCollection),
        where(rule.sourceField, '==', documentId)
      );
      
      const snapshot = await getDocs(referencingQuery);
      
      if (!snapshot.empty) {
        blockingReferences.push({
          collection: rule.sourceCollection,
          count: snapshot.size,
          rule,
        });
      }
    } catch (error) {
      console.error(`Error checking references from ${rule.sourceCollection}:`, error);
    }
  }

  return {
    canDelete: blockingReferences.length === 0,
    blockingReferences: blockingReferences.length > 0 ? blockingReferences : undefined,
  };
}

/**
 * Handle cascading operations when deleting a document
 */
export async function handleCascadingDelete(
  collectionName: string,
  documentId: string,
  dryRun: boolean = true
): Promise<{
  affectedDocuments: Array<{
    collection: string;
    documentId: string;
    action: 'delete' | 'update';
    field?: string;
  }>;
  errors?: string[];
}> {
  const db = await getFirebaseDb();
  if (!db) {
    return { affectedDocuments: [], errors: ['Firebase is not initialized'] };
  }

  const affectedDocuments: Array<{
    collection: string;
    documentId: string;
    action: 'delete' | 'update';
    field?: string;
  }> = [];
  const errors: string[] = [];

  // Find rules where this collection is the target
  const incomingRules = REFERENCE_RULES.filter(
    rule => rule.targetCollection === collectionName
  );

  const batch = writeBatch(db);

  for (const rule of incomingRules) {
    try {
      // Find all documents that reference this one
      const referencingQuery = query(
        collection(db, rule.sourceCollection),
        where(rule.sourceField, '==', documentId)
      );
      
      const snapshot = await getDocs(referencingQuery);
      
      for (const docSnap of snapshot.docs) {
        switch (rule.onDelete) {
          case 'cascade':
            affectedDocuments.push({
              collection: rule.sourceCollection,
              documentId: docSnap.id,
              action: 'delete',
            });
            
            if (!dryRun) {
              batch.delete(doc(db, rule.sourceCollection, docSnap.id));
            }
            break;
            
          case 'set_null':
            affectedDocuments.push({
              collection: rule.sourceCollection,
              documentId: docSnap.id,
              action: 'update',
              field: rule.sourceField,
            });
            
            if (!dryRun) {
              batch.update(doc(db, rule.sourceCollection, docSnap.id), {
                [rule.sourceField]: null,
              });
            }
            break;
            
          case 'restrict':
            // Should have been caught by canDeleteDocument
            errors.push(`Cannot delete: referenced by ${rule.sourceCollection}/${docSnap.id}`);
            break;
        }
      }
    } catch (error) {
      errors.push(`Error processing cascade for ${rule.sourceCollection}: ${error}`);
    }
  }

  if (!dryRun && errors.length === 0) {
    try {
      await batch.commit();
    } catch (error) {
      errors.push(`Error committing cascade operations: ${error}`);
    }
  }

  return {
    affectedDocuments,
    errors: errors.length > 0 ? errors : undefined,
  };
}

/**
 * Fix orphaned references by setting them to null or a default value
 */
export async function fixOrphanedReferences(
  orphanedReferences: OrphanedReference[],
  defaultValues?: Record<string, any>
): Promise<{
  fixed: number;
  failed: number;
  errors?: string[];
}> {
  const db = await getFirebaseDb();
  if (!db) {
    return { fixed: 0, failed: orphanedReferences.length, errors: ['Firebase is not initialized'] };
  }

  let fixed = 0;
  let failed = 0;
  const errors: string[] = [];
  const batch = writeBatch(db);

  for (const orphan of orphanedReferences) {
    try {
      const docRef = doc(db, orphan.sourceCollection, orphan.sourceDocumentId);
      const defaultValue = defaultValues?.[orphan.sourceField] ?? null;
      
      batch.update(docRef, {
        [orphan.sourceField]: defaultValue,
      });
      
      fixed++;
    } catch (error) {
      failed++;
      errors.push(
        `Failed to fix ${orphan.sourceCollection}/${orphan.sourceDocumentId}: ${error}`
      );
    }
  }

  if (fixed > 0) {
    try {
      await batch.commit();
    } catch (error) {
      failed += fixed;
      fixed = 0;
      errors.push(`Failed to commit fixes: ${error}`);
    }
  }

  return {
    fixed,
    failed,
    errors: errors.length > 0 ? errors : undefined,
  };
}

/**
 * Create a reference validator hook for real-time validation
 */
export function createReferenceValidator(rules: ReferenceRule[] = REFERENCE_RULES) {
  const cache = new Map<string, boolean>();
  const cacheTimeout = 5 * 60 * 1000; // 5 minutes
  
  return {
    async validateReference(
      targetCollection: string,
      targetId: string
    ): Promise<boolean> {
      const cacheKey = `${targetCollection}:${targetId}`;
      
      // Check cache
      if (cache.has(cacheKey)) {
        return cache.get(cacheKey)!;
      }
      
      const db = await getFirebaseDb();
      if (!db) return false;
      
      try {
        const docRef = doc(db, targetCollection, targetId);
        const docSnap = await getDoc(docRef);
        const exists = docSnap.exists();
        
        // Cache result
        cache.set(cacheKey, exists);
        setTimeout(() => cache.delete(cacheKey), cacheTimeout);
        
        return exists;
      } catch (error) {
        console.error(`Error validating reference ${cacheKey}:`, error);
        return false;
      }
    },
    
    clearCache() {
      cache.clear();
    },
  };
}

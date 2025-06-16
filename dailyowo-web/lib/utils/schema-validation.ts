import { z } from 'zod';
import { Timestamp } from 'firebase/firestore';

/**
 * Schema Validation System
 * Enforces consistent data structures across Firestore documents
 */

// Custom Zod types for Firestore
const firestoreTimestamp = z.custom<Timestamp>(
  (val) => val instanceof Timestamp || (val && typeof val.toDate === 'function'),
  { message: 'Invalid Firestore timestamp' }
);

const firestoreDate = z.union([
  z.date(),
  firestoreTimestamp,
  z.string().datetime(),
]);

// Transaction Schema
export const TransactionSchema = z.object({
  userId: z.string().min(1),
  type: z.enum(['income', 'expense', 'asset', 'liability']),
  amount: z.number().positive(),
  currency: z.string().length(3).default('USD'),
  categoryId: z.string().min(1),
  categoryType: z.enum(['global', 'user']),
  customCategory: z.string().optional(),
  description: z.string().max(500),
  date: firestoreDate,
  isRecurring: z.boolean().default(false),
  recurringConfig: z.object({
    frequency: z.enum(['daily', 'weekly', 'monthly', 'yearly']),
    endDate: firestoreDate.optional(),
    nextDate: firestoreDate.optional(),
  }).optional(),
  tags: z.array(z.string()).optional(),
  attachments: z.object({
    receipts: z.array(z.string().url()).optional(),
    notes: z.string().optional(),
  }).optional(),
  location: z.object({
    name: z.string().optional(),
    latitude: z.number().min(-90).max(90).optional(),
    longitude: z.number().min(-180).max(180).optional(),
  }).optional(),
  merchant: z.string().optional(),
  paymentMethod: z.enum(['cash', 'credit', 'debit', 'bank-transfer', 'mobile-payment', 'other']).optional(),
  isPrivate: z.boolean().optional(),
  debtId: z.string().optional(),
  assetDetails: z.object({
    symbol: z.string().optional(),
    quantity: z.number().positive().optional(),
    currentPrice: z.number().positive().optional(),
    lastPriceUpdate: firestoreDate.optional(),
    exchange: z.string().optional(),
    accountNumber: z.string().optional(),
    institution: z.string().optional(),
  }).optional(),
  liabilityDetails: z.object({
    interestRate: z.number().min(0).max(100).optional(),
    minimumPayment: z.number().positive().optional(),
    dueDate: firestoreDate.optional(),
    accountNumber: z.string().optional(),
    lender: z.string().optional(),
    originalAmount: z.number().positive().optional(),
  }).optional(),
  createdAt: firestoreDate,
  updatedAt: firestoreDate,
  createdBy: z.string(),
  lastModifiedBy: z.string().optional(),
  // Optimistic locking fields
  version: z.number().int().min(0).default(0),
  deleted: z.boolean().optional(),
  deletedAt: firestoreDate.optional(),
});

// Budget Schema
export const BudgetSchema = z.object({
  userId: z.string().min(1),
  name: z.string().min(1).max(100),
  categoryId: z.string().min(1),
  amount: z.number().positive(),
  period: z.enum(['daily', 'weekly', 'monthly', 'yearly']),
  startDate: firestoreDate,
  endDate: firestoreDate.optional(),
  isActive: z.boolean().default(true),
  notifications: z.object({
    enabled: z.boolean().default(true),
    thresholds: z.array(z.number().min(0).max(100)).default([50, 80, 100]),
  }).optional(),
  createdAt: firestoreDate,
  updatedAt: firestoreDate,
  version: z.number().int().min(0).default(0),
});

// Goal Schema
export const GoalSchema = z.object({
  userId: z.string().min(1),
  name: z.string().min(1).max(100),
  type: z.enum(['emergency-fund', 'retirement', 'vacation', 'home', 'car', 'education', 'investment', 'other']),
  targetAmount: z.number().positive(),
  currentAmount: z.number().min(0).default(0),
  targetDate: firestoreDate.optional(),
  monthlyContribution: z.number().min(0).optional(),
  description: z.string().max(500).optional(),
  priority: z.enum(['high', 'medium', 'low']).default('medium'),
  isCompleted: z.boolean().default(false),
  completedAt: firestoreDate.optional(),
  categoryId: z.string().optional(),
  createdAt: firestoreDate,
  updatedAt: firestoreDate,
  version: z.number().int().min(0).default(0),
});

// User Schema
export const UserSchema = z.object({
  email: z.string().email(),
  displayName: z.string().min(1).max(100).optional(),
  photoURL: z.string().url().optional(),
  phoneNumber: z.string().optional(),
  preferences: z.object({
    currency: z.string().length(3).default('USD'),
    language: z.string().default('en'),
    theme: z.enum(['light', 'dark', 'system']).default('system'),
    notifications: z.object({
      email: z.boolean().default(true),
      push: z.boolean().default(true),
      sms: z.boolean().default(false),
    }).default({}),
  }).default({}),
  financialProfile: z.object({
    monthlyIncome: z.number().min(0).optional(),
    savingsGoalPercentage: z.number().min(0).max(100).optional(),
    riskTolerance: z.enum(['conservative', 'moderate', 'aggressive']).optional(),
  }).optional(),
  createdAt: firestoreDate,
  updatedAt: firestoreDate,
  lastLoginAt: firestoreDate.optional(),
  isActive: z.boolean().default(true),
  version: z.number().int().min(0).default(0),
});

// Category Schema
export const CategorySchema = z.object({
  name: z.string().min(1).max(50),
  type: z.enum(['income', 'expense', 'asset', 'liability']),
  icon: z.string().optional(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
  parentId: z.string().optional(),
  isSystem: z.boolean().default(false),
  isActive: z.boolean().default(true),
  userId: z.string().optional(), // For user-created categories
  createdAt: firestoreDate,
  updatedAt: firestoreDate,
  version: z.number().int().min(0).default(0),
});

// Schema map for easy access
export const SCHEMAS = {
  transactions: TransactionSchema,
  budgets: BudgetSchema,
  goals: GoalSchema,
  users: UserSchema,
  categories: CategorySchema,
} as const;

export type SchemaType = keyof typeof SCHEMAS;

/**
 * Validate a document against its schema
 */
export function validateDocument<T extends SchemaType>(
  collectionName: T,
  data: unknown
): {
  success: boolean;
  data?: z.infer<typeof SCHEMAS[T]>;
  errors?: z.ZodError;
} {
  const schema = SCHEMAS[collectionName];
  if (!schema) {
    return {
      success: false,
      errors: new z.ZodError([{
        code: 'custom',
        path: [],
        message: `No schema defined for collection: ${collectionName}`,
      }]),
    };
  }

  try {
    const validatedData = schema.parse(data);
    return {
      success: true,
      data: validatedData,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        errors: error,
      };
    }
    throw error;
  }
}

/**
 * Sanitize data before storing in Firestore
 */
export function sanitizeDocument<T extends SchemaType>(
  collectionName: T,
  data: unknown
): z.infer<typeof SCHEMAS[T]> | null {
  const schema = SCHEMAS[collectionName];
  if (!schema) {
    console.error(`No schema defined for collection: ${collectionName}`);
    return null;
  }

  try {
    // Use safeParse to avoid throwing
    const result = schema.safeParse(data);
    if (result.success) {
      return result.data;
    } else {
      console.error(`Validation errors for ${collectionName}:`, result.error.errors);
      return null;
    }
  } catch (error) {
    console.error(`Error sanitizing document for ${collectionName}:`, error);
    return null;
  }
}

/**
 * Create a partial schema for updates
 */
export function createUpdateSchema<T extends SchemaType>(
  collectionName: T
): z.ZodType<Partial<z.infer<typeof SCHEMAS[T]>>> {
  const schema = SCHEMAS[collectionName];
  if (!schema) {
    throw new Error(`No schema defined for collection: ${collectionName}`);
  }

  // Make all fields optional for updates
  return schema.partial() as z.ZodType<Partial<z.infer<typeof SCHEMAS[T]>>>;
}

/**
 * Validate an update operation
 */
export function validateUpdate<T extends SchemaType>(
  collectionName: T,
  updates: unknown
): {
  success: boolean;
  data?: Partial<z.infer<typeof SCHEMAS[T]>>;
  errors?: z.ZodError;
} {
  const updateSchema = createUpdateSchema(collectionName);

  try {
    const validatedData = updateSchema.parse(updates);
    return {
      success: true,
      data: validatedData,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        errors: error,
      };
    }
    throw error;
  }
}

/**
 * Create a type-safe document creator
 */
export function createDocumentFactory<T extends SchemaType>(
  collectionName: T
) {
  return {
    create(data: z.infer<typeof SCHEMAS[T]>): z.infer<typeof SCHEMAS[T]> {
      const result = validateDocument(collectionName, data);
      if (!result.success) {
        throw new Error(`Invalid ${collectionName} document: ${result.errors?.message}`);
      }
      return result.data!;
    },

    createPartial(data: Partial<z.infer<typeof SCHEMAS[T]>>): Partial<z.infer<typeof SCHEMAS[T]>> {
      const result = validateUpdate(collectionName, data);
      if (!result.success) {
        throw new Error(`Invalid ${collectionName} update: ${result.errors?.message}`);
      }
      return result.data!;
    },

    validate(data: unknown): data is z.infer<typeof SCHEMAS[T]> {
      const result = validateDocument(collectionName, data);
      return result.success;
    },
  };
}

/**
 * Firestore security rules generator based on schemas
 */
export function generateSecurityRules(): string {
  const rules: string[] = [
    'rules_version = "2";',
    'service cloud.firestore {',
    '  match /databases/{database}/documents {',
    '',
    '    // Helper functions',
    '    function isAuthenticated() {',
    '      return request.auth != null;',
    '    }',
    '',
    '    function isOwner(userId) {',
    '      return isAuthenticated() && request.auth.uid == userId;',
    '    }',
    '',
    '    function hasRequiredFields(fields) {',
    '      return request.resource.data.keys().hasAll(fields);',
    '    }',
    '',
  ];

  // Generate rules for each collection
  Object.entries(SCHEMAS).forEach(([collection, schema]) => {
    // Extract required fields from schema
    const schemaShape = schema instanceof z.ZodObject ? schema.shape : {};
    const requiredFields = Object.entries(schemaShape)
      .filter(([_, fieldSchema]) => {
        // Check if field is required (not optional)
        return !(fieldSchema instanceof z.ZodOptional);
      })
      .map(([fieldName]) => fieldName);

    rules.push(`    // ${collection} collection`);
    rules.push(`    match /${collection}/{document} {`);
    rules.push(`      allow read: if isOwner(resource.data.userId);`);
    rules.push(`      allow create: if isOwner(request.resource.data.userId)`);
    rules.push(`        && hasRequiredFields([${requiredFields.map(f => `"${f}"`).join(', ')}]);`);
    rules.push(`      allow update: if isOwner(resource.data.userId)`);
    rules.push(`        && request.resource.data.userId == resource.data.userId;`);
    rules.push(`      allow delete: if isOwner(resource.data.userId);`);
    rules.push(`    }`);
    rules.push('');
  });

  rules.push('  }');
  rules.push('}');

  return rules.join('\n');
}

/**
 * Create a middleware for automatic schema validation
 */
export function createSchemaValidationMiddleware() {
  return {
    async beforeCreate<T extends SchemaType>(
      collectionName: T,
      data: unknown
    ): Promise<z.infer<typeof SCHEMAS[T]>> {
      const result = validateDocument(collectionName, data);
      if (!result.success) {
        throw new Error(
          `Schema validation failed for ${collectionName}: ${JSON.stringify(result.errors?.errors)}`
        );
      }
      return result.data!;
    },

    async beforeUpdate<T extends SchemaType>(
      collectionName: T,
      updates: unknown
    ): Promise<Partial<z.infer<typeof SCHEMAS[T]>>> {
      const result = validateUpdate(collectionName, updates);
      if (!result.success) {
        throw new Error(
          `Update validation failed for ${collectionName}: ${JSON.stringify(result.errors?.errors)}`
        );
      }
      return result.data!;
    },
  };
} 
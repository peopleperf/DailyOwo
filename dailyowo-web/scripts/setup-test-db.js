#!/usr/bin/env node

/**
 * DailyOwo Test Database Setup Script
 * 
 * This script creates sample data in Firebase for testing and demonstration purposes.
 * It creates realistic budgets, transactions, and user data so the app can be tested immediately.
 * 
 * Usage: npm run setup-test-db
 */

const admin = require('firebase-admin');
const readline = require('readline');

// Initialize Firebase Admin (requires service account key)
const initFirebase = () => {
  try {
    // Check if already initialized
    if (admin.apps.length === 0) {
      admin.initializeApp({
        // Use environment variables or service account key file
        credential: admin.credential.applicationDefault(),
        projectId: process.env.FIREBASE_PROJECT_ID || 'dailyowo-test'
      });
    }
    return admin.firestore();
  } catch (error) {
    console.error('Failed to initialize Firebase:', error.message);
    console.log('Make sure you have:');
    console.log('1. Set GOOGLE_APPLICATION_CREDENTIALS environment variable');
    console.log('2. Or downloaded service account key and set FIREBASE_PROJECT_ID');
    process.exit(1);
  }
};

// Sample user data
const createSampleUser = (userId) => ({
  uid: userId,
  email: 'test@example.com',
  displayName: 'Test User',
  firstName: 'Test',
  lastName: 'User',
  region: 'us',
  currency: 'USD',
  dateFormat: 'MM/DD/YYYY',
  timezone: 'America/New_York',
  onboardingCompleted: true,
  createdAt: admin.firestore.Timestamp.now(),
  updatedAt: admin.firestore.Timestamp.now(),
  
  // Privacy settings
  privacySettings: {
    dataVisibility: {
      transactions: 'private',
      netWorth: 'private',
      goals: 'family',
      budgets: 'family'
    },
    dataRetention: {
      enableAutoDeletion: false,
      retentionPeriod: 'indefinite',
      inactiveDataCleanup: true
    },
    thirdPartySharing: {
      analytics: true,
      marketing: false,
      partnerships: false
    },
    notifications: {
      budgetAlerts: true,
      goalReminders: true,
      weeklyReports: true,
      monthlyReports: true
    }
  },

  // AI settings
  aiSettings: {
    enabled: true,
    features: {
      budgetOptimization: true,
      expenseAnalysis: true,
      savingsRecommendations: true,
      goalTracking: true,
      marketInsights: true
    },
    privacy: {
      dataSharing: 'aggregated',
      personalizedRecommendations: true
    },
    transparency: {
      explainDecisions: true,
      showConfidence: true,
      allowFeedback: true
    },
    performance: {
      processingSpeed: 'balanced',
      batteryOptimization: true
    }
  }
});

// Sample transactions for the last 30 days
const createSampleTransactions = (userId) => {
  const transactions = [];
  const now = new Date();
  
  // Monthly income
  transactions.push({
    userId,
    type: 'income',
    amount: 5000,
    category: 'salary',
    description: 'Monthly Salary',
    date: admin.firestore.Timestamp.fromDate(new Date(now.getFullYear(), now.getMonth(), 1)),
    currency: 'USD',
    isRecurring: false,
    createdAt: admin.firestore.Timestamp.now(),
    updatedAt: admin.firestore.Timestamp.now(),
    createdBy: userId
  });

  // Housing expenses
  transactions.push({
    userId,
    type: 'expense',
    amount: 1200,
    category: 'rent',
    description: 'Monthly Rent',
    date: admin.firestore.Timestamp.fromDate(new Date(now.getTime() - 1000 * 60 * 60 * 24 * 1)),
    currency: 'USD',
    isRecurring: false,
    createdAt: admin.firestore.Timestamp.now(),
    updatedAt: admin.firestore.Timestamp.now(),
    createdBy: userId
  });

  transactions.push({
    userId,
    type: 'expense',
    amount: 150,
    category: 'electricity',
    description: 'Electric Bill',
    date: admin.firestore.Timestamp.fromDate(new Date(now.getTime() - 1000 * 60 * 60 * 24 * 3)),
    currency: 'USD',
    isRecurring: false,
    createdAt: admin.firestore.Timestamp.now(),
    updatedAt: admin.firestore.Timestamp.now(),
    createdBy: userId
  });

  // Food expenses
  transactions.push({
    userId,
    type: 'expense',
    amount: 120,
    category: 'groceries',
    description: 'Weekly Groceries - Whole Foods',
    date: admin.firestore.Timestamp.fromDate(new Date(now.getTime() - 1000 * 60 * 60 * 24 * 2)),
    currency: 'USD',
    isRecurring: false,
    createdAt: admin.firestore.Timestamp.now(),
    updatedAt: admin.firestore.Timestamp.now(),
    createdBy: userId
  });

  transactions.push({
    userId,
    type: 'expense',
    amount: 45,
    category: 'dining-out',
    description: 'Restaurant Dinner',
    date: admin.firestore.Timestamp.fromDate(new Date(now.getTime() - 1000 * 60 * 60 * 24 * 4)),
    currency: 'USD',
    isRecurring: false,
    createdAt: admin.firestore.Timestamp.now(),
    updatedAt: admin.firestore.Timestamp.now(),
    createdBy: userId
  });

  // Transportation
  transactions.push({
    userId,
    type: 'expense',
    amount: 60,
    category: 'fuel',
    description: 'Gas Station',
    date: admin.firestore.Timestamp.fromDate(new Date(now.getTime() - 1000 * 60 * 60 * 24 * 6)),
    currency: 'USD',
    isRecurring: false,
    createdAt: admin.firestore.Timestamp.now(),
    updatedAt: admin.firestore.Timestamp.now(),
    createdBy: userId
  });

  // Entertainment
  transactions.push({
    userId,
    type: 'expense',
    amount: 15,
    category: 'streaming-services',
    description: 'Netflix Subscription',
    date: admin.firestore.Timestamp.fromDate(new Date(now.getTime() - 1000 * 60 * 60 * 24 * 7)),
    currency: 'USD',
    isRecurring: false,
    createdAt: admin.firestore.Timestamp.now(),
    updatedAt: admin.firestore.Timestamp.now(),
    createdBy: userId
  });

  // Shopping
  transactions.push({
    userId,
    type: 'expense',
    amount: 200,
    category: 'clothing',
    description: 'New Clothes - Amazon',
    date: admin.firestore.Timestamp.fromDate(new Date(now.getTime() - 1000 * 60 * 60 * 24 * 9)),
    currency: 'USD',
    isRecurring: false,
    createdAt: admin.firestore.Timestamp.now(),
    updatedAt: admin.firestore.Timestamp.now(),
    createdBy: userId
  });

  // Savings
  transactions.push({
    userId,
    type: 'expense',
    amount: 500,
    category: 'emergency-fund',
    description: 'Emergency Fund Transfer',
    date: admin.firestore.Timestamp.fromDate(new Date(now.getTime() - 1000 * 60 * 60 * 24 * 10)),
    currency: 'USD',
    isRecurring: false,
    createdAt: admin.firestore.Timestamp.now(),
    updatedAt: admin.firestore.Timestamp.now(),
    createdBy: userId
  });

  transactions.push({
    userId,
    type: 'expense',
    amount: 300,
    category: 'retirement-401k',
    description: '401k Contribution',
    date: admin.firestore.Timestamp.fromDate(new Date(now.getTime() - 1000 * 60 * 60 * 24 * 11)),
    currency: 'USD',
    isRecurring: false,
    createdAt: admin.firestore.Timestamp.now(),
    updatedAt: admin.firestore.Timestamp.now(),
    createdBy: userId
  });

  return transactions;
};

// Sample budget
const createSampleBudget = (userId) => {
  const now = new Date();
  const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
  const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  return {
    userId,
    name: '50/30/20 Budget - ' + startDate.toLocaleDateString(),
    method: {
      type: '50-30-20',
      allocations: {}
    },
    period: {
      id: `period-${Date.now()}`,
      startDate: admin.firestore.Timestamp.fromDate(startDate),
      endDate: admin.firestore.Timestamp.fromDate(endDate),
      frequency: 'monthly',
      totalIncome: 5000,
      totalAllocated: 5000,
      totalSpent: 0,
      totalRemaining: 5000,
      isActive: true
    },
    categories: [
      // NEEDS (50% = $2500)
      {
        id: 'needs-housing',
        name: 'Housing',
        type: 'housing',
        allocated: 1500, // 30% of total income
        spent: 0,
        remaining: 1500,
        isOverBudget: false,
        allowRollover: false,
        rolloverAmount: 0,
        transactionCategories: ['rent', 'mortgage', 'home-maintenance', 'home-improvement']
      },
      {
        id: 'needs-utilities',
        name: 'Utilities',
        type: 'utilities',
        allocated: 500, // 10% of total income
        spent: 0,
        remaining: 500,
        isOverBudget: false,
        allowRollover: true,
        rolloverAmount: 0,
        transactionCategories: ['electricity', 'gas', 'water', 'internet', 'phone', 'cable-tv']
      },
      {
        id: 'needs-food',
        name: 'Food & Groceries',
        type: 'food',
        allocated: 500, // 10% of total income
        spent: 0,
        remaining: 500,
        isOverBudget: false,
        allowRollover: true,
        rolloverAmount: 0,
        transactionCategories: ['groceries', 'dining-out', 'coffee-shops', 'fast-food']
      },
      // WANTS (30% = $1500)
      {
        id: 'wants-entertainment',
        name: 'Entertainment',
        type: 'entertainment',
        allocated: 750, // 15% of total income
        spent: 0,
        remaining: 750,
        isOverBudget: false,
        allowRollover: true,
        rolloverAmount: 0,
        transactionCategories: ['movies', 'games', 'music', 'sports', 'hobbies']
      },
      {
        id: 'wants-shopping',
        name: 'Shopping',
        type: 'shopping',
        allocated: 750, // 15% of total income
        spent: 0,
        remaining: 750,
        isOverBudget: false,
        allowRollover: true,
        rolloverAmount: 0,
        transactionCategories: ['clothing', 'household-items', 'electronics']
      },
      // SAVINGS (20% = $1000)
      {
        id: 'savings-emergency',
        name: 'Emergency Fund',
        type: 'savings',
        allocated: 500, // 10% of total income
        spent: 0,
        remaining: 500,
        isOverBudget: false,
        allowRollover: true,
        rolloverAmount: 0,
        transactionCategories: ['emergency-fund']
      },
      {
        id: 'savings-retirement',
        name: 'Retirement',
        type: 'retirement',
        allocated: 500, // 10% of total income
        spent: 0,
        remaining: 500,
        isOverBudget: false,
        allowRollover: true,
        rolloverAmount: 0,
        transactionCategories: ['retirement-401k', 'retirement-ira', 'pension']
      }
    ],
    isActive: true,
    createdAt: admin.firestore.Timestamp.now(),
    updatedAt: admin.firestore.Timestamp.now()
  };
};

// Sample goals
const createSampleGoals = (userId) => [
  {
    userId,
    name: 'Emergency Fund',
    targetAmount: 15000,
    currentAmount: 5000,
    targetDate: admin.firestore.Timestamp.fromDate(new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)),
    isCompleted: false,
    category: 'emergency',
    priority: 'high',
    createdAt: admin.firestore.Timestamp.now(),
    updatedAt: admin.firestore.Timestamp.now(),
    createdBy: userId
  },
  {
    userId,
    name: 'Vacation to Europe',
    targetAmount: 8000,
    currentAmount: 2000,
    targetDate: admin.firestore.Timestamp.fromDate(new Date(Date.now() + 180 * 24 * 60 * 60 * 1000)),
    isCompleted: false,
    category: 'travel',
    priority: 'medium',
    createdAt: admin.firestore.Timestamp.now(),
    updatedAt: admin.firestore.Timestamp.now(),
    createdBy: userId
  }
];

const setupTestUser = async (db, userId) => {
  console.log(`Setting up test data for user: ${userId}`);

  try {
    // Create user profile
    await db.collection('users').doc(userId).set(createSampleUser(userId));
    console.log('✓ Created user profile');

    // Create transactions
    const transactions = createSampleTransactions(userId);
    const batch = db.batch();
    
    transactions.forEach((transaction) => {
      const docRef = db.collection('users').doc(userId).collection('transactions').doc();
      batch.set(docRef, transaction);
    });
    
    await batch.commit();
    console.log(`✓ Created ${transactions.length} sample transactions`);

    // Create budget
    const budget = createSampleBudget(userId);
    const budgetRef = db.collection('users').doc(userId).collection('budgets').doc(`budget-${Date.now()}`);
    await budgetRef.set(budget);
    console.log('✓ Created sample budget');

    // Create goals
    const goals = createSampleGoals(userId);
    const goalsBatch = db.batch();
    
    goals.forEach((goal) => {
      const docRef = db.collection('users').doc(userId).collection('goals').doc();
      goalsBatch.set(docRef, goal);
    });
    
    await goalsBatch.commit();
    console.log(`✓ Created ${goals.length} sample goals`);

    console.log('\n🎉 Test data setup complete!');
    console.log(`\nYou can now login with:`);
    console.log(`Email: test@example.com`);
    console.log(`User ID: ${userId}`);
    console.log(`\nThe budget should now show realistic data with a Budget Overall Score.`);

  } catch (error) {
    console.error('Error setting up test data:', error);
    throw error;
  }
};

const main = async () => {
  console.log('🚀 DailyOwo Test Database Setup\n');

  const db = initFirebase();

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const question = (prompt) => new Promise((resolve) => {
    rl.question(prompt, resolve);
  });

  try {
    const userId = await question('Enter User ID (or press Enter for default "test-user-123"): ');
    const finalUserId = userId.trim() || 'test-user-123';

    const confirm = await question(`\nThis will create test data for user "${finalUserId}". Continue? (y/N): `);
    
    if (confirm.toLowerCase() === 'y' || confirm.toLowerCase() === 'yes') {
      await setupTestUser(db, finalUserId);
    } else {
      console.log('Setup cancelled.');
    }

  } catch (error) {
    console.error('Setup failed:', error);
    process.exit(1);
  } finally {
    rl.close();
  }
};

if (require.main === module) {
  main();
}

module.exports = { createSampleUser, createSampleTransactions, createSampleBudget, createSampleGoals }; 
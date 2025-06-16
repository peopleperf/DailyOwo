import { Ability, AbilityBuilder } from '@casl/ability';

// Define all possible actions in the system
export type Actions = 
  // Basic CRUD
  | 'view' | 'create' | 'update' | 'delete'
  // Financial specific
  | 'viewBalance' | 'viewDetails' | 'categorize'
  // Administrative
  | 'invite' | 'remove' | 'manage' | 'approve'
  // Advanced
  | 'export' | 'audit';

// Define all subjects (resources) in the system
export type Subjects = 
  // Core financial data
  | 'Transaction' | 'Budget' | 'Goal' | 'Investment' | 'Debt'
  // Account & profile
  | 'Account' | 'Profile' | 'NetWorth'
  // Family & collaboration
  | 'FamilyMember' | 'Invitation' | 'Permission'
  // Data & reports
  | 'Report' | 'Export' | 'AuditLog'
  // Special
  | 'all';

// Define the main ability type
export interface AppAbility extends Ability<[Actions, Subjects]> {}

// Family member roles
export type FamilyRole = 'principal' | 'co-principal' | 'partner' | 'child' | 'parent' | 'advisor' | 'accountant';

// Custom role definition for flexibility
export interface CustomRole {
  id: string;
  name: string;
  description: string;
  permissions: FamilyPermissions;
  isDefault: boolean;
  createdBy: string;
  expiresAt?: Date;
}

// Comprehensive permission matrix
export interface FamilyPermissions {
  // Financial Viewing Permissions
  viewNetWorth: boolean;
  viewAccountBalances: boolean;
  viewTransactionDetails: boolean;
  viewTransactionAmounts: boolean; // Can see amounts but not descriptions
  viewBudgets: boolean;
  viewGoals: boolean;
  viewInvestments: boolean;
  viewDebts: boolean;
  
  // Transaction Management
  addTransactions: {
    income: boolean;
    expenses: boolean;
    assets: boolean;
    debts: boolean;
  };
  
  editTransactions: {
    own: boolean;
    family: boolean;
    requiresApproval: boolean; // For cross-account edits
  };
  
  deleteTransactions: {
    own: boolean;
    family: boolean;
    requiresApproval: boolean;
  };
  
  categorizeTransactions: boolean;
  uploadReceipts: boolean;
  
  // Goals & Budget Management
  viewFamilyGoals: boolean;
  createFamilyGoals: boolean;
  editFamilyGoals: boolean;
  deleteFamilyGoals: boolean;
  
  viewFamilyBudgets: boolean;
  createBudgets: boolean;
  editBudgets: boolean;
  modifyBudgetAllocations: boolean;
  
  // Administrative Permissions
  inviteMembers: boolean;
  removeMembers: boolean;
  editMemberPermissions: boolean;
  createCustomRoles: boolean;
  
  // Data & Privacy
  viewAuditLog: boolean;
  exportFamilyData: boolean;
  manageDataPrivacy: boolean;
  
  // Approval Workflows
  canApproveTransactions: boolean;
  canApproveBudgetChanges: boolean;
  canApproveGoalChanges: boolean;
  
  // Advanced Features
  manageIntegrations: boolean; // Banking, investments
  accessAdvancedReports: boolean;
  manageNotifications: boolean;
}

// Family member with comprehensive data
export interface FamilyMember {
  id: string;
  uid: string; // Firebase user ID
  email: string;
  displayName: string;
  profilePhoto?: string;
  
  // Role & Status
  role: FamilyRole;
  customRole?: CustomRole;
  status: 'active' | 'invited' | 'suspended' | 'pending';
  
  // Metadata
  joinedAt: Date;
  invitedBy: string;
  lastActiveAt?: Date;
  
  // Permissions
  permissions: FamilyPermissions;
  
  // Account Access
  accountAccess: {
    ownAccountId: string;
    accessibleAccounts: string[]; // Can view these accounts
    canMergeAccounts: boolean;
  };
  
  // Privacy & Visibility
  transactionVisibility: {
    defaultLevel: 'all' | 'own' | 'categories' | 'none';
    categoryOverrides: Record<string, boolean>; // Category-specific visibility
    hiddenTransactionIds: string[]; // Specific transactions to hide
    hiddenCategories: string[]; // Bulk category privacy
  };
  
  // Temporary Permissions
  temporaryPermissions?: {
    permissions: Partial<FamilyPermissions>;
    expiresAt: Date;
    grantedBy: string;
    reason?: string;
  }[];
}

// Approval workflow types
export interface ApprovalRequest {
  id: string;
  type: 'transaction_edit' | 'transaction_delete' | 'budget_change' | 'goal_change' | 'permission_change';
  requestedBy: string;
  requestedFor?: string; // If editing someone else's data
  
  // Original and proposed changes
  originalData: any;
  proposedChanges: any;
  
  // Approval status
  status: 'pending' | 'approved' | 'rejected' | 'expired';
  reviewedBy?: string;
  reviewedAt?: Date;
  reviewComment?: string;
  
  // Metadata
  createdAt: Date;
  expiresAt: Date;
  priority: 'low' | 'medium' | 'high';
}

// Transaction privacy and ownership
export interface TransactionAccess {
  ownerId: string; // Who created/owns this transaction
  visibility: 'private' | 'family' | 'specific'; // Who can see it
  allowedMembers?: string[]; // If visibility is 'specific'
  editPermissions: 'owner_only' | 'family' | 'specific';
  allowedEditors?: string[]; // If editPermissions is 'specific'
  requiresApprovalFrom?: string[]; // Must be approved by these members
}

// Role-based permission presets
export const DEFAULT_ROLE_PERMISSIONS: Record<FamilyRole, FamilyPermissions> = {
  principal: {
    // Principals can do everything
    viewNetWorth: true,
    viewAccountBalances: true,
    viewTransactionDetails: true,
    viewTransactionAmounts: true,
    viewBudgets: true,
    viewGoals: true,
    viewInvestments: true,
    viewDebts: true,
    
    addTransactions: {
      income: true,
      expenses: true,
      assets: true,
      debts: true,
    },
    
    editTransactions: {
      own: true,
      family: true,
      requiresApproval: false,
    },
    
    deleteTransactions: {
      own: true,
      family: true,
      requiresApproval: false,
    },
    
    categorizeTransactions: true,
    uploadReceipts: true,
    
    viewFamilyGoals: true,
    createFamilyGoals: true,
    editFamilyGoals: true,
    deleteFamilyGoals: true,
    
    viewFamilyBudgets: true,
    createBudgets: true,
    editBudgets: true,
    modifyBudgetAllocations: true,
    
    inviteMembers: true,
    removeMembers: true,
    editMemberPermissions: true,
    createCustomRoles: true,
    
    viewAuditLog: true,
    exportFamilyData: true,
    manageDataPrivacy: true,
    
    canApproveTransactions: true,
    canApproveBudgetChanges: true,
    canApproveGoalChanges: true,
    
    manageIntegrations: true,
    accessAdvancedReports: true,
    manageNotifications: true,
  },
  
  'co-principal': {
    // Co-principals have most permissions but can't remove the principal
    viewNetWorth: true,
    viewAccountBalances: true,
    viewTransactionDetails: true,
    viewTransactionAmounts: true,
    viewBudgets: true,
    viewGoals: true,
    viewInvestments: true,
    viewDebts: true,
    
    addTransactions: {
      income: true,
      expenses: true,
      assets: true,
      debts: true,
    },
    
    editTransactions: {
      own: true,
      family: true,
      requiresApproval: true, // Requires approval for principal's transactions
    },
    
    deleteTransactions: {
      own: true,
      family: false,
      requiresApproval: true,
    },
    
    categorizeTransactions: true,
    uploadReceipts: true,
    
    viewFamilyGoals: true,
    createFamilyGoals: true,
    editFamilyGoals: true,
    deleteFamilyGoals: true,
    
    viewFamilyBudgets: true,
    createBudgets: true,
    editBudgets: true,
    modifyBudgetAllocations: true,
    
    inviteMembers: true,
    removeMembers: false, // Cannot remove principal
    editMemberPermissions: true,
    createCustomRoles: true,
    
    viewAuditLog: true,
    exportFamilyData: true,
    manageDataPrivacy: false,
    
    canApproveTransactions: true,
    canApproveBudgetChanges: true,
    canApproveGoalChanges: true,
    
    manageIntegrations: true,
    accessAdvancedReports: true,
    manageNotifications: true,
  },
  
  partner: {
    // Partners have good access but limited admin rights
    viewNetWorth: true,
    viewAccountBalances: true,
    viewTransactionDetails: true,
    viewTransactionAmounts: true,
    viewBudgets: true,
    viewGoals: true,
    viewInvestments: true,
    viewDebts: true,
    
    addTransactions: {
      income: true,
      expenses: true,
      assets: true,
      debts: true,
    },
    
    editTransactions: {
      own: true,
      family: false,
      requiresApproval: true,
    },
    
    deleteTransactions: {
      own: true,
      family: false,
      requiresApproval: true,
    },
    
    categorizeTransactions: true,
    uploadReceipts: true,
    
    viewFamilyGoals: true,
    createFamilyGoals: true,
    editFamilyGoals: false,
    deleteFamilyGoals: false,
    
    viewFamilyBudgets: true,
    createBudgets: false,
    editBudgets: false,
    modifyBudgetAllocations: false,
    
    inviteMembers: false,
    removeMembers: false,
    editMemberPermissions: false,
    createCustomRoles: false,
    
    viewAuditLog: false,
    exportFamilyData: true,
    manageDataPrivacy: false,
    
    canApproveTransactions: false,
    canApproveBudgetChanges: false,
    canApproveGoalChanges: false,
    
    manageIntegrations: false,
    accessAdvancedReports: false,
    manageNotifications: false,
  },
  
  child: {
    // Children have very limited access - mainly savings/goals
    viewNetWorth: false,
    viewAccountBalances: false,
    viewTransactionDetails: false,
    viewTransactionAmounts: false,
    viewBudgets: false,
    viewGoals: true, // Can see family goals for education
    viewInvestments: false,
    viewDebts: false,
    
    addTransactions: {
      income: false,
      expenses: false,
      assets: true, // Can add to savings
      debts: false,
    },
    
    editTransactions: {
      own: true,
      family: false,
      requiresApproval: true,
    },
    
    deleteTransactions: {
      own: false,
      family: false,
      requiresApproval: true,
    },
    
    categorizeTransactions: false,
    uploadReceipts: false,
    
    viewFamilyGoals: true,
    createFamilyGoals: false,
    editFamilyGoals: false,
    deleteFamilyGoals: false,
    
    viewFamilyBudgets: false,
    createBudgets: false,
    editBudgets: false,
    modifyBudgetAllocations: false,
    
    inviteMembers: false,
    removeMembers: false,
    editMemberPermissions: false,
    createCustomRoles: false,
    
    viewAuditLog: false,
    exportFamilyData: false,
    manageDataPrivacy: false,
    
    canApproveTransactions: false,
    canApproveBudgetChanges: false,
    canApproveGoalChanges: false,
    
    manageIntegrations: false,
    accessAdvancedReports: false,
    manageNotifications: false,
  },
  
  parent: {
    // Parents can see most things but can't make changes
    viewNetWorth: true,
    viewAccountBalances: true,
    viewTransactionDetails: false, // Can see amounts but not details
    viewTransactionAmounts: true,
    viewBudgets: true,
    viewGoals: true,
    viewInvestments: true,
    viewDebts: true,
    
    addTransactions: {
      income: false,
      expenses: false,
      assets: false,
      debts: false,
    },
    
    editTransactions: {
      own: false,
      family: false,
      requiresApproval: false,
    },
    
    deleteTransactions: {
      own: false,
      family: false,
      requiresApproval: false,
    },
    
    categorizeTransactions: false,
    uploadReceipts: false,
    
    viewFamilyGoals: true,
    createFamilyGoals: false,
    editFamilyGoals: false,
    deleteFamilyGoals: false,
    
    viewFamilyBudgets: true,
    createBudgets: false,
    editBudgets: false,
    modifyBudgetAllocations: false,
    
    inviteMembers: false,
    removeMembers: false,
    editMemberPermissions: false,
    createCustomRoles: false,
    
    viewAuditLog: false,
    exportFamilyData: false,
    manageDataPrivacy: false,
    
    canApproveTransactions: false,
    canApproveBudgetChanges: false,
    canApproveGoalChanges: false,
    
    manageIntegrations: false,
    accessAdvancedReports: false,
    manageNotifications: false,
  },
  
  advisor: {
    // Financial advisors have view access and can make suggestions
    viewNetWorth: true,
    viewAccountBalances: true,
    viewTransactionDetails: true,
    viewTransactionAmounts: true,
    viewBudgets: true,
    viewGoals: true,
    viewInvestments: true,
    viewDebts: true,
    
    addTransactions: {
      income: false,
      expenses: false,
      assets: false,
      debts: false,
    },
    
    editTransactions: {
      own: false,
      family: false,
      requiresApproval: false,
    },
    
    deleteTransactions: {
      own: false,
      family: false,
      requiresApproval: false,
    },
    
    categorizeTransactions: true, // Can help with categorization
    uploadReceipts: false,
    
    viewFamilyGoals: true,
    createFamilyGoals: true, // Can suggest goals
    editFamilyGoals: false,
    deleteFamilyGoals: false,
    
    viewFamilyBudgets: true,
    createBudgets: true, // Can suggest budgets
    editBudgets: false,
    modifyBudgetAllocations: false,
    
    inviteMembers: false,
    removeMembers: false,
    editMemberPermissions: false,
    createCustomRoles: false,
    
    viewAuditLog: false,
    exportFamilyData: true,
    manageDataPrivacy: false,
    
    canApproveTransactions: false,
    canApproveBudgetChanges: false,
    canApproveGoalChanges: false,
    
    manageIntegrations: false,
    accessAdvancedReports: true,
    manageNotifications: false,
  },
  
  accountant: {
    // Accountants have broad view access for reporting
    viewNetWorth: true,
    viewAccountBalances: true,
    viewTransactionDetails: true,
    viewTransactionAmounts: true,
    viewBudgets: true,
    viewGoals: true,
    viewInvestments: true,
    viewDebts: true,
    
    addTransactions: {
      income: false,
      expenses: false,
      assets: false,
      debts: false,
    },
    
    editTransactions: {
      own: false,
      family: false,
      requiresApproval: false,
    },
    
    deleteTransactions: {
      own: false,
      family: false,
      requiresApproval: false,
    },
    
    categorizeTransactions: true,
    uploadReceipts: false,
    
    viewFamilyGoals: true,
    createFamilyGoals: false,
    editFamilyGoals: false,
    deleteFamilyGoals: false,
    
    viewFamilyBudgets: true,
    createBudgets: false,
    editBudgets: false,
    modifyBudgetAllocations: false,
    
    inviteMembers: false,
    removeMembers: false,
    editMemberPermissions: false,
    createCustomRoles: false,
    
    viewAuditLog: true,
    exportFamilyData: true,
    manageDataPrivacy: false,
    
    canApproveTransactions: false,
    canApproveBudgetChanges: false,
    canApproveGoalChanges: false,
    
    manageIntegrations: false,
    accessAdvancedReports: true,
    manageNotifications: false,
  },
};

// Helper function to create abilities based on family member
export function defineAbilitiesFor(familyMember: FamilyMember): AppAbility {
  const { can, cannot, build } = new AbilityBuilder<AppAbility>(Ability);
  
  const permissions = familyMember.permissions;
  
  // Apply temporary permissions if they exist and haven't expired
  let effectivePermissions = { ...permissions };
  if (familyMember.temporaryPermissions) {
    familyMember.temporaryPermissions.forEach(tempPerm => {
      if (tempPerm.expiresAt > new Date()) {
        effectivePermissions = { ...effectivePermissions, ...tempPerm.permissions };
      }
    });
  }
  
  // Financial viewing permissions
  if (effectivePermissions.viewNetWorth) can('view', 'NetWorth');
  if (effectivePermissions.viewAccountBalances) can('viewBalance', 'Account');
  if (effectivePermissions.viewTransactionDetails) can('viewDetails', 'Transaction');
  if (effectivePermissions.viewTransactionAmounts) can('view', 'Transaction');
  if (effectivePermissions.viewBudgets) can('view', 'Budget');
  if (effectivePermissions.viewGoals) can('view', 'Goal');
  if (effectivePermissions.viewInvestments) can('view', 'Investment');
  if (effectivePermissions.viewDebts) can('view', 'Debt');
  
  // Transaction management
  if (effectivePermissions.addTransactions.income) can('create', 'Transaction');
  if (effectivePermissions.addTransactions.expenses) can('create', 'Transaction');
  if (effectivePermissions.addTransactions.assets) can('create', 'Transaction');
  if (effectivePermissions.addTransactions.debts) can('create', 'Transaction');
  
  if (effectivePermissions.editTransactions.own) {
    can('update', 'Transaction');
  }
  if (effectivePermissions.editTransactions.family) {
    can('update', 'Transaction');
  }
  
  if (effectivePermissions.deleteTransactions.own) {
    can('delete', 'Transaction');
  }
  if (effectivePermissions.deleteTransactions.family) {
    can('delete', 'Transaction');
  }
  
  if (effectivePermissions.categorizeTransactions) can('categorize', 'Transaction');
  
  // Goals and budgets
  if (effectivePermissions.viewFamilyGoals) can('view', 'Goal');
  if (effectivePermissions.createFamilyGoals) can('create', 'Goal');
  if (effectivePermissions.editFamilyGoals) can('update', 'Goal');
  if (effectivePermissions.deleteFamilyGoals) can('delete', 'Goal');
  
  if (effectivePermissions.viewFamilyBudgets) can('view', 'Budget');
  if (effectivePermissions.createBudgets) can('create', 'Budget');
  if (effectivePermissions.editBudgets) can('update', 'Budget');
  
  // Administrative permissions
  if (effectivePermissions.inviteMembers) can('invite', 'FamilyMember');
  if (effectivePermissions.removeMembers) can('remove', 'FamilyMember');
  if (effectivePermissions.editMemberPermissions) can('manage', 'Permission');
  
  // Data and privacy
  if (effectivePermissions.viewAuditLog) can('view', 'AuditLog');
  if (effectivePermissions.exportFamilyData) can('export', 'all');
  
  // Approval permissions
  if (effectivePermissions.canApproveTransactions) can('approve', 'Transaction');
  if (effectivePermissions.canApproveBudgetChanges) can('approve', 'Budget');
  if (effectivePermissions.canApproveGoalChanges) can('approve', 'Goal');
  
  return build();
}

// Helper to check if action needs approval
export function needsApproval(
  action: Actions, 
  subject: Subjects, 
  actor: FamilyMember, 
  target?: any
): boolean {
  // Check if editing someone else's transactions
  if (action === 'update' && subject === 'Transaction') {
    if (target?.ownerId !== actor.uid) {
      return actor.permissions.editTransactions.requiresApproval;
    }
  }
  
  // Check if deleting someone else's transactions
  if (action === 'delete' && subject === 'Transaction') {
    if (target?.ownerId !== actor.uid) {
      return actor.permissions.deleteTransactions.requiresApproval;
    }
  }
  
  return false;
} 
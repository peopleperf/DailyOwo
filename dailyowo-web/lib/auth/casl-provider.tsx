'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { Ability, AbilityBuilder } from '@casl/ability';
import { Can as CASLCan } from '@casl/react';
import { FamilyMember, Actions, Subjects, AppAbility, DEFAULT_ROLE_PERMISSIONS } from '@/types/permissions';
import { useAuth } from '@/lib/firebase/auth-context';
import { familyService, FamilyDocument } from '@/lib/firebase/family-service';

interface CASLContextType {
  ability: AppAbility;
  updateAbility: (familyMember: FamilyMember) => void;
  isLoading: boolean;
  familyMembers: FamilyMember[];
  currentMemberRole: string | null;
  familyData: FamilyDocument | null;
  inviteMember: (email: string, role: string, message?: string) => Promise<boolean>;
  removeMember: (userId: string) => Promise<boolean>;
  updateMemberRole: (userId: string, newRole: string) => Promise<boolean>;
  loadFamilyDataExplicit: () => Promise<boolean>;
}

const CASLContext = createContext<CASLContextType | null>(null);

export function CASLProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [ability, setAbility] = useState<AppAbility>(new Ability([]));
  const [isLoading, setIsLoading] = useState(true);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [currentMemberRole, setCurrentMemberRole] = useState<string | null>(null);
  const [familyData, setFamilyData] = useState<FamilyDocument | null>(null);
  const [isClient, setIsClient] = useState(false);

  // Check if we're on the client side
  useEffect(() => {
    setIsClient(true);
  }, []);

  const buildAbilityFromMember = (member: FamilyMember): AppAbility => {
    const { can, build } = new AbilityBuilder<AppAbility>(Ability);

    // Get default permissions for the member's role
    const defaultPermissions = DEFAULT_ROLE_PERMISSIONS[member.role] || DEFAULT_ROLE_PERMISSIONS.child;
    
    // Map specific permissions to CASL abilities
    if (defaultPermissions.viewNetWorth) can('view', 'NetWorth');
    if (defaultPermissions.viewAccountBalances) can('view', 'Account');
    if (defaultPermissions.viewTransactionDetails) can('view', 'Transaction');
    if (defaultPermissions.viewTransactionAmounts) can('view', 'Transaction');
    if (defaultPermissions.viewBudgets) can('view', 'Budget');
    if (defaultPermissions.viewGoals) can('view', 'Goal');
    if (defaultPermissions.viewInvestments) can('view', 'Investment');
    if (defaultPermissions.viewDebts) can('view', 'Debt');
    
    // Transaction permissions
    if (defaultPermissions.addTransactions?.income) can('create', 'Transaction');
    if (defaultPermissions.addTransactions?.expenses) can('create', 'Transaction');
    if (defaultPermissions.addTransactions?.assets) can('create', 'Transaction');
    if (defaultPermissions.addTransactions?.debts) can('create', 'Transaction');
    
    // General transaction permissions
    if (defaultPermissions.addTransactions?.income || 
        defaultPermissions.addTransactions?.expenses || 
        defaultPermissions.addTransactions?.assets || 
        defaultPermissions.addTransactions?.debts) {
      can('create', 'Transaction');
    }
    
    if (defaultPermissions.editTransactions?.own) can('update', 'Transaction');
    if (defaultPermissions.editTransactions?.family) can('update', 'Transaction');
    if (defaultPermissions.deleteTransactions?.own) can('delete', 'Transaction');
    if (defaultPermissions.deleteTransactions?.family) can('delete', 'Transaction');
    if (defaultPermissions.categorizeTransactions) can('categorize', 'Transaction');
    
    // Goals and budgets
    if (defaultPermissions.viewFamilyGoals) can('view', 'Goal');
    if (defaultPermissions.createFamilyGoals) can('create', 'Goal');
    if (defaultPermissions.editFamilyGoals) can('update', 'Goal');
    if (defaultPermissions.deleteFamilyGoals) can('delete', 'Goal');
    
    if (defaultPermissions.viewFamilyBudgets) can('view', 'Budget');
    if (defaultPermissions.createBudgets) can('create', 'Budget');
    if (defaultPermissions.editBudgets) can('update', 'Budget');
    if (defaultPermissions.modifyBudgetAllocations) can('manage', 'Budget');
    
    // Family management permissions - THIS IS THE CRITICAL PART
    if (defaultPermissions.inviteMembers) can('invite', 'FamilyMember');
    if (defaultPermissions.removeMembers) can('remove', 'FamilyMember');
    if (defaultPermissions.editMemberPermissions) can('manage', 'Permission');
    if (defaultPermissions.createCustomRoles) can('create', 'Permission');
    
    // Data and audit permissions
    if (defaultPermissions.viewAuditLog) can('view', 'AuditLog');
    if (defaultPermissions.exportFamilyData) can('export', 'Export');
    if (defaultPermissions.manageDataPrivacy) can('manage', 'Profile');
    
    // Approval permissions
    if (defaultPermissions.canApproveTransactions) can('approve', 'Transaction');
    if (defaultPermissions.canApproveBudgetChanges) can('approve', 'Budget');
    if (defaultPermissions.canApproveGoalChanges) can('approve', 'Goal');
    
    // Advanced features
    if (defaultPermissions.manageIntegrations) can('manage', 'Account');
    if (defaultPermissions.accessAdvancedReports) can('view', 'Report');
    if (defaultPermissions.manageNotifications) can('manage', 'Profile');

    // Note: Custom permission overrides would be implemented here
    // if we had a different permission structure that supports granular overrides

    return build();
  };

  const updateAbility = (familyMember: FamilyMember) => {
    const newAbility = buildAbilityFromMember(familyMember);
    setAbility(newAbility);
    setCurrentMemberRole(familyMember.role);
  };

  /**
   * IMPORTANT: Family data is NOT automatically loaded to avoid unnecessary Firestore calls
   * and prevent "Target ID already exists" errors.
   * 
   * Single users don't need family functionality until they explicitly:
   * 1. Create a family (inviting other members)
   * 2. Accept a family invitation
   * 
   * When implementing family features:
   * - Call loadFamilyDataExplicit() when user creates a family
   * - Call loadFamilyDataExplicit() when user accepts an invitation
   * - The system will use default single-user permissions until family data is loaded
   */
  const loadFamilyData = async () => {
    // Skip if not on client side
    if (!isClient || typeof window === 'undefined') {
      setIsLoading(false);
      return;
    }

    // Skip if no user
    if (!user?.uid) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);

      // Don't automatically fetch family data
      // Just set up default single-user permissions
      // Family data will only be loaded when user explicitly creates or joins a family
      
      const defaultMember: FamilyMember = {
        id: user.uid,
        uid: user.uid,
        email: user.email || '',
        displayName: user.displayName || 'User',
        role: 'principal',
        status: 'active',
        joinedAt: new Date(),
        invitedBy: 'self',
        permissions: DEFAULT_ROLE_PERMISSIONS.principal,
        accountAccess: {
          ownAccountId: user.uid,
          accessibleAccounts: [user.uid],
          canMergeAccounts: true
        },
        transactionVisibility: {
          defaultLevel: 'all',
          categoryOverrides: {},
          hiddenTransactionIds: [],
          hiddenCategories: []
        }
      };
      
      updateAbility(defaultMember);
      setFamilyMembers([defaultMember]);
      setFamilyData(null); // No family data by default
    } catch (error) {
      console.error('Error setting up permissions:', error);
      
      // Fallback permissions even on error
      const fallbackMember: FamilyMember = {
        id: user?.uid || '',
        uid: user?.uid || '',
        email: user?.email || '',
        displayName: user?.displayName || 'User',
        role: 'principal',
        status: 'active',
        joinedAt: new Date(),
        invitedBy: 'system',
        permissions: DEFAULT_ROLE_PERMISSIONS.principal,
        accountAccess: {
          ownAccountId: user?.uid || '',
          accessibleAccounts: [user?.uid || ''],
          canMergeAccounts: true
        },
        transactionVisibility: {
          defaultLevel: 'all',
          categoryOverrides: {},
          hiddenTransactionIds: [],
          hiddenCategories: []
        }
      };
      updateAbility(fallbackMember);
      setFamilyMembers([fallbackMember]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Only load family data when on client and user is available
    if (isClient && user?.uid) {
      loadFamilyData();
    } else if (isClient && !user?.uid) {
      // No user, set loading to false
      setIsLoading(false);
    }
  }, [isClient, user?.uid]);

  // Family management functions
  const inviteMember = async (email: string, role: string, message?: string): Promise<boolean> => {
    if (!isClient || !user?.uid || typeof window === 'undefined') {
      console.error('No user or not in browser context');
      return false;
    }

    try {
      // If no family data exists, try to load it first
      let currentFamilyData = familyData;
      if (!currentFamilyData) {
        const loaded = await loadFamilyDataExplicit();
        if (!loaded) {
          console.error('No family data available after loading attempt');
          return false;
        }
        // Get the family data after loading
        const family = await familyService.getFamilyByUserId(user.uid);
        if (!family) {
          console.error('Failed to get family data');
          return false;
        }
        currentFamilyData = family;
      }

      await familyService.inviteFamilyMember(
        currentFamilyData.id,
        user.uid,
        user.displayName || 'User',
        email,
        role,
        message || ''
      );
      return true;
    } catch (error) {
      console.error('Error inviting family member:', error);
      return false;
    }
  };

  const removeMember = async (userId: string): Promise<boolean> => {
    if (!isClient || !user?.uid || !familyData || typeof window === 'undefined') {
      console.error('No user or family data available, or not in browser context');
      return false;
    }

    try {
      const success = await familyService.removeFamilyMember(familyData.id, userId, user.uid);
      if (success) {
        // Refresh family data
        await loadFamilyData();
      }
      return success;
    } catch (error) {
      console.error('Error removing family member:', error);
      return false;
    }
  };

  const updateMemberRole = async (userId: string, newRole: string): Promise<boolean> => {
    if (!isClient || !user?.uid || !familyData || typeof window === 'undefined') {
      console.error('No user or family data available, or not in browser context');
      return false;
    }

    try {
      const success = await familyService.updateMemberRole(familyData.id, userId, newRole, user.uid);
      if (success) {
        // Refresh family data
        await loadFamilyData();
      }
      return success;
    } catch (error) {
      console.error('Error updating member role:', error);
      return false;
    }
  };

  // Add this new function to explicitly load family data when needed
  const loadFamilyDataExplicit = async (): Promise<boolean> => {
    if (!isClient || !user?.uid || typeof window === 'undefined') {
      console.error('Cannot load family data: no user or not in browser context');
      return false;
    }

    try {
      setIsLoading(true);
      
      const family = await familyService.getFamilyByUserId(user.uid);
      
      if (family) {
        setFamilyData(family);

        // Extract family members as array
        const membersArray = Object.values(family.members);
        setFamilyMembers(membersArray);

        // Find current user's role in the family
        const currentMember = family.members[user.uid];
        if (currentMember) {
          updateAbility(currentMember);
          return true;
        }
      }
      
      return false;
    } catch (error) {
      console.error('Error loading family data:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const value: CASLContextType = {
    ability,
    updateAbility,
    isLoading,
    familyMembers,
    currentMemberRole,
    familyData,
    inviteMember,
    removeMember,
    updateMemberRole,
    loadFamilyDataExplicit
  };

  return (
    <CASLContext.Provider value={value}>
      {children}
    </CASLContext.Provider>
  );
}

export function useCASL() {
  const context = useContext(CASLContext);
  if (!context) {
    throw new Error('useCASL must be used within a CASLProvider');
  }
  return context;
}

// Convenience hooks for common permission checks
export function useCanViewFinancials() {
  const { ability } = useCASL();
  return ability.can('view', 'NetWorth');
}

export function useCanManageTransactions() {
  const { ability } = useCASL();
  return ability.can('create', 'Transaction');
}

export function useCanManageFamily() {
  const { ability } = useCASL();
  return ability.can('invite', 'FamilyMember');
}

export function useCanViewTransactionDetails() {
  const { ability } = useCASL();
  return ability.can('view', 'Transaction');
}

export function useCanManageBudgets() {
  const { ability } = useCASL();
  return ability.can('create', 'Budget');
}

export function useCanManageGoals() {
  const { ability } = useCASL();
  return ability.can('create', 'Goal');
}

export function useIsAdminRole() {
  const { currentMemberRole } = useCASL();
  return ['principal', 'co-principal', 'partner'].includes(currentMemberRole || '');
}

export function useIsPrincipal() {
  const { currentMemberRole } = useCASL();
  return currentMemberRole === 'principal';
}

// Create a wrapper Can component that uses the ability from context
export function Can({ I, a, fallback, children }: {
  I: Actions;
  a: Subjects;
  fallback?: React.ReactNode;
  children?: React.ReactNode;
}) {
  const { ability } = useCASL();
  
  if (ability.can(I, a)) {
    return <>{children}</>;
  }
  
  return <>{fallback}</>;
} 
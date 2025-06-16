'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  Crown, 
  Shield, 
  UserPlus, 
  Mail, 
  Settings, 
  MoreVertical,
  Eye,
  EyeOff,
  Trash2,
  Edit,
  Check,
  X,
  AlertTriangle,
  Plus,
  Lock,
  Unlock,
  Copy,
  ChevronDown,
  Save,
  Info,
  TrendingUp,
  DollarSign,
  Target,
  CheckCircle,
  XCircle,
  RefreshCw,
  FileText
} from 'lucide-react';
import { GlassContainer } from '@/components/ui/GlassContainer';
import { GlassButton } from '@/components/ui/GlassButton';
import { CollapsibleCard } from '@/components/ui/CollapsibleCard';
import { Can, useCASL, useCanManageFamily, useIsPrincipal } from '@/lib/auth/casl-provider';
import { FamilyMember } from '@/types/permissions';
import { useAuth } from '@/lib/firebase/auth-context';
import { collection, query, orderBy, limit, onSnapshot, doc, updateDoc, deleteDoc, getDocs } from 'firebase/firestore';
import { getFirebaseDb } from '@/lib/firebase/config';

import { familyService, FamilyInvitation } from '@/lib/firebase/family-service';
import { useToast } from '@/hooks/useToast';

interface CustomRole {
  id: string;
  name: string;
  description: string;
  permissions: {
    financial: {
      viewNetWorth: boolean;
      viewTransactions: boolean;
      addTransactions: boolean;
      editTransactions: boolean;
      deleteTransactions: boolean;
      viewGoals: boolean;
      addGoals: boolean;
      editGoals: boolean;
    };
    budgets: {
      view: boolean;
      create: boolean;
      edit: boolean;
      delete: boolean;
    };
    family: {
      invite: boolean;
      remove: boolean;
      editRoles: boolean;
    };
    admin: {
      settings: boolean;
      export: boolean;
      archive: boolean;
    };
  };
  isSystem: boolean;
  createdBy: string;
  createdAt: Date;
}

interface AuditLogItem {
  id: string;
  timestamp: Date;
  user: string;
  action: string;
  details: string;
  category: string;
  severity: 'low' | 'medium' | 'high';
}

interface CreateRoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateRole: (role: Omit<CustomRole, 'id' | 'createdAt'>) => Promise<void>;
}

function CreateRoleModal({ isOpen, onClose, onCreateRole }: CreateRoleModalProps) {
  const [roleName, setRoleName] = useState('');
  const [roleDescription, setRoleDescription] = useState('');
  const [permissions, setPermissions] = useState({
    financial: {
      viewNetWorth: false,
      viewTransactions: true,
      addTransactions: false,
      editTransactions: false,
      deleteTransactions: false,
      viewGoals: true,
      addGoals: false,
      editGoals: false,
    },
    budgets: {
      view: true,
      create: false,
      edit: false,
      delete: false,
    },
    family: {
      invite: false,
      remove: false,
      editRoles: false,
    },
    admin: {
      settings: false,
      export: false,
      archive: false,
    },
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlePermissionToggle = (category: string, permission: string) => {
    setPermissions(prev => {
      const categoryKey = category as keyof typeof prev;
      const categoryPerms = prev[categoryKey];
      const permissionKey = permission as keyof typeof categoryPerms;
      
      return {
        ...prev,
        [category]: {
          ...categoryPerms,
          [permission]: !categoryPerms[permissionKey]
        }
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleName.trim()) return;

    setIsSubmitting(true);
    try {
      await onCreateRole({
        name: roleName,
        description: roleDescription,
        permissions,
        isSystem: false,
        createdBy: 'current-user' // TODO: Get from auth context
      });
      setRoleName('');
      setRoleDescription('');
      setPermissions({
        financial: {
          viewNetWorth: false,
          viewTransactions: true,
          addTransactions: false,
          editTransactions: false,
          deleteTransactions: false,
          viewGoals: true,
          addGoals: false,
          editGoals: false,
        },
        budgets: {
          view: true,
          create: false,
          edit: false,
          delete: false,
        },
        family: {
          invite: false,
          remove: false,
          editRoles: false,
        },
        admin: {
          settings: false,
          export: false,
          archive: false,
        },
      });
      onClose();
    } catch (error) {
      console.error('Error creating role:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="glass-container p-4 md:p-6 w-full max-w-full md:max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl"
      >
        <div className="flex items-center justify-between mb-4 md:mb-6">
          <h3 className="text-lg md:text-xl font-light text-primary">Create Custom Role</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-primary/5 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-primary/60" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-primary mb-2">
                Role Name
              </label>
              <input
                type="text"
                value={roleName}
                onChange={(e) => setRoleName(e.target.value)}
                className="glass-input w-full text-sm md:text-base"
                placeholder="e.g., Teen Manager"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-primary mb-2">
                Description
              </label>
              <input
                type="text"
                value={roleDescription}
                onChange={(e) => setRoleDescription(e.target.value)}
                className="glass-input w-full text-sm md:text-base"
                placeholder="Brief description of this role"
              />
            </div>
          </div>

          {/* Permission Categories */}
          <div className="space-y-4 md:space-y-6">
            {Object.entries(permissions).map(([category, categoryPerms]) => (
              <div key={category} className="glass-subtle p-3 md:p-4 rounded-xl">
                <h4 className="font-medium text-primary mb-3 capitalize flex items-center gap-2 text-sm md:text-base">
                  {category === 'financial' && <Eye className="w-4 h-4 text-gold" />}
                  {category === 'budgets' && <Settings className="w-4 h-4 text-blue-500" />}
                  {category === 'family' && <Users className="w-4 h-4 text-green-500" />}
                  {category === 'admin' && <Shield className="w-4 h-4 text-purple-500" />}
                  {category} Permissions
                </h4>
                <div className="space-y-2">
                  {Object.entries(categoryPerms).map(([permission, enabled]) => (
                    <label key={`${category}-${permission}`} className="flex items-center gap-3 cursor-pointer p-2 hover:bg-primary/5 rounded-lg transition-colors">
                      <input
                        type="checkbox"
                        checked={enabled}
                        onChange={() => handlePermissionToggle(category, permission)}
                        className="w-4 h-4 text-gold border-gray-300 rounded focus:ring-gold"
                      />
                      <span className="text-sm text-primary capitalize">
                        {permission.replace(/([A-Z])/g, ' $1').toLowerCase()}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-col md:flex-row gap-3 pt-4">
            <GlassButton
              type="button"
              onClick={onClose}
              variant="ghost"
              className="flex-1 py-3"
              disabled={isSubmitting}
            >
              Cancel
            </GlassButton>
            <GlassButton
              type="submit"
              variant="primary"
              goldBorder
              disabled={isSubmitting || !roleName.trim()}
              className="flex-1 py-3"
            >
              {isSubmitting ? 'Creating...' : 'Create Role'}
            </GlassButton>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

interface InviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInvite: (email: string, role: string, message?: string) => Promise<void>;
  customRoles: CustomRole[];
}

function InviteMemberModal({ isOpen, onClose, onInvite, customRoles }: InviteModalProps) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('child');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsSubmitting(true);
    try {
      await onInvite(email, role, message.trim() || undefined);
      setEmail('');
      setRole('child');
      setMessage('');
      onClose();
    } catch (error) {
      console.error('Error inviting member:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end md:items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, y: '100%' }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className="glass-container p-4 md:p-6 w-full md:max-w-md rounded-t-2xl md:rounded-2xl"
      >
        <div className="flex items-center justify-between mb-4 md:mb-6">
          <h3 className="text-lg md:text-xl font-light text-primary">Invite Family Member</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-primary/5 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-primary/60" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-primary mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="glass-input w-full text-sm md:text-base"
              placeholder="member@example.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-primary mb-2">
              Role & Permissions
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="glass-input w-full text-sm md:text-base"
            >
              <optgroup label="System Roles">
                <option value="child">Child (Limited Access)</option>
                <option value="parent">Parent (View Only)</option>
                <option value="partner">Partner (Full Access)</option>
                <option value="co-principal">Co-Principal (Admin)</option>
              </optgroup>
              {customRoles.length > 0 && (
                <optgroup label="Custom Roles">
                  {customRoles.map((customRole) => (
                    <option key={customRole.id} value={customRole.id}>
                      {customRole.name} ({customRole.description})
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-primary mb-2">
              Personal Message (Optional)
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="glass-input w-full text-sm md:text-base resize-none"
              placeholder="Add a personal message to your invitation..."
              rows={3}
            />
          </div>

          <div className="flex flex-col md:flex-row gap-3 mt-6">
            <GlassButton
              type="button"
              onClick={onClose}
              variant="ghost"
              className="flex-1 py-3"
            >
              Cancel
            </GlassButton>
            <GlassButton
              type="submit"
              variant="primary"
              goldBorder
              disabled={isSubmitting}
              className="flex-1 py-3"
            >
              {isSubmitting ? 'Inviting...' : 'Send Invite'}
            </GlassButton>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

interface MemberRoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: FamilyMember | null;
  onUpdateRole: (memberId: string, newRole: string) => Promise<void>;
  customRoles: CustomRole[];
}

function MemberRoleModal({ isOpen, onClose, member, onUpdateRole, customRoles }: MemberRoleModalProps) {
  const [selectedRole, setSelectedRole] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (member) {
      setSelectedRole(member.role);
    }
  }, [member]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!member || !selectedRole) return;

    setIsSubmitting(true);
    try {
      await onUpdateRole(member.uid, selectedRole);
      onClose();
    } catch (error) {
      console.error('Error updating role:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !member) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end md:items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, y: '100%' }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className="glass-container p-4 md:p-6 w-full md:max-w-md rounded-t-2xl md:rounded-2xl"
      >
        <div className="flex items-center justify-between mb-4 md:mb-6">
          <h3 className="text-lg md:text-xl font-light text-primary">Update Member Role</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-primary/5 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-primary/60" />
          </button>
        </div>

        <div className="mb-4 p-3 md:p-4 glass-subtle rounded-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-gold/20 to-primary/20 rounded-full flex items-center justify-center">
              <span className="text-sm font-medium text-primary">
                {member.displayName?.split(' ').map(n => n[0]).join('') || 'U'}
              </span>
            </div>
            <div>
              <h4 className="font-medium text-primary text-sm md:text-base">{member.displayName}</h4>
              <p className="text-xs md:text-sm text-primary/60">{member.email}</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-primary mb-2">
              Select New Role
            </label>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="glass-input w-full text-sm md:text-base"
            >
              <optgroup label="System Roles">
                <option value="child">Child (Limited Access)</option>
                <option value="parent">Parent (View Only)</option>
                <option value="partner">Partner (Full Access)</option>
                <option value="co-principal">Co-Principal (Admin)</option>
              </optgroup>
              {customRoles.length > 0 && (
                <optgroup label="Custom Roles">
                  {customRoles.map((customRole) => (
                    <option key={customRole.id} value={customRole.id}>
                      {customRole.name}
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
          </div>

          <div className="flex flex-col md:flex-row gap-3 mt-6">
            <GlassButton
              type="button"
              onClick={onClose}
              variant="ghost"
              className="flex-1 py-3"
            >
              Cancel
            </GlassButton>
            <GlassButton
              type="submit"
              variant="primary"
              goldBorder
              disabled={isSubmitting}
              className="flex-1 py-3"
            >
              {isSubmitting ? 'Updating...' : 'Update Role'}
            </GlassButton>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

function getRoleIcon(role: string) {
  switch (role) {
    case 'principal':
      return <Crown className="w-4 h-4 text-gold" />;
    case 'co-principal':
      return <Crown className="w-4 h-4 text-blue-500" />;
    case 'partner':
      return <Shield className="w-4 h-4 text-green-500" />;
    case 'parent':
      return <Eye className="w-4 h-4 text-purple-500" />;
    default:
      return <Users className="w-4 h-4 text-gray-500" />;
  }
}

function getRoleColor(role: string) {
  switch (role) {
    case 'principal':
      return 'bg-gold/10 text-gold';
    case 'co-principal':
      return 'bg-blue-500/10 text-blue-500';
    case 'partner':
      return 'bg-green-500/10 text-green-500';
    case 'parent':
      return 'bg-purple-500/10 text-purple-500';
    default:
      return 'bg-gray-500/10 text-gray-500';
  }
}

interface FamilySettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function FamilySettingsModal({ isOpen, onClose }: FamilySettingsModalProps) {
  const [familySettings, setFamilySettings] = useState({
    familyName: 'Smith Family',
    currency: 'USD',
    timezone: 'America/New_York',
    privacy: {
      allowDataSharing: true,
      crossAccountVisibility: 'admins',
      transactionApprovalRequired: false
    },
    limits: {
      maxMembers: 10,
      transactionLimit: 1000,
      goalSharingEnabled: true
    }
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // TODO: Save to Firebase
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('Family settings saved:', familySettings);
      onClose();
    } catch (error) {
      console.error('Error saving family settings:', error);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="glass-container p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-light text-primary">Family Settings</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-primary/5 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-primary/60" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Basic Settings */}
          <div className="space-y-4">
            <h4 className="font-medium text-primary">Basic Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-primary mb-2">Family Name</label>
                <input
                  type="text"
                  value={familySettings.familyName}
                  onChange={(e) => setFamilySettings(prev => ({ ...prev, familyName: e.target.value }))}
                  className="glass-input w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-primary mb-2">Default Currency</label>
                <select
                  value={familySettings.currency}
                  onChange={(e) => setFamilySettings(prev => ({ ...prev, currency: e.target.value }))}
                  className="glass-input w-full"
                >
                  <option value="USD">USD - US Dollar</option>
                  <option value="EUR">EUR - Euro</option>
                  <option value="GBP">GBP - British Pound</option>
                  <option value="NGN">NGN - Nigerian Naira</option>
                </select>
              </div>
            </div>
          </div>

          {/* Privacy Settings */}
          <div className="space-y-4">
            <h4 className="font-medium text-primary">Privacy & Sharing</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-primary">Allow Data Sharing</p>
                  <p className="text-sm text-primary/60">Enable sharing financial insights between family members</p>
                </div>
                <button
                  onClick={() => setFamilySettings(prev => ({
                    ...prev,
                    privacy: { ...prev.privacy, allowDataSharing: !prev.privacy.allowDataSharing }
                  }))}
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    familySettings.privacy.allowDataSharing ? 'bg-gold' : 'bg-gray-300'
                  }`}
                >
                  <motion.div
                    animate={{ x: familySettings.privacy.allowDataSharing ? 24 : 0 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md"
                  />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-primary">Cross-Account Visibility</p>
                  <p className="text-sm text-primary/60">Who can see transactions across family accounts</p>
                </div>
                <select
                  value={familySettings.privacy.crossAccountVisibility}
                  onChange={(e) => setFamilySettings(prev => ({
                    ...prev,
                    privacy: { ...prev.privacy, crossAccountVisibility: e.target.value }
                  }))}
                  className="glass-input w-32"
                >
                  <option value="none">None</option>
                  <option value="admins">Admins Only</option>
                  <option value="all">All Members</option>
                </select>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex gap-3 pt-4">
            <GlassButton
              type="button"
              onClick={onClose}
              variant="ghost"
              className="flex-1"
              disabled={isSaving}
            >
              Cancel
            </GlassButton>
            <GlassButton
              onClick={handleSave}
              variant="primary"
              goldBorder
              disabled={isSaving}
              className="flex-1"
            >
              {isSaving ? 'Saving...' : 'Save Settings'}
            </GlassButton>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

interface FamilyExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  familyMembers: FamilyMember[];
}

function FamilyExportModal({ isOpen, onClose, familyMembers }: FamilyExportModalProps) {
  const { user } = useAuth();
  const [exportOptions, setExportOptions] = useState({
    format: 'csv' as 'csv' | 'json' | 'pdf',
    scope: 'all' as 'all' | 'transactions' | 'goals' | 'budgets' | 'members',
    dateRange: '1y' as 'all' | '1y' | '6m' | '3m',
    includeMembers: ['all'] as string[],
    includeSensitive: false
  });
  const [isExporting, setIsExporting] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);

  const fetchExportData = async () => {
    if (!user) return null;

    const db = getFirebaseDb();
    if (!db) return null;

    try {
      const data: any = {
        exportInfo: {
          familyId: user.uid,
          exportedBy: user.displayName || user.email,
          exportedAt: new Date().toISOString(),
          scope: exportOptions.scope,
          dateRange: exportOptions.dateRange
        }
      };

      // Fetch based on scope
      if (exportOptions.scope === 'all' || exportOptions.scope === 'transactions') {
        const transactionsRef = collection(db, 'users', user.uid, 'transactions');
        const transactionsSnap = await getDocs(transactionsRef);
        data.transactions = [];
        transactionsSnap.forEach((doc) => {
          const transaction = doc.data();
          data.transactions.push({
            id: doc.id,
            type: transaction.type,
            amount: transaction.amount,
            currency: transaction.currency || 'USD',
            category: transaction.category,
            description: transaction.description,
            date: transaction.date?.toDate?.()?.toISOString() || transaction.date,
            createdAt: transaction.createdAt?.toDate?.()?.toISOString() || transaction.createdAt
          });
        });
      }

      if (exportOptions.scope === 'all' || exportOptions.scope === 'goals') {
        const goalsRef = collection(db, 'users', user.uid, 'goals');
        const goalsSnap = await getDocs(goalsRef);
        data.goals = [];
        goalsSnap.forEach((doc) => {
          const goal = doc.data();
          data.goals.push({
            id: doc.id,
            name: goal.name,
            targetAmount: goal.targetAmount,
            currentAmount: goal.currentAmount,
            isCompleted: goal.isCompleted,
            createdAt: goal.createdAt?.toDate?.()?.toISOString() || goal.createdAt
          });
        });
      }

      if (exportOptions.scope === 'all' || exportOptions.scope === 'budgets') {
        const budgetsRef = collection(db, 'users', user.uid, 'budgets');
        const budgetsSnap = await getDocs(budgetsRef);
        data.budgets = [];
        budgetsSnap.forEach((doc) => {
          const budget = doc.data();
          data.budgets.push({
            id: doc.id,
            name: budget.name,
            amount: budget.amount,
            period: budget.period,
            category: budget.category,
            createdAt: budget.createdAt?.toDate?.()?.toISOString() || budget.createdAt
          });
        });
      }

      if (exportOptions.scope === 'all' || exportOptions.scope === 'members') {
        // Get family members data
        data.familyMembers = familyMembers.map((member: FamilyMember) => ({
          uid: member.uid,
          email: member.email,
          displayName: member.displayName,
          role: member.role,
          status: member.status,
          joinedAt: member.joinedAt
        }));
      }

      return data;
    } catch (error) {
      console.error('Error fetching export data:', error);
      return null;
    }
  };

  const generateCSV = (data: any) => {
    let csv = '';
    
    if (data.transactions) {
      csv += 'TRANSACTIONS\n';
      csv += 'ID,Type,Amount,Currency,Category,Description,Date,Created At\n';
      data.transactions.forEach((t: any) => {
        csv += `"${t.id}","${t.type}","${t.amount}","${t.currency}","${t.category}","${t.description}","${t.date}","${t.createdAt}"\n`;
      });
      csv += '\n';
    }

    if (data.goals) {
      csv += 'GOALS\n';
      csv += 'ID,Name,Target Amount,Current Amount,Completed,Created At\n';
      data.goals.forEach((g: any) => {
        csv += `"${g.id}","${g.name}","${g.targetAmount}","${g.currentAmount}","${g.isCompleted}","${g.createdAt}"\n`;
      });
      csv += '\n';
    }

    if (data.budgets) {
      csv += 'BUDGETS\n';
      csv += 'ID,Name,Amount,Period,Category,Created At\n';
      data.budgets.forEach((b: any) => {
        csv += `"${b.id}","${b.name}","${b.amount}","${b.period}","${b.category}","${b.createdAt}"\n`;
      });
      csv += '\n';
    }

    if (data.familyMembers) {
      csv += 'FAMILY MEMBERS\n';
      csv += 'UID,Email,Display Name,Role,Status,Joined At\n';
      data.familyMembers.forEach((m: any) => {
        csv += `"${m.uid}","${m.email}","${m.displayName}","${m.role}","${m.status}","${m.joinedAt}"\n`;
      });
    }

    return csv;
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const exportData = await fetchExportData();
      
      if (!exportData) {
        alert('Failed to fetch data for export. Please try again.');
        return;
      }

      // Calculate record count
      const recordCount = (exportData.transactions?.length || 0) + 
                         (exportData.goals?.length || 0) + 
                         (exportData.budgets?.length || 0) + 
                         (exportData.familyMembers?.length || 0);

      if (recordCount === 0) {
        alert('No data found to export. Please add some financial data first.');
        return;
      }

      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `dailyowo-export-${exportOptions.scope}-${timestamp}.${exportOptions.format}`;
      
      let content = '';
      let mimeType = '';

      if (exportOptions.format === 'json') {
        content = JSON.stringify(exportData, null, 2);
        mimeType = 'application/json';
      } else if (exportOptions.format === 'csv') {
        content = generateCSV(exportData);
        mimeType = 'text/csv';
      } else if (exportOptions.format === 'pdf') {
        // For PDF, we'll create a simple text report
        content = `DailyOwo Financial Export Report
        
Export Date: ${new Date().toLocaleDateString()}
Export Scope: ${exportOptions.scope}
Total Records: ${recordCount}

${exportData.transactions ? `Transactions: ${exportData.transactions.length}\n` : ''}
${exportData.goals ? `Goals: ${exportData.goals.length}\n` : ''}
${exportData.budgets ? `Budgets: ${exportData.budgets.length}\n` : ''}
${exportData.familyMembers ? `Family Members: ${exportData.familyMembers.length}\n` : ''}

Note: This is a simplified PDF export. For detailed data, please use CSV or JSON format.`;
        mimeType = 'text/plain';
      }
      
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      console.log('Export completed:', {
        scope: exportOptions.scope,
        format: exportOptions.format,
        recordCount,
        filename
      });
      
      // Show success message
      alert(`Successfully exported ${recordCount} records to ${filename}`);
      onClose();
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  // Load preview data when options change
  useEffect(() => {
    if (isOpen && user) {
      fetchExportData().then(setPreviewData);
    }
  }, [isOpen, exportOptions.scope, user]);

  if (!isOpen) return null;

  const recordCount = previewData ? 
    (previewData.transactions?.length || 0) + 
    (previewData.goals?.length || 0) + 
    (previewData.budgets?.length || 0) + 
    (previewData.familyMembers?.length || 0) : 0;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="glass-container p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-light text-primary">Export DailyOwo Data</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-primary/5 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-primary/60" />
          </button>
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-primary mb-2">Format</label>
              <select
                value={exportOptions.format}
                onChange={(e) => setExportOptions(prev => ({ ...prev, format: e.target.value as any }))}
                className="glass-input w-full"
              >
                <option value="csv">CSV (Spreadsheet)</option>
                <option value="json">JSON (Raw Data)</option>
                <option value="pdf">PDF (Report)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-primary mb-2">Scope</label>
              <select
                value={exportOptions.scope}
                onChange={(e) => setExportOptions(prev => ({ ...prev, scope: e.target.value as any }))}
                className="glass-input w-full"
              >
                <option value="all">All Data</option>
                <option value="transactions">Transactions Only</option>
                <option value="goals">Goals Only</option>
                <option value="budgets">Budgets Only</option>
                <option value="members">Family Members Only</option>
              </select>
            </div>
          </div>

          {/* Preview Section */}
          {previewData && (
            <div className="p-4 glass-subtle rounded-xl">
              <h4 className="font-medium text-primary mb-3">Export Preview</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                {previewData.transactions && (
                  <div>
                    <span className="text-primary/60">Transactions:</span>
                    <span className="ml-2 font-medium text-primary">{previewData.transactions.length}</span>
                  </div>
                )}
                {previewData.goals && (
                  <div>
                    <span className="text-primary/60">Goals:</span>
                    <span className="ml-2 font-medium text-primary">{previewData.goals.length}</span>
                  </div>
                )}
                {previewData.budgets && (
                  <div>
                    <span className="text-primary/60">Budgets:</span>
                    <span className="ml-2 font-medium text-primary">{previewData.budgets.length}</span>
                  </div>
                )}
                {previewData.familyMembers && (
                  <div>
                    <span className="text-primary/60">Members:</span>
                    <span className="ml-2 font-medium text-primary">{previewData.familyMembers.length}</span>
                  </div>
                )}
              </div>
              <div className="mt-2 pt-2 border-t border-gray-200">
                <span className="text-primary/60">Total Records:</span>
                <span className="ml-2 font-medium text-gold">{recordCount}</span>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <GlassButton
              type="button"
              onClick={onClose}
              variant="ghost"
              className="flex-1"
              disabled={isExporting}
            >
              Cancel
            </GlassButton>
            <GlassButton
              onClick={handleExport}
              variant="primary"
              goldBorder
              disabled={isExporting || recordCount === 0}
              className="flex-1"
            >
              {isExporting ? 'Exporting...' : `Export ${recordCount} Records`}
            </GlassButton>
          </div>

          {recordCount === 0 && (
            <div className="text-center p-4 text-primary/60 text-sm">
              No data available for export. Add some transactions, goals, or budgets first.
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

interface AuditLogModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function AuditLogModal({ isOpen, onClose }: AuditLogModalProps) {
  const { user } = useAuth();
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isOpen || !user) return;

    const db = getFirebaseDb();
    if (!db) return;

    // Subscribe to real audit logs from Firebase
    const auditRef = collection(db, 'users', user.uid, 'audit_logs');
    const auditQuery = query(auditRef, orderBy('timestamp', 'desc'), limit(50));

    const unsubscribe = onSnapshot(auditQuery, (snapshot) => {
      const logs: AuditLogItem[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        logs.push({
          id: doc.id,
          timestamp: data.timestamp?.toDate() || new Date(),
          user: data.user || user.displayName || 'User',
          action: data.action || 'Unknown Action',
          details: data.details || 'No details available',
          category: data.category || 'general',
          severity: (data.severity as 'low' | 'medium' | 'high') || 'low'
        });
      });
      
      // If no real logs exist, show helpful placeholder
      if (logs.length === 0) {
        logs.push({
          id: 'placeholder-1',
          timestamp: new Date(Date.now() - 5 * 60 * 1000),
          user: user.displayName || 'You',
          action: 'Account setup',
          details: 'Profile created and initial setup completed',
          category: 'account',
          severity: 'medium'
        });
      }
      
      setAuditLogs(logs);
      setIsLoading(false);
    }, (error) => {
      console.error('Error loading audit logs:', error);
      // Fallback to placeholder data
      setAuditLogs([{
        id: 'error-placeholder',
        timestamp: new Date(),
        user: 'System',
        action: 'Error loading logs',
        details: 'Please check your permissions and try again',
        category: 'error',
        severity: 'high'
      }]);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [isOpen, user]);

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="glass-container max-w-2xl w-full max-h-[80vh] overflow-hidden"
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-light text-primary">DailyOwo Activity Log</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-primary/60" />
          </button>
        </div>

        <div className="space-y-4 max-h-96 overflow-y-auto p-6">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin w-8 h-8 border-2 border-gold border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-primary/60">Loading activity logs...</p>
            </div>
          ) : (
            auditLogs.map((log) => (
              <div key={log.id} className="glass-subtle p-4 rounded-xl">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-primary">{log.action}</span>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        log.severity === 'high' ? 'bg-red-100 text-red-700' :
                        log.severity === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {log.category}
                      </span>
                    </div>
                    <p className="text-sm text-primary/60 mb-2">{log.details}</p>
                    <div className="flex items-center gap-4 text-xs text-primary/40">
                      <span>By: {log.user}</span>
                      <span>{formatTime(log.timestamp)}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="mt-6 pt-4 border-t border-gray-200 p-6">
          <GlassButton
            onClick={onClose}
            variant="primary"
            goldBorder
            className="w-full"
          >
            Close Activity Log
          </GlassButton>
        </div>
      </motion.div>
    </div>
  );
}

export function FamilyManagementSection() {
  const { success: toastSuccess, error: toastError } = useToast();
  const { 
    familyMembers, 
    isLoading: caslLoading,
    inviteMember: inviteFamilyMember,
    removeMember: removeFamilyMember,
    updateMemberRole: updateRole,
    loadFamilyDataExplicit,
    familyData
  } = useCASL();
  const { user } = useAuth();
  const canManageFamily = useCanManageFamily();
  const isPrincipal = useIsPrincipal();
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isCreateRoleModalOpen, setIsCreateRoleModalOpen] = useState(false);
  const [isMemberRoleModalOpen, setIsMemberRoleModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<FamilyMember | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'members' | 'roles' | 'invitations' | 'admin'>('members');
  const [hasLoadedFamilyData, setHasLoadedFamilyData] = useState(false);
  const [invitations, setInvitations] = useState<FamilyInvitation[]>([]);
  const [isLoadingInvitations, setIsLoadingInvitations] = useState(false);
  
  // Mock custom roles (in production, this would come from Firebase)
  const [customRoles, setCustomRoles] = useState<CustomRole[]>([
    {
      id: 'teen-manager',
      name: 'Teen Manager',
      description: 'Limited spending tracking for teenagers',
      permissions: {
        financial: {
          viewNetWorth: false,
          viewTransactions: true,
          addTransactions: true,
          editTransactions: false,
          deleteTransactions: false,
          viewGoals: true,
          addGoals: true,
          editGoals: false,
        },
        budgets: {
          view: true,
          create: false,
          edit: false,
          delete: false,
        },
        family: {
          invite: false,
          remove: false,
          editRoles: false,
        },
        admin: {
          settings: false,
          export: false,
          archive: false,
        },
      },
      isSystem: false,
      createdBy: 'principal-user',
      createdAt: new Date('2024-01-15')
    }
  ]);

  // Load family data when component mounts if user wants to use family features
  useEffect(() => {
    const loadFamilyIfNeeded = async () => {
      if (!hasLoadedFamilyData && user) {
        const loaded = await loadFamilyDataExplicit();
        setHasLoadedFamilyData(true);
        
        // If no family exists, we might need to create one
        if (!loaded) {
          console.log('No family found for user. Family will be created when first member is invited.');
        } else if (familyData) {
          // Load invitations if family exists
          loadInvitations();
        }
      }
    };
    
    loadFamilyIfNeeded();
  }, [user, hasLoadedFamilyData, loadFamilyDataExplicit, familyData]);

  // Load invitations when family data is available
  const loadInvitations = async () => {
    if (!familyData) return;
    
    setIsLoadingInvitations(true);
    try {
      const familyInvitations = await familyService.getAllFamilyInvitations(familyData.id);
      setInvitations(familyInvitations);
    } catch (error) {
      console.error('Error loading invitations:', error);
    } finally {
      setIsLoadingInvitations(false);
    }
  };

  const createCustomRole = async (roleData: Omit<CustomRole, 'id' | 'createdAt'>) => {
    try {
      const newRole: CustomRole = {
        ...roleData,
        id: `custom-${Date.now()}`,
        createdAt: new Date()
      };
      
      setCustomRoles(prev => [...prev, newRole]);
      console.log('Custom role created:', newRole);
      // TODO: Save to Firebase
    } catch (error) {
      console.error('Error creating custom role:', error);
      throw error;
    }
  };

  const inviteMember = async (email: string, role: string, message?: string) => {
    setIsLoading(true);
    try {
      // Ensure family data is loaded
      if (!familyData && user) {
        // Try to load family data first
        const loaded = await loadFamilyDataExplicit();
        
        if (!loaded) {
          // No family exists, we need to create one
          console.log('Creating family for user before inviting member...');
          
          // Create the family
          const newFamily = await familyService.createFamily(
            user.uid,
            user.email || '',
            user.displayName || 'User'
          );
          
          // Load the newly created family data
          const familyLoaded = await loadFamilyDataExplicit();
          
          if (!familyLoaded) {
            throw new Error('Failed to load family data after creation');
          }
        }
      }
      
      const success = await inviteFamilyMember(email, role, message);
      if (success) {
        console.log('Family invitation sent successfully');
        toastSuccess('Invitation sent', `Successfully invited ${email} to your family.`);
        
        // Reload family data to update the UI
        await loadFamilyDataExplicit();
        // Reload invitations
        await loadInvitations();
      } else {
        throw new Error('Failed to send invitation');
      }
    } catch (error) {
      console.error('Error inviting member:', error);
      toastError('Error', error instanceof Error ? error.message : 'Failed to invite family member');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const cancelInvitation = async (invitationId: string) => {
    if (!confirm('Are you sure you want to cancel this invitation?')) return;
    
    try {
      const success = await familyService.cancelInvitation(invitationId);
      if (success) {
        toastSuccess('Invitation cancelled', 'The invitation has been cancelled');
        await loadInvitations();
      }
    } catch (error) {
      console.error('Error cancelling invitation:', error);
      toastError('Error', 'Failed to cancel invitation');
    }
  };

  const removeMember = async (memberId: string) => {
    if (!confirm('Are you sure you want to remove this family member?')) return;
    
    try {
      setIsLoading(true);
      const success = await removeFamilyMember(memberId);
      if (success) {
        console.log('Family member removed successfully');
        // TODO: Show success toast notification
        toastSuccess('Member removed', 'Family member has been removed successfully');
        // Reload family data to update the UI
        await loadFamilyDataExplicit();
      } else {
        throw new Error('Failed to remove family member');
      }
    } catch (error) {
      console.error('Error removing member:', error);
      // TODO: Show error toast notification
      toastError('Error', error instanceof Error ? error.message : 'Failed to remove family member');
    } finally {
      setIsLoading(false);
    }
  };

  const editMemberRole = async (memberId: string, newRole: string) => {
    try {
      setIsLoading(true);
      const success = await updateRole(memberId, newRole);
      if (success) {
        console.log('Member role updated successfully');
        // TODO: Show success toast notification
        toastSuccess('Role updated', 'Member role has been updated successfully');
        // Reload family data to update the UI
        await loadFamilyDataExplicit();
      } else {
        throw new Error('Failed to update member role');
      }
    } catch (error) {
      console.error('Error changing member role:', error);
      // TODO: Show error toast notification
      toastError('Error', error instanceof Error ? error.message : 'Failed to update member role');
    } finally {
      setIsLoading(false);
    }
  };

  const openMemberRoleModal = (member: FamilyMember) => {
    setSelectedMember(member);
    setIsMemberRoleModalOpen(true);
  };

  // Custom role deletion function
  const deleteCustomRole = async (roleId: string) => {
    if (!confirm('Are you sure you want to delete this custom role? This action cannot be undone.')) {
      return;
    }

    try {
      // TODO: Check if any family members are using this role
      const membersUsingRole = familyMembers.filter(member => member.role === roleId);
      if (membersUsingRole.length > 0) {
        alert(`Cannot delete role: ${membersUsingRole.length} family member(s) are currently using this role. Please reassign them first.`);
        return;
      }

      // Remove from local state
      setCustomRoles(prev => prev.filter(role => role.id !== roleId));
      
      // TODO: Delete from Firebase
      const db = getFirebaseDb();
      if (db && user) {
        await deleteDoc(doc(db, 'users', user.uid, 'custom_roles', roleId));
      }
      
      console.log('Custom role deleted:', roleId);
    } catch (error) {
      console.error('Error deleting custom role:', error);
      alert('Failed to delete custom role. Please try again.');
    }
  };

  if (caslLoading) {
    return (
      <CollapsibleCard
        title="Family Management"
        subtitle="Loading family information..."
        icon={<Users className="w-5 h-5 text-gold" />}
        className="space-y-4"
      >
        <div className="animate-pulse">
          <div className="h-24 bg-gray-200 rounded-xl mb-3"></div>
          <div className="h-16 bg-gray-200 rounded-xl"></div>
        </div>
      </CollapsibleCard>
    );
  }

  return (
    <>
      <CollapsibleCard
        title="Family Management"
        subtitle={`${familyMembers.length} members • ${customRoles.length} custom roles`}
        icon={<Users className="w-5 h-5 text-gold" />}
        className="space-y-3"
      >
        <div className="space-y-3">
          {/* Compact Action Bar */}
          <div className="flex items-center justify-between gap-2 p-3 glass-subtle rounded-lg">
            <div className="flex gap-2">
              <Can I="invite" a="FamilyMember">
                <GlassButton
                  variant="primary"
                  size="sm"
                  goldBorder
                  onClick={() => setIsInviteModalOpen(true)}
                  disabled={isLoading}
                  className="text-xs px-3 py-1.5"
                >
                  <UserPlus className="w-3 h-3 mr-1" />
                  Invite
                </GlassButton>
              </Can>
              
              {isPrincipal && (
                <GlassButton
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsCreateRoleModalOpen(true)}
                  className="text-xs px-3 py-1.5"
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Role
                </GlassButton>
              )}
            </div>

            {/* Compact Tabs */}
            <div className="flex bg-primary/5 rounded-lg p-1">
              {[
                { id: 'members', label: 'Members', icon: Users, count: familyMembers.length },
                { id: 'roles', label: 'Roles', icon: Shield, count: customRoles.length },
                { id: 'invitations', label: 'Invitations', icon: Mail, count: invitations.length },
                ...(isPrincipal ? [{ id: 'admin', label: 'Admin', icon: Settings, count: null }] : [])
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-1 ${
                    activeTab === tab.id
                      ? 'bg-white text-primary shadow-sm'
                      : 'text-primary/60 hover:text-primary'
                  }`}
                >
                  <tab.icon className="w-3 h-3" />
                  {tab.label}
                  {tab.count !== null && (
                    <span className="ml-1 px-1.5 py-0.5 bg-primary/10 text-[10px] rounded-full">
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div className="min-h-[200px]">
            {activeTab === 'members' && (
              <div className="space-y-2">
                {familyMembers.map((member) => (
                  <motion.div
                    key={member.uid || member.id || member.email}
                    whileHover={{ scale: 1.005 }}
                    className="glass-subtle p-3 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-gold/20 to-primary/20 rounded-full flex items-center justify-center">
                        <span className="text-xs font-medium text-primary">
                          {member.displayName?.split(' ').map((n, index) => n[0]).join('') || 'U'}
                        </span>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-primary text-sm truncate">
                            {member.displayName || 'User'}
                          </h4>
                          {getRoleIcon(member.role)}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-primary/60">
                          <span className="truncate">{member.email}</span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] ${getRoleColor(member.role)}`}>
                            {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                            member.status === 'active' 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-yellow-100 text-yellow-700'
                          }`}>
                            {member.status}
                          </span>
                        </div>
                      </div>
                      
                      <Can I="remove" a="FamilyMember">
                        {member.role !== 'principal' && (
                          <div className="flex items-center gap-1">
                            <GlassButton
                              variant="ghost"
                              size="sm"
                              onClick={() => openMemberRoleModal(member)}
                              title="Edit Role"
                              className="p-1.5"
                            >
                              <Edit className="w-3 h-3" />
                            </GlassButton>
                            <GlassButton
                              variant="ghost"
                              size="sm"
                              onClick={() => removeMember(member.uid)}
                              className="text-red-500 hover:bg-red-50 p-1.5"
                              title="Remove Member"
                            >
                              <Trash2 className="w-3 h-3" />
                            </GlassButton>
                          </div>
                        )}
                      </Can>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {activeTab === 'roles' && (
              <div className="space-y-2">
                {customRoles.map((role) => (
                  <div key={role.id} className="glass-subtle p-3 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-primary text-sm">{role.name}</h4>
                          <span className="text-xs text-primary/40">
                            {role.createdAt.toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-xs text-primary/60 truncate">{role.description}</p>
                      </div>
                      
                      {isPrincipal && !role.isSystem && (
                        <div className="flex items-center gap-1">
                          <GlassButton 
                            size="sm" 
                            variant="ghost"
                            title="Edit Role"
                            className="p-1.5"
                          >
                            <Edit className="w-3 h-3" />
                          </GlassButton>
                          <GlassButton 
                            size="sm" 
                            variant="ghost" 
                            className="text-red-500 hover:bg-red-50 p-1.5"
                            onClick={() => deleteCustomRole(role.id)}
                            title="Delete Role"
                          >
                            <Trash2 className="w-3 h-3" />
                          </GlassButton>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                
                {/* Quick Permission Overview */}
                <div className="mt-3 p-3 glass-subtle rounded-lg">
                  <h4 className="font-medium text-primary text-sm mb-2 flex items-center gap-2">
                    <Eye className="w-3 h-3 text-gold" />
                    Your Permissions
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-primary/60">Financial</span>
                      <Can I="view" a="NetWorth" fallback={<EyeOff className="w-3 h-3 text-red-500" />}>
                        <Eye className="w-3 h-3 text-green-500" />
                      </Can>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-primary/60">Transactions</span>
                      <Can I="create" a="Transaction" fallback={<EyeOff className="w-3 h-3 text-red-500" />}>
                        <Eye className="w-3 h-3 text-green-500" />
                      </Can>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-primary/60">Family Mgmt</span>
                      <Can I="invite" a="FamilyMember" fallback={<EyeOff className="w-3 h-3 text-red-500" />}>
                        <Eye className="w-3 h-3 text-green-500" />
                      </Can>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-primary/60">Goals/Budgets</span>
                      <Can I="create" a="Goal" fallback={<EyeOff className="w-3 h-3 text-red-500" />}>
                        <Eye className="w-3 h-3 text-green-500" />
                      </Can>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'invitations' && (
              <div className="space-y-2">
                {isLoadingInvitations ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-gold border-t-transparent mx-auto mb-3"></div>
                    <p className="text-primary/60 text-sm">Loading invitations...</p>
                  </div>
                ) : invitations.length === 0 ? (
                  <div className="text-center py-8">
                    <Mail className="w-12 h-12 text-primary/20 mx-auto mb-3" />
                    <p className="text-primary/60 text-sm">No invitations sent yet</p>
                  </div>
                ) : (
                  invitations.map((invitation) => {
                    const isExpired = new Date() > new Date(invitation.expiresAt);
                    const isPending = invitation.status === 'pending';
                    const isAccepted = invitation.status === 'accepted';
                    
                    return (
                      <div key={invitation.id} className="glass-subtle p-3 rounded-lg">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium text-primary text-sm">{invitation.invitedEmail}</h4>
                              <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                                isAccepted ? 'bg-green-100 text-green-700' :
                                isExpired ? 'bg-gray-100 text-gray-700' :
                                isPending ? 'bg-yellow-100 text-yellow-700' :
                                'bg-red-100 text-red-700'
                              }`}>
                                {isExpired ? 'Expired' : invitation.status}
                              </span>
                              <span className={`px-2 py-0.5 rounded-full text-[10px] ${getRoleColor(invitation.role)}`}>
                                {invitation.role}
                              </span>
                            </div>
                            <div className="text-xs text-primary/60">
                              <p>Invited {new Date(invitation.createdAt).toLocaleDateString()} by {invitation.inviterName}</p>
                              {invitation.message && (
                                <p className="mt-1 italic">"{invitation.message}"</p>
                              )}
                              {!isAccepted && !isExpired && (
                                <p className="mt-1 text-gold">
                                  Expires {new Date(invitation.expiresAt).toLocaleDateString()}
                                </p>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-1">
                            {isPending && !isExpired && (
                              <>
                                <GlassButton
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => {
                                    const inviteLink = `${window.location.origin}/join-family?invitation=${invitation.id}`;
                                    navigator.clipboard.writeText(inviteLink);
                                    toastSuccess('Link copied', 'Invitation link copied to clipboard');
                                  }}
                                  title="Copy invitation link"
                                  className="p-1.5"
                                >
                                  <Copy className="w-3 h-3" />
                                </GlassButton>
                                <GlassButton 
                                  size="sm" 
                                  variant="ghost"
                                  className="text-red-500 hover:bg-red-50 p-1.5"
                                  onClick={() => cancelInvitation(invitation.id!)}
                                  title="Cancel invitation"
                                >
                                  <X className="w-3 h-3" />
                                </GlassButton>
                              </>
                            )}
                            {isAccepted && (
                              <Check className="w-4 h-4 text-green-600" />
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                
                {/* Manual sharing instructions */}
                {invitations.some(inv => inv.status === 'pending' && new Date() <= new Date(inv.expiresAt)) && (
                  <div className="mt-4 p-3 bg-gold/10 rounded-lg">
                    <p className="text-xs text-primary/80 font-medium mb-1">📧 Email notifications not set up yet</p>
                    <p className="text-xs text-primary/60">
                      Click the copy button next to pending invitations to get a shareable link. 
                      Send this link to your family members via email or messaging app.
                    </p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'admin' && isPrincipal && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="glass-subtle p-3 rounded-lg">
                  <h4 className="font-medium text-primary text-sm mb-1">Settings</h4>
                  <p className="text-xs text-primary/60 mb-2">Family preferences</p>
                  <GlassButton 
                    size="sm" 
                    variant="ghost"
                    onClick={() => setIsSettingsModalOpen(true)}
                    className="text-xs px-2 py-1"
                  >
                    Configure
                  </GlassButton>
                </div>
                
                <div className="glass-subtle p-3 rounded-lg">
                  <h4 className="font-medium text-primary text-sm mb-1">Export</h4>
                  <p className="text-xs text-primary/60 mb-2">Download data</p>
                  <GlassButton 
                    size="sm" 
                    variant="ghost"
                    onClick={() => setIsExportModalOpen(true)}
                    className="text-xs px-2 py-1"
                  >
                    Export
                  </GlassButton>
                </div>
                
                <div className="glass-subtle p-3 rounded-lg">
                  <h4 className="font-medium text-primary text-sm mb-1">Audit Log</h4>
                  <p className="text-xs text-primary/60 mb-2">Activity history</p>
                  <GlassButton 
                    size="sm" 
                    variant="ghost"
                    onClick={() => setIsAuditModalOpen(true)}
                    className="text-xs px-2 py-1"
                  >
                    View
                  </GlassButton>
                </div>
              </div>
            )}
          </div>

          {/* Limited Access Notice */}
          {!canManageFamily && (
            <div className="p-3 glass-subtle rounded-lg text-center">
              <AlertTriangle className="w-5 h-5 text-yellow-500 mx-auto mb-2" />
              <p className="text-primary/60 text-xs">
                Contact your family administrator for management access.
              </p>
            </div>
          )}
        </div>
      </CollapsibleCard>

      <InviteMemberModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        onInvite={inviteMember}
        customRoles={customRoles}
      />

      <CreateRoleModal
        isOpen={isCreateRoleModalOpen}
        onClose={() => setIsCreateRoleModalOpen(false)}
        onCreateRole={createCustomRole}
      />

      <MemberRoleModal
        isOpen={isMemberRoleModalOpen}
        onClose={() => setIsMemberRoleModalOpen(false)}
        member={selectedMember}
        onUpdateRole={editMemberRole}
        customRoles={customRoles}
      />

      <FamilySettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
      />

      <FamilyExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        familyMembers={familyMembers}
      />

      <AuditLogModal
        isOpen={isAuditModalOpen}
        onClose={() => setIsAuditModalOpen(false)}
      />
    </>
  );
} 
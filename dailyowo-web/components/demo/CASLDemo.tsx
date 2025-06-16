'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Shield, 
  Eye, 
  EyeOff, 
  UserPlus, 
  Settings, 
  DollarSign,
  Target,
  PiggyBank,
  Crown,
  Users,
  AlertCircle
} from 'lucide-react';
import { GlassContainer } from '@/components/ui/GlassContainer';
import { GlassButton } from '@/components/ui/GlassButton';
import { AdminPanelModal } from '@/components/profile/AdminPanelModal';
import { 
  Can, 
  useCASL, 
  useCanViewFinancials,
  useCanManageTransactions,
  useCanManageFamily,
  useCanManageBudgets,
  useCanManageGoals,
  useIsAdminRole,
  useIsPrincipal
} from '@/lib/auth/casl-provider';

interface PermissionTestCardProps {
  title: string;
  permission: string;
  action: string;
  subject: string;
  icon: React.ReactNode;
  canAccess: boolean;
  description: string;
}

function PermissionTestCard({ 
  title, 
  permission, 
  action, 
  subject, 
  icon, 
  canAccess, 
  description 
}: PermissionTestCardProps) {
  return (
    <GlassContainer className="p-4">
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
          canAccess 
            ? 'bg-green-100 text-green-600' 
            : 'bg-red-100 text-red-600'
        }`}>
          {icon}
        </div>
        
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-medium text-primary">{title}</h3>
            <div className="flex items-center gap-2">
              {canAccess ? (
                <Eye className="w-4 h-4 text-green-500" />
              ) : (
                <EyeOff className="w-4 h-4 text-red-500" />
              )}
              <span className={`text-xs px-2 py-1 rounded-full ${
                canAccess 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-red-100 text-red-700'
              }`}>
                {canAccess ? 'Allowed' : 'Denied'}
              </span>
            </div>
          </div>
          
          <p className="text-sm text-primary/60 mb-2">{description}</p>
          
          <div className="text-xs text-primary/40 font-mono">
            Can {action} {subject}
          </div>
        </div>
      </div>
    </GlassContainer>
  );
}

export function CASLDemo() {
  const { 
    familyMembers, 
    currentMemberRole, 
    isLoading 
  } = useCASL();
  
  const canViewFinancials = useCanViewFinancials();
  const canManageTransactions = useCanManageTransactions();
  const canManageFamily = useCanManageFamily();
  const canManageBudgets = useCanManageBudgets();
  const canManageGoals = useCanManageGoals();
  const isAdminRole = useIsAdminRole();
  const isPrincipal = useIsPrincipal();

  const [showDetails, setShowDetails] = useState(false);
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);

  if (isLoading) {
    return (
      <GlassContainer className="p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-4"></div>
          <div className="h-4 bg-gray-200 rounded mb-2"></div>
          <div className="h-4 bg-gray-200 rounded"></div>
        </div>
      </GlassContainer>
    );
  }

  const permissionTests = [
    {
      title: 'View Financial Data',
      permission: 'view net_worth',
      action: 'view',
      subject: 'net_worth',
      icon: <DollarSign className="w-5 h-5" />,
      canAccess: canViewFinancials,
      description: 'Access to net worth, balances, and financial overview'
    },
    {
      title: 'Manage Transactions',
      permission: 'add transactions',
      action: 'add',
      subject: 'transactions',
      icon: <Settings className="w-5 h-5" />,
      canAccess: canManageTransactions,
      description: 'Create, edit, and delete financial transactions'
    },
    {
      title: 'Invite Family Members',
      permission: 'invite family',
      action: 'invite',
      subject: 'family',
      icon: <UserPlus className="w-5 h-5" />,
      canAccess: canManageFamily,
      description: 'Send invitations and manage family access'
    },
    {
      title: 'Manage Goals',
      permission: 'add goals',
      action: 'add',
      subject: 'goals',
      icon: <Target className="w-5 h-5" />,
      canAccess: canManageGoals,
      description: 'Create and manage financial goals'
    },
    {
      title: 'Manage Budgets',
      permission: 'add budgets',
      action: 'add',
      subject: 'budgets',
      icon: <PiggyBank className="w-5 h-5" />,
      canAccess: canManageBudgets,
      description: 'Create and manage budget categories'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Current User Status */}
      <GlassContainer className="p-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 bg-gradient-to-br from-gold/20 to-primary/20 rounded-full flex items-center justify-center">
            {isPrincipal ? (
              <Crown className="w-6 h-6 text-gold" />
            ) : (
              <Users className="w-6 h-6 text-primary" />
            )}
          </div>
          
          <div>
            <h2 className="text-xl font-light text-primary">DailyOwo Permission System</h2>
            <p className="text-primary/60">
              Current Role: <span className="font-medium text-gold">{currentMemberRole}</span>
              {isAdminRole && (
                <span className="ml-2 text-xs bg-gold/10 text-gold px-2 py-1 rounded-full">
                  Admin
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="text-center p-3 bg-primary/5 rounded-xl">
            <p className="text-sm text-primary/60">Family Members</p>
            <p className="text-2xl font-light text-primary">{familyMembers.length}</p>
          </div>
          <div className="text-center p-3 bg-primary/5 rounded-xl">
            <p className="text-sm text-primary/60">Permissions</p>
            <p className="text-2xl font-light text-primary">
              {permissionTests.filter(test => test.canAccess).length}/{permissionTests.length}
            </p>
          </div>
          <div className="text-center p-3 bg-primary/5 rounded-xl">
            <p className="text-sm text-primary/60">Access Level</p>
            <p className="text-2xl font-light text-primary">
              {isPrincipal ? 'Full' : isAdminRole ? 'High' : 'Limited'}
            </p>
          </div>
        </div>

        <GlassButton
          variant="ghost"
          onClick={() => setShowDetails(!showDetails)}
          className="w-full"
        >
          {showDetails ? 'Hide Details' : 'Show Permission Details'}
        </GlassButton>
      </GlassContainer>

      {/* Permission Test Results */}
      {showDetails && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="space-y-4"
        >
          <h3 className="text-lg font-light text-primary mb-4">
            Permission Test Results
          </h3>
          
          <div className="grid gap-3">
            {permissionTests.map((test, index) => (
              <PermissionTestCard
                key={index}
                {...test}
              />
            ))}
          </div>
        </motion.div>
      )}

      {/* Component-Level Permission Examples */}
      <GlassContainer className="p-6">
        <h3 className="text-lg font-light text-primary mb-4 flex items-center gap-2">
          <Shield className="w-5 h-5 text-gold" />
          Component-Level Permissions
        </h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-primary/5 rounded-xl">
            <span className="text-primary">Admin Settings Button</span>
            <Can I="invite" a="FamilyMember" fallback={
              <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full">
                Hidden
              </span>
            }>
              <GlassButton 
                variant="ghost" 
                size="sm"
                onClick={() => setIsAdminPanelOpen(true)}
              >
                <Settings className="w-4 h-4 mr-2" />
                Admin Panel
              </GlassButton>
            </Can>
          </div>

          <div className="flex items-center justify-between p-3 bg-primary/5 rounded-xl">
            <span className="text-primary">Financial Data Access</span>
            <Can I="view" a="NetWorth" fallback={
              <div className="flex items-center gap-2 text-red-600">
                <AlertCircle className="w-4 h-4" />
                <span className="text-xs">Access Denied</span>
              </div>
            }>
              <div className="flex items-center gap-2 text-green-600">
                <Eye className="w-4 h-4" />
                <span className="text-xs">Full Access</span>
              </div>
            </Can>
          </div>

          <div className="flex items-center justify-between p-3 bg-primary/5 rounded-xl">
            <span className="text-primary">Transaction Management</span>
            <Can I="create" a="Transaction" fallback={
              <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full">
                View Only
              </span>
            }>
              <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                Full Control
              </span>
            </Can>
          </div>
        </div>
      </GlassContainer>

      {/* Admin Panel Modal */}
      <AdminPanelModal 
        isOpen={isAdminPanelOpen}
        onClose={() => setIsAdminPanelOpen(false)}
      />
    </div>
  );
} 
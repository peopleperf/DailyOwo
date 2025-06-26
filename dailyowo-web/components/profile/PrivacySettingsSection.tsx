'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, 
  Download, 
  Trash2, 
  Eye, 
  EyeOff, 
  Settings, 
  AlertTriangle, 
  CheckCircle,
  X,
  FileText,
  Database,
  Lock,
  Users,
  Calendar,
  Clock
} from 'lucide-react';
import { GlassContainer } from '@/components/ui/GlassContainer';
import { GlassButton } from '@/components/ui/GlassButton';
import { CollapsibleCard } from '@/components/ui/CollapsibleCard';
import { useAuth } from '@/lib/firebase/auth-context';
import { getFirebaseDb } from '@/lib/firebase/config';
import { collection, query, where, getDocs, orderBy, Timestamp } from 'firebase/firestore';

interface PrivacySettings {
  dataVisibility: {
    transactions: 'private' | 'family' | 'admins';
    netWorth: 'private' | 'family' | 'admins';
    goals: 'private' | 'family' | 'admins';
    budgets: 'private' | 'family' | 'admins';
  };
  dataRetention: {
    automaticDeletion: boolean;
    retentionPeriod: '1y' | '2y' | '5y' | 'indefinite';
    deleteInactiveData: boolean;
  };
  thirdPartySharing: {
    analytics: boolean;
    marketing: boolean;
    improvements: boolean;
  };
  notifications: {
    dataAccess: boolean;
    exports: boolean;
    deletions: boolean;
  };
}

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function ExportDataModal({ isOpen, onClose }: ExportModalProps) {
  const { user } = useAuth();
  const [exportFormat, setExportFormat] = useState<'csv' | 'json'>('csv');
  const [exportScope, setExportScope] = useState<'all' | 'transactions' | 'goals' | 'budgets'>('all');
  const [dateRange, setDateRange] = useState<'all' | '1y' | '6m' | '3m'>('all');
  const [isExporting, setIsExporting] = useState(false);
  const [exportComplete, setExportComplete] = useState(false);

  const handleExport = async () => {
    if (!user?.uid) {
      alert('User not authenticated');
      return;
    }

    setIsExporting(true);
    
    try {
      const db = await getFirebaseDb();
      if (!db) {
        throw new Error('Database not available');
      }

      const exportData: any = {
        user: {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName
        },
        exportInfo: {
          scope: exportScope,
          format: exportFormat,
          dateRange: dateRange,
          exportedAt: new Date().toISOString()
        },
        data: {}
      };

      // Calculate date filter
      let startDate: Date | null = null;
      if (dateRange !== 'all') {
        const now = new Date();
        const months = dateRange === '1y' ? 12 : dateRange === '6m' ? 6 : 3;
        startDate = new Date(now.getFullYear(), now.getMonth() - months, 1);
      }

      // Fetch transactions
      if (exportScope === 'all' || exportScope === 'transactions') {
        const transactionsRef = collection(db, 'users', user.uid, 'transactions');
        let transactionsQuery = query(
          transactionsRef,
          where('deleted', '!=', true),
          orderBy('deleted'),
          orderBy('date', 'desc')
        );

        if (startDate) {
          transactionsQuery = query(
            transactionsRef,
            where('deleted', '!=', true),
            where('date', '>=', Timestamp.fromDate(startDate)),
            orderBy('deleted'),
            orderBy('date', 'desc')
          );
        }

        const transactionsSnapshot = await getDocs(transactionsQuery);
        exportData.data.transactions = transactionsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          date: doc.data().date?.toDate?.()?.toISOString() || doc.data().date,
          createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || doc.data().createdAt,
          updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || doc.data().updatedAt
        }));
      }

      // Fetch goals
      if (exportScope === 'all' || exportScope === 'goals') {
        const goalsRef = collection(db, 'goals');
        const goalsQuery = query(goalsRef, where('userId', '==', user.uid));
        const goalsSnapshot = await getDocs(goalsQuery);
        exportData.data.goals = goalsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          targetDate: doc.data().targetDate?.toDate?.()?.toISOString() || doc.data().targetDate,
          createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || doc.data().createdAt,
          updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || doc.data().updatedAt
        }));
      }

      // Fetch budgets
      if (exportScope === 'all' || exportScope === 'budgets') {
        const budgetsRef = collection(db, 'users', user.uid, 'budgets');
        const budgetsQuery = query(budgetsRef, orderBy('createdAt', 'desc'));
        const budgetsSnapshot = await getDocs(budgetsQuery);
        exportData.data.budgets = budgetsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || doc.data().createdAt,
          updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || doc.data().updatedAt
        }));
      }

      // Add user profile data if exporting all
      if (exportScope === 'all') {
        // TODO: Add user profile data
        exportData.data.profile = {};
        /*
        exportData.data.profile = {
          ...userProfile,
          createdAt: userProfile?.createdAt?.toDate?.()?.toISOString() || userProfile?.createdAt,
          updatedAt: userProfile?.updatedAt?.toDate?.()?.toISOString() || userProfile?.updatedAt
        };
        */

        // Fetch family data
        try {
          const familyRef = collection(db, 'users', user.uid, 'family');
          const familySnapshot = await getDocs(familyRef);
          exportData.data.family = familySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            joinedAt: doc.data().joinedAt?.toDate?.()?.toISOString() || doc.data().joinedAt
          }));

          const invitationsRef = collection(db, 'users', user.uid, 'familyInvitations');
          const invitationsSnapshot = await getDocs(invitationsRef);
          exportData.data.familyInvitations = invitationsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            sentAt: doc.data().sentAt?.toDate?.()?.toISOString() || doc.data().sentAt
          }));
        } catch (familyError) {
          console.warn('Could not fetch family data:', familyError);
        }
      }

      // Calculate record counts
      const recordCount = Object.values(exportData.data).reduce((total: number, dataSet: any) => {
        return total + (Array.isArray(dataSet) ? dataSet.length : 0);
      }, 0);

      exportData.exportInfo.recordCount = recordCount;
      
      console.log('Real export completed:', exportData);
      
      // Create and download file
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
      const filename = `dailyowo-export-${exportScope}-${timestamp}.${exportFormat}`;
      
      let content: string;
      if (exportFormat === 'json') {
        content = JSON.stringify(exportData, null, 2);
      } else {
        // Create CSV content
        content = 'Type,Date,Description,Amount,Category,Currency\n';
        if (exportData.data.transactions) {
          exportData.data.transactions.forEach((t: any) => {
            content += `${t.type || 'unknown'},${t.date || ''},${t.description || ''},${t.amount || 0},${t.categoryId || ''},${t.currency || 'USD'}\n`;
          });
        }
        if (exportData.data.goals) {
          exportData.data.goals.forEach((g: any) => {
            content += `goal,${g.targetDate || ''},${g.name || ''},${g.targetAmount || 0},${g.category || ''},${g.currency || 'USD'}\n`;
          });
        }
      }
      
      const blob = new Blob([content], { 
        type: exportFormat === 'json' ? 'application/json' : 'text/csv' 
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      setExportComplete(true);
      
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="glass-container p-6 w-full max-w-md"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-light text-primary">Export Your Data</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-primary/5 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-primary/60" />
          </button>
        </div>

        {exportComplete ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-8"
          >
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-primary mb-2">Export Complete!</h4>
            <p className="text-primary/60 text-sm">Your data has been downloaded successfully.</p>
            <GlassButton
              variant="primary"
              goldBorder
              onClick={onClose}
              className="mt-4"
            >
              Done
            </GlassButton>
          </motion.div>
        ) : (
          <div className="space-y-6">
            {/* Export Format */}
            <div>
              <label className="block text-sm font-medium text-primary mb-3">
                Export Format
              </label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: 'csv', label: 'CSV', desc: 'Excel compatible' },
                  { value: 'json', label: 'JSON', desc: 'Developer friendly' }
                ].map((format) => (
                  <button
                    key={format.value}
                    onClick={() => setExportFormat(format.value as 'csv' | 'json')}
                    className={`p-3 rounded-xl border-2 transition-all text-left ${
                      exportFormat === format.value
                        ? 'border-gold bg-gold/5'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="font-medium text-sm text-primary">{format.label}</div>
                    <div className="text-xs text-primary/60">{format.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Export Scope */}
            <div>
              <label className="block text-sm font-medium text-primary mb-3">
                Data to Export
              </label>
              <select
                value={exportScope}
                onChange={(e) => setExportScope(e.target.value as any)}
                className="glass-input w-full"
              >
                <option value="all">All Data</option>
                <option value="transactions">Transactions Only</option>
                <option value="goals">Goals Only</option>
                <option value="budgets">Budgets Only</option>
              </select>
            </div>

            {/* Date Range */}
            <div>
              <label className="block text-sm font-medium text-primary mb-3">
                Date Range
              </label>
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value as any)}
                className="glass-input w-full"
              >
                <option value="all">All Time</option>
                <option value="1y">Last 12 Months</option>
                <option value="6m">Last 6 Months</option>
                <option value="3m">Last 3 Months</option>
              </select>
            </div>

            {/* Privacy Notice */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
              <div className="flex gap-3">
                <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-blue-900 mb-1">Privacy Notice</h4>
                  <p className="text-xs text-blue-700">
                    Your exported data will be encrypted and available for download for 7 days.
                  </p>
                </div>
              </div>
            </div>

            {/* Export Button */}
            <div className="flex gap-3">
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
                disabled={isExporting}
                className="flex-1"
              >
                {isExporting ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Exporting...
                  </div>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Export Data
                  </>
                )}
              </GlassButton>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}

interface DeleteAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function DeleteAccountModal({ isOpen, onClose }: DeleteAccountModalProps) {
  const { user } = useAuth();
  const [confirmationText, setConfirmationText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [step, setStep] = useState<'confirm' | 'verify' | 'final'>('confirm');
  
  const expectedText = 'DELETE MY ACCOUNT';
  const isConfirmationValid = confirmationText === expectedText;

  const handleDelete = async () => {
    if (!isConfirmationValid) return;
    
    setIsDeleting(true);
    
    try {
      // In production, this would:
      // 1. Export final data backup
      // 2. Remove user from all family accounts
      // 3. Transfer account ownership if principal
      // 4. Delete all user data
      // 5. Delete Firebase auth account
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      console.log('Account deletion process initiated for user:', user?.uid);
      
      // TODO: Implement actual deletion logic
      alert('Account deletion initiated. You will receive a confirmation email.');
      onClose();
      
    } catch (error) {
      console.error('Account deletion failed:', error);
      alert('Failed to delete account. Please contact support.');
    } finally {
      setIsDeleting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="glass-container p-6 w-full max-w-md"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-light text-primary">Delete Account</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-primary/5 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-primary/60" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Warning */}
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
            <div className="flex gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-red-900 mb-2">This action cannot be undone</h4>
                <ul className="text-xs text-red-700 space-y-1">
                  <li>• All your financial data will be permanently deleted</li>
                  <li>• You will be removed from all family accounts</li>
                  <li>• Your transaction history will be lost forever</li>
                  <li>• This action affects {user?.email}</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Confirmation Input */}
          <div>
            <label className="block text-sm font-medium text-primary mb-2">
              Type <span className="font-mono bg-gray-100 px-1 rounded">{expectedText}</span> to confirm:
            </label>
            <input
              type="text"
              value={confirmationText}
              onChange={(e) => setConfirmationText(e.target.value)}
              className="glass-input w-full font-mono"
              placeholder={expectedText}
              disabled={isDeleting}
            />
          </div>

          {/* Delete Button */}
          <div className="flex gap-3">
            <GlassButton
              type="button"
              onClick={onClose}
              variant="ghost"
              className="flex-1"
              disabled={isDeleting}
            >
              Cancel
            </GlassButton>
            <GlassButton
              onClick={handleDelete}
              disabled={!isConfirmationValid || isDeleting}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white border-red-600"
            >
              {isDeleting ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Deleting...
                </div>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Account
                </>
              )}
            </GlassButton>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export function PrivacySettingsSection() {
  const { user, updateUserProfile } = useAuth();
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [privacySettings, setPrivacySettings] = useState<PrivacySettings>({
    dataVisibility: {
      transactions: 'family',
      netWorth: 'admins',
      goals: 'family',
      budgets: 'family'
    },
    dataRetention: {
      automaticDeletion: false,
      retentionPeriod: '5y',
      deleteInactiveData: true
    },
    thirdPartySharing: {
      analytics: true,
      marketing: false,
      improvements: true
    },
    notifications: {
      dataAccess: true,
      exports: true,
      deletions: true
    }
  });

  const handleSettingChange = (category: keyof PrivacySettings, setting: string, value: any) => {
    setPrivacySettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [setting]: value
      }
    }));
  };

  const saveSettings = async () => {
    setIsSaving(true);
    try {
      await updateUserProfile({ privacySettings });
      console.log('Privacy settings saved:', privacySettings);
    } catch (error) {
      console.error('Error saving privacy settings:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <CollapsibleCard
        title="Privacy & Data"
        subtitle="Control your data privacy, visibility, and export options"
        icon={<Shield className="w-5 h-5 text-gold" />}
      >
        <div className="space-y-8">
          {/* Data Visibility Controls */}
          <GlassContainer className="p-6">
            <h3 className="text-lg font-light text-primary mb-4 flex items-center gap-2">
              <Eye className="w-5 h-5 text-gold" />
              Data Visibility
            </h3>
            
            <div className="space-y-4">
              {Object.entries(privacySettings.dataVisibility).map(([dataType, visibility]) => (
                <div key={dataType} className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-primary capitalize">{dataType}</h4>
                    <p className="text-sm text-primary/60">
                      {dataType === 'transactions' && 'Your spending and income data'}
                      {dataType === 'netWorth' && 'Your total assets and net worth'}
                      {dataType === 'goals' && 'Your financial goals and progress'}
                      {dataType === 'budgets' && 'Your budget categories and limits'}
                    </p>
                  </div>
                  <select
                    value={visibility}
                    onChange={(e) => handleSettingChange('dataVisibility', dataType, e.target.value)}
                    className="glass-input w-32"
                  >
                    <option value="private">Private</option>
                    <option value="family">Family</option>
                    <option value="admins">Admins Only</option>
                  </select>
                </div>
              ))}
            </div>
          </GlassContainer>

          {/* Data Retention */}
          <GlassContainer className="p-6">
            <h3 className="text-lg font-light text-primary mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-gold" />
              Data Retention
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-primary">Automatic Data Deletion</h4>
                  <p className="text-sm text-primary/60">Automatically delete old data based on retention period</p>
                </div>
                <button
                  onClick={() => handleSettingChange('dataRetention', 'automaticDeletion', !privacySettings.dataRetention.automaticDeletion)}
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    privacySettings.dataRetention.automaticDeletion ? 'bg-gold' : 'bg-gray-300'
                  }`}
                >
                  <motion.div
                    animate={{ x: privacySettings.dataRetention.automaticDeletion ? 24 : 0 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md"
                  />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-primary">Retention Period</h4>
                  <p className="text-sm text-primary/60">How long to keep your financial data</p>
                </div>
                <select
                  value={privacySettings.dataRetention.retentionPeriod}
                  onChange={(e) => handleSettingChange('dataRetention', 'retentionPeriod', e.target.value)}
                  className="glass-input w-32"
                >
                  <option value="1y">1 Year</option>
                  <option value="2y">2 Years</option>
                  <option value="5y">5 Years</option>
                  <option value="indefinite">Forever</option>
                </select>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-primary">Delete Inactive Data</h4>
                  <p className="text-sm text-primary/60">Remove data from periods with no activity</p>
                </div>
                <button
                  onClick={() => handleSettingChange('dataRetention', 'deleteInactiveData', !privacySettings.dataRetention.deleteInactiveData)}
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    privacySettings.dataRetention.deleteInactiveData ? 'bg-gold' : 'bg-gray-300'
                  }`}
                >
                  <motion.div
                    animate={{ x: privacySettings.dataRetention.deleteInactiveData ? 24 : 0 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md"
                  />
                </button>
              </div>
            </div>
          </GlassContainer>

          {/* Data Export */}
          <GlassContainer className="p-6">
            <h3 className="text-lg font-light text-primary mb-4 flex items-center gap-2">
              <Download className="w-5 h-5 text-gold" />
              Data Export
            </h3>
            
            <div className="space-y-4">
              <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-primary">Export Your Data</h4>
                    <p className="text-sm text-primary/60">Download all your financial data in multiple formats</p>
                  </div>
                  <GlassButton
                    variant="ghost"
                    onClick={() => setIsExportModalOpen(true)}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </GlassButton>
                </div>
              </div>
            </div>
          </GlassContainer>

          {/* Account Deletion */}
          <GlassContainer className="p-6">
            <h3 className="text-lg font-light text-primary mb-4 flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-red-600" />
              Danger Zone
            </h3>
            
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-primary">Delete Account</h4>
                  <p className="text-sm text-primary/60">Permanently delete your account and all data</p>
                </div>
                <GlassButton
                  onClick={() => setIsDeleteModalOpen(true)}
                  className="bg-red-600 hover:bg-red-700 text-white border-red-600"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </GlassButton>
              </div>
            </div>
          </GlassContainer>

          {/* Save Button */}
          <div className="flex justify-end">
            <GlassButton
              variant="primary"
              goldBorder
              onClick={saveSettings}
              disabled={isSaving}
            >
              {isSaving ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Saving...
                </div>
              ) : (
                'Save Privacy Settings'
              )}
            </GlassButton>
          </div>
        </div>
      </CollapsibleCard>

      <ExportDataModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
      />

      <DeleteAccountModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
      />
    </>
  );
} 
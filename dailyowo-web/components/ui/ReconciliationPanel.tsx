'use client';

import React, { useState, useEffect } from 'react';
import { 
  CheckCircle, 
  AlertCircle, 
  RefreshCw, 
  Calendar,
  DollarSign,
  FileText,
  X,
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { GlassContainer } from '@/components/ui/GlassContainer';
import { GlassButton } from '@/components/ui/GlassButton';
import { GlassInput } from '@/components/ui/GlassInput';
import { 
  createReconciliation,
  completeReconciliation,
  getReconciliationHistory,
  getReconciliationSummary,
  ReconciliationSummary,
  ReconciliationRecord
} from '@/lib/utils/account-reconciliation';
import { formatCurrency } from '@/lib/utils/currency';

interface ReconciliationPanelProps {
  accountId: string;
  accountName: string;
  currentBalance: number;
  onClose?: () => void;
}

export function ReconciliationPanel({
  accountId,
  accountName,
  currentBalance,
  onClose
}: ReconciliationPanelProps) {
  const [isReconciling, setIsReconciling] = useState(false);
  const [statementBalance, setStatementBalance] = useState('');
  const [statementDate, setStatementDate] = useState(new Date().toISOString().split('T')[0]);
  const [reconciliationResult, setReconciliationResult] = useState<ReconciliationRecord | null>(null);
  const [history, setHistory] = useState<ReconciliationRecord[]>([]);
  const [latestStatus, setLatestStatus] = useState<ReconciliationRecord | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    loadReconciliationData();
  }, [accountId]);

  const loadReconciliationData = async () => {
    try {
      // Get userId from context - you may need to pass this as a prop
      const userId = 'current-user-id'; // TODO: Get actual user ID
      const hist = await getReconciliationHistory(accountId, userId, 5);
      setHistory(hist);
      if (hist.length > 0) {
        setLatestStatus(hist[0]);
      }
    } catch (error) {
      console.error('Error loading reconciliation data:', error);
    }
  };

  const handleReconcile = async () => {
    if (!statementBalance || isReconciling) return;

    setIsReconciling(true);
    setReconciliationResult(null);

    try {
      // Get current date for month/year
      const statementDateObj = new Date(statementDate);
      const month = statementDateObj.getMonth() + 1; // 1-based
      const year = statementDateObj.getFullYear();
      
      // TODO: Get actual user ID and opening balance
      const userId = 'current-user-id';
      const openingBalance = 0; // This should come from previous reconciliation
      
      const reconciliation = await createReconciliation(
        userId,
        accountId,
        accountName,
        month,
        year,
        parseFloat(statementBalance),
        openingBalance
      );

      const result = reconciliation; // createReconciliation already returns the summary

      setReconciliationResult(result);
      
      // Reload data after reconciliation
      await loadReconciliationData();
      
      // Reset form if successful
      if (result.status === 'reconciled') {
        setStatementBalance('');
      }
    } catch (error) {
      console.error('Error reconciling account:', error);
    } finally {
      setIsReconciling(false);
    }
  };

  const getStatusColor = (status?: 'reconciled' | 'pending' | 'discrepancy' | 'adjusted') => {
    switch (status) {
      case 'reconciled':
      case 'adjusted':
        return 'text-green-600 dark:text-green-400';
      case 'discrepancy':
        return 'text-red-600 dark:text-red-400';
      case 'pending':
      default:
        return 'text-yellow-600 dark:text-yellow-400';
    }
  };

  const getStatusIcon = (status?: 'reconciled' | 'pending' | 'discrepancy' | 'adjusted') => {
    switch (status) {
      case 'reconciled':
      case 'adjusted':
        return <CheckCircle className="w-5 h-5" />;
      case 'discrepancy':
        return <AlertCircle className="w-5 h-5" />;
      case 'pending':
      default:
        return <RefreshCw className="w-5 h-5" />;
    }
  };

  return (
    <GlassContainer className="w-full max-w-2xl p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-light text-primary">Account Reconciliation</h2>
          <p className="text-sm text-primary/60 mt-1">{accountName}</p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-primary/60" />
          </button>
        )}
      </div>

      {/* Current Status */}
      <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-primary/60">Current Balance</p>
            <p className="text-2xl font-light">{formatCurrency(currentBalance, 'USD')}</p>
          </div>
          {latestStatus && (
            <div className={`flex items-center gap-2 ${getStatusColor(latestStatus.status)}`}>
              {getStatusIcon(latestStatus.status)}
              <div className="text-right">
                <p className="text-sm font-medium capitalize">{latestStatus.status}</p>
                <p className="text-xs opacity-75">
                  {new Date(latestStatus.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Reconciliation Form */}
      <div className="space-y-4 mb-6">
        <div>
          <label className="text-xs font-medium text-primary/60 uppercase tracking-wide mb-2 block">
            Statement Date
          </label>
          <GlassInput
            type="date"
            value={statementDate}
            onChange={(e) => setStatementDate(e.target.value)}
            max={new Date().toISOString().split('T')[0]}
          />
        </div>

        <div>
          <label className="text-xs font-medium text-primary/60 uppercase tracking-wide mb-2 block">
            Statement Balance
          </label>
          <div className="relative">
            <GlassInput
              type="text"
              value={statementBalance}
              onChange={(e) => {
                const value = e.target.value.replace(/[^0-9.-]/g, '');
                setStatementBalance(value);
              }}
              placeholder="0.00"
              className="pl-8"
            />
            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/40" />
          </div>
        </div>

        <GlassButton
          onClick={handleReconcile}
          disabled={!statementBalance || isReconciling}
          goldBorder
          className="w-full"
        >
          {isReconciling ? (
            <>
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              Reconciling...
            </>
          ) : (
            'Reconcile Account'
          )}
        </GlassButton>
      </div>

      {/* Reconciliation Result */}
      <AnimatePresence>
        {reconciliationResult && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`p-4 rounded-lg border mb-6 ${
              reconciliationResult.status === 'reconciled'
                ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800'
                : 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800'
            }`}
          >
            <div className="flex items-start gap-3">
              {reconciliationResult.status === 'reconciled' ? (
                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
              )}
              <div className="flex-1">
                <h4 className="font-medium mb-2">
                  {reconciliationResult.status === 'reconciled'
                    ? 'Account Reconciled Successfully'
                    : 'Reconciliation Discrepancies Found'}
                </h4>
                
                {reconciliationResult.discrepancies.length > 0 && (
                  <div className="space-y-2 text-sm">
                    {reconciliationResult.discrepancies.map((disc, index) => (
                      <div key={index} className="p-2 bg-white/50 dark:bg-gray-800/50 rounded">
                        <p className="font-medium">{disc.type}</p>
                        <p className="text-xs text-primary/60">{disc.description}</p>
                        {disc.amount !== undefined && (
                          <p className="text-xs">
                            Amount: {formatCurrency(Math.abs(disc.amount), 'USD')}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                <div className="mt-3 pt-3 border-t border-current/10">
                  <div className="flex justify-between text-sm">
                    <span>Statement Balance:</span>
                    <span>{formatCurrency(reconciliationResult.balances.stated, 'USD')}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Calculated Balance:</span>
                    <span>{formatCurrency(reconciliationResult.balances.calculated, 'USD')}</span>
                  </div>
                  {reconciliationResult.balances.difference !== 0 && (
                    <div className="flex justify-between text-sm font-medium mt-1">
                      <span>Difference:</span>
                      <span className={reconciliationResult.balances.difference > 0 ? 'text-green-600' : 'text-red-600'}>
                        {formatCurrency(reconciliationResult.balances.difference, 'USD')}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* History Toggle */}
      <button
        onClick={() => setShowHistory(!showHistory)}
        className="flex items-center gap-2 text-sm text-primary/60 hover:text-primary transition-colors mb-4"
      >
        <FileText className="w-4 h-4" />
        <span>Reconciliation History</span>
        <ChevronRight className={`w-4 h-4 transition-transform ${showHistory ? 'rotate-90' : ''}`} />
      </button>

      {/* History List */}
      <AnimatePresence>
        {showHistory && history.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="space-y-2"
          >
            {history.map((item) => (
              <div
                key={item.id}
                className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className={getStatusColor(item.status)}>
                    {getStatusIcon(item.status)}
                  </div>
                  <div>
                    <p className="text-sm font-medium">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-primary/60">
                      Balance: {formatCurrency(item.balances.closing, 'USD')}
                    </p>
                  </div>
                </div>
                {item.discrepancies && item.discrepancies.length > 0 && (
                  <span className="text-xs bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 px-2 py-1 rounded">
                    {item.discrepancies.length} issue{item.discrepancies.length !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </GlassContainer>
  );
} 
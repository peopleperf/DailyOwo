'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Edit2, Trash2, Calendar, Tag, Receipt, Download, ExternalLink, User } from 'lucide-react';
import { GlassContainer } from '@/components/ui/GlassContainer';
import { GlassButton } from '@/components/ui/GlassButton';
import { formatCurrency } from '@/lib/utils/format';
import { useAuth } from '@/lib/firebase/auth-context';
import { useLocale } from 'next-intl';

interface TransactionDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: {
    id: string;
    type: 'income' | 'expense' | 'asset' | 'liability';
    amount: number;
    category: string;
    categoryIcon: any;
    categoryColor: string;
    categoryName: string;
    description: string;
    date: Date;
    recurring?: string;
    receiptUrl?: string;
    createdAt?: Date;
    currency?: string;
    // User tracking
    createdBy?: string;
    createdByName?: string;
    createdByEmail?: string;
    budgetCategory?: string;
  };
  onEdit: () => void;
  onDelete: () => void;
}

export function TransactionDetailModal({
  isOpen,
  onClose,
  transaction,
  onEdit,
  onDelete,
}: TransactionDetailModalProps) {
  const { userProfile } = useAuth();
  const locale = useLocale();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleDelete = () => {
    if (showDeleteConfirm) {
      onDelete();
      onClose();
    } else {
      setShowDeleteConfirm(true);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString(locale, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString(locale, {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <GlassContainer 
              goldBorder
              className="w-full max-w-lg max-h-[90vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-light text-primary">Transaction Details</h2>
                  <button
                    onClick={onClose}
                    className="p-2 hover:bg-white/60 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-primary/50" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                {/* Amount and Category */}
                <div className="text-center mb-8">
                  <div className={`w-20 h-20 rounded-2xl ${
                    transaction.type === 'income' ? 'bg-gold/10' : 'bg-gray-100'
                  } flex items-center justify-center mx-auto mb-4`}>
                    <transaction.categoryIcon className={`w-10 h-10 ${transaction.categoryColor}`} />
                  </div>
                  
                  <p className="text-sm text-primary/60 font-light mb-2">{transaction.categoryName}</p>
                  
                  <p className={`text-3xl font-light ${
                    transaction.type === 'income' ? 'text-gold' : 'text-primary'
                  }`}>
                    {transaction.type === 'income' ? '+' : '-'}
                    {formatCurrency(transaction.amount, { 
                      currency: transaction.currency || userProfile?.currency || 'USD', 
                      locale 
                    })}
                  </p>
                  
                  {transaction.recurring && (
                    <span className="inline-flex items-center gap-1 mt-2 px-3 py-1 bg-gold/10 text-gold rounded-full text-xs font-light">
                      Recurring {transaction.recurring}
                    </span>
                  )}
                </div>

                {/* Details */}
                <div className="space-y-4">
                  {/* Description */}
                  {transaction.description && (
                    <div>
                      <p className="text-xs text-primary/40 font-light tracking-wide uppercase mb-1">Description</p>
                      <p className="text-sm text-primary font-light">{transaction.description}</p>
                    </div>
                  )}

                  {/* Date & Time */}
                  <div>
                    <p className="text-xs text-primary/40 font-light tracking-wide uppercase mb-1">Date & Time</p>
                    <div className="flex items-center gap-2 text-sm text-primary font-light">
                      <Calendar className="w-4 h-4 text-primary/40" />
                      <span>{formatDate(transaction.date)}</span>
                      <span className="text-primary/40">at</span>
                      <span>{formatTime(transaction.date)}</span>
                    </div>
                  </div>

                  {/* Category */}
                  <div>
                    <p className="text-xs text-primary/40 font-light tracking-wide uppercase mb-1">Category</p>
                    <div className="flex items-center gap-2 text-sm text-primary font-light">
                      <Tag className="w-4 h-4 text-primary/40" />
                      <span>{transaction.categoryName}</span>
                    </div>
                  </div>

                  {/* Receipt */}
                  {transaction.receiptUrl && (
                    <div>
                      <p className="text-xs text-primary/40 font-light tracking-wide uppercase mb-2">Receipt</p>
                      <div className="bg-gray-50 rounded-xl p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <Receipt className="w-4 h-4 text-primary/40" />
                            <span className="text-sm text-primary font-light">Receipt attached</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <button className="p-2 hover:bg-white rounded-lg transition-colors">
                              <Download className="w-4 h-4 text-primary/50" />
                            </button>
                            <button className="p-2 hover:bg-white rounded-lg transition-colors">
                              <ExternalLink className="w-4 h-4 text-primary/50" />
                            </button>
                          </div>
                        </div>
                        {/* Receipt Preview */}
                        <img 
                          src={transaction.receiptUrl} 
                          alt="Receipt" 
                          className="w-full rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                          onClick={() => window.open(transaction.receiptUrl, '_blank')}
                        />
                      </div>
                    </div>
                  )}

                  {/* Created By */}
                  {transaction.createdByName && (
                    <div>
                      <p className="text-xs text-primary/40 font-light tracking-wide uppercase mb-1">Added By</p>
                      <div className="flex items-center gap-2 text-sm text-primary font-light">
                        <User className="w-4 h-4 text-primary/40" />
                        <span>{transaction.createdByName}</span>
                        {transaction.createdByEmail && (
                          <span className="text-primary/40">({transaction.createdByEmail})</span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Budget Category */}
                  {transaction.budgetCategory && (
                    <div>
                      <p className="text-xs text-primary/40 font-light tracking-wide uppercase mb-1">Budget Category</p>
                      <div className="flex items-center gap-2 text-sm text-primary font-light">
                        <Tag className="w-4 h-4 text-primary/40" />
                        <span className="capitalize">{transaction.budgetCategory.replace('-', ' ')}</span>
                      </div>
                    </div>
                  )}

                  {/* Created At */}
                  {transaction.createdAt && (
                    <div>
                      <p className="text-xs text-primary/40 font-light tracking-wide uppercase mb-1">Added On</p>
                      <p className="text-sm text-primary/60 font-light">
                        {formatDate(transaction.createdAt)} at {formatTime(transaction.createdAt)}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="p-6 border-t border-gray-100">
                {showDeleteConfirm ? (
                  <div className="space-y-3">
                    <p className="text-sm text-center text-primary/70 font-light">
                      Are you sure you want to delete this transaction?
                    </p>
                    <div className="flex gap-3">
                      <GlassButton
                        variant="secondary"
                        size="sm"
                        onClick={() => setShowDeleteConfirm(false)}
                        className="flex-1"
                      >
                        Cancel
                      </GlassButton>
                      <GlassButton
                        variant="primary"
                        size="sm"
                        onClick={handleDelete}
                        className="flex-1 bg-red-600 hover:bg-red-700"
                      >
                        Delete
                      </GlassButton>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-3">
                    <GlassButton
                      variant="secondary"
                      size="sm"
                      onClick={onEdit}
                      className="flex-1"
                    >
                      <Edit2 className="w-4 h-4 mr-2" />
                      Edit
                    </GlassButton>
                    <GlassButton
                      variant="secondary"
                      size="sm"
                      onClick={handleDelete}
                      className="flex-1 hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </GlassButton>
                  </div>
                )}
              </div>
            </GlassContainer>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
} 
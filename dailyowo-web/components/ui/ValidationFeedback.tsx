'use client';

import React from 'react';
import { AlertCircle, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface ValidationMessage {
  type: 'error' | 'warning' | 'success' | 'info';
  message: string;
  field?: string;
}

interface ValidationFeedbackProps {
  messages: ValidationMessage[];
  className?: string;
}

export function ValidationFeedback({ messages, className = '' }: ValidationFeedbackProps) {
  if (messages.length === 0) return null;

  const getIcon = (type: ValidationMessage['type']) => {
    switch (type) {
      case 'error':
        return <AlertCircle className="w-4 h-4" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4" />;
      case 'success':
        return <CheckCircle className="w-4 h-4" />;
      case 'info':
        return <Info className="w-4 h-4" />;
    }
  };

  const getStyles = (type: ValidationMessage['type']) => {
    switch (type) {
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-900/20 dark:border-yellow-800 dark:text-yellow-300';
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-300';
      case 'info':
        return 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-300';
    }
  };

  return (
    <AnimatePresence>
      <div className={`space-y-2 ${className}`}>
        {messages.map((msg, index) => (
          <motion.div
            key={`${msg.type}-${msg.field}-${index}`}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className={`flex items-start gap-2 p-3 rounded-lg border ${getStyles(msg.type)}`}
          >
            <div className="flex-shrink-0 mt-0.5">
              {getIcon(msg.type)}
            </div>
            <div className="flex-1">
              {msg.field && (
                <span className="font-medium capitalize">{msg.field}: </span>
              )}
              <span className="text-sm">{msg.message}</span>
            </div>
          </motion.div>
        ))}
      </div>
    </AnimatePresence>
  );
}

// Inline validation component for form fields
interface InlineValidationProps {
  error?: string;
  warning?: string;
  success?: string;
}

export function InlineValidation({ error, warning, success }: InlineValidationProps) {
  if (!error && !warning && !success) return null;

  return (
    <div className="mt-1 text-sm">
      {error && (
        <p className="text-red-600 dark:text-red-400 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          {error}
        </p>
      )}
      {warning && !error && (
        <p className="text-yellow-600 dark:text-yellow-400 flex items-center gap-1">
          <AlertTriangle className="w-3 h-3" />
          {warning}
        </p>
      )}
      {success && !error && !warning && (
        <p className="text-green-600 dark:text-green-400 flex items-center gap-1">
          <CheckCircle className="w-3 h-3" />
          {success}
        </p>
      )}
    </div>
  );
} 
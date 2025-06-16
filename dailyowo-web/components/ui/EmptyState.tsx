'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export default function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-16 px-4"
    >
      <div className="w-20 h-20 rounded-2xl bg-gray-50 flex items-center justify-center mb-6">
        <Icon className="w-10 h-10 text-primary/20" />
      </div>
      
      <h3 className="text-xl font-light text-primary mb-2">
        {title}
      </h3>
      
      {description && (
        <p className="text-sm font-light text-primary/40 text-center max-w-sm mb-6">
          {description}
        </p>
      )}
      
      {action && (
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={action.onClick}
          className="px-6 py-3 bg-white/50 border border-gold/30 rounded-xl hover:border-gold/50 hover:shadow-lg transition-all text-primary font-light"
        >
          {action.label}
        </motion.button>
      )}
    </motion.div>
  );
} 
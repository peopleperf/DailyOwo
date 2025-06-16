'use client';

import { motion } from 'framer-motion';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
}

export function PageHeader({ title, subtitle }: PageHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white border-b border-gray-200"
    >
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <h1 className="text-3xl font-light text-primary">{title}</h1>
        {subtitle && (
          <p className="text-primary/60 mt-2">{subtitle}</p>
        )}
      </div>
    </motion.div>
  );
} 
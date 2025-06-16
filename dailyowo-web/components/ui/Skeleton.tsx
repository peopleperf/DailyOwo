'use client';

import { cn } from '@/lib/utils/cn';
import { motion } from 'framer-motion';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
  width?: string | number;
  height?: string | number;
  animation?: 'pulse' | 'wave' | 'none';
}

export function Skeleton({
  className,
  variant = 'text',
  width,
  height,
  animation = 'pulse',
}: SkeletonProps) {
  const variantClasses = {
    text: 'h-4 rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-none',
    rounded: 'rounded-lg',
  };

  const animationClasses = {
    pulse: 'animate-pulse',
    wave: 'skeleton-wave',
    none: '',
  };

  return (
    <div
      className={cn(
        'bg-gray-200',
        variantClasses[variant],
        animationClasses[animation],
        className
      )}
      style={{
        width: width || (variant === 'circular' ? 40 : '100%'),
        height: height || (variant === 'circular' ? 40 : variant === 'text' ? 16 : 100),
      }}
    />
  );
}

// Card skeleton for mobile screens
export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('p-4 space-y-3', className)}>
      <div className="flex items-center space-x-3">
        <Skeleton variant="circular" width={40} height={40} />
        <div className="flex-1 space-y-2">
          <Skeleton width="60%" height={14} />
          <Skeleton width="40%" height={12} />
        </div>
      </div>
      <Skeleton variant="rounded" height={80} />
      <div className="space-y-2">
        <Skeleton width="90%" />
        <Skeleton width="70%" />
      </div>
    </div>
  );
}

// Transaction list skeleton
export function TransactionSkeleton() {
  return (
    <div className="flex items-center justify-between p-4">
      <div className="flex items-center space-x-3">
        <Skeleton variant="circular" width={44} height={44} />
        <div className="space-y-1">
          <Skeleton width={120} height={16} />
          <Skeleton width={80} height={14} />
        </div>
      </div>
      <div className="text-right space-y-1">
        <Skeleton width={60} height={16} />
        <Skeleton width={40} height={14} />
      </div>
    </div>
  );
}

// Dashboard loading state
export function DashboardSkeleton() {
  return (
    <div className="space-y-4 p-4">
      {/* Welcome section */}
      <div className="space-y-2">
        <Skeleton width="40%" height={24} />
        <Skeleton width="60%" height={16} />
      </div>

      {/* Net worth card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <CardSkeleton className="rounded-2xl" />
      </motion.div>

      {/* Quick stats grid */}
      <div className="grid grid-cols-2 gap-3">
        {[0.2, 0.3].map((delay, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay }}
          >
            <div className="rounded-xl p-3 space-y-2 border border-gray-200">
              <Skeleton width="50%" height={14} />
              <Skeleton width="70%" height={20} />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Transactions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="space-y-1"
      >
        <Skeleton width="40%" height={18} className="mb-3" />
        {[0, 1, 2].map((i) => (
          <div key={i} className="rounded-xl border border-gray-200">
            <TransactionSkeleton />
          </div>
        ))}
      </motion.div>
    </div>
  );
} 
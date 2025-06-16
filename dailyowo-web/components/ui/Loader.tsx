'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils/cn';
import { spinAnimation } from '@/lib/utils/animations';

interface LoaderProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'gold';
  fullScreen?: boolean;
  text?: string;
  className?: string;
}

export function Loader({
  size = 'md',
  variant = 'default',
  fullScreen = false,
  text,
  className,
}: LoaderProps) {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-10 h-10',
    lg: 'w-16 h-16',
  };

  const LoaderContent = () => (
    <div className={cn('flex flex-col items-center justify-center gap-4', className)}>
      <motion.div
        className={cn(
          'relative',
          sizeClasses[size]
        )}
        {...spinAnimation}
      >
        {/* Outer ring */}
        <div
          className={cn(
            'absolute inset-0 rounded-full border-2',
            variant === 'gold' 
              ? 'border-gold/20' 
              : 'border-white/20'
          )}
        />
        
        {/* Spinning gradient */}
        <div
          className={cn(
            'absolute inset-0 rounded-full border-2 border-transparent',
            'border-t-current border-r-current',
            variant === 'gold'
              ? 'text-gold'
              : 'text-white'
          )}
          style={{
            background: variant === 'gold'
              ? 'linear-gradient(45deg, transparent, transparent 40%, rgba(255, 215, 0, 0.1))'
              : 'linear-gradient(45deg, transparent, transparent 40%, rgba(255, 255, 255, 0.1))'
          }}
        />
        
        {/* Center dot */}
        <div
          className={cn(
            'absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
            'w-1/3 h-1/3 rounded-full',
            variant === 'gold'
              ? 'bg-gold/50'
              : 'bg-white/50'
          )}
        />
      </motion.div>
      
      {text && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-sm text-primary/70"
        >
          {text}
        </motion.p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
      >
        <div className="glass rounded-2xl p-8">
          <LoaderContent />
        </div>
      </motion.div>
    );
  }

  return <LoaderContent />;
}

// Page loader with progress
export function PageLoader({ progress }: { progress?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/95 backdrop-blur-md"
    >
      <div className="relative">
        <Loader size="lg" variant="gold" />
        
        {/* DailyOwo branding */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-8 text-center"
        >
          <h2 className="text-2xl font-bold text-gradient">DailyOwo</h2>
          <p className="text-sm text-primary/60 mt-1">Your Premium Finance Companion</p>
        </motion.div>
      </div>
      
      {/* Progress bar */}
      {progress !== undefined && (
        <motion.div
          initial={{ opacity: 0, width: 0 }}
          animate={{ opacity: 1, width: '200px' }}
          transition={{ delay: 0.5 }}
          className="mt-8 h-1 bg-gray-200 rounded-full overflow-hidden"
        >
          <motion.div
            className="h-full bg-gradient-to-r from-gold to-gold-light rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </motion.div>
      )}
    </motion.div>
  );
} 
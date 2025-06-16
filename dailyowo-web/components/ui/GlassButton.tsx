'use client';

import { forwardRef, ButtonHTMLAttributes } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils/cn';

interface GlassButtonProps extends Omit<HTMLMotionProps<"button">, "ref"> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'gold';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  fullWidth?: boolean;
  goldBorder?: boolean;
}

export const GlassButton = forwardRef<HTMLButtonElement, GlassButtonProps>(
  ({ 
    className, 
    variant = 'primary', 
    size = 'md', 
    loading = false, 
    fullWidth = false,
    goldBorder = false,
    children, 
    disabled,
    ...props 
  }, ref) => {
    const baseClasses = 'relative inline-flex items-center justify-center font-medium rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none';
    
    const sizeClasses = {
      sm: 'px-3 py-2 text-sm min-h-[40px]',
      md: 'px-4 py-2.5 text-base min-h-[44px]',
      lg: 'px-6 py-3 text-lg min-h-[48px]',
    };

    const variantClasses = {
      primary: cn(
        'bg-primary text-white',
        'hover:bg-primary-light hover:shadow-lg hover:-translate-y-0.5',
        'active:translate-y-0',
        goldBorder && 'gold-border-glow'
      ),
      secondary: cn(
        'glass glass-hover text-primary relative',
        'before:content-[\'\'] before:absolute before:inset-0',
        'before:bg-gradient-to-br before:from-white/10 before:via-transparent before:to-transparent',
        'before:pointer-events-none before:z-[1] before:rounded-xl',
        goldBorder && 'gold-border-glow'
      ),
      ghost: cn(
        'bg-transparent hover:bg-gray-100 text-primary',
        'hover:shadow-soft'
      ),
      danger: cn(
        'bg-error text-white',
        'hover:bg-red-600 hover:shadow-lg hover:-translate-y-0.5',
        'active:translate-y-0'
      ),
      gold: cn(
        'btn-gold text-white font-semibold',
        'hover:shadow-gold-glow hover:-translate-y-0.5',
        'active:translate-y-0'
      ),
    };

    return (
      <motion.button
        ref={ref}
        whileTap={{ scale: 0.98 }}
        className={cn(
          baseClasses,
          sizeClasses[size],
          variantClasses[variant],
          fullWidth && 'w-full',
          loading && 'cursor-wait',
          className
        )}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <>
            <svg 
              className="animate-spin -ml-1 mr-2 h-4 w-4" 
              xmlns="http://www.w3.org/2000/svg" 
              fill="none" 
              viewBox="0 0 24 24"
            >
              <circle 
                className="opacity-25" 
                cx="12" 
                cy="12" 
                r="10" 
                stroke="currentColor" 
                strokeWidth="4"
              />
              <path 
                className="opacity-75" 
                fill="currentColor" 
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Loading...
          </>
        ) : children}
      </motion.button>
    );
  }
);

GlassButton.displayName = 'GlassButton'; 
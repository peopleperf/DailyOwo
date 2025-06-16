'use client';

import { forwardRef, InputHTMLAttributes, ReactNode, useState } from 'react';
import { cn } from '@/lib/utils/cn';
import { Eye, EyeOff } from 'lucide-react';

interface GlassInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: ReactNode;
  fullWidth?: boolean;
}

const GlassInput = forwardRef<HTMLInputElement, GlassInputProps>(
  ({ className, type = 'text', label, error, icon, fullWidth = true, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = type === 'password';

    return (
      <div className={cn('space-y-2', fullWidth && 'w-full')}>
        {label && (
          <label className="text-sm font-medium text-primary/80">
            {label}
          </label>
        )}
        
        <div className="relative">
          {icon && (
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-primary/40 pointer-events-none">
              {icon}
            </div>
          )}
          
          <input
            ref={ref}
            type={isPassword && !showPassword ? 'password' : type === 'password' ? 'text' : type}
            className={cn(
              'glass-input w-full rounded-xl',
              'placeholder:text-primary/30 text-primary',
              'transition-all duration-200',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'touch-manipulation', // Optimize for mobile
              icon && 'pl-12',
              type === 'password' && 'pr-12',
              error && 'border-error/30 focus:border-error/50',
              className
            )}
            {...props}
          />
          
          {type === 'password' && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-primary/40 hover:text-primary/60 transition-colors p-1"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          )}
        </div>
        
        {error && (
          <p className="text-sm text-error">
            {error}
          </p>
        )}
      </div>
    );
  }
);

GlassInput.displayName = 'GlassInput';

export { GlassInput }; 
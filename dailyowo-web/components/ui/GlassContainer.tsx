'use client';

import { cn } from '@/lib/utils/cn';
import { HTMLAttributes, forwardRef } from 'react';

interface GlassContainerProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'dark' | 'light';
  blur?: 'sm' | 'md' | 'lg';
  noBorder?: boolean;
  goldBorder?: boolean;
  glowAnimation?: boolean;
}

const GlassContainer = forwardRef<HTMLDivElement, GlassContainerProps>(
  ({ 
    children, 
    className, 
    variant = 'default',
    blur = 'sm',
    noBorder = false,
    goldBorder = false,
    glowAnimation = false,
    ...props 
  }, ref) => {
    // Balanced blur values for proper glass feel
    const blurValues = {
      sm: '12px',
      md: '16px', 
      lg: '24px',
    };

    // Balanced glass variants - more depth but still elegant
    const variantStyles = {
      default: {
        background: 'rgba(255, 255, 255, 0.7)',
        backgroundImage: `
          radial-gradient(at 20% 30%, rgba(255, 255, 255, 0.3) 0px, transparent 50%),
          radial-gradient(at 80% 0%, rgba(255, 255, 255, 0.2) 0px, transparent 50%),
          radial-gradient(at 40% 70%, rgba(166, 124, 0, 0.03) 0px, transparent 50%)
        `,
        border: goldBorder ? 'rgba(166, 124, 0, 0.4)' : 'rgba(255, 255, 255, 0.5)',
        boxShadow: goldBorder 
          ? '0 8px 32px 0 rgba(38, 38, 89, 0.08), 0 0 20px 0 rgba(166, 124, 0, 0.1), inset 0 2px 4px 0 rgba(255, 255, 255, 0.9), inset 0 -1px 2px 0 rgba(0, 0, 0, 0.04)'
          : '0 8px 32px 0 rgba(38, 38, 89, 0.08), inset 0 2px 4px 0 rgba(255, 255, 255, 0.9), inset 0 -1px 2px 0 rgba(0, 0, 0, 0.04)',
      },
      dark: {
        background: 'rgba(245, 245, 245, 0.75)',
        backgroundImage: `
          radial-gradient(at 20% 30%, rgba(255, 255, 255, 0.4) 0px, transparent 50%),
          radial-gradient(at 80% 0%, rgba(255, 255, 255, 0.3) 0px, transparent 50%)
        `,
        border: goldBorder ? 'rgba(166, 124, 0, 0.4)' : 'rgba(255, 255, 255, 0.6)',
        boxShadow: '0 8px 32px 0 rgba(38, 38, 89, 0.1), inset 0 2px 4px 0 rgba(255, 255, 255, 0.95), inset 0 -1px 2px 0 rgba(0, 0, 0, 0.05)',
      },
      light: {
        background: 'rgba(255, 255, 255, 0.8)',
        backgroundImage: `
          radial-gradient(at 30% 20%, rgba(255, 255, 255, 0.5) 0px, transparent 50%),
          radial-gradient(at 70% 80%, rgba(255, 255, 255, 0.3) 0px, transparent 50%)
        `,
        border: goldBorder ? 'rgba(166, 124, 0, 0.3)' : 'rgba(255, 255, 255, 0.7)',
        boxShadow: '0 6px 24px 0 rgba(38, 38, 89, 0.06), inset 0 2px 4px 0 rgba(255, 255, 255, 1), inset 0 -1px 1px 0 rgba(0, 0, 0, 0.02)',
      },
    };

    const selectedVariant = variantStyles[variant];

    return (
      <div
        ref={ref}
        className={cn(
          'relative rounded-2xl overflow-hidden transition-all duration-300',
          goldBorder && glowAnimation && 'gold-border-glow',
          className
        )}
        style={{
          background: selectedVariant.background,
          backgroundImage: selectedVariant.backgroundImage,
          border: !noBorder ? `1px solid ${selectedVariant.border}` : undefined,
          boxShadow: selectedVariant.boxShadow,
          backdropFilter: `blur(${blurValues[blur]}) saturate(180%)`,
          WebkitBackdropFilter: `blur(${blurValues[blur]}) saturate(180%)`,
        }}
        {...props}
      >
        {goldBorder && (
          <>
            {/* Subtle gold accent line */}
            <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-gold/20 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 h-[1px] bg-gradient-to-r from-transparent via-gold/20 to-transparent" />
          </>
        )}
        
        {/* Glass shine layer for depth */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-50"
          style={{
            background: `linear-gradient(105deg, 
              transparent 40%, 
              rgba(255, 255, 255, 0.2) 45%, 
              rgba(255, 255, 255, 0.1) 50%, 
              transparent 55%
            )`,
          }}
        />
        
        {/* Content */}
        <div className="relative z-10">
          {children}
        </div>
      </div>
    );
  }
);

GlassContainer.displayName = 'GlassContainer';

export { GlassContainer }; 
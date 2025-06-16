'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils/cn';

interface ContainerProps {
  children: ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  padding?: boolean;
}

export function Container({
  children,
  className,
  size = 'lg',
  padding = true,
}: ContainerProps) {
  const sizeClasses = {
    sm: 'max-w-screen-sm', // 640px
    md: 'max-w-screen-md', // 768px  
    lg: 'max-w-screen-lg', // 1024px
    xl: 'max-w-screen-xl', // 1280px
    full: 'max-w-full',
  };

  return (
    <div
      className={cn(
        'mx-auto w-full',
        sizeClasses[size],
        padding && [
          'px-4', // mobile: 16px
          'sm:px-6', // 640px+: 24px
          'md:px-8', // 768px+: 32px
          'lg:px-12', // 1024px+: 48px
        ],
        className
      )}
    >
      {children}
    </div>
  );
} 
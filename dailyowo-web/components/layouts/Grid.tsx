'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils/cn';

interface GridProps {
  children: ReactNode;
  className?: string;
  cols?: {
    default?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
  gap?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

export function Grid({
  children,
  className,
  cols = { default: 1, sm: 2, md: 3, lg: 4 },
  gap = 'md',
}: GridProps) {
  const gapClasses = {
    none: 'gap-0',
    xs: 'gap-2', // 8px
    sm: 'gap-3', // 12px
    md: 'gap-4', // 16px - mobile friendly
    lg: 'gap-6', // 24px
    xl: 'gap-8', // 32px
  };

  const colClasses = [
    cols.default && `grid-cols-${cols.default}`,
    cols.sm && `sm:grid-cols-${cols.sm}`,
    cols.md && `md:grid-cols-${cols.md}`,
    cols.lg && `lg:grid-cols-${cols.lg}`,
    cols.xl && `xl:grid-cols-${cols.xl}`,
  ].filter(Boolean);

  return (
    <div
      className={cn(
        'grid',
        gapClasses[gap],
        colClasses,
        className
      )}
    >
      {children}
    </div>
  );
}

interface GridItemProps {
  children: ReactNode;
  className?: string;
  span?: {
    default?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
}

export function GridItem({
  children,
  className,
  span,
}: GridItemProps) {
  const spanClasses = span ? [
    span.default && `col-span-${span.default}`,
    span.sm && `sm:col-span-${span.sm}`,
    span.md && `md:col-span-${span.md}`,
    span.lg && `lg:col-span-${span.lg}`,
    span.xl && `xl:col-span-${span.xl}`,
  ].filter(Boolean) : [];

  return (
    <div className={cn(spanClasses, className)}>
      {children}
    </div>
  );
} 
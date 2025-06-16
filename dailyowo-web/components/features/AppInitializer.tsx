'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { SplashScreen } from './SplashScreen';
import { useAuth } from '@/lib/firebase/auth-context';

interface AppInitializerProps {
  children: React.ReactNode;
}

export function AppInitializer({ children }: AppInitializerProps) {
  const [showSplash, setShowSplash] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const { user, userProfile, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // Track when component is mounted (client-side only)
  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    // Only run on client side after mount
    if (!isMounted) return;

    // Check if user has seen splash screen in this session
    const hasSeenSplash = sessionStorage.getItem('hasSeenSplash');
    
    // Only show splash on locale-specific home pages
    const isLocaleHomePage = pathname && pathname.match(/^\/[a-z]{2}(?:-[A-Z]{2})?$/);
    
    if (!hasSeenSplash && isLocaleHomePage) {
      setShowSplash(true);
    } else {
      setIsInitialized(true);
    }
  }, [isMounted, pathname]);

  const handleSplashComplete = () => {
    sessionStorage.setItem('hasSeenSplash', 'true');
    setShowSplash(false);
    setIsInitialized(true);
  };

  // Handle authentication redirects
  useEffect(() => {
    // Only run on client side after mount and initialization
    if (!isMounted || !isInitialized || loading || !pathname) return;

    // Check if we're on a protected route
    const isProtectedRoute = pathname.includes('/dashboard') || pathname.includes('/onboarding');
    
    if (isProtectedRoute && !user) {
      // Extract locale from pathname
      const localeMatch = pathname.match(/^\/([a-z]{2}(?:-[A-Z]{2})?)/);
      const locale = localeMatch ? localeMatch[1] : 'en';
      router.push(`/${locale}/auth/login`);
    }
  }, [isMounted, isInitialized, loading, user, pathname, router]);

  // During SSR or before initialization
  if (!isMounted) {
    return <>{children}</>;
  }

  if (showSplash && !isInitialized) {
    return <SplashScreen onComplete={handleSplashComplete} />;
  }

  return <>{children}</>;
} 
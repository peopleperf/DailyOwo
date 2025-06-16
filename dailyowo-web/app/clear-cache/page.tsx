'use client';

import { useEffect } from 'react';
import { Container } from '@/components/layouts/Container';
import { GlassContainer } from '@/components/ui/GlassContainer';
import { Loader } from 'lucide-react';

export default function ClearCachePage() {
  useEffect(() => {
    const clearCache = async () => {
      console.log('Starting cache clear process...');
      
      try {
        // Clear all IndexedDB databases
        if ('indexedDB' in window) {
          const databases = await indexedDB.databases();
          console.log('Found databases:', databases);
          
          for (const db of databases) {
            if (db.name) {
              try {
                await indexedDB.deleteDatabase(db.name);
                console.log(`Cleared database: ${db.name}`);
              } catch (err) {
                console.error(`Failed to delete ${db.name}:`, err);
              }
            }
          }
        }
        
        // Clear localStorage
        localStorage.clear();
        console.log('Cleared localStorage');
        
        // Clear sessionStorage
        sessionStorage.clear();
        console.log('Cleared sessionStorage');
        
        // Clear cookies for this domain
        document.cookie.split(";").forEach((c) => {
          document.cookie = c
            .replace(/^ +/, "")
            .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
        });
        console.log('Cleared cookies');
        
        // Wait a moment
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Redirect to home page with cache cleared
        window.location.href = '/?cache_cleared=true';
        
      } catch (error) {
        console.error('Cache clear error:', error);
        // Still try to redirect
        setTimeout(() => {
          window.location.href = '/';
        }, 2000);
      }
    };
    
    clearCache();
  }, []);
  
  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <Container size="sm">
        <GlassContainer className="p-8 text-center">
          <div className="w-16 h-16 glass-subtle rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Loader className="w-8 h-8 text-gold animate-spin" />
          </div>
          <h1 className="text-2xl font-semibold text-primary mb-2">
            Clearing Browser Cache
          </h1>
          <p className="text-primary/70">
            Please wait while we clear your browser cache...
          </p>
          <p className="text-sm text-primary/50 mt-4">
            You'll be redirected to the home page once complete.
          </p>
        </GlassContainer>
      </Container>
    </div>
  );
} 
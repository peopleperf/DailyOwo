'use client';

import React, { useEffect, useState } from 'react';
import { AlertCircle, RefreshCw, CheckCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { firestoreDiagnostics } from '@/lib/firebase/firestore-diagnostics';

export function FirestoreErrorBoundary({ children }: { children: React.ReactNode }) {
  const [hasError, setHasError] = useState(false);
  const [isRecovering, setIsRecovering] = useState(false);
  const [isFatalError, setIsFatalError] = useState(false);
  const [recoveryProgress, setRecoveryProgress] = useState(0);
  const [errorSummary, setErrorSummary] = useState<any>(null);

  useEffect(() => {
    // Listen for recovery events
    const handleRecoveryNeeded = (event: CustomEvent) => {
      console.log('[FirestoreErrorBoundary] Recovery needed:', event.detail);
      setHasError(true);
      setIsRecovering(true);
      setErrorSummary(event.detail);
      setRecoveryProgress(20);
    };
    
    const handleRecoveryComplete = () => {
      console.log('[FirestoreErrorBoundary] Recovery complete');
      setRecoveryProgress(100);
      setTimeout(() => {
        setHasError(false);
        setIsRecovering(false);
        setRecoveryProgress(0);
      }, 1000);
    };
    
    const handleRecoveryFailed = () => {
      console.log('[FirestoreErrorBoundary] Recovery failed');
      setIsRecovering(false);
      setIsFatalError(true);
    };
    
    window.addEventListener('firestore-recovery-needed', handleRecoveryNeeded as any);
    window.addEventListener('firestore-recovery-complete', handleRecoveryComplete);
    window.addEventListener('firestore-recovery-failed', handleRecoveryFailed);
    
    // Check Firestore health periodically
    const healthCheck = setInterval(() => {
      if (!firestoreDiagnostics.isFirestoreHealthy()) {
        const summary = firestoreDiagnostics.getErrorSummary();
        if (summary.totalErrors > 10) {
          setHasError(true);
          setErrorSummary(summary);
        }
      }
    }, 5000);
    
    return () => {
      window.removeEventListener('firestore-recovery-needed', handleRecoveryNeeded as any);
      window.removeEventListener('firestore-recovery-complete', handleRecoveryComplete);
      window.removeEventListener('firestore-recovery-failed', handleRecoveryFailed);
      clearInterval(healthCheck);
    };
  }, []);

  useEffect(() => {
    if (isRecovering) {
      // Simulate recovery progress
      const progressInterval = setInterval(() => {
        setRecoveryProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 500);
      
      return () => clearInterval(progressInterval);
    }
  }, [isRecovering]);

  const handleManualRecovery = async () => {
    setIsRecovering(true);
    setRecoveryProgress(10);
    
    try {
      // Clear all IndexedDB databases
      if ('indexedDB' in window) {
        const databases = await indexedDB.databases();
        for (const db of databases) {
          if (db.name?.includes('firestore') || db.name?.includes('firebase')) {
            await new Promise((resolve, reject) => {
              const deleteReq = indexedDB.deleteDatabase(db.name!);
              deleteReq.onsuccess = () => resolve(undefined);
              deleteReq.onerror = () => reject(deleteReq.error);
            });
          }
        }
      }
      
      setRecoveryProgress(50);
      
      // Clear local storage
      localStorage.removeItem('firebase:host:dailyowo.firebaseio.com');
      localStorage.removeItem('firebase:previouslyFetchedAt:dailyowo.firebaseio.com');
      
      setRecoveryProgress(80);
      
      // Clear diagnostics
      firestoreDiagnostics.clearErrors();
      
      setRecoveryProgress(100);
      
      // Reload the page
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (error) {
      console.error('Manual recovery failed:', error);
      setIsFatalError(true);
      setIsRecovering(false);
    }
  };

  if (!hasError) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <div className="max-w-md w-full">
        <Alert variant={isFatalError ? "destructive" : "default"}>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>
            {isRecovering ? 'Recovering Database...' : 'Database Connection Issue'}
          </AlertTitle>
          <AlertDescription className="space-y-4">
            {isRecovering ? (
              <>
                <p>We're automatically recovering your database connection. This should only take a moment.</p>
                <Progress value={recoveryProgress} className="mt-2" />
                <p className="text-sm text-gray-600">Progress: {recoveryProgress}%</p>
              </>
            ) : isFatalError ? (
              <>
                <p>We couldn't automatically recover the database connection. This might be due to:</p>
                <ul className="list-disc list-inside text-sm space-y-1 mt-2">
                  <li>Multiple browser tabs open</li>
                  <li>Browser storage corruption</li>
                  <li>Network connectivity issues</li>
                </ul>
                {errorSummary && (
                  <div className="mt-3 p-2 bg-gray-100 rounded text-xs">
                    <p>Error patterns: {Object.keys(errorSummary.errorPatterns || {}).join(', ')}</p>
                    <p>Total errors: {errorSummary.totalErrors}</p>
                  </div>
                )}
                <div className="flex gap-2 mt-4">
                  <Button 
                    onClick={handleManualRecovery}
                    variant="default"
                    size="sm"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Try Recovery
                  </Button>
                  <Button 
                    onClick={() => window.location.reload()}
                    variant="outline"
                    size="sm"
                  >
                    Reload Page
                  </Button>
                </div>
              </>
            ) : (
              <>
                <p>We detected an issue with the database connection. Starting automatic recovery...</p>
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold mx-auto mt-4"></div>
              </>
            )}
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
} 
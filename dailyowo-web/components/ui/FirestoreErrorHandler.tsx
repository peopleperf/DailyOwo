'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { GlassButton } from './GlassButton';

export function FirestoreErrorHandler() {
  const [showError, setShowError] = useState(false);
  const [errorDetails, setErrorDetails] = useState<any>(null);

  useEffect(() => {
    const handleFirestoreError = (event: CustomEvent) => {
      setErrorDetails(event.detail);
      setShowError(true);
    };

    window.addEventListener('firestore-error' as any, handleFirestoreError);

    return () => {
      window.removeEventListener('firestore-error' as any, handleFirestoreError);
    };
  }, []);

  const handleClearCache = async () => {
    try {
      // Clear all IndexedDB databases
      if ('indexedDB' in window) {
        const databases = await indexedDB.databases();
        const firestoreDbs = databases.filter(db => 
          db.name?.includes('firestore') || 
          db.name?.includes('firebase')
        );

        for (const db of firestoreDbs) {
          if (db.name) {
            await indexedDB.deleteDatabase(db.name);
            console.log(`Cleared database: ${db.name}`);
          }
        }
      }

      // Clear localStorage
      localStorage.clear();
      
      // Reload the page
      window.location.reload();
    } catch (error) {
      console.error('Failed to clear cache:', error);
      // Still try to reload
      window.location.reload();
    }
  };

  if (!showError || !errorDetails) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="fixed top-4 left-1/2 -translate-x-1/2 z-50 max-w-md w-full px-4"
      >
        <div className="glass-container p-4 rounded-xl border-2 border-orange-500/20 bg-orange-50/90">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-primary mb-1">
                Database Connection Issue
              </h3>
              <p className="text-sm text-primary/70 mb-3">
                We're experiencing a connection issue with the database. This is usually fixed by clearing your browser cache.
              </p>
              <div className="flex gap-2">
                <GlassButton
                  size="sm"
                  variant="primary"
                  onClick={handleClearCache}
                  className="bg-orange-600 hover:bg-orange-700"
                >
                  <RefreshCw className="w-4 h-4 mr-1" />
                  Clear Cache & Reload
                </GlassButton>
                <GlassButton
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowError(false)}
                >
                  Dismiss
                </GlassButton>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
} 
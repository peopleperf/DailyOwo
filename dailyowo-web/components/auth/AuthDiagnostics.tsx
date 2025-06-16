'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/firebase/auth-context';
import { getFirebaseAuth } from '@/lib/firebase/config';
import { getFirestoreDiagnostics, logDiagnostics } from '@/lib/firebase/diagnostics';
import { motion } from 'framer-motion';
import { User, Shield, Database, AlertTriangle, CheckCircle, XCircle, RefreshCw } from 'lucide-react';

export function AuthDiagnostics() {
  // Use try-catch in case auth context is not available
  let authData: any = { user: null, userProfile: null, loading: false, error: null };
  try {
    authData = useAuth();
  } catch (e) {
    console.log('Auth context not available, running in standalone mode');
  }
  
  const { user, userProfile, loading, error } = authData;
  const [authState, setAuthState] = useState<any>(null);
  const [firestoreDiag, setFirestoreDiag] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);

  const updateDiagnostics = async () => {
    setRefreshing(true);
    
    try {
      // Get auth state
      const auth = getFirebaseAuth();
      if (auth) {
        setAuthState({
          currentUser: auth.currentUser ? {
            uid: auth.currentUser.uid,
            email: auth.currentUser.email,
            emailVerified: auth.currentUser.emailVerified,
            displayName: auth.currentUser.displayName,
            metadata: auth.currentUser.metadata ? {
              creationTime: auth.currentUser.metadata.creationTime,
              lastSignInTime: auth.currentUser.metadata.lastSignInTime
            } : null
          } : null,
          authPersistence: await auth.currentUser?.getIdTokenResult().then(r => r.authTime).catch(() => 'unknown')
        });
      } else {
        setAuthState({ currentUser: null, authPersistence: 'not initialized' });
      }

      // Get Firestore diagnostics
      const fsDiag = getFirestoreDiagnostics();
      setFirestoreDiag(fsDiag);
      
      // Log to console
      logDiagnostics();
    } catch (error) {
      console.error('Error updating diagnostics:', error);
    }
    
    setRefreshing(false);
  };

  useEffect(() => {
    updateDiagnostics();
  }, [user]);

  // Only show in development mode
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  // Disable auth diagnostics completely
  return null;
} 
'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { GlassContainer } from '@/components/ui/GlassContainer';
import { useAuth } from '@/lib/firebase/auth-context';
import { getFirebaseDb } from '@/lib/firebase/config';
import { ensureFirestoreConnection, createUserDocument, initializeCollections } from '@/lib/firebase/init-collections';
import { forceFirestoreOnline, clearFirestoreCache } from '@/lib/firebase/force-online';
import { 
  getFirestoreDiagnostics, 
  logDiagnostics, 
  resetFirestoreConnection,
  restartFirestore,
  clearLastError
} from '@/lib/firebase/diagnostics';
import { doc, setDoc, getDoc, collection, addDoc } from 'firebase/firestore';
import { CheckCircle, XCircle, Loader2, Database, Wifi, User, FileText, RefreshCw, Trash2, AlertCircle, Activity, AlertTriangle, Shield } from 'lucide-react';

export default function FirebaseDebugPage() {
  // Use try-catch for auth context in case it's not available
  let user = null;
  let userProfile = null;
  try {
    const auth = useAuth();
    user = auth.user;
    userProfile = auth.userProfile;
  } catch (e) {
    console.log('Auth context not available, running in standalone mode');
  }
  
  const [status, setStatus] = useState<{[key: string]: 'pending' | 'success' | 'error'}>({});
  const [messages, setMessages] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [diagnostics, setDiagnostics] = useState<any>(null);
  const [adminMode] = useState(true); // Always in admin mode for testing
  const [isClient, setIsClient] = useState(false);

  // Initialize client state and diagnostics
  useEffect(() => {
    setIsClient(true);
    const initialDiagnostics = getFirestoreDiagnostics();
    setDiagnostics(initialDiagnostics);
  }, []);

  const addMessage = (message: string) => {
    setMessages(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const updateDiagnostics = () => {
    if (!isClient) return;
    
    const newDiagnostics = getFirestoreDiagnostics();
    setDiagnostics(newDiagnostics);
    logDiagnostics(); // Also log to console
  };

  const runDiagnostics = async () => {
    setIsRunning(true);
    setMessages([]);
    setStatus({});
    clearLastError(); // Clear any previous errors

    // Update diagnostics at start
    updateDiagnostics();

    // Test 1: Check Firebase configuration
    addMessage('Starting Firebase diagnostics...');
    setStatus(prev => ({ ...prev, config: 'pending' }));
    
    const db = await getFirebaseDb();
    if (!db) {
      setStatus(prev => ({ ...prev, config: 'error' }));
      addMessage('❌ Firebase not configured properly');
      setIsRunning(false);
      return;
    }
    
    setStatus(prev => ({ ...prev, config: 'success' }));
    addMessage('✅ Firebase configuration loaded');

    // Test 2: Check authentication (optional in admin mode)
    setStatus(prev => ({ ...prev, auth: 'pending' }));
    if (!user && !adminMode) {
      setStatus(prev => ({ ...prev, auth: 'error' }));
      addMessage('❌ No authenticated user');
      addMessage('⚠️ Some tests will be skipped without authentication');
    } else if (user) {
      setStatus(prev => ({ ...prev, auth: 'success' }));
      addMessage(`✅ Authenticated as: ${user.email}`);
    } else {
      setStatus(prev => ({ ...prev, auth: 'success' }));
      addMessage('✅ Running in admin mode (no auth required)');
    }

    // Test 3: Test Firestore connection
    setStatus(prev => ({ ...prev, connection: 'pending' }));
    try {
      await ensureFirestoreConnection();
      setStatus(prev => ({ ...prev, connection: 'success' }));
      addMessage('✅ Firestore connection established');
    } catch (error: any) {
      setStatus(prev => ({ ...prev, connection: 'error' }));
      addMessage(`❌ Firestore connection failed: ${error.message}`);
    }

    // Test 4: Test basic Firestore operations
    setStatus(prev => ({ ...prev, firestoreOps: 'pending' }));
    try {
      // Test write to a diagnostic collection
      const testData = {
        test: true,
        timestamp: new Date(),
        mode: adminMode ? 'admin' : 'user',
        message: 'Test document from debug page'
      };
      
      const testRef = await addDoc(collection(db, 'test-diagnostics'), testData);
      addMessage('✅ Successfully wrote test document');
      
      // Test read
      const testDoc = await getDoc(doc(db, 'test-diagnostics', testRef.id));
      if (testDoc.exists()) {
        setStatus(prev => ({ ...prev, firestoreOps: 'success' }));
        addMessage('✅ Successfully read test document');
      } else {
        throw new Error('Could not read test document');
      }
    } catch (error: any) {
      setStatus(prev => ({ ...prev, firestoreOps: 'error' }));
      addMessage(`❌ Firestore operations test failed: ${error.message}`);
    }

    // Test 5: Check user document (only if authenticated)
    if (user) {
      setStatus(prev => ({ ...prev, userDoc: 'pending' }));
      try {
        const userRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userRef);
        
        if (userDoc.exists()) {
          setStatus(prev => ({ ...prev, userDoc: 'success' }));
          addMessage('✅ User document exists');
        } else {
          setStatus(prev => ({ ...prev, userDoc: 'error' }));
          addMessage('❌ User document not found');
          
          // Try to create it
          addMessage('📝 Creating user document...');
          await createUserDocument(user.uid, {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName || '',
            onboardingCompleted: userProfile?.onboardingCompleted || false
          });
          setStatus(prev => ({ ...prev, userDoc: 'success' }));
          addMessage('✅ User document created');
        }
      } catch (error: any) {
        setStatus(prev => ({ ...prev, userDoc: 'error' }));
        addMessage(`❌ Error with user document: ${error.message}`);
      }
    } else {
      addMessage('⏭️ Skipping user document test (no authentication)');
    }

    // Update diagnostics at end
    updateDiagnostics();
    
    setIsRunning(false);
    addMessage('🏁 Diagnostics complete');
  };

  const fixConnection = async () => {
    setIsRunning(true);
    addMessage('🔧 Attempting to fix connection...');

    try {
      // Reset Firestore connection
      await resetFirestoreConnection();
      addMessage('✅ Connection reset');

      // Force online mode
      await forceFirestoreOnline();
      addMessage('✅ Forced online mode');

      // Initialize collections (only if authenticated)
      if (user) {
        await initializeCollections(user.uid);
        addMessage('✅ Collections initialized');
      } else {
        addMessage('⚠️ Skipping collection initialization (no authentication)');
      }

      // Force a connection refresh
      await ensureFirestoreConnection();
      addMessage('✅ Connection refreshed');

      // Update diagnostics
      updateDiagnostics();

      addMessage('🎉 Fix complete! Try using the app now.');
    } catch (error: any) {
      addMessage(`❌ Fix failed: ${error.message}`);
    }

    setIsRunning(false);
  };

  const fullRestart = async () => {
    setIsRunning(true);
    addMessage('🔄 Performing full Firestore restart...');

    try {
      await restartFirestore();
      addMessage('✅ Firestore restarted');
      
      // Update diagnostics
      updateDiagnostics();
      
      addMessage('🎉 Restart complete!');
    } catch (error: any) {
      addMessage(`⚠️ Restart completed with warnings: ${error?.message || 'Unknown error'}`);
      // Still update diagnostics since restart might have partially worked
      updateDiagnostics();
    }

    setIsRunning(false);
  };

  const softRestart = async () => {
    setIsRunning(true);
    addMessage('🔄 Performing soft Firestore restart...');

    try {
      // Import the soft restart function
      const { softRestartFirestore } = await import('@/lib/firebase/diagnostics');
      await softRestartFirestore();
      addMessage('✅ Soft restart completed');
      
      // Update diagnostics
      updateDiagnostics();
      
      addMessage('🎉 Soft restart complete!');
    } catch (error: any) {
      addMessage(`⚠️ Soft restart completed with warnings: ${error?.message || 'Unknown error'}`);
      updateDiagnostics();
    }

    setIsRunning(false);
  };

  const clearCache = async () => {
    setIsRunning(true);
    addMessage('🧹 Clearing Firestore cache...');

    try {
      await clearFirestoreCache();
      addMessage('✅ Cache cleared');
      
      addMessage('🔄 Reloading page in 2 seconds...');
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error: any) {
      addMessage(`❌ Clear cache failed: ${error.message}`);
      setIsRunning(false);
    }
  };

  const getStatusIcon = (status?: 'pending' | 'success' | 'error') => {
    switch (status) {
      case 'pending':
        return <Loader2 className="w-5 h-5 text-primary/40 animate-spin" />;
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return <div className="w-5 h-5" />;
    }
  };

  // Don't render until client is ready to avoid hydration mismatch
  if (!isClient) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-light text-primary">Firebase Debug Tool</h1>
        <div className="flex items-center gap-2 px-3 py-1 bg-purple-100 rounded-full">
          <Shield className="w-4 h-4 text-purple-600" />
          <span className="text-sm font-medium text-purple-800">Admin Mode</span>
        </div>
      </div>

      {/* Admin mode notice */}
      <div className="mb-6 p-4 bg-purple-50 border border-purple-200 rounded-xl flex items-start gap-3">
        <Shield className="w-5 h-5 text-purple-600 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-purple-800">Admin Mode Enabled</p>
          <p className="text-sm text-purple-700 mt-1">
            All diagnostic features are available without authentication for testing purposes.
          </p>
        </div>
      </div>

      {/* Show last error if any */}
      {diagnostics?.lastError && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-800">Last Firestore Error</p>
              <p className="text-sm text-red-700 mt-1 font-mono">{diagnostics.lastError}</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Status Panel */}
        <GlassContainer className="p-6">
          <h2 className="text-xl font-light text-primary mb-4">Connection Status</h2>
          
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              {getStatusIcon(status.config)}
              <Database className="w-5 h-5 text-primary/40" />
              <span className="text-sm font-light">Firebase Configuration</span>
            </div>
            
            <div className="flex items-center gap-3">
              {getStatusIcon(status.auth)}
              <User className="w-5 h-5 text-primary/40" />
              <span className="text-sm font-light">Authentication</span>
            </div>
            
            <div className="flex items-center gap-3">
              {getStatusIcon(status.connection)}
              <Wifi className="w-5 h-5 text-primary/40" />
              <span className="text-sm font-light">Firestore Connection</span>
            </div>
            
            <div className="flex items-center gap-3">
              {getStatusIcon(status.firestoreOps)}
              <Database className="w-5 h-5 text-primary/40" />
              <span className="text-sm font-light">Firestore Operations</span>
            </div>
            
            <div className="flex items-center gap-3">
              {getStatusIcon(status.userDoc)}
              <FileText className="w-5 h-5 text-primary/40" />
              <span className="text-sm font-light">User Document</span>
            </div>
          </div>

          {/* Real-time Diagnostics */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg space-y-2">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-primary/60" />
              <span className="text-sm font-medium text-primary/80">Real-time Status</span>
            </div>
            <div className="text-xs space-y-1 text-primary/60">
              <p>Active Listeners: {diagnostics?.activeListeners || 0}</p>
              <p>Failed Listeners: {diagnostics?.failedListeners?.length || 0}</p>
              <p>Connection: {diagnostics?.connectionStatus || 'unknown'}</p>
              <p>Initialized: {diagnostics?.isInitialized ? 'Yes' : 'No'}</p>
            </div>
            {diagnostics?.failedListeners?.length > 0 && (
              <div className="mt-2 pt-2 border-t border-gray-200">
                <p className="text-xs font-medium text-red-600">Failed Listeners:</p>
                <ul className="text-xs text-red-500 mt-1">
                  {diagnostics.failedListeners.map((id: string, index: number) => (
                    <li key={index}>• {id}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="mt-6 space-y-3">
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={runDiagnostics}
              disabled={isRunning}
              className="w-full px-4 py-3 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-light flex items-center justify-center gap-2"
            >
              {isRunning ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Running...
                </>
              ) : (
                'Run Diagnostics'
              )}
            </motion.button>
            
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={fixConnection}
              disabled={isRunning}
              className="w-full px-4 py-3 bg-gold text-white rounded-xl hover:bg-gold-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-light flex items-center justify-center gap-2"
            >
              {isRunning ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Fixing...
                </>
              ) : (
                'Fix Connection'
              )}
            </motion.button>
            
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={softRestart}
              disabled={isRunning}
              className="w-full px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-light flex items-center justify-center gap-2"
            >
              {isRunning ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Soft Restarting...
                </>
              ) : (
                'Soft Restart (Recommended)'
              )}
            </motion.button>
            
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={fullRestart}
              disabled={isRunning}
              className="w-full px-4 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-light flex items-center justify-center gap-2"
            >
              {isRunning ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Full Restarting...
                </>
              ) : (
                'Full Restart (Advanced)'
              )}
            </motion.button>
            
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={clearCache}
              disabled={isRunning}
              className="w-full px-4 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-light flex items-center justify-center gap-2"
            >
              {isRunning ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Clearing...
                </>
              ) : (
                'Clear Cache & Reload'
              )}
            </motion.button>
          </div>
        </GlassContainer>

        {/* Messages Panel */}
        <GlassContainer className="p-6">
          <h2 className="text-xl font-light text-primary mb-4">Debug Log</h2>
          
          <div className="bg-gray-50 rounded-lg p-4 h-96 overflow-y-auto font-mono text-xs">
            {messages.length === 0 ? (
              <p className="text-primary/40">No messages yet. Run diagnostics to start.</p>
            ) : (
              messages.map((msg, index) => (
                <div key={index} className="mb-1">
                  {msg}
                </div>
              ))
            )}
          </div>
        </GlassContainer>
      </div>

      {/* Info Panel */}
      <GlassContainer className="mt-6 p-6">
        <h2 className="text-xl font-light text-primary mb-4">Information</h2>
        
        <div className="space-y-2 text-sm font-light text-primary/70">
          <p><strong>Mode:</strong> {adminMode ? 'Admin (No Auth Required)' : 'Standard'}</p>
          <p><strong>User ID:</strong> {user?.uid || 'Not authenticated'}</p>
          <p><strong>Email:</strong> {user?.email || 'Not authenticated'}</p>
          <p><strong>Display Name:</strong> {user?.displayName || 'Not set'}</p>
          <p><strong>Onboarding Complete:</strong> {userProfile?.onboardingCompleted ? 'Yes' : 'No'}</p>
          <p><strong>Project ID:</strong> {process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}</p>
          <p><strong>Browser:</strong> {typeof window !== 'undefined' ? navigator.userAgent : 'N/A'}</p>
        </div>
        
        <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
          <p className="text-xs text-yellow-800">
            <strong>Note:</strong> This page is running in admin mode for testing purposes. 
            All diagnostic features are available without authentication.
          </p>
        </div>
      </GlassContainer>
    </div>
  );
} 
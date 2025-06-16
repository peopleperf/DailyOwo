'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { GlassContainer } from '@/components/ui/GlassContainer';
import { initializeFirebaseIfNeeded, getFirebaseAuth, getFirebaseDb } from '@/lib/firebase/config';
import { Shield, CheckCircle, XCircle, Loader2, AlertCircle } from 'lucide-react';

export default function TestAuthPage() {
  const [testResults, setTestResults] = useState<any[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const addResult = (test: string, status: 'pass' | 'fail', message: string) => {
    setTestResults(prev => [...prev, { test, status, message, timestamp: new Date() }]);
  };

  const runAuthTests = async () => {
    setIsRunning(true);
    setTestResults([]);

    // Test 1: Firebase Initialization
    try {
      const { app, auth, db } = initializeFirebaseIfNeeded();
      if (app && auth && db) {
        addResult('Firebase Initialization', 'pass', 'All services initialized successfully');
      } else {
        addResult('Firebase Initialization', 'fail', `Missing services - App: ${!!app}, Auth: ${!!auth}, DB: ${!!db}`);
      }
    } catch (error: any) {
      addResult('Firebase Initialization', 'fail', error.message);
    }

    // Test 2: Auth Service Check
    try {
      const auth = getFirebaseAuth();
      if (auth) {
        addResult('Auth Service', 'pass', 'Auth service is available');
        
        // Check current user
        const currentUser = auth.currentUser;
        if (currentUser) {
          addResult('Current User', 'pass', `User logged in: ${currentUser.email}`);
        } else {
          addResult('Current User', 'pass', 'No user logged in (expected in test mode)');
        }
      } else {
        addResult('Auth Service', 'fail', 'Auth service not available');
      }
    } catch (error: any) {
      addResult('Auth Service', 'fail', error.message);
    }

    // Test 3: Firestore Check
    try {
      const db = getFirebaseDb();
      if (db) {
        addResult('Firestore Service', 'pass', 'Firestore is available');
        
        // Try to access a test collection
        const { collection, getDocs } = await import('firebase/firestore');
        const testCollection = collection(db, 'test-auth-check');
        const snapshot = await getDocs(testCollection);
        addResult('Firestore Query', 'pass', `Successfully queried test collection (${snapshot.size} docs)`);
      } else {
        addResult('Firestore Service', 'fail', 'Firestore not available');
      }
    } catch (error: any) {
      // Expected if no permissions or collection doesn't exist
      if (error.code === 'permission-denied') {
        addResult('Firestore Query', 'pass', 'Permission denied (expected without auth)');
      } else {
        addResult('Firestore Query', 'fail', error.message);
      }
    }

    // Test 4: Auth State Persistence
    try {
      const auth = getFirebaseAuth();
      if (auth) {
        const persistence = await auth.currentUser?.getIdTokenResult()
          .then(() => 'Token available')
          .catch(() => 'No token (expected without login)');
        addResult('Auth Persistence', 'pass', persistence || 'No persistence data');
      }
    } catch (error: any) {
      addResult('Auth Persistence', 'fail', error.message);
    }

    setIsRunning(false);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-light text-primary">Auth Test Page</h1>
        <div className="flex items-center gap-2 px-3 py-1 bg-purple-100 rounded-full">
          <Shield className="w-4 h-4 text-purple-600" />
          <span className="text-sm font-medium text-purple-800">No Auth Required</span>
        </div>
      </div>

      <GlassContainer className="p-6 mb-6">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-blue-800">Test Mode</p>
            <p className="text-sm text-blue-700 mt-1">
              This page tests Firebase authentication and Firestore connectivity without requiring login.
              Perfect for debugging auth issues.
            </p>
          </div>
        </div>
      </GlassContainer>

      <GlassContainer className="p-6">
        <h2 className="text-xl font-light text-primary mb-4">Auth Tests</h2>
        
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={runAuthTests}
          disabled={isRunning}
          className="w-full px-4 py-3 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-light flex items-center justify-center gap-2 mb-6"
        >
          {isRunning ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Running Tests...
            </>
          ) : (
            'Run Auth Tests'
          )}
        </motion.button>

        {testResults.length > 0 && (
          <div className="space-y-3">
            {testResults.map((result, index) => (
              <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                {result.status === 'pass' ? (
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-600 mt-0.5" />
                )}
                <div className="flex-1">
                  <p className="font-medium text-sm">{result.test}</p>
                  <p className="text-xs text-gray-600 mt-1">{result.message}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </GlassContainer>

      <GlassContainer className="mt-6 p-6">
        <h2 className="text-xl font-light text-primary mb-4">Quick Actions</h2>
        <div className="grid gap-3 md:grid-cols-2">
          <a
            href="/firebase-debug"
            className="block p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
          >
            <p className="font-medium text-blue-800">Firebase Debug Tool</p>
            <p className="text-sm text-blue-600 mt-1">Full diagnostics and repair tools</p>
          </a>
          
          <a
            href="/auth/login"
            className="block p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
          >
            <p className="font-medium text-green-800">Login Page</p>
            <p className="text-sm text-green-600 mt-1">Test actual authentication flow</p>
          </a>
        </div>
      </GlassContainer>

      <div className="mt-6 text-center text-sm text-gray-500">
        <p>Console: Type <code className="bg-gray-100 px-2 py-1 rounded">firestoreDiag.help()</code> for diagnostic commands</p>
      </div>
    </div>
  );
} 
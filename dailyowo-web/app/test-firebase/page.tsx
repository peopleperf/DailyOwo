'use client';

import { useEffect, useState } from 'react';
import { Container } from '@/components/layouts/Container';
import { GlassContainer } from '@/components/ui/GlassContainer';
import { GlassButton } from '@/components/ui/GlassButton';
import { isFirebaseConfigured, initializeFirebaseIfNeeded } from '@/lib/firebase/config';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';

export default function TestFirebasePage() {
  const [configStatus, setConfigStatus] = useState<any>({});
  const [testResults, setTestResults] = useState<any>({});
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    // Check environment variables (without exposing sensitive data)
    const status = {
      isConfigured: isFirebaseConfigured(),
      hasApiKey: !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      hasAuthDomain: !!process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      hasProjectId: !!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      hasStorageBucket: !!process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      hasMessagingSenderId: !!process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      hasAppId: !!process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
      projectIdPreview: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ? 
        process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID.substring(0, 8) + '...' : 
        'Not set'
    };
    setConfigStatus(status);
  }, []);

  const testFirebaseConnection = async () => {
    setTesting(true);
    setTestResults({});

    try {
      // Initialize Firebase
      const firebase = initializeFirebaseIfNeeded();
      console.log('Firebase initialization result:', firebase);
      
      if (!firebase || !firebase.db) {
        setTestResults({ 
          error: 'Firebase/Firestore not initialized. Check your configuration.',
          details: 'Make sure Firestore Database is created in Firebase Console'
        });
        setTesting(false);
        return;
      }

      const { db } = firebase;

      // Add more detailed logging
      console.log('Firestore instance:', db);

      // Test 1: Write to Firestore with better error handling
      try {
        const testDocRef = doc(db, 'test', 'connection-test');
        console.log('Document reference created:', testDocRef);
        
        await setDoc(testDocRef, {
          test: true,
          timestamp: serverTimestamp(),
          message: 'Firebase connection test',
          createdAt: new Date().toISOString()
        });
        
        setTestResults((prev: any) => ({ ...prev, write: '✅ Write successful' }));
      } catch (writeError: any) {
        console.error('Write error details:', writeError);
        setTestResults((prev: any) => ({ 
          ...prev, 
          writeError: `❌ Write failed: ${writeError.message}`,
          writeErrorCode: writeError.code
        }));
      }

      // Test 2: Read from Firestore
      try {
        const testDocRef = doc(db, 'test', 'connection-test');
        const docSnap = await getDoc(testDocRef);
        
        if (docSnap.exists()) {
          setTestResults((prev: any) => ({ ...prev, read: '✅ Read successful' }));
        } else {
          setTestResults((prev: any) => ({ ...prev, read: '❌ Read failed - document not found' }));
        }
      } catch (readError: any) {
        console.error('Read error details:', readError);
        setTestResults((prev: any) => ({ 
          ...prev, 
          readError: `❌ Read failed: ${readError.message}`,
          readErrorCode: readError.code
        }));
      }

      // Test 3: Check Auth
      if (firebase.auth) {
        setTestResults((prev: any) => ({ ...prev, auth: '✅ Auth initialized' }));
      } else {
        setTestResults((prev: any) => ({ ...prev, auth: '❌ Auth not initialized' }));
      }

      // If we got here without major errors, consider it a success
      if (!testResults.error && !testResults.writeError && !testResults.readError) {
        setTestResults((prev: any) => ({ ...prev, success: true }));
      }

    } catch (error: any) {
      console.error('Firebase test error:', error);
      setTestResults({ 
        error: error.message,
        code: error.code,
        details: error.toString(),
        stack: error.stack
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white p-8">
      <Container size="md">
        <GlassContainer className="p-8">
          <h1 className="text-2xl font-bold text-primary mb-6">Firebase Configuration Test</h1>
          
          <div className="space-y-4">
            <div className="p-4 glass-subtle rounded-lg">
              <h2 className="font-semibold mb-2">Configuration Status</h2>
              <ul className="space-y-2 text-sm">
                <li>Firebase Configured: <span className={configStatus.isConfigured ? 'text-green-600' : 'text-red-600'}>
                  {configStatus.isConfigured ? '✅ Yes' : '❌ No'}
                </span></li>
                <li>API Key: {configStatus.hasApiKey ? '✅' : '❌'}</li>
                <li>Auth Domain: {configStatus.hasAuthDomain ? '✅' : '❌'}</li>
                <li>Project ID: {configStatus.hasProjectId ? '✅' : '❌'} ({configStatus.projectIdPreview})</li>
                <li>Storage Bucket: {configStatus.hasStorageBucket ? '✅' : '❌'}</li>
                <li>Messaging Sender ID: {configStatus.hasMessagingSenderId ? '✅' : '❌'}</li>
                <li>App ID: {configStatus.hasAppId ? '✅' : '❌'}</li>
              </ul>
            </div>

            {configStatus.isConfigured && (
              <div className="p-4 glass-subtle rounded-lg">
                <h2 className="font-semibold mb-2">Test Firebase Connection</h2>
                <div className="flex gap-3 flex-wrap">
                  <GlassButton
                    onClick={testFirebaseConnection}
                    disabled={testing}
                    variant="primary"
                  >
                    {testing ? 'Testing...' : 'Run Connection Test'}
                  </GlassButton>
                  
                  {configStatus.hasProjectId && (
                    <GlassButton
                      onClick={() => {
                        const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
                        window.open(`https://console.firebase.google.com/project/${projectId}/firestore`, '_blank');
                      }}
                      variant="secondary"
                    >
                      Open Firestore Console
                    </GlassButton>
                  )}
                </div>

                {Object.keys(testResults).length > 0 && (
                  <div className="mt-4 space-y-2">
                    {testResults.error ? (
                      <div className="text-red-600">
                        <p className="font-semibold">❌ Error:</p>
                        <p className="text-sm">{testResults.error}</p>
                        {testResults.code && <p className="text-xs">Code: {testResults.code}</p>}
                        {testResults.details && (
                          <pre className="text-xs mt-2 p-2 bg-red-50 rounded overflow-x-auto">
                            {testResults.details}
                          </pre>
                        )}
                      </div>
                    ) : (
                      <>
                        {testResults.write && <p className="text-sm">{testResults.write}</p>}
                        {testResults.writeError && (
                          <div className="text-red-600 text-sm">
                            <p>{testResults.writeError}</p>
                            {testResults.writeErrorCode && <p className="text-xs">Code: {testResults.writeErrorCode}</p>}
                          </div>
                        )}
                        {testResults.read && <p className="text-sm">{testResults.read}</p>}
                        {testResults.readError && (
                          <div className="text-red-600 text-sm">
                            <p>{testResults.readError}</p>
                            {testResults.readErrorCode && <p className="text-xs">Code: {testResults.readErrorCode}</p>}
                          </div>
                        )}
                        {testResults.auth && <p className="text-sm">{testResults.auth}</p>}
                        {testResults.success && (
                          <p className="text-green-600 font-semibold">✅ All tests passed!</p>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            )}

            <div className="p-4 glass-subtle rounded-lg">
              <h2 className="font-semibold mb-2">Common Issues & Solutions</h2>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="font-medium text-red-600">Getting 400 Bad Request or "client is offline" error?</p>
                  <div className="mt-2 p-4 bg-red-50 border-2 border-red-200 rounded-lg">
                    <p className="font-semibold text-red-700 mb-2">⚠️ This error means Firestore Database is NOT created!</p>
                    <p className="text-sm text-red-600 mb-2">You must create the Firestore database in Firebase Console first:</p>
                  </div>
                  <ol className="mt-1 space-y-1 list-decimal list-inside text-gray-600">
                    <li>Go to <a href="https://console.firebase.google.com" target="_blank" className="text-blue-600 underline">Firebase Console</a> → Your Project → Firestore Database</li>
                    <li>You should see a big "Create database" button - <strong>CLICK IT!</strong></li>
                    <li>Choose:
                      <ul className="ml-6 mt-1">
                        <li>• <strong>Start in test mode</strong> (for development)</li>
                        <li>• Choose your region (preferably closest to you)</li>
                      </ul>
                    </li>
                    <li>Click "Enable" and wait for database creation to complete (30-60 seconds)</li>
                    <li>Once created, come back here and run the test again</li>
                    <li>Verify your Firestore rules allow read/write:
                      <pre className="mt-1 p-2 bg-gray-100 rounded text-xs">
{`rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}`}
                      </pre>
                    </li>
                    <li>Check your Firebase project ID matches your .env.local:
                      <pre className="mt-1 p-2 bg-gray-100 rounded text-xs">
Project ID in .env.local: {configStatus.projectIdPreview}
                      </pre>
                    </li>
                    <li>Make sure you're looking at the correct Firebase project</li>
                  </ol>
                </div>

                <div>
                  <p className="font-medium">For production, update security rules to be more restrictive!</p>
                </div>
              </div>
            </div>

            <div className="p-4 glass-subtle rounded-lg bg-yellow-50">
              <h2 className="font-semibold mb-2">⚠️ Important</h2>
              <p className="text-sm">
                After creating or modifying .env.local, you must restart the dev server:
              </p>
              <pre className="mt-2 p-2 bg-gray-100 rounded text-xs">
                1. Press Ctrl+C to stop the server
                2. Run: npm run dev
              </pre>
            </div>
          </div>
        </GlassContainer>
      </Container>
    </div>
  );
} 
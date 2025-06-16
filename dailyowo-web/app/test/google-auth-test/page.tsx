'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/firebase/auth-context';
import { CheckCircle, XCircle, Mail } from 'lucide-react';

export default function GoogleAuthTestPage() {
  const { user, userProfile, emailVerified } = useAuth();
  const [signInMethod, setSignInMethod] = useState<string | null>(null);

  // Determine sign-in method
  if (user && !signInMethod) {
    const isGoogleUser = user.providerData.some(provider => provider.providerId === 'google.com');
    setSignInMethod(isGoogleUser ? 'Google' : 'Email/Password');
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold">Google Authentication Test</h1>

        {user ? (
          <div className="bg-white rounded-lg shadow-lg p-6 space-y-4">
            <h2 className="text-xl font-semibold mb-4">User Authentication Status</h2>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Email:</p>
                <p className="font-medium">{user.email}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-600">Sign-in Method:</p>
                <p className="font-medium">{signInMethod}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-600">Firebase Email Verified:</p>
                <div className="flex items-center gap-2">
                  {user.emailVerified ? (
                    <>
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <span className="text-green-600">Verified</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-5 w-5 text-red-600" />
                      <span className="text-red-600">Not Verified</span>
                    </>
                  )}
                </div>
              </div>
              
              <div>
                <p className="text-sm text-gray-600">Profile Email Verified:</p>
                <div className="flex items-center gap-2">
                  {userProfile?.emailVerified ? (
                    <>
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <span className="text-green-600">Verified</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-5 w-5 text-red-600" />
                      <span className="text-red-600">Not Set</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h3 className="font-semibold text-blue-800 mb-2">Expected Behavior:</h3>
              <div className="space-y-2 text-sm text-blue-700">
                {signInMethod === 'Google' ? (
                  <>
                    <p>✅ Firebase Email Verified: Should be TRUE (verified by Google)</p>
                    <p>✅ Profile Email Verified: Should be TRUE (set during sign-in)</p>
                    <p>✅ No verification email sent (not needed)</p>
                    <p>✅ User can proceed directly to app</p>
                  </>
                ) : (
                  <>
                    <p>⚠️ Firebase Email Verified: FALSE until email verified</p>
                    <p>⚠️ Profile Email Verified: FALSE until email verified</p>
                    <p>📧 Verification email sent via Resend</p>
                    <p>🔒 User must verify email before accessing app</p>
                  </>
                )}
              </div>
            </div>

            {signInMethod === 'Google' && (
              <div className="mt-4 p-4 bg-green-50 rounded-lg">
                <div className="flex items-start gap-3">
                  <Mail className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="font-semibold text-green-800">Welcome Email</p>
                    <p className="text-sm text-green-700 mt-1">
                      New Google users receive a welcome email instead of a verification email.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <p className="text-gray-600">Please sign in to test authentication status.</p>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">How It Works</h2>
          <div className="space-y-4 text-sm">
            <div>
              <h3 className="font-semibold">Email/Password Sign-up:</h3>
              <ul className="list-disc list-inside mt-2 space-y-1 text-gray-600">
                <li>User creates account with email and password</li>
                <li>Custom verification email sent via Resend</li>
                <li>User must click verification link</li>
                <li>Email verified status updated in profile</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold">Google Sign-in:</h3>
              <ul className="list-disc list-inside mt-2 space-y-1 text-gray-600">
                <li>User signs in with Google account</li>
                <li>Email already verified by Google</li>
                <li>No verification email needed</li>
                <li>Welcome email sent to new users</li>
                <li>Direct access to app (onboarding or dashboard)</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 
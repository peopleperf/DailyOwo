'use client';

import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { 
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, serverTimestamp, collection, query, where, getDocs } from 'firebase/firestore';
import { getFirebaseAuth, getFirebaseDb, initializeFirebaseIfNeeded } from './config';
import { ensureFirestoreConnection, createUserDocument, initializeCollections } from './init-collections';
import { sessionService } from './session-service';
import { userProfileService } from './user-profile-service';
import { useRouter, usePathname } from 'next/navigation';
import { sendEmail } from '@/lib/services/email-service';
import { CustomEmailVerificationService } from '@/lib/services/custom-email-verification';

export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  firstName?: string;
  lastName?: string;
  age?: number | '';
  bio?: string;
  photoURL?: string;
  createdAt: any;
  updatedAt: any;
  onboardingCompleted?: boolean;
  emailVerified?: boolean;
  emailVerifiedAt?: any;
  // Financial profile
  currency?: string;
  region?: string;
  language?: string;
  timezone?: string;
  dateFormat?: string;
  monthlyIncome?: number;
  monthlyExpenses?: number;
  currentSavings?: number;
  currentDebt?: number;
  // AI and Privacy Settings
  aiSettings?: {
    enabled: boolean;
    features: {
      insights: boolean;
      categorization: boolean;
      predictions: boolean;
      recommendations: boolean;
      optimization: boolean;
    };
    privacy: {
      dataSharing: 'minimal' | 'standard' | 'full';
      retentionPeriod: '30d' | '90d' | '1y' | 'indefinite';
      allowPersonalization: boolean;
    };
    transparency: {
      showConfidenceScores: boolean;
      explainRecommendations: boolean;
      allowCorrections: boolean;
    };
    performance: {
      analysisFrequency: 'real-time' | 'daily' | 'weekly';
      autoApply: boolean;
    };
  };
  privacySettings?: {
    dataVisibility: {
      transactions: 'private' | 'family' | 'admins';
      netWorth: 'private' | 'family' | 'admins';
      goals: 'private' | 'family' | 'admins';
      budgets: 'private' | 'family' | 'admins';
    };
    dataRetention: {
      automaticDeletion: boolean;
      retentionPeriod: '1y' | '2y' | '5y' | 'indefinite';
      deleteInactiveData: boolean;
    };
    thirdPartySharing: {
      analytics: boolean;
      marketing: boolean;
      improvements: boolean;
    };
    notifications: {
      dataAccess: boolean;
      exports: boolean;
      deletions: boolean;
    };
  };
}

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  emailVerified: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  sendVerificationEmail: () => Promise<void>;
  updateUserProfile: (data: Partial<UserProfile>) => Promise<void>;
  changePassword: (newPassword: string) => Promise<void>;
  reauthenticate: (currentPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export { AuthContext };

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [emailVerified, setEmailVerified] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const pathname = usePathname();
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const authStateProcessingRef = useRef(false);
  const isClientRef = useRef(false);

  // Initialize client detection
  useEffect(() => {
    isClientRef.current = true;
  }, []);

  const handleRedirect = (user: User | null, profile: UserProfile | null) => {
    if (!pathname || !isClientRef.current) return;

    const isAuthPath = authPaths.some(path => pathname.startsWith(path));
    const isVerifyEmailPath = pathname.startsWith('/verify-email');

    if (user && profile) {
      // Check if email is verified (check both Firebase and our custom field)
      const isEmailVerified = user.emailVerified || profile.emailVerified;
      if (!isEmailVerified) {
        // User email is not verified, redirect to verification page
        if (!isVerifyEmailPath) {
          router.push('/verify-email');
        }
        return;
      }

      // User is logged in and email is verified
      if (profile.onboardingCompleted) {
        // Onboarding is complete, if they are on an auth page, send them to the dashboard
        if (isAuthPath || isVerifyEmailPath) {
          router.push('/dashboard');
        }
      } else {
        // Onboarding is not complete, if they are not on the onboarding page, send them there
        if (!pathname.startsWith('/onboarding')) {
          router.push('/onboarding');
        }
      }
    } else {
      // User is not logged in
      const isAuthRequiredPath = authRequiredPaths.some(path => pathname.startsWith(path));
      if (isAuthRequiredPath || isVerifyEmailPath) {
        router.push('/auth/login');
      }
    }
  };

  // Paths that require authentication
  const authRequiredPaths = ['/dashboard', '/onboarding', '/profile', '/transactions', '/goals', '/budgets'];
  const authPaths = ['/auth/login', '/auth/register', '/auth/reset-password'];

  // Fetch user profile from Firestore
  const fetchUserProfile = async (uid: string) => {
    if (!isClientRef.current) return null;
    
    const db = getFirebaseDb();
    if (!db) {
      console.warn('Firestore not available for profile fetch');
      return null;
    }
    
    try {
      const docRef = doc(db, 'users', uid);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return docSnap.data() as UserProfile;
      }
      return null;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
  };

  // Create user profile in Firestore
  const createUserProfile = async (user: User, additionalData?: Partial<UserProfile>) => {
    if (!isClientRef.current) return;
    
    const db = getFirebaseDb();
    if (!db) {
      console.warn('Firestore not available for profile creation');
      // Still set local state so user can proceed
      const fallbackProfile: UserProfile = {
        uid: user.uid,
        email: user.email!,
        displayName: user.displayName || additionalData?.displayName || '',
        photoURL: user.photoURL || '',
        createdAt: new Date(),
        updatedAt: new Date(),
        onboardingCompleted: false,
        ...additionalData
      };
      setUserProfile(fallbackProfile);
      return;
    }
    
    try {
      // First ensure Firestore is connected
      await ensureFirestoreConnection();
      
      const profile: UserProfile = {
        uid: user.uid,
        email: user.email!,
        displayName: user.displayName || additionalData?.displayName || '',
        photoURL: user.photoURL || '',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        onboardingCompleted: false,
        ...additionalData
      };
      
      // Use the new createUserDocument function
      await createUserDocument(user.uid, profile);
      
      // Initialize collections for the user
      await initializeCollections(user.uid);
      
      setUserProfile(profile);
      console.log('User profile created and collections initialized');
    } catch (error) {
      console.error('Error creating user profile:', error);
      // Still set local state so user can proceed
      const fallbackProfile: UserProfile = {
        uid: user.uid,
        email: user.email!,
        displayName: user.displayName || additionalData?.displayName || '',
        photoURL: user.photoURL || '',
        createdAt: new Date(),
        updatedAt: new Date(),
        onboardingCompleted: false,
        ...additionalData
      };
      setUserProfile(fallbackProfile);
      console.warn('Using fallback profile data');
    }
  };

  // Update user profile
  const updateUserProfile = async (data: Partial<UserProfile>) => {
    if (!user || !isClientRef.current) return;
    
    const db = getFirebaseDb();
    if (!db) {
      console.warn('Firestore not available for profile update');
      return;
    }
    
    try {
      const docRef = doc(db, 'users', user.uid);
      await updateDoc(docRef, {
        ...data,
        updatedAt: serverTimestamp()
      });
      
      // Update local state
      setUserProfile(prev => prev ? { ...prev, ...data } : null);
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  };

  // Process auth state change
  const processAuthStateChange = async (user: User | null) => {
    if (authStateProcessingRef.current || !isClientRef.current) return;
    authStateProcessingRef.current = true;

    try {
      // Wait for Firebase to be initialized
      const { db } = initializeFirebaseIfNeeded();
      
      // If Firestore is not available yet, wait a bit and retry
      if (!db) {
        console.log('Waiting for Firestore initialization...');
        await new Promise(resolve => setTimeout(resolve, 500));
        const { db: retryDb } = initializeFirebaseIfNeeded();
        if (!retryDb) {
          console.warn('Firestore still not available after retry');
        }
      }

      if (user) {
        setUser(user);
        setEmailVerified(user.emailVerified);
        
        // Fetch user profile
        let profile = await fetchUserProfile(user.uid);
        if (!profile) {
          // Create profile if it doesn't exist
          // For Google/social auth, email is already verified
          const additionalData: Partial<UserProfile> = {};
          if (user.providerData.some(provider => provider.providerId === 'google.com')) {
            additionalData.emailVerified = true;
            additionalData.emailVerifiedAt = serverTimestamp();
          }
          await createUserProfile(user, additionalData);
          profile = await fetchUserProfile(user.uid);
        } else {
          setUserProfile(profile);
        }
        
        // Handle redirect after profile is loaded
        handleRedirect(user, profile);

        // Create user profile in the new service if it doesn't exist (with error handling)
        try {
          const db = getFirebaseDb();
          if (db) {
            let userProfileData = await userProfileService.getUserProfile(user.uid);
            if (!userProfileData && user.email && user.displayName) {
              await userProfileService.createUserProfile(user.uid, user.email, user.displayName);
            }
          }
        } catch (error) {
          console.warn('Failed to create user profile in profile service:', error);
        }

        // Create session for new login (with error handling)
        try {
          const db = getFirebaseDb();
          if (db) {
            const existingSessions = await sessionService.getActiveSessions(user.uid);
            if (existingSessions.length === 0) {
              await sessionService.createSession(user.uid, {});
              console.log('Created session for user login');
            }
          }
        } catch (error) {
          console.warn('Failed to create session:', error);
        }
      } else {
        setUser(null);
        setUserProfile(null);
        setEmailVerified(false);
        handleRedirect(null, null);
      }
    } finally {
      authStateProcessingRef.current = false;
      setLoading(false);
    }
  };

  // Initialize auth state listener
  useEffect(() => {
    if (!isClientRef.current) return;
    
    console.log('Setting up auth state listener');
    
    // Initialize Firebase immediately
    initializeFirebaseIfNeeded();
    
    const auth = getFirebaseAuth();
    if (!auth) {
      console.error('Auth not initialized');
      setLoading(false);
      return;
    }

    // Set up auth state listener
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log('Auth state changed:', user?.uid || 'null');
      processAuthStateChange(user);
    });

    unsubscribeRef.current = unsubscribe;

    // Check for redirect result (for mobile Google auth)
    getRedirectResult(auth).catch((error) => {
      console.error('Redirect result error:', error);
    });

    // Cleanup
    return () => {
      console.log('Cleaning up auth state listener');
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, []); // Empty dependency array - only run once

  // Sign in with email and password
  const signIn = async (email: string, password: string) => {
    const auth = getFirebaseAuth();
    if (!auth) throw new Error('Firebase not configured');
    
    setError(null);
    
    // Retry logic for visibility check errors
    const maxRetries = 3;
    let retryCount = 0;
    
    while (retryCount < maxRetries) {
      try {
        const result = await signInWithEmailAndPassword(auth, email, password);
        const profile = await fetchUserProfile(result.user.uid);
        if (!profile) {
          await createUserProfile(result.user);
        }

        // Create session for login
        try {
          await sessionService.createSession(result.user.uid, {});
          console.log('Session created for sign in');
        } catch (error) {
          console.warn('Failed to create session on sign in:', error);
        }
        
        // Success - break out of retry loop
        return;
        
      } catch (error: any) {
        console.error(`Sign in attempt ${retryCount + 1} failed:`, error);
        
        // Check if this is a visibility check error
        if (error.code === 'auth/visibility-check-was-unavailable' && retryCount < maxRetries - 1) {
          retryCount++;
          console.log(`Retrying sign in (attempt ${retryCount + 1}/${maxRetries}) due to visibility check error...`);
          
          // Wait a bit before retrying
          await new Promise(resolve => setTimeout(resolve, 1000));
          continue;
        }
        
        // For other errors or if we've exhausted retries, set user-friendly error
        const errorMessage = getErrorMessage(error);
        setError(errorMessage);
        
        // Create a new error with the user-friendly message
        const userError = new Error(errorMessage);
        userError.name = error.name;
        throw userError;
      }
    }
  };

  // Helper function to get user-friendly error messages
  const getErrorMessage = (error: any): string => {
    switch (error.code) {
      case 'auth/visibility-check-was-unavailable':
        return 'Authentication temporarily unavailable. Please check your browser settings and try again.';
      case 'auth/network-request-failed':
        return 'Network error. Please check your internet connection.';
      case 'auth/user-not-found':
        return 'No account found with this email address. Please sign up to create a new account.';
      case 'auth/wrong-password':
        return 'Incorrect password. Please try again.';
      case 'auth/invalid-email':
        return 'Please enter a valid email address.';
      case 'auth/invalid-credential':
        return 'Invalid email or password. If you don\'t have an account, please sign up first.';
      case 'auth/user-disabled':
        return 'This account has been disabled.';
      case 'auth/too-many-requests':
        return 'Too many failed attempts. Please try again later.';
      case 'auth/weak-password':
        return 'Password should be at least 6 characters.';
      case 'auth/email-already-in-use':
        return 'An account with this email already exists. Please sign in instead.';
      default:
        return error.message || 'Authentication failed. Please try again.';
    }
  };

  // Sign up with email and password
  const signUp = async (email: string, password: string, displayName: string) => {
    const auth = getFirebaseAuth();
    if (!auth) throw new Error('Firebase not configured');
    
    setError(null);
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      
      // Update display name
      await updateProfile(result.user, { displayName });
      
      // Create user profile in Firestore
      await createUserProfile(result.user, { displayName });

      // Send verification email through Resend (custom approach)
      try {
        console.log('Attempting to send custom verification email...');
        
        await CustomEmailVerificationService.sendVerificationEmail(
          result.user.uid,
          email,
          displayName || email.split('@')[0]
        );
        console.log('✅ Custom verification email sent via Resend');
      } catch (emailError: any) {
        console.error('❌ Failed to send custom verification email:', emailError);
        console.error('Error details:', emailError.message || emailError);
        console.error('Stack trace:', emailError.stack);
        
        // Don't fall back to Firebase - we want branded emails only
        const errorMessage = emailError.message || 'Failed to send verification email. Please try again.';
        throw new Error(errorMessage);
      }

      // Create session for new user
      try {
        await sessionService.createSession(result.user.uid, {});
        console.log('Session created for sign up');
      } catch (error) {
        console.warn('Failed to create session on sign up:', error);
      }
    } catch (error: any) {
      const errorMessage = getErrorMessage(error);
      setError(errorMessage);
      const userError = new Error(errorMessage);
      userError.name = error.name;
      throw userError;
    }
  };

  // Sign in with Google
  const signInWithGoogle = async () => {
    const auth = getFirebaseAuth();
    if (!auth) throw new Error('Firebase not configured');
    
    setError(null);
    try {
      const provider = new GoogleAuthProvider();
      
      // Check if mobile
      const isMobile = typeof window !== 'undefined' && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      
      if (isMobile) {
        // Use redirect for mobile
        await signInWithRedirect(auth, provider);
      } else {
        // Use popup for desktop
        const result = await signInWithPopup(auth, provider);
        const profile = await fetchUserProfile(result.user.uid);
        if (!profile) {
          // For Google sign-ins, email is already verified by Google
          await createUserProfile(result.user, {
            emailVerified: true,
            emailVerifiedAt: serverTimestamp()
          });
          
          // Send welcome email to new Google users
          if (result.user.email) {
            try {
              await sendEmail({
                to: result.user.email,
                subject: 'Welcome to DailyOwo!',
                template: 'welcome',
                data: {
                  userName: result.user.displayName || result.user.email.split('@')[0]
                }
              });
              console.log('Welcome email sent to Google user');
            } catch (emailError) {
              console.warn('Failed to send welcome email:', emailError);
              // Don't throw - email is nice to have but not critical
            }
          }
        }

        // Create user profile in the new service if first time
        try {
          let userProfileData = await userProfileService.getUserProfile(result.user.uid);
          if (!userProfileData && result.user.email && result.user.displayName) {
            await userProfileService.createUserProfile(result.user.uid, result.user.email, result.user.displayName);
          }
        } catch (error) {
          console.warn('Failed to create user profile in profile service:', error);
        }

        // Create session for Google sign in
        try {
          await sessionService.createSession(result.user.uid, {});
          console.log('Session created for Google sign in');
        } catch (error) {
          console.warn('Failed to create session on Google sign in:', error);
        }
      }
    } catch (error: any) {
      const errorMessage = getErrorMessage(error);
      setError(errorMessage);
      const userError = new Error(errorMessage);
      userError.name = error.name;
      throw userError;
    }
  };

  // Logout
  const logout = async () => {
    const auth = getFirebaseAuth();
    if (!auth) return;
    
    setError(null);
    try {
      await signOut(auth);
      router.push('/auth/login');
    } catch (error: any) {
      const errorMessage = getErrorMessage(error);
      setError(errorMessage);
      const userError = new Error(errorMessage);
      userError.name = error.name;
      throw userError;
    }
  };

  // Reset password
  const resetPassword = async (email: string) => {
    const auth = getFirebaseAuth();
    if (!auth) throw new Error('Firebase not configured');
    
    setError(null);
    try {
      await sendPasswordResetEmail(auth, email);
      
      // Send password reset email notification
      try {
        // Get user profile by email to get displayName
        const db = getFirebaseDb();
        let userName = email.split('@')[0];
        if (db) {
          const usersRef = collection(db, 'users');
          const q = query(usersRef, where('email', '==', email));
          const querySnapshot = await getDocs(q);
          if (!querySnapshot.empty) {
            const userData = querySnapshot.docs[0].data();
            userName = userData.displayName || userData.firstName || userName;
          }
        }
        
        await sendEmail({
          to: email,
          subject: 'Reset your DailyOwo password',
          template: 'password-reset',
          data: {
            userName,
            resetLink: `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password`,
          },
        });
      } catch (emailError) {
        console.error('Failed to send password reset email:', emailError);
        // Continue even if email notification fails
      }
    } catch (error: any) {
      const errorMessage = getErrorMessage(error);
      setError(errorMessage);
      const userError = new Error(errorMessage);
      userError.name = error.name;
      throw userError;
    }
  };

  // Send verification email
  const sendVerificationEmail = async () => {
    if (!user) {
      throw new Error('No user logged in to send verification email');
    }

    if (!user.email) {
      throw new Error('User email not found');
    }

    setError(null);
    try {
      // Use our custom verification service instead of Firebase
      await CustomEmailVerificationService.sendVerificationEmail(
        user.uid,
        user.email,
        userProfile?.displayName || user.email.split('@')[0]
      );
      console.log('Custom verification email sent via Resend');
    } catch (error: any) {
      console.error('Error sending custom verification email:', error);
      const errorMessage = error.message || 'Failed to send verification email';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  // Re-authenticate user with current password (required before sensitive operations)
  const reauthenticate = async (currentPassword: string) => {
    if (!user || !user.email) {
      throw new Error('No user logged in');
    }

    const auth = getFirebaseAuth();
    if (!auth) throw new Error('Firebase not configured');

    setError(null);
    try {
      // Create credential with current email and password
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      
      // Re-authenticate the user
      await reauthenticateWithCredential(user, credential);
      
      console.log('User re-authenticated successfully');
    } catch (error: any) {
      console.error('Re-authentication failed:', error);
      const errorMessage = getErrorMessage(error);
      setError(errorMessage);
      const userError = new Error(errorMessage);
      userError.name = error.name;
      throw userError;
    }
  };

  // Change password (requires recent authentication)
  const changePassword = async (newPassword: string) => {
    if (!user) {
      throw new Error('No user logged in');
    }

    const auth = getFirebaseAuth();
    if (!auth) throw new Error('Firebase not configured');

    setError(null);
    try {
      await updatePassword(user, newPassword);
      console.log('Password changed successfully');
      
      // Send security alert
      try {
        await sendEmail({
          to: user.email!,
          subject: 'Security alert for your DailyOwo account',
          template: 'security-alert',
          data: {
            userName: userProfile?.displayName || user.email!.split('@')[0],
            alertType: 'password_changed',
            details: {
              timestamp: new Date(),
            },
            userId: user.uid,
          },
        });
      } catch (emailError) {
        console.error('Failed to send security alert:', emailError);
        // Continue even if email fails
      }
    } catch (error: any) {
      console.error('Password change failed:', error);
      const errorMessage = getErrorMessage(error);
      setError(errorMessage);
      const userError = new Error(errorMessage);
      userError.name = error.name;
      throw userError;
    }
  };

  const value = {
    user,
    userProfile,
    loading,
    emailVerified,
    error,
    signIn,
    signUp,
    signInWithGoogle,
    logout,
    resetPassword,
    sendVerificationEmail,
    updateUserProfile,
    changePassword,
    reauthenticate
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Protected route hook
export function useRequireAuth() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login');
    }
  }, [user, loading, router]);

  return { user, loading };
} 
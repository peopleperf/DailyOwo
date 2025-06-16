'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Container } from '@/components/layouts/Container';
import { GlassContainer } from '@/components/ui/GlassContainer';
import { GlassButton } from '@/components/ui/GlassButton';
import { Icon } from '@/components/ui/Icon';
import { Loader } from '@/components/ui/Loader';
import { fadeInUp } from '@/lib/utils/animations';
import { useAuth } from '@/lib/firebase/auth-context';
import { AnimatedSplashScreen } from '@/components/features/AnimatedSplashScreen';
import { WelcomeStep } from '@/components/onboarding/WelcomeStep';
import { RegionStep } from '@/components/onboarding/RegionStep';
import { FinancialSnapshotStep } from '@/components/onboarding/FinancialSnapshotStep';
import { InvestmentsStep } from '@/components/onboarding/InvestmentsStep';
import { FamilyStep } from '@/components/onboarding/FamilyStep';
import { ProfileStep } from '@/components/onboarding/ProfileStep';
import { PreferencesStep } from '@/components/onboarding/PreferencesStep';
import { CompletionStep } from '@/components/onboarding/CompletionStep';
import { initializeFinancialDataFromProfile } from '@/lib/firebase/init-financial-data';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

interface OnboardingData {
  region?: string;
  currency?: string;
  language?: string;
  monthlyIncome?: number;
  monthlyExpenses?: number;
  currentSavings?: number;
  currentDebt?: number;
  investmentTypes?: string[];
  riskTolerance?: string;
  investmentGoals?: string[];
  familyMembers?: Array<{
    name: string;
    email: string;
    role: string;
  }>;
  profile?: {
    name?: string;
    age?: number;
    occupation?: string;
  };
  features?: {
    offlineMode: boolean;
    cloudSync: boolean;
    aiInsights: boolean;
  };
  notificationSettings?: {
    budgetAlerts: boolean;
    goalReminders: boolean;
    weeklyReports: boolean;
  };
}

const TOTAL_STEPS = 9; // Splash, Welcome, Region, Financial, Investments, Family, Profile, Preferences, Completion

export default function OnboardingPage() {
  const router = useRouter();
  const { user, userProfile, updateUserProfile, loading } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [onboardingData, setOnboardingData] = useState<OnboardingData>({
    features: {
      offlineMode: true,
      cloudSync: true,
      aiInsights: true,
    }
  });
  const [isCompleting, setIsCompleting] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  
  // Get locale from pathname
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
  const locale = pathname.split('/')[1] || 'en';

  // Redirect if not authenticated or onboarding already completed
  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push(`/${locale}/auth/login`);
      } else if (userProfile?.onboardingCompleted) {
        router.push(`/${locale}/dashboard`);
      }
    }
  }, [user, userProfile, loading, router, locale]);

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 glass rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg">
            <span className="text-4xl font-bold text-gradient-gold">D</span>
          </div>
          <Loader size="lg" variant="gold" />
        </div>
      </div>
    );
  }

  const handleSplashComplete = () => {
    setShowSplash(false);
    setCurrentStep(1); // Start at Welcome step
  };

  const handleNext = () => {
    if (currentStep < TOTAL_STEPS - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleNextWithData = (data: any) => {
    setOnboardingData(prev => ({ ...prev, ...data }));
    handleNext();
  };

  const handleBack = () => {
    if (currentStep > 1) { // Don't go back to splash
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSkip = () => {
    handleNext();
  };

  const handlePreferencesComplete = (data: any) => {
    setOnboardingData(prev => ({ ...prev, ...data }));
    handleNext(); // Move to completion step
  };

  const handleFinalComplete = async () => {
    if (isCompleting) return;
    
    setIsCompleting(true);
    
    // Update user profile with onboarding data
    try {
      await updateUserProfile({
        ...onboardingData,
        onboardingCompleted: true
      });
      
      // Initialize financial data from profile
      try {
        await initializeFinancialDataFromProfile(user.uid, onboardingData);
        console.log('Financial data initialized successfully');
      } catch (error) {
        console.error('Error initializing financial data:', error);
        // Don't block onboarding completion if this fails
      }
      
      // Small delay to ensure state is updated
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Redirect to dashboard
      router.push(`/${locale}/dashboard`);
    } catch (error) {
      console.error('Error completing onboarding:', error);
      
      // If Firestore update fails, still redirect to dashboard
      // The user can still use the app even if the profile update fails
      console.log('Redirecting to dashboard anyway...');
      
      // Try router push first
      router.push(`/${locale}/dashboard`);
      
      // Fallback to window.location if router doesn't work
      setTimeout(() => {
        if (typeof window !== 'undefined') {
          window.location.href = `/${locale}/dashboard`;
        }
      }, 1000);
    } finally {
      setIsCompleting(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return null; // Splash screen is rendered separately
      case 1:
        return <WelcomeStep onNext={handleNext} />;
      case 2:
        return (
          <RegionStep
            data={onboardingData}
            onNext={handleNextWithData}
            onBack={handleBack}
          />
        );
      case 3:
        return (
          <FinancialSnapshotStep
            data={onboardingData}
            onNext={handleNextWithData}
            onBack={handleBack}
            onSkip={handleSkip}
          />
        );
      case 4:
        return (
          <InvestmentsStep
            data={onboardingData}
            onNext={handleNextWithData}
            onBack={handleBack}
            onSkip={handleSkip}
          />
        );
      case 5:
        return (
          <FamilyStep
            data={onboardingData}
            onNext={handleNextWithData}
            onBack={handleBack}
            onSkip={handleSkip}
          />
        );
      case 6:
        return (
          <ProfileStep
            data={onboardingData}
            onNext={handleNextWithData}
            onBack={handleBack}
          />
        );
      case 7:
        return (
          <PreferencesStep
            data={onboardingData}
            onNext={handlePreferencesComplete}
            onBack={handleBack}
            features={onboardingData.features}
          />
        );
      case 8:
        return (
          <CompletionStep
            data={onboardingData}
            onComplete={handleFinalComplete}
            isLoading={isCompleting}
          />
        );
      default:
        return null;
    }
  };

  // Show splash screen
  if (showSplash) {
    return <AnimatedSplashScreen onComplete={handleSplashComplete} duration={2500} />;
  }

  // Calculate progress (exclude splash and completion from progress bar)
  const progressSteps = TOTAL_STEPS - 2; // Exclude splash and completion
  const adjustedStep = currentStep - 1; // Adjust for splash being step 0

  return (
    <div className="min-h-screen bg-white">
      {/* Background pattern */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-50 via-white to-gray-50" />
        <div className="absolute top-20 -left-32 w-[500px] h-[500px] bg-gold/[0.03] rounded-full mix-blend-multiply filter blur-3xl" />
        <div className="absolute top-60 -right-32 w-[500px] h-[500px] bg-primary/[0.03] rounded-full mix-blend-multiply filter blur-3xl" />
        <div className="absolute -bottom-32 left-60 w-[500px] h-[500px] bg-gold/[0.03] rounded-full mix-blend-multiply filter blur-3xl" />
      </div>

      <Container size="md" className="py-12 md:py-16">
        {/* Progress bar - hide on completion step */}
        {currentStep > 0 && currentStep < TOTAL_STEPS - 1 && (
          <div className="mb-12">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-medium text-primary/70">
                Step {adjustedStep} of {progressSteps}
              </h2>
              {currentStep > 1 && (
                <button
                  onClick={handleBack}
                  className="text-sm text-primary/60 hover:text-primary transition-colors flex items-center gap-1"
                >
                  <Icon name="arrowLeft" size="xs" />
                  Go back
                </button>
              )}
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden shadow-inner">
              <motion.div
                className="h-full bg-gradient-to-r from-gold to-gold-dark shadow-sm"
                initial={{ width: 0 }}
                animate={{ width: `${(adjustedStep / progressSteps) * 100}%` }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
              />
            </div>
          </div>
        )}

        {/* Step content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {renderStep()}
          </motion.div>
        </AnimatePresence>
      </Container>
    </div>
  );
} 
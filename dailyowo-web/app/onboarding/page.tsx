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
// Premium onboarding components
import { PremiumWelcomeStep } from '@/components/onboarding/premium/PremiumWelcomeStep';
import { EssentialSetupStep } from '@/components/onboarding/premium/EssentialSetupStep';
import { SecuritySetupStep } from '@/components/onboarding/premium/SecuritySetupStep';
import { FinancialAspirationsStep } from '@/components/onboarding/premium/FinancialAspirationsStep';
import { PremiumFeaturesStep } from '@/components/onboarding/premium/PremiumFeaturesStep';
import { PremiumCompletionStep } from '@/components/onboarding/premium/PremiumCompletionStep';
import { initializeFinancialDataFromProfile } from '@/lib/firebase/init-financial-data';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

interface OnboardingData {
  // Essential setup
  displayName?: string;
  region?: string;
  currency?: string;
  currencySymbol?: string;
  dateFormat?: string;
  
  // Security
  securitySetupComplete?: boolean;
  twoFactorEnabled?: boolean;
  
  // Financial aspirations
  selectedGoals?: string[];
  primaryGoal?: string;
  monthlyAmount?: number;
  currentSavings?: number;
  goals?: Array<{
    id: string;
    title: string;
    isPrimary: boolean;
    template: boolean;
  }>;
  
  // Premium features
  features?: Record<string, boolean>;
  notifications?: Record<string, boolean>;
  premiumFeaturesConfigured?: boolean;
}

const TOTAL_STEPS = 6; // Welcome, Essential, Security, Aspirations, Features, Completion

export default function OnboardingPage() {
  const router = useRouter();
  const { user, userProfile, updateUserProfile, loading } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [onboardingData, setOnboardingData] = useState<OnboardingData>({});
  const [isCompleting, setIsCompleting] = useState(false);
  
  // Get locale from pathname
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
  const locale = pathname.split('/')[1] || 'en';

  // Redirect if not authenticated or onboarding already completed
  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/auth/login');
      } else if (userProfile?.onboardingCompleted) {
        router.push('/dashboard');
      }
    }
  }, [user, userProfile, loading, router]);

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-24 h-24 glass rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl">
            <span className="text-5xl font-light text-gradient-gold">D</span>
          </div>
          <Loader size="lg" variant="gold" />
        </div>
      </div>
    );
  }

  // Remove splash screen - start directly with onboarding

  const handleNext = () => {
    if (currentStep < TOTAL_STEPS) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleNextWithData = (data: any) => {
    setOnboardingData(prev => ({ ...prev, ...data }));
    handleNext();
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  // Remove skip and preferences handlers - not needed in streamlined flow

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
      router.push('/dashboard');
    } catch (error) {
      console.error('Error completing onboarding:', error);
      
      // If Firestore update fails, still redirect to dashboard
      // The user can still use the app even if the profile update fails
      console.log('Redirecting to dashboard anyway...');
      
      // Try router push first
      router.push('/dashboard');
      
      // Fallback to window.location if router doesn't work
      setTimeout(() => {
        if (typeof window !== 'undefined') {
          window.location.href = '/dashboard';
        }
      }, 1000);
    } finally {
      setIsCompleting(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <PremiumWelcomeStep onNext={handleNext} />;
      case 2:
        return (
          <EssentialSetupStep
            data={onboardingData}
            onNext={handleNextWithData}
            onBack={handleBack}
          />
        );
      case 3:
        return (
          <SecuritySetupStep
            data={onboardingData}
            onNext={handleNextWithData}
            onBack={handleBack}
          />
        );
      case 4:
        return (
          <FinancialAspirationsStep
            data={onboardingData}
            onNext={handleNextWithData}
            onBack={handleBack}
          />
        );
      case 5:
        return (
          <PremiumFeaturesStep
            data={onboardingData}
            onNext={handleNextWithData}
            onBack={handleBack}
          />
        );
      case 6:
        return (
          <PremiumCompletionStep
            data={onboardingData}
            onComplete={handleFinalComplete}
            isLoading={isCompleting}
          />
        );
      default:
        return null;
    }
  };

  // Start onboarding at step 1
  useEffect(() => {
    if (currentStep === 0) {
      setCurrentStep(1);
    }
  }, [currentStep]);

  // Calculate progress (exclude completion from progress bar)
  const progressSteps = TOTAL_STEPS - 1; // Exclude completion
  const adjustedStep = currentStep; // Direct step mapping

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
        {currentStep > 0 && currentStep < TOTAL_STEPS && (
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
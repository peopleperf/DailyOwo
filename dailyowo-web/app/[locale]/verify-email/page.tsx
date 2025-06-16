'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Mail, CheckCircle, ArrowRight, RefreshCw, AlertCircle } from 'lucide-react';
import { useAuth } from '@/lib/firebase/auth-context';
import { Container } from '@/components/layouts/Container';
import { GlassContainer } from '@/components/ui/GlassContainer';
import { GlassButton } from '@/components/ui/GlassButton';
import { Icon } from '@/components/ui/Icon';
import { fadeInUp } from '@/lib/utils/animations';
import { useRouter, useSearchParams } from 'next/navigation';
import { CustomEmailVerificationService } from '@/lib/services/custom-email-verification';

export default function VerifyEmailPage() {
  const { user, userProfile, sendVerificationEmail } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [message, setMessage] = useState('');
  const [isVerified, setIsVerified] = useState(false);
  const [verificationError, setVerificationError] = useState<string | null>(null);

  // Check for verification result from URL parameters (custom verification)
  useEffect(() => {
    if (!searchParams) return;
    
    const verified = searchParams.get('verified');
    const error = searchParams.get('error');

    if (verified === 'true') {
      setIsVerified(true);
      setMessage('Email verified successfully! Redirecting...');
      setTimeout(() => {
        router.push('/onboarding');
      }, 2000);
    } else if (error) {
      setVerificationError(decodeURIComponent(error));
      setMessage(decodeURIComponent(error));
    }
  }, [searchParams, router]);

  // Check verification status periodically
  useEffect(() => {
    if (!user || !userProfile) return;

    // For custom verification, we check the userProfile emailVerified field
    // This is updated when the user clicks the verification link
    const checkVerificationStatus = async () => {
      if (!isVerified && userProfile.emailVerified) {
        setIsVerified(true);
        setMessage('Email verified successfully! Redirecting...');
        setTimeout(() => {
          router.push('/onboarding');
        }, 2000);
      }
    };

    // Check immediately
    checkVerificationStatus();

    // Also check periodically for updates
    const interval = setInterval(checkVerificationStatus, 3000);

    return () => {
      clearInterval(interval);
    };
  }, [user, userProfile, router, isVerified]);

  // Countdown timer for resend button
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleResendEmail = async () => {
    if (!user || resending || countdown > 0) return;

    setResending(true);
    setMessage('');
    setVerificationError(null);

    try {
      // Send verification email through our custom Resend service
      if (user.email) {
        await CustomEmailVerificationService.sendVerificationEmail(
          user.uid,
          user.email,
          userProfile?.displayName || user.email.split('@')[0]
        );
      }

      setMessage('Verification email sent! Please check your inbox.');
      setCountdown(60); // 60 second cooldown
    } catch (error) {
      console.error('Error resending verification email:', error);
      setMessage('Failed to send verification email. Please try again.');
    } finally {
      setResending(false);
    }
  };

  const handleRefreshStatus = () => {
    // Force a page refresh to check for updates
    window.location.reload();
  };

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!user) {
      router.push('/auth/login');
    }
  }, [user, router]);

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <Container size="sm">
        <motion.div {...fadeInUp}>
          <GlassContainer className="p-8 md:p-10 text-center">
            {/* Icon */}
            <div className="w-20 h-20 glass-subtle rounded-full flex items-center justify-center mx-auto mb-6">
              {isVerified ? (
                <CheckCircle className="w-10 h-10 text-green-600" />
              ) : (
                <Mail className="w-10 h-10 text-gold" />
              )}
            </div>

            {/* Title */}
            <h1 className="text-3xl font-bold text-primary mb-2">
              {isVerified ? 'Email Verified!' : 'Verify Your Email'}
            </h1>

            {/* Description */}
            <p className="text-primary/70 mb-8">
              {isVerified ? (
                'Your email has been verified successfully.'
              ) : (
                <>
                  We've sent a verification email to <br />
                  <span className="font-medium text-primary">{user.email}</span>
                </>
              )}
            </p>

            {/* Message */}
            {message && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-4 rounded-xl mb-6 ${
                  message.includes('successfully') 
                    ? 'bg-green-50 text-green-700' 
                    : message.includes('Failed')
                    ? 'bg-red-50 text-red-700'
                    : 'bg-blue-50 text-blue-700'
                }`}
              >
                {message}
              </motion.div>
            )}

            {!isVerified && (
              <>
                {/* Instructions */}
                <div className="glass-subtle p-6 rounded-xl mb-8 text-left">
                  <h3 className="font-semibold text-primary mb-3">Next steps:</h3>
                  <ol className="space-y-2 text-sm text-primary/70">
                    <li className="flex items-start">
                      <span className="text-gold mr-2">1.</span>
                      Check your email inbox for a verification email from DailyOwo
                    </li>
                    <li className="flex items-start">
                      <span className="text-gold mr-2">2.</span>
                      Click the verification link in the email
                    </li>
                    <li className="flex items-start">
                      <span className="text-gold mr-2">3.</span>
                      Return to this page or refresh to continue
                    </li>
                  </ol>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <GlassButton
                    variant="primary"
                    goldBorder
                    onClick={handleResendEmail}
                    disabled={resending || countdown > 0}
                  >
                    {resending ? (
                      <>
                        <Icon name="loader" size="sm" className="mr-2 animate-spin" />
                        Sending...
                      </>
                    ) : countdown > 0 ? (
                      `Resend in ${countdown}s`
                    ) : (
                      <>
                        <Mail className="w-4 h-4 mr-2" />
                        Resend Email
                      </>
                    )}
                  </GlassButton>

                  <GlassButton
                    variant="ghost"
                    onClick={handleRefreshStatus}
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Check Status
                  </GlassButton>
                </div>

                {/* Alternative actions */}
                <div className="mt-8 pt-8 border-t border-gray-200">
                  <p className="text-sm text-primary/60 mb-3">
                    Can't find the email? Check your spam folder or
                  </p>
                  <button
                    onClick={() => {
                      router.push('/auth/login');
                    }}
                    className="text-sm text-gold hover:text-gold-dark transition-colors"
                  >
                    Sign in with a different email
                  </button>
                </div>
              </>
            )}

            {isVerified && (
              <GlassButton
                variant="primary"
                goldBorder
                onClick={() => router.push('/onboarding')}
                className="mt-4"
              >
                Continue to Onboarding
                <ArrowRight className="w-4 h-4 ml-2" />
              </GlassButton>
            )}
          </GlassContainer>
        </motion.div>
      </Container>
    </div>
  );
} 
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';

import { Container } from '@/components/layouts/Container';
import { GlassContainer } from '@/components/ui/GlassContainer';
import { GlassButton } from '@/components/ui/GlassButton';
import { GlassInput } from '@/components/ui/GlassInput'; // Assuming GlassInput exists
import { Icon } from '@/components/ui/Icon';

import { fadeInUp } from '@/lib/utils/animations';
import { useAuth } from '@/lib/firebase/auth-context';
import { Loader } from '@/components/ui/Loader';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export default function ResetPasswordPage() {
  const router = useRouter();
  const { resetPassword, error: authError, user, loading: authLoading } = useAuth();
  
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Redirect if already logged in
  useEffect(() => {
    if (!authLoading && user) {
      router.push('/dashboard'); // Or based on onboarding status if needed
    }
  }, [user, authLoading, router]);

  const validateForm = () => {
    if (!email) {
      setFormError('Email is required.');
      return false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      setFormError('Please enter a valid email address.');
      return false;
    }
    setFormError(null);
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage(null);
    setFormError(null);

    if (!validateForm()) return;

    setIsLoading(true);
    try {
      await resetPassword(email);
      setSuccessMessage(`An email has been sent to ${email} with instructions to reset your password.`);
      setEmail(''); // Clear email field on success
    } catch (error: any) {
      // authError from context might also be set, or use error from catch
      if (authError?.includes('auth/user-not-found')) {
        setFormError('No account found with this email address.');
      } else {
        setFormError('An unexpected error occurred. Please try again.');
      }
      console.error('Password reset error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white relative flex items-center justify-center">
      

      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-white via-gray-50/30 to-white" />
        <div className="absolute top-0 -left-32 w-96 h-96 bg-gold/[0.02] rounded-full mix-blend-multiply filter blur-3xl" />
        <div className="absolute bottom-0 -right-32 w-96 h-96 bg-primary/[0.02] rounded-full mix-blend-multiply filter blur-3xl" />
      </div>

      <Container size="sm" className="py-8 relative">
        <motion.div {...fadeInUp} className="max-w-md mx-auto">
          <div className="text-center mb-12">
            <div className="w-24 h-24 bg-gradient-to-br from-white to-gold/10 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-xl">
              <span className="text-5xl font-light text-gradient-gold">D</span>
            </div>
            <h1 className="text-3xl font-light text-primary mb-3">Reset Your Password</h1>
            <p className="text-primary/50 text-sm font-light">Enter your email to receive reset instructions.</p>
          </div>

          <GlassContainer className="p-10 bg-gradient-to-br from-white via-white to-gold/5" goldBorder>
            <form onSubmit={handleSubmit} className="space-y-6">
              {successMessage && (
                <div className="p-3 bg-green-100 border border-green-300 text-green-700 rounded-lg text-sm font-light">
                  {successMessage}
                </div>
              )}
              {formError && (
                <div className="p-3 bg-red-100 border border-red-300 text-red-700 rounded-lg text-sm font-light">
                  {formError}
                </div>
              )}
              {/* Display global authError from context if it's relevant and not handled by formError */}
              {/* {!formError && !successMessage && authError && (
                <div className="p-3 bg-red-100 border border-red-300 text-red-700 rounded-lg text-sm font-light">
                  {authError} 
                </div>
              )} */}

              <div className="space-y-2">
                <label htmlFor="email" className="text-xs font-light tracking-wide uppercase text-primary/60">
                  Email
                </label>
                <GlassInput
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  disabled={isLoading}
                  className="w-full"
                />
              </div>

              <GlassButton
                type="submit"
                variant="primary"
                fullWidth
                goldBorder
                disabled={isLoading}
                className="py-4 text-sm font-light tracking-wide"
              >
                {isLoading ? <Loader size="sm" variant="gold" /> : 'Send Instructions'}
              </GlassButton>
            </form>

            <p className="text-center text-xs text-primary/50 mt-8 pt-8 border-t border-gray-100 font-light">
              <Link
                href="/auth/login"
                className="text-gold hover:text-gold-dark transition-colors"
              >
                Back to Login
              </Link>
            </p>
          </GlassContainer>
        </motion.div>
      </Container>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { Container } from '@/components/layouts/Container';
import { GlassContainer } from '@/components/ui/GlassContainer';
import { GlassButton } from '@/components/ui/GlassButton';
import { GlassInput } from '@/components/ui/GlassInput';
import { Icon } from '@/components/ui/Icon';
import { LanguageSelector } from '@/components/ui/LanguageSelector';
import { fadeInUp } from '@/lib/utils/animations';
import { useAuth } from '@/lib/firebase/auth-context';
import { Loader } from '@/components/ui/Loader';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export default function LoginPage() {
  const router = useRouter();
  const { signIn, signInWithGoogle, error, user, userProfile } = useAuth();
    const t = useTranslations('auth.login');
  const tValidation = useTranslations('validation');
  const tCommon = useTranslations('common');
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [showPasswordHint, setShowPasswordHint] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (user && userProfile) {
      // Check if onboarding is completed
      if (userProfile.onboardingCompleted) {
        router.push('/dashboard');
      } else {
        router.push('/onboarding');
      }
    }
  }, [user, userProfile, router]);

  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    if (!formData.email) {
            errors.email = tValidation('emailRequired');
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            errors.email = tValidation('emailInvalid');
    }
    
    if (!formData.password) {
            errors.password = tValidation('passwordRequired');
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    setIsLoading(true);
    try {
      await signIn(formData.email, formData.password);
      router.push('/dashboard');
    } catch (error: any) {
      console.error('Login error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      await signInWithGoogle();
      // Router push will be handled by auth context after redirect
    } catch (error: any) {
      console.error('Google sign in error:', error);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white relative flex items-center justify-center">
      {/* Language Selector */}
      <div className="absolute top-6 right-6 z-20">
        <LanguageSelector />
      </div>

      {/* Premium Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-white via-gray-50/30 to-white" />
        <div className="absolute top-0 -left-32 w-96 h-96 bg-gold/[0.02] rounded-full mix-blend-multiply filter blur-3xl" />
        <div className="absolute bottom-0 -right-32 w-96 h-96 bg-primary/[0.02] rounded-full mix-blend-multiply filter blur-3xl" />
      </div>

      <Container size="sm" className="py-8 relative">
        <motion.div {...fadeInUp} className="max-w-md mx-auto">
          {/* Logo and Header */}
          <div className="text-center mb-12">
            <div className="w-24 h-24 bg-gradient-to-br from-white to-gold/10 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-xl">
              <span className="text-5xl font-light text-gradient-gold">D</span>
            </div>
            <h1 className="text-3xl font-light text-primary mb-3">{t('title')}</h1>
            <p className="text-primary/50 text-sm font-light">{t('subtitle')}</p>
          </div>

          <GlassContainer className="p-10 bg-gradient-to-br from-white via-white to-gold/5" goldBorder>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-4 rounded-xl bg-red-50/50 border border-red-100"
                >
                  <p className="text-sm text-red-700 font-light">{error}</p>
                  {(error.includes('No account found') || error.includes("don't have an account")) && (
                    <p className="text-sm text-primary mt-2">
                      <Link href="/auth/register" className="text-gold hover:text-gold-dark transition-colors font-medium">
                        Click here to create an account →
                      </Link>
                    </p>
                  )}
                  {error.includes('Incorrect password') && (
                    <p className="text-sm text-primary mt-2">
                      <Link href="/auth/reset-password" className="text-gold hover:text-gold-dark transition-colors font-medium">
                        Forgot your password? Reset it here →
                      </Link>
                    </p>
                  )}
                </motion.div>
              )}

              <div className="space-y-5">
                <div className="space-y-2">
                  <label className="text-xs font-light tracking-wide uppercase text-primary/60">
                    {t('email')}
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="you@example.com"
                    className="w-full px-4 py-3 bg-white/50 border border-gray-200 rounded-xl focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-all text-primary font-light"
                    disabled={isLoading}
                  />
                  {validationErrors.email && (
                    <p className="text-xs text-red-600 mt-1 font-light">{validationErrors.email}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-light tracking-wide uppercase text-primary/60">
                    {t('password')}
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      onFocus={() => setShowPasswordHint(true)}
                      onBlur={() => setShowPasswordHint(false)}
                      placeholder="••••••••"
                      className="w-full px-4 py-3 bg-white/50 border border-gray-200 rounded-xl focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-all text-primary font-light"
                      disabled={isLoading}
                    />
                    {showPasswordHint && !formData.password && (
                      <motion.div
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="absolute left-0 top-full mt-1 text-xs text-primary/60 bg-white px-3 py-1 rounded-lg shadow-sm border border-gray-100"
                      >
                        Password must be at least 6 characters
                      </motion.div>
                    )}
                  </div>
                  {validationErrors.password && (
                    <p className="text-xs text-red-600 mt-1 font-light">{validationErrors.password}</p>
                  )}
                </div>
              </div>

              <div className="text-right">
                <Link
                  href="/auth/reset-password"
                  className="text-xs text-primary/50 hover:text-gold transition-colors font-light"
                >
                  {t('forgotPassword')}
                </Link>
              </div>

              <div className="space-y-4 pt-4">
                <GlassButton
                  type="submit"
                  variant="primary"
                  fullWidth
                  goldBorder
                  disabled={isLoading}
                  className="py-4 text-sm font-light tracking-wide"
                >
                  {isLoading ? <Loader size="sm" variant="gold" /> : t('signIn')}
                </GlassButton>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-100" />
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="px-4 bg-white text-primary/40 font-light">{t('orContinueWith')}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={isLoading}
                  className="w-full glass px-4 py-3 rounded-xl flex items-center justify-center gap-3 hover:bg-white/60 transition-all text-primary/70 font-light disabled:opacity-50"
                >
                  <Icon name="google" size="sm" />
                  <span className="text-sm">{t('signInWithGoogle')}</span>
                </button>
              </div>
            </form>

            <p className="text-center text-xs text-primary/50 mt-8 pt-8 border-t border-gray-100 font-light">
              {t('noAccount')}{' '}
              <Link
                href="/auth/register"
                className="text-gold hover:text-gold-dark transition-colors"
              >
                {t('signUp')}
              </Link>
            </p>
          </GlassContainer>
        </motion.div>
      </Container>
    </div>
  );
} 
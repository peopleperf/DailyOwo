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

const PasswordRequirement = ({ met, label }: { met: boolean; label: string }) => (
  <div className={`flex items-center transition-colors ${met ? 'text-green-500' : 'text-primary/40'}`}>
    <Icon name={met ? 'checkCircle' : 'circle'} size="xs" className="mr-2" />
    <span>{label}</span>
  </div>
);

export default function RegisterPage() {
  const router = useRouter();
  const { signUp, signInWithGoogle, error, user } = useAuth();
      const t = useTranslations('auth.register');
  const tValidation = useTranslations('validation');
  const tPasswordReqs = useTranslations('auth.register.passwordRequirements');
  const tCommon = useTranslations('common');
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    agreeToTerms: false,
  });
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [isRedirecting, setIsRedirecting] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (user && !isRedirecting) {
      setIsRedirecting(true);
      // Small delay to ensure profile is loaded
      setTimeout(() => {
        // Check if email is verified
        if (user.emailVerified) {
          router.push('/onboarding');
        } else {
          router.push('/verify-email');
        }
      }, 1000);
    }
  }, [user, router, isRedirecting]);

  const getPasswordValidation = (password: string) => {
    return {
      minLength: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
    };
  };

  const passwordValidation = getPasswordValidation(formData.password);

  const validateForm = () => {
    const errors: Record<string, string> = {};
    const passwordVal = getPasswordValidation(formData.password);

    if (!formData.email) {
      errors.email = tValidation('emailRequired');
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = tValidation('emailInvalid');
    }

    if (!Object.values(passwordVal).every(Boolean)) {
      errors.password = tPasswordReqs('title'); // Generic message, detailed UI shows specifics
    }

    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = tValidation('passwordsDoNotMatch');
    }

    if (!formData.agreeToTerms) {
      errors.agreeToTerms = tValidation('termsRequired');
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    setIsLoading(true);
    try {
      await signUp(formData.email, formData.password, '');
      setIsRedirecting(true);
      // Registration successful, redirect to email verification
      router.push('/verify-email');
    } catch (error: any) {
      console.error('Registration error:', error);
      setIsLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setIsLoading(true);
    try {
      await signInWithGoogle();
      router.push('/onboarding');
    } catch (error: any) {
      console.error('Google sign up error:', error);
      setIsLoading(false);
    }
  };

  // Show loading state while redirecting
  if (isRedirecting) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-24 h-24 bg-gradient-to-br from-white to-gold/10 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl">
            <span className="text-5xl font-light text-gradient-gold">D</span>
          </div>
          <h2 className="text-2xl font-light text-primary mb-3">Setting up your account...</h2>
          <p className="text-primary/50 font-light">Please verify your email to continue</p>
          <Loader size="md" variant="gold" className="mt-4" />
        </div>
      </div>
    );
  }

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
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-4 rounded-xl bg-red-50/50 border border-red-100"
                >
                  <p className="text-sm text-red-700 font-light">{error}</p>
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
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="••••••••"
                    className="w-full px-4 py-3 bg-white/50 border border-gray-200 rounded-xl focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-all text-primary font-light"
                    disabled={isLoading}
                  />
                  {validationErrors.password && (
                    <p className="text-xs text-red-600 mt-1 font-light">{validationErrors.password}</p>
                  )}
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs mt-2 pl-1">
                    <PasswordRequirement label={tPasswordReqs('minLength')} met={passwordValidation.minLength} />
                    <PasswordRequirement label={tPasswordReqs('uppercase')} met={passwordValidation.uppercase} />
                    <PasswordRequirement label={tPasswordReqs('lowercase')} met={passwordValidation.lowercase} />
                    <PasswordRequirement label={tPasswordReqs('number')} met={passwordValidation.number} />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-light tracking-wide uppercase text-primary/60">
                    {t('confirmPassword')}
                  </label>
                  <input
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    placeholder="••••••••"
                    className="w-full px-4 py-3 bg-white/50 border border-gray-200 rounded-xl focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-all text-primary font-light"
                    disabled={isLoading}
                  />
                  {validationErrors.confirmPassword && (
                    <p className="text-xs text-red-600 mt-1 font-light">{validationErrors.confirmPassword}</p>
                  )}
                </div>

                <div className="pt-3">
                  <label className="flex items-start gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={formData.agreeToTerms}
                      onChange={(e) => setFormData({ ...formData, agreeToTerms: e.target.checked })}
                      className="mt-1 w-4 h-4 text-gold border-gray-300 rounded focus:ring-gold"
                    />
                    <span className="text-xs text-primary/60 font-light group-hover:text-primary/80 transition-colors">
                      {t('agreeToTerms')}
                    </span>
                  </label>
                  {validationErrors.agreeToTerms && (
                    <p className="mt-2 ml-7 text-xs text-red-600 font-light">{validationErrors.agreeToTerms}</p>
                  )}
                </div>
              </div>

              <div className="space-y-4 pt-4">
                <GlassButton
                  type="submit"
                  variant="primary"
                  fullWidth
                  goldBorder
                  disabled={isLoading || !formData.agreeToTerms}
                  className="py-4 text-sm font-light tracking-wide"
                >
                  {isLoading ? <Loader size="sm" variant="gold" /> : t('createAccount')}
                </GlassButton>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-100" />
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="px-4 bg-white text-primary/40 font-light">{t('orSignUpWith')}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleGoogleSignUp}
                  disabled={isLoading}
                  className="w-full glass px-4 py-3 rounded-xl flex items-center justify-center gap-3 hover:bg-white/60 transition-all text-primary/70 font-light disabled:opacity-50"
                >
                  <Icon name="google" size="sm" />
                  <span className="text-sm">{t('signUpWithGoogle')}</span>
                </button>
              </div>
            </form>

            <p className="text-center text-xs text-primary/50 mt-8 pt-8 border-t border-gray-100 font-light">
              {t('alreadyHaveAccount')}{' '}
              <Link
                href="/auth/login"
                className="text-gold hover:text-gold-dark transition-colors"
              >
                {t('signIn')}
              </Link>
            </p>
          </GlassContainer>
        </motion.div>
      </Container>
    </div>
  );
} 
'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { GlassContainer } from '@/components/ui/GlassContainer';
import { GlassButton } from '@/components/ui/GlassButton';
import { GlassInput } from '@/components/ui/GlassInput';
import { Icon } from '@/components/ui/Icon';
import { Loader } from '@/components/ui/Loader';
import { Shield, Key, ArrowLeft, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/lib/firebase/auth-context';

interface TwoFactorVerificationProps {
  userId: string;
  onVerified: () => void;
  onBack: () => void;
  isLoading?: boolean;
}

export function TwoFactorVerification({ 
  userId, 
  onVerified, 
  onBack, 
  isLoading = false 
}: TwoFactorVerificationProps) {
  const { verify2FA } = useAuth();
  const [verificationCode, setVerificationCode] = useState('');
  const [error, setError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [showBackupCode, setShowBackupCode] = useState(false);

  const handleVerify = async () => {
    if (!verificationCode.trim()) {
      setError('Please enter the verification code');
      return;
    }

    setIsVerifying(true);
    setError('');

    try {
      await verify2FA(verificationCode);
      onVerified();
    } catch (error: any) {
      console.error('2FA verification failed:', error);
      setError(error.message || 'Verification failed. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && verificationCode.length >= 6) {
      handleVerify();
    }
  };

  return (
    <div className="min-h-screen bg-white relative flex items-center justify-center pt-safe pb-safe">
      {/* Premium Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-white via-gray-50/30 to-white" />
        <div className="absolute top-0 -left-32 w-96 h-96 bg-gold/[0.02] rounded-full mix-blend-multiply filter blur-3xl" />
        <div className="absolute bottom-0 -right-32 w-96 h-96 bg-primary/[0.02] rounded-full mix-blend-multiply filter blur-3xl" />
      </div>

      <div className="w-full max-w-md mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Header */}
          <div className="text-center mb-12">
            <div className="w-20 h-20 bg-gradient-to-br from-white to-gold/10 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-xl">
              <Shield className="w-10 h-10 text-gold" />
            </div>
            <h1 className="text-3xl font-light text-primary mb-3">
              Two-Factor Authentication
            </h1>
            <p className="text-primary/60 font-light">
              Enter the 6-digit code from your authenticator app to continue.
            </p>
          </div>

          <GlassContainer className="p-8 bg-gradient-to-br from-white via-white to-gold/5" goldBorder>
            <div className="space-y-6">
              {/* Verification Code Input */}
              <div>
                <label className="text-xs font-light tracking-wide uppercase text-primary/60 block mb-3">
                  Verification Code
                </label>
                <GlassInput
                  type="text"
                  value={verificationCode}
                  onChange={(e) => {
                    // Only allow 6 digits
                    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                    setVerificationCode(value);
                    if (error) setError('');
                  }}
                  onKeyPress={handleKeyPress}
                  placeholder="000000"
                  className="text-2xl font-light text-center tracking-widest"
                  maxLength={6}
                  autoFocus
                  disabled={isLoading || isVerifying}
                  icon={<Key size={18} className="text-primary/40" />}
                />
                <p className="text-xs font-light text-primary/50 mt-2 text-center">
                  Enter the 6-digit code from your authenticator app
                </p>
              </div>

              {/* Error Message */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-4 rounded-xl bg-red-50/50 border border-red-100 flex items-center gap-3"
                >
                  <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
                  <p className="text-sm text-red-700 font-light">{error}</p>
                </motion.div>
              )}

              {/* Verify Button */}
              <GlassButton
                variant="primary"
                goldBorder
                onClick={handleVerify}
                disabled={isLoading || isVerifying || verificationCode.length < 6}
                className="w-full py-4 text-sm font-light tracking-wide"
              >
                {isVerifying ? (
                  <Loader size="sm" variant="gold" />
                ) : (
                  'Verify & Continue'
                )}
              </GlassButton>

              {/* Backup Code Option */}
              <div className="text-center">
                <button
                  onClick={() => setShowBackupCode(!showBackupCode)}
                  className="text-sm text-primary/50 hover:text-gold transition-colors font-light"
                  disabled={isLoading || isVerifying}
                >
                  {showBackupCode ? 'Use authenticator code' : 'Use backup code instead'}
                </button>
              </div>

              {/* Backup Code Input */}
              {showBackupCode && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="space-y-3"
                >
                  <label className="text-xs font-light tracking-wide uppercase text-primary/60 block">
                    Backup Code
                  </label>
                  <GlassInput
                    type="text"
                    value={verificationCode}
                    onChange={(e) => {
                      // Allow backup code format (XXXX-XXXX)
                      const value = e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, '');
                      setVerificationCode(value);
                      if (error) setError('');
                    }}
                    placeholder="XXXX-XXXX"
                    className="text-lg font-mono text-center tracking-wider"
                    disabled={isLoading || isVerifying}
                  />
                  <p className="text-xs font-light text-primary/50 text-center">
                    Enter one of your saved backup codes
                  </p>
                </motion.div>
              )}

              {/* Back Button */}
              <div className="pt-4 border-t border-gray-100">
                <GlassButton
                  variant="ghost"
                  onClick={onBack}
                  disabled={isLoading || isVerifying}
                  className="w-full font-light"
                >
                  <ArrowLeft size={18} className="mr-2" />
                  Back to Login
                </GlassButton>
              </div>
            </div>
          </GlassContainer>

          {/* Help Text */}
          <div className="text-center mt-8">
            <p className="text-xs font-light text-primary/40">
              Having trouble? Contact support for assistance.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GlassContainer } from '@/components/ui/GlassContainer';
import { GlassButton } from '@/components/ui/GlassButton';
import { GlassInput } from '@/components/ui/GlassInput';
import { Icon } from '@/components/ui/Icon';
import { Shield, Smartphone, Key, CheckCircle, AlertTriangle, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/lib/firebase/auth-context';
import { twoFactorService } from '@/lib/firebase/two-factor-service';

interface SecuritySetupStepProps {
  data: any;
  onNext: (data: any) => void;
  onBack: () => void;
}

interface Setup2FAData {
  secret: string;
  qrCodeURL: string;
  backupCodes: string[];
}

export function SecuritySetupStep({ data, onNext, onBack }: SecuritySetupStepProps) {
  const { user, reauthenticate } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [enable2FA, setEnable2FA] = useState(false);
  const [setup2FAData, setSetup2FAData] = useState<Setup2FAData | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [step, setStep] = useState<'password' | '2fa-setup' | '2fa-verify' | 'complete'>('password');

  const handlePasswordVerification = async () => {
    if (!currentPassword.trim()) {
      setErrors({ password: 'Please enter your current password' });
      return;
    }

    setIsLoading(true);
    try {
      await reauthenticate(currentPassword);
      setErrors({});
      
      if (enable2FA) {
        // Set up 2FA
        const setup2FA = await twoFactorService.setup2FA(user!.uid, user!.email!);
        setSetup2FAData(setup2FA);
        setStep('2fa-setup');
      } else {
        setStep('complete');
      }
    } catch (error: any) {
      setErrors({ password: 'Incorrect password. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleContinueToVerify = () => {
    setStep('2fa-verify');
  };

  const handle2FAVerification = async () => {
    if (!verificationCode.trim()) {
      setErrors({ verification: 'Please enter the verification code' });
      return;
    }

    setIsLoading(true);
    try {
      await twoFactorService.enable2FA(user!.uid, verificationCode);
      setErrors({});
      setStep('complete');
    } catch (error: any) {
      setErrors({ verification: 'Invalid verification code. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleComplete = () => {
    onNext({
      securitySetupComplete: true,
      twoFactorEnabled: enable2FA && step === 'complete',
    });
  };

  const handleSkip2FA = () => {
    setEnable2FA(false);
    setStep('complete');
  };

  const renderPasswordStep = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
    >
      <div className="space-y-6">
        <div className="text-center mb-8">
          <p className="text-lg font-light text-primary/70 max-w-md mx-auto">
            First, let's verify your identity to ensure account security.
          </p>
        </div>

        <div>
          <label className="block text-xs font-light tracking-wide uppercase text-primary/60 mb-3">
            Current Password
          </label>
          <div className="relative">
            <GlassInput
              type={showPassword ? 'text' : 'password'}
              value={currentPassword}
              onChange={(e) => {
                setCurrentPassword(e.target.value);
                if (errors.password) setErrors({ ...errors, password: '' });
              }}
              placeholder="Enter your current password"
              icon={<Key size={18} className="text-primary/40" />}
              className="text-lg font-light pr-12"
              error={errors.password}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-primary/40 hover:text-primary/60 transition-colors"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        {/* 2FA Option */}
        <div className="glass-subtle p-6 rounded-xl border border-gold/20">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-gold/10 flex items-center justify-center flex-shrink-0">
              <Smartphone className="w-6 h-6 text-gold" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-light text-primary">
                  Enable Two-Factor Authentication
                </h3>
                <button
                  onClick={() => setEnable2FA(!enable2FA)}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    enable2FA ? 'bg-gold' : 'bg-gray-300'
                  }`}
                >
                  <motion.div
                    animate={{ x: enable2FA ? 24 : 0 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    className="w-6 h-6 bg-white rounded-full shadow-md"
                  />
                </button>
              </div>
              <p className="text-sm font-light text-primary/60 mb-3">
                Add an extra layer of security with time-based codes from your phone.
              </p>
              <div className="flex items-center gap-2 text-xs font-light text-primary/50">
                <Shield className="w-4 h-4" />
                <span>Recommended for maximum security</span>
              </div>
            </div>
          </div>
        </div>

        <GlassButton
          variant="primary"
          goldBorder
          onClick={handlePasswordVerification}
          disabled={isLoading || !currentPassword.trim()}
          className="w-full py-4 font-light"
        >
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              {enable2FA ? 'Continue to 2FA Setup' : 'Continue'}
              <Icon name="arrowRight" size="sm" className="ml-2" />
            </>
          )}
        </GlassButton>
      </div>
    </motion.div>
  );

  const render2FASetupStep = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
    >
      <div className="space-y-6">
        <div className="text-center mb-8">
          <div className="w-16 h-16 glass-subtle rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Smartphone className="w-8 h-8 text-gold" />
          </div>
          <h3 className="text-2xl font-light text-primary mb-3">
            Set up your authenticator
          </h3>
          <p className="text-lg font-light text-primary/70 max-w-md mx-auto">
            Scan this QR code with your authenticator app to generate secure codes.
          </p>
        </div>

        {setup2FAData && (
          <div className="space-y-6">
            {/* QR Code */}
            <div className="flex justify-center">
              <div className="p-6 bg-white rounded-2xl shadow-lg">
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(setup2FAData.qrCodeURL)}`}
                  alt="2FA QR Code"
                  className="w-48 h-48"
                />
              </div>
            </div>

            {/* Manual Setup Code */}
            <div className="glass-subtle p-4 rounded-xl">
              <p className="text-xs font-light tracking-wide uppercase text-primary/60 mb-2">
                Manual Setup Code
              </p>
              <code className="text-sm font-mono bg-gray-50 px-3 py-2 rounded-lg block break-all">
                {twoFactorService.formatSecret(setup2FAData.secret)}
              </code>
            </div>

            {/* Instructions */}
            <div className="space-y-3">
              <p className="text-sm font-light text-primary/70">
                <strong>Recommended apps:</strong> Google Authenticator, Authy, or 1Password
              </p>
              <ol className="text-sm font-light text-primary/60 space-y-1 list-decimal list-inside">
                <li>Download an authenticator app</li>
                <li>Scan the QR code or enter the manual code</li>
                <li>Save the backup codes in a secure location</li>
                <li>Enter the 6-digit code to verify setup</li>
              </ol>
            </div>

            <GlassButton
              variant="primary"
              goldBorder
              onClick={handleContinueToVerify}
              className="w-full py-4 font-light"
            >
              I've Added the Code
              <Icon name="arrowRight" size="sm" className="ml-2" />
            </GlassButton>
          </div>
        )}
      </div>
    </motion.div>
  );

  const render2FAVerifyStep = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
    >
      <div className="space-y-6">
        <div className="text-center mb-8">
          <div className="w-16 h-16 glass-subtle rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Key className="w-8 h-8 text-gold" />
          </div>
          <h3 className="text-2xl font-light text-primary mb-3">
            Verify your setup
          </h3>
          <p className="text-lg font-light text-primary/70 max-w-md mx-auto">
            Enter the 6-digit code from your authenticator app to complete setup.
          </p>
        </div>

        <div>
          <label className="block text-xs font-light tracking-wide uppercase text-primary/60 mb-3">
            Verification Code
          </label>
          <GlassInput
            type="text"
            value={verificationCode}
            onChange={(e) => {
              // Only allow 6 digits
              const value = e.target.value.replace(/\D/g, '').slice(0, 6);
              setVerificationCode(value);
              if (errors.verification) setErrors({ ...errors, verification: '' });
            }}
            placeholder="000000"
            className="text-2xl font-light text-center tracking-widest"
            maxLength={6}
            error={errors.verification}
          />
          <p className="text-xs font-light text-primary/50 mt-2 text-center">
            Enter the 6-digit code from your authenticator app
          </p>
        </div>

        {/* Backup Codes Preview */}
        {setup2FAData && (
          <div className="glass-subtle p-4 rounded-xl">
            <div className="flex items-center gap-2 mb-3">
              <Shield className="w-4 h-4 text-gold" />
              <p className="text-xs font-light tracking-wide uppercase text-primary/60">
                Backup Codes (Save These)
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              {setup2FAData.backupCodes.slice(0, 4).map((code, index) => (
                <div key={index} className="bg-gray-50 px-2 py-1 rounded">
                  {code}
                </div>
              ))}
            </div>
            <p className="text-xs font-light text-primary/50 mt-2">
              +{setup2FAData.backupCodes.length - 4} more codes (download after verification)
            </p>
          </div>
        )}

        <div className="flex gap-3">
          <GlassButton
            variant="ghost"
            onClick={handleSkip2FA}
            className="flex-1 py-4 font-light"
          >
            Skip for Now
          </GlassButton>
          <GlassButton
            variant="primary"
            goldBorder
            onClick={handle2FAVerification}
            disabled={isLoading || verificationCode.length !== 6}
            className="flex-1 py-4 font-light"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                Verify & Enable
                <CheckCircle size={18} className="ml-2" />
              </>
            )}
          </GlassButton>
        </div>
      </div>
    </motion.div>
  );

  const renderCompleteStep = () => (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-center space-y-6"
    >
      <div className="w-20 h-20 glass-subtle rounded-full flex items-center justify-center mx-auto">
        <CheckCircle className="w-10 h-10 text-gold" />
      </div>
      
      <h3 className="text-2xl font-light text-primary">
        Security setup complete
      </h3>
      
      <p className="text-lg font-light text-primary/70 max-w-md mx-auto">
        {enable2FA 
          ? 'Your account is now protected with two-factor authentication.'
          : 'You can always enable two-factor authentication later in settings.'
        }
      </p>

      <GlassButton
        variant="primary"
        goldBorder
        onClick={handleComplete}
        className="min-w-[280px] py-4 font-light"
      >
        Continue to Financial Setup
        <Icon name="arrowRight" size="sm" className="ml-2" />
      </GlassButton>
    </motion.div>
  );

  return (
    <div className="max-w-2xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12"
      >
        <div className="w-16 h-16 glass-subtle rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Shield className="w-8 h-8 text-gold" />
        </div>
        <h2 className="text-3xl font-light text-primary mb-4">
          Secure your account
        </h2>
        <p className="text-lg font-light text-primary/70 max-w-md mx-auto">
          Premium security features to protect your financial data.
        </p>
      </motion.div>

      <GlassContainer className="p-8 md:p-10 bg-gradient-to-br from-white via-white to-gold/5" goldBorder>
        <AnimatePresence mode="wait">
          {step === 'password' && renderPasswordStep()}
          {step === '2fa-setup' && render2FASetupStep()}
          {step === '2fa-verify' && render2FAVerifyStep()}
          {step === 'complete' && renderCompleteStep()}
        </AnimatePresence>

        {/* Back button (only show on password step) */}
        {step === 'password' && (
          <div className="flex justify-start mt-8">
            <GlassButton
              variant="ghost"
              onClick={onBack}
              className="font-light"
            >
              <Icon name="arrowLeft" size="sm" className="mr-2" />
              Back
            </GlassButton>
          </div>
        )}
      </GlassContainer>
    </div>
  );
}
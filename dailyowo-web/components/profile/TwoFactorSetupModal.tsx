'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Shield, 
  Smartphone, 
  Copy, 
  CheckCircle, 
  AlertTriangle,
  Download,
  RefreshCw,
  HelpCircle,
  Clock
} from 'lucide-react';
import { GlassContainer } from '@/components/ui/GlassContainer';
import { GlassButton } from '@/components/ui/GlassButton';
import QRCode from 'qrcode';
import { twoFactorService } from '@/lib/firebase/two-factor-service';
import { userProfileService } from '@/lib/firebase/user-profile-service';

interface TwoFactorSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  userUid: string;
  userEmail: string;
  onSetupComplete: () => void;
}

interface SetupData {
  secret: string;
  qrCodeURL: string;
  backupCodes: string[];
}

export function TwoFactorSetupModal({ 
  isOpen, 
  onClose, 
  userUid, 
  userEmail,
  onSetupComplete 
}: TwoFactorSetupModalProps) {
  const [step, setStep] = useState<'setup' | 'verify' | 'backup' | 'complete'>('setup');
  const [setupData, setSetupData] = useState<SetupData | null>(null);
  const [qrCodeDataURL, setQrCodeDataURL] = useState<string>('');
  const [verificationCode, setVerificationCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const startSetup = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const { secret, qrCodeURL, backupCodes } = await twoFactorService.setup2FA(userUid, userEmail);
      setSetupData({ secret, qrCodeURL, backupCodes });
      
      // Generate QR code image
      const qrDataURL = await QRCode.toDataURL(qrCodeURL, {
        width: 256,
        margin: 2,
        color: {
          dark: '#1a1a2e',
          light: '#ffffff'
        }
      });
      setQrCodeDataURL(qrDataURL);
      
      setStep('verify');
    } catch (err) {
      console.error('Error setting up 2FA:', err);
      setError('Failed to setup 2FA. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const verifySetup = async () => {
    if (!setupData || !verificationCode) {
      setError('Please enter the verification code');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      await twoFactorService.enable2FA(userUid, verificationCode);
      
      await userProfileService.update2FAStatus(userUid, true);
      setStep('backup');
      
    } catch (err: any) {
      console.error('Error verifying 2FA:', err);
      if (err.message?.includes('Invalid verification code')) {
        setError('Invalid verification code. Please check your authenticator app and try again.');
      } else if (err.message?.includes('2FA not set up')) {
        setError('2FA setup was not found. Please restart the setup process.');
      } else {
        setError('Verification failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const completeSetup = () => {
    setStep('complete');
    setTimeout(() => {
      onSetupComplete();
      onClose();
      resetModal();
    }, 2000);
  };

  const resetModal = () => {
    setStep('setup');
    setSetupData(null);
    setQrCodeDataURL('');
    setVerificationCode('');
    setError(null);
    setCopied(null);
  };

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(type);
      setTimeout(() => setCopied(null), 2000);
    } catch (err) {
      setError('Failed to copy to clipboard');
    }
  };

  const downloadBackupCodes = () => {
    if (!setupData) return;
    
    const content = `DailyOwo Two-Factor Authentication Backup Codes
Generated: ${new Date().toLocaleString()}

These codes can be used to access your account if you lose your authenticator device.
Each code can only be used once. Store them in a safe place.

${setupData.backupCodes.map((code, index) => `${index + 1}. ${code}`).join('\n')}

Keep these codes secure and do not share them with anyone.`;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'dailyowo-backup-codes.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-md"
        >
          <GlassContainer className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center">
                  <Shield className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-primary">Two-Factor Authentication</h2>
                  <p className="text-sm text-primary/60">
                    {step === 'setup' && 'Secure your account'}
                    {step === 'verify' && 'Scan QR code'}
                    {step === 'backup' && 'Save backup codes'}
                    {step === 'complete' && 'Setup complete!'}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-primary/5 rounded-xl transition-colors"
              >
                <X className="w-5 h-5 text-primary/60" />
              </button>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2"
              >
                <AlertTriangle className="w-4 h-4 text-red-600" />
                <span className="text-sm text-red-700">{error}</span>
              </motion.div>
            )}

            <AnimatePresence mode="wait">
              {step === 'setup' && (
                <motion.div
                  key="setup"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Smartphone className="w-8 h-8 text-blue-600" />
                    </div>
                    <h3 className="text-lg font-medium text-primary mb-2">Enable Two-Factor Authentication</h3>
                    <p className="text-sm text-primary/60">
                      Add an extra layer of security to your account using an authenticator app.
                    </p>
                  </div>

                  <div className="space-y-4 mb-6">
                    <div className="p-4 glass-subtle rounded-xl">
                      <h4 className="font-medium text-primary mb-2">What you'll need:</h4>
                      <ul className="text-sm text-primary/60 space-y-1">
                        <li>• An authenticator app (Google Authenticator, Authy, etc.)</li>
                        <li>• Your mobile device with a camera</li>
                        <li>• A safe place to store backup codes</li>
                      </ul>
                    </div>
                  </div>

                  <GlassButton
                    onClick={startSetup}
                    variant="primary"
                    className="w-full"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <div className="flex items-center gap-2">
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Setting up...
                      </div>
                    ) : (
                      'Continue'
                    )}
                  </GlassButton>
                </motion.div>
              )}

              {step === 'verify' && setupData && (
                <motion.div
                  key="verify"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <div className="text-center mb-6">
                    <h3 className="text-lg font-medium text-primary mb-2">Scan QR Code</h3>
                    <p className="text-sm text-primary/60">
                      Open your authenticator app and scan this QR code
                    </p>
                  </div>

                  <div className="bg-white p-4 rounded-xl mb-4 flex justify-center">
                    <img 
                      src={qrCodeDataURL} 
                      alt="2FA QR Code" 
                      className="w-48 h-48"
                    />
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-primary mb-2">
                      Or enter this key manually:
                    </label>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 p-3 glass-subtle rounded-xl font-mono text-sm text-primary break-all">
                        {setupData.secret}
                      </div>
                      <GlassButton
                        onClick={() => copyToClipboard(setupData.secret, 'secret')}
                        variant="ghost"
                        size="sm"
                      >
                        {copied === 'secret' ? (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </GlassButton>
                    </div>
                  </div>

                  <div className="mb-6">
                    <label className="block text-sm font-medium text-primary mb-2">
                      Enter the 6-digit code from your authenticator app:
                    </label>
                    <input
                      type="text"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      className="w-full p-3 glass-subtle rounded-xl text-center text-lg font-mono tracking-wider"
                      placeholder="000000"
                      maxLength={6}
                    />
                  </div>

                  {/* Troubleshooting section that appears after failed attempts */}
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="mb-6 p-4 glass-subtle rounded-xl"
                    >
                      <h4 className="font-medium text-primary mb-3 text-sm flex items-center gap-2">
                        <HelpCircle className="w-4 h-4 text-yellow-600" />
                        Troubleshooting Tips
                      </h4>
                      <div className="space-y-2 text-xs text-primary/70">
                        <div className="flex items-start gap-2">
                          <Clock className="w-3 h-3 text-blue-500 mt-0.5 flex-shrink-0" />
                          <span>Make sure your device time is accurate and try a fresh code</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <Smartphone className="w-3 h-3 text-green-500 mt-0.5 flex-shrink-0" />
                          <span>Double-check you scanned the QR code correctly</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <RefreshCw className="w-3 h-3 text-orange-500 mt-0.5 flex-shrink-0" />
                          <span>Enter exactly 6 digits without spaces or dashes</span>
                        </div>
                      </div>
                      <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <p className="text-xs text-yellow-700">
                          <strong>Still not working?</strong> Try manually entering the secret key in your authenticator app instead of scanning the QR code.
                        </p>
                      </div>
                    </motion.div>
                  )}

                  <GlassButton
                    onClick={verifySetup}
                    variant="primary"
                    className="w-full"
                    disabled={isLoading || verificationCode.length !== 6}
                  >
                    {isLoading ? 'Verifying...' : 'Verify & Continue'}
                  </GlassButton>
                </motion.div>
              )}

              {step === 'backup' && setupData && (
                <motion.div
                  key="backup"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-green-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <CheckCircle className="w-8 h-8 text-green-600" />
                    </div>
                    <h3 className="text-lg font-medium text-primary mb-2">Save Your Backup Codes</h3>
                    <p className="text-sm text-primary/60">
                      Store these codes safely. You can use them if you lose access to your authenticator.
                    </p>
                  </div>

                  <div className="p-4 glass-subtle rounded-xl mb-4">
                    <div className="grid grid-cols-2 gap-2 text-sm font-mono">
                      {setupData.backupCodes.map((code, index) => (
                        <div key={index} className="p-2 bg-white/5 rounded text-center">
                          {code}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-3 mb-6">
                    <GlassButton
                      onClick={downloadBackupCodes}
                      variant="secondary"
                      className="flex-1"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </GlassButton>
                    <GlassButton
                      onClick={() => copyToClipboard(setupData.backupCodes.join('\n'), 'backup')}
                      variant="secondary"
                      className="flex-1"
                    >
                      {copied === 'backup' ? (
                        <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                      ) : (
                        <Copy className="w-4 h-4 mr-2" />
                      )}
                      Copy
                    </GlassButton>
                  </div>

                  <GlassButton
                    onClick={completeSetup}
                    variant="primary"
                    className="w-full"
                  >
                    I've Saved My Backup Codes
                  </GlassButton>
                </motion.div>
              )}

              {step === 'complete' && (
                <motion.div
                  key="complete"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-8"
                >
                  <div className="w-16 h-16 bg-green-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="text-lg font-medium text-primary mb-2">Setup Complete!</h3>
                  <p className="text-sm text-primary/60">
                    Two-factor authentication has been enabled for your account.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </GlassContainer>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
} 
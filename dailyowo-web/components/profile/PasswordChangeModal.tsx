'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Lock, 
  Eye, 
  EyeOff, 
  X, 
  CheckCircle, 
  AlertTriangle, 
  Shield,
  Clock
} from 'lucide-react';
import { GlassButton } from '@/components/ui/GlassButton';
import { useAuth } from '@/lib/firebase/auth-context';
import { validatePassword } from '@/lib/utils/validation';

interface PasswordStrengthIndicatorProps {
  password: string;
  strength: number;
}

function PasswordStrengthIndicator({ password, strength }: PasswordStrengthIndicatorProps) {
  const getStrengthColor = (strength: number) => {
    if (strength <= 1) return 'bg-red-500';
    if (strength <= 2) return 'bg-orange-500';
    if (strength <= 3) return 'bg-yellow-500';
    if (strength <= 4) return 'bg-green-500';
    return 'bg-emerald-500';
  };

  const getStrengthText = (strength: number) => {
    if (strength <= 1) return 'Very Weak';
    if (strength <= 2) return 'Weak';
    if (strength <= 3) return 'Fair';
    if (strength <= 4) return 'Good';
    return 'Strong';
  };

  const requirements = [
    { label: 'At least 8 characters', met: password.length >= 8 },
    { label: 'Uppercase letter', met: /[A-Z]/.test(password) },
    { label: 'Lowercase letter', met: /[a-z]/.test(password) },
    { label: 'Number', met: /[0-9]/.test(password) },
    { label: 'Special character', met: /[^A-Za-z0-9]/.test(password) },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-primary/70">Password Strength</span>
        <span className={`text-sm font-medium ${
          strength <= 2 ? 'text-red-600' : 
          strength <= 3 ? 'text-yellow-600' : 
          'text-green-600'
        }`}>
          {getStrengthText(strength)}
        </span>
      </div>
      
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((level) => (
          <div
            key={level}
            className={`h-1 flex-1 rounded-full transition-all ${
              level <= strength ? getStrengthColor(strength) : 'bg-gray-200'
            }`}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-2">
        {requirements.map((req, index) => (
          <div key={index} className="flex items-center gap-2">
            {req.met ? (
              <CheckCircle className="w-3 h-3 text-green-500" />
            ) : (
              <div className="w-3 h-3 rounded-full border border-gray-300" />
            )}
            <span className={`text-xs ${req.met ? 'text-green-600' : 'text-primary/50'}`}>
              {req.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

interface PasswordChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPasswordChanged?: () => void;
}

export function PasswordChangeModal({ isOpen, onClose, onPasswordChanged }: PasswordChangeModalProps) {
  const { changePassword, reauthenticate } = useAuth();
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);
  const [attemptCount, setAttemptCount] = useState(0);
  const [cooldownTime, setCooldownTime] = useState(0);

  // Security: Rate limiting with exponential backoff
  useEffect(() => {
    if (cooldownTime > 0) {
      const timer = setInterval(() => {
        setCooldownTime(prev => Math.max(0, prev - 1));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [cooldownTime]);

  // Clear form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setErrors({});
      setSuccess(false);
      setShowPasswords({ current: false, new: false, confirm: false });
    }
  }, [isOpen]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.currentPassword) {
      newErrors.currentPassword = 'Current password is required';
    }

    const passwordValidation = validatePassword(formData.newPassword);
    if (!passwordValidation.isValid) {
      newErrors.newPassword = passwordValidation.error || 'Invalid password';
    }

    if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (formData.currentPassword === formData.newPassword) {
      newErrors.newPassword = 'New password must be different from current password';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (cooldownTime > 0) {
      setErrors({ submit: `Please wait ${cooldownTime} seconds before trying again` });
      return;
    }

    if (!validateForm()) return;

    setIsSubmitting(true);
    setErrors({});

    try {
      // Step 1: Re-authenticate user with current password for security
      await reauthenticate(formData.currentPassword);
      
      // Step 2: Change password
      await changePassword(formData.newPassword);
      
      // Success
      setSuccess(true);
      
      // Call callback to update password timestamp
      if (onPasswordChanged) {
        onPasswordChanged();
      }
      
      setTimeout(() => {
        onClose();
        setSuccess(false);
      }, 2000);

    } catch (error: any) {
      setAttemptCount(prev => prev + 1);
      
      // Exponential backoff for failed attempts
      const backoffTime = Math.min(300, Math.pow(2, attemptCount) * 5); // Max 5 minutes
      setCooldownTime(backoffTime);

      // Handle specific Firebase errors
      if (error.code === 'auth/wrong-password') {
        setErrors({ currentPassword: 'Current password is incorrect' });
      } else if (error.code === 'auth/too-many-requests') {
        setErrors({ submit: 'Too many failed attempts. Please try again later.' });
        setCooldownTime(300); // 5 minutes cooldown
      } else if (error.code === 'auth/requires-recent-login') {
        setErrors({ submit: 'Please log out and log back in before changing your password' });
      } else {
        setErrors({ submit: 'Failed to change password. Please try again.' });
      }

      console.error('Password change error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const passwordStrength = validatePassword(formData.newPassword).strength || 0;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="glass-container p-6 w-full max-w-lg border border-white/20 shadow-2xl"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gold/10 rounded-xl flex items-center justify-center">
              <Lock className="w-5 h-5 text-gold" />
            </div>
            <div>
              <h3 className="text-xl font-light text-primary">Change Password</h3>
              <p className="text-sm text-primary/60">Update your account password</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-primary/5 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-primary/60" />
          </button>
        </div>

        {success ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-8"
          >
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-primary mb-2">Password Changed!</h4>
            <p className="text-primary/60 text-sm">Your password has been updated successfully.</p>
          </motion.div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Current Password */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-primary">
                Current Password
              </label>
              <div className="relative">
                <input
                  type={showPasswords.current ? 'text' : 'password'}
                  value={formData.currentPassword}
                  onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                  className="glass-input w-full pr-12"
                  placeholder="Enter current password"
                  disabled={isSubmitting || cooldownTime > 0}
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded transition-colors"
                >
                  {showPasswords.current ? <EyeOff className="w-4 h-4 text-primary/60" /> : <Eye className="w-4 h-4 text-primary/60" />}
                </button>
              </div>
              {errors.currentPassword && (
                <p className="text-sm text-red-600">{errors.currentPassword}</p>
              )}
            </div>

            {/* New Password */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-primary">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showPasswords.new ? 'text' : 'password'}
                  value={formData.newPassword}
                  onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                  className="glass-input w-full pr-12"
                  placeholder="Enter new password"
                  disabled={isSubmitting || cooldownTime > 0}
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded transition-colors"
                >
                  {showPasswords.new ? <EyeOff className="w-4 h-4 text-primary/60" /> : <Eye className="w-4 h-4 text-primary/60" />}
                </button>
              </div>
              {errors.newPassword && (
                <p className="text-sm text-red-600">{errors.newPassword}</p>
              )}
              
              {/* Password Strength Indicator */}
              {formData.newPassword && (
                <PasswordStrengthIndicator 
                  password={formData.newPassword} 
                  strength={passwordStrength} 
                />
              )}
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-primary">
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  type={showPasswords.confirm ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className="glass-input w-full pr-12"
                  placeholder="Confirm new password"
                  disabled={isSubmitting || cooldownTime > 0}
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded transition-colors"
                >
                  {showPasswords.confirm ? <EyeOff className="w-4 h-4 text-primary/60" /> : <Eye className="w-4 h-4 text-primary/60" />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-sm text-red-600">{errors.confirmPassword}</p>
              )}
            </div>

            {/* Security Notice */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
              <div className="flex gap-3">
                <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-blue-900 mb-1">Security Notice</h4>
                  <p className="text-xs text-blue-700">
                    After changing your password, you'll remain logged in on this device, but 
                    you'll need to sign in again on other devices.
                  </p>
                </div>
              </div>
            </div>

            {/* Error Messages */}
            {errors.submit && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                <div className="flex gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
                  <p className="text-sm text-red-700">{errors.submit}</p>
                </div>
              </div>
            )}

            {/* Cooldown Timer */}
            {cooldownTime > 0 && (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
                <div className="flex gap-3">
                  <Clock className="w-5 h-5 text-yellow-600 mt-0.5" />
                  <p className="text-sm text-yellow-700">
                    Security cooldown: Please wait {cooldownTime} seconds before trying again.
                  </p>
                </div>
              </div>
            )}

            {/* Submit Buttons */}
            <div className="flex gap-3 pt-4">
              <GlassButton
                type="button"
                onClick={onClose}
                variant="ghost"
                className="flex-1"
                disabled={isSubmitting}
              >
                Cancel
              </GlassButton>
              <GlassButton
                type="submit"
                variant="primary"
                goldBorder
                disabled={isSubmitting || cooldownTime > 0 || passwordStrength < 3}
                className="flex-1"
              >
                {isSubmitting ? 'Changing...' : 'Change Password'}
              </GlassButton>
            </div>
          </form>
        )}
      </motion.div>
    </div>
  );
} 
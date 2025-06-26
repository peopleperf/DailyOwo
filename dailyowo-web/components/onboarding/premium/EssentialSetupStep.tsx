'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { GlassContainer } from '@/components/ui/GlassContainer';
import { GlassButton } from '@/components/ui/GlassButton';
import { GlassInput } from '@/components/ui/GlassInput';
import { Icon } from '@/components/ui/Icon';
import { User, Globe } from 'lucide-react';

interface EssentialSetupStepProps {
  data: any;
  onNext: (data: any) => void;
  onBack: () => void;
}

const REGIONS = [
  { 
    id: 'us', 
    name: 'United States', 
    flag: '🇺🇸', 
    currency: 'USD',
    currencySymbol: '$',
    dateFormat: 'MM/DD/YYYY'
  },
  { 
    id: 'uk', 
    name: 'United Kingdom', 
    flag: '🇬🇧', 
    currency: 'GBP',
    currencySymbol: '£',
    dateFormat: 'DD/MM/YYYY'
  },
  { 
    id: 'eu', 
    name: 'European Union', 
    flag: '🇪🇺', 
    currency: 'EUR',
    currencySymbol: '€',
    dateFormat: 'DD/MM/YYYY'
  },
  { 
    id: 'nigeria', 
    name: 'Nigeria', 
    flag: '🇳🇬', 
    currency: 'NGN',
    currencySymbol: '₦',
    dateFormat: 'DD/MM/YYYY'
  },
  { 
    id: 'south-africa', 
    name: 'South Africa', 
    flag: '🇿🇦', 
    currency: 'ZAR',
    currencySymbol: 'R',
    dateFormat: 'DD/MM/YYYY'
  },
  { 
    id: 'kenya', 
    name: 'Kenya', 
    flag: '🇰🇪', 
    currency: 'KES',
    currencySymbol: 'KSh',
    dateFormat: 'DD/MM/YYYY'
  },
];

export function EssentialSetupStep({ data, onNext, onBack }: EssentialSetupStepProps) {
  const [formData, setFormData] = useState({
    displayName: data.displayName || '',
    region: data.region || '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleContinue = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.displayName.trim()) {
      newErrors.displayName = 'Display name is required';
    }
    if (!formData.region) {
      newErrors.region = 'Please select your region';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const region = REGIONS.find(r => r.id === formData.region);
    onNext({
      ...formData,
      currency: region?.currency,
      currencySymbol: region?.currencySymbol,
      dateFormat: region?.dateFormat,
    });
  };

  return (
    <div className="max-w-2xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12"
      >
        <div className="w-16 h-16 glass-subtle rounded-2xl flex items-center justify-center mx-auto mb-6">
          <User className="w-8 h-8 text-gold" />
        </div>
        <h2 className="text-3xl font-light text-primary mb-4">
          Essential details
        </h2>
        <p className="text-lg font-light text-primary/70 max-w-md mx-auto">
          Let's personalize your financial platform with just the essentials.
        </p>
      </motion.div>

      <GlassContainer className="p-8 md:p-10 bg-gradient-to-br from-white via-white to-gold/5" goldBorder>
        <div className="space-y-8">
          {/* Display Name */}
          <div>
            <label className="block text-xs font-light tracking-wide uppercase text-primary/60 mb-3">
              Display Name
            </label>
            <GlassInput
              type="text"
              value={formData.displayName}
              onChange={(e) => {
                setFormData({ ...formData, displayName: e.target.value });
                if (errors.displayName) setErrors({ ...errors, displayName: '' });
              }}
              placeholder="What should we call you?"
              icon={<User size={18} className="text-primary/40" />}
              className="text-lg font-light"
              error={errors.displayName}
            />
            <p className="text-xs font-light text-primary/50 mt-2">
              This is how you'll appear in the app and to family members
            </p>
          </div>

          {/* Region Selection */}
          <div>
            <label className="block text-xs font-light tracking-wide uppercase text-primary/60 mb-4">
              Currency & Region
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {REGIONS.map((region) => (
                <motion.button
                  key={region.id}
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setFormData({ ...formData, region: region.id });
                    if (errors.region) setErrors({ ...errors, region: '' });
                  }}
                  className={`glass-subtle p-4 rounded-xl border-2 transition-all text-left ${
                    formData.region === region.id
                      ? 'border-gold bg-gold/5 shadow-md'
                      : 'border-transparent hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{region.flag}</span>
                    <div>
                      <div className="font-light text-primary">{region.name}</div>
                      <div className="text-sm font-light text-primary/60">
                        {region.currencySymbol} {region.currency}
                      </div>
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>
            {errors.region && (
              <p className="text-sm font-light text-red-600 mt-2">{errors.region}</p>
            )}
          </div>

          {/* Info note */}
          <div className="glass-subtle p-4 rounded-xl flex items-start gap-3">
            <Globe className="w-5 h-5 text-gold mt-0.5 flex-shrink-0" />
            <div className="text-sm font-light text-primary/70">
              <p className="mb-2">
                More currencies and regions are being added regularly.
              </p>
              <p>
                All financial data is encrypted and stored securely in your region.
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-between mt-10">
          <GlassButton
            variant="ghost"
            onClick={onBack}
            className="font-light"
          >
            <Icon name="arrowLeft" size="sm" className="mr-2" />
            Back
          </GlassButton>
          <GlassButton
            variant="primary"
            goldBorder
            onClick={handleContinue}
            className="font-light"
          >
            Continue
            <Icon name="arrowRight" size="sm" className="ml-2" />
          </GlassButton>
        </div>
      </GlassContainer>
    </div>
  );
}
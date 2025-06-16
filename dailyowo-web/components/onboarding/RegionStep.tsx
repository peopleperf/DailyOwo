'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { GlassContainer } from '@/components/ui/GlassContainer';
import { GlassButton } from '@/components/ui/GlassButton';
import { Icon } from '@/components/ui/Icon';

interface RegionStepProps {
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

export function RegionStep({ data, onNext, onBack }: RegionStepProps) {
  const t = useTranslations('onboarding.region');
  const tCommon = useTranslations('common');
  const [selectedRegion, setSelectedRegion] = useState(data.region || '');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleContinue = () => {
    if (!selectedRegion) {
      setErrors({ region: 'Please select your region' });
      return;
    }

    const region = REGIONS.find(r => r.id === selectedRegion);
    onNext({
      region: selectedRegion,
      currency: region?.currency,
      currencySymbol: region?.currencySymbol,
      dateFormat: region?.dateFormat,
    });
  };

  return (
    <GlassContainer className="p-8 md:p-10">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-primary mb-2">
          {t('title')}
        </h2>
        <p className="text-primary/70">
          {t('subtitle')}
        </p>
      </div>

      {/* Region selection */}
      <div className="mb-8">
        <label className="block text-sm font-medium text-primary mb-4">
          {t('selectRegion')}
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {REGIONS.map((region) => (
            <motion.button
              key={region.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                setSelectedRegion(region.id);
                setErrors({});
              }}
              className={`glass-subtle p-4 rounded-xl border-2 transition-all ${
                selectedRegion === region.id
                  ? 'border-gold bg-gold/5'
                  : 'border-transparent hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{region.flag}</span>
                <div className="text-left">
                  <div className="font-medium text-primary">{region.name}</div>
                  <div className="text-sm text-primary/60">
                    {region.currencySymbol} {region.currency}
                  </div>
                </div>
              </div>
            </motion.button>
          ))}
        </div>
        {errors.region && (
          <p className="text-red-500 text-sm mt-2">{errors.region}</p>
        )}
      </div>

      {/* Language info */}
      <div className="glass-subtle p-4 rounded-xl mb-8 flex items-start gap-3">
        <Icon name="info" size="sm" className="text-gold mt-0.5" />
        <div className="text-sm text-primary/70">
          <p>{t('moreLanguagesComing')}</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-between">
        <GlassButton
          variant="ghost"
          onClick={onBack}
        >
          <Icon name="arrowLeft" size="sm" className="mr-2" />
          {tCommon('back')}
        </GlassButton>
        <GlassButton
          variant="primary"
          goldBorder
          onClick={handleContinue}
        >
          {tCommon('continue')}
          <Icon name="arrowRight" size="sm" className="ml-2" />
        </GlassButton>
      </div>
    </GlassContainer>
  );
} 
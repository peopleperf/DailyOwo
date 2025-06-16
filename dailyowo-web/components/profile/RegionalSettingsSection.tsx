'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Globe, MapPin, Clock, DollarSign } from 'lucide-react';
import { GlassContainer } from '@/components/ui/GlassContainer';
import { GlassButton } from '@/components/ui/GlassButton';
import { CollapsibleCard } from '@/components/ui/CollapsibleCard';
import { useAuth } from '@/lib/firebase/auth-context';

interface RegionalSettings {
  currency: string;
  region: string;
  language: string;
  timezone: string;
  dateFormat: string;
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

const LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
];

export function RegionalSettingsSection() {
  const { userProfile, updateUserProfile } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [settings, setSettings] = useState<RegionalSettings>({
    currency: userProfile?.currency || 'USD',
    region: userProfile?.region || 'us',
    language: userProfile?.language || 'en',
    timezone: userProfile?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
    dateFormat: userProfile?.dateFormat || 'MM/DD/YYYY',
  });

  const handleRegionChange = (regionId: string) => {
    const region = REGIONS.find(r => r.id === regionId);
    if (region) {
      setSettings(prev => ({
        ...prev,
        region: regionId,
        currency: region.currency,
        dateFormat: region.dateFormat,
      }));
    }
  };

  const handleSettingChange = (key: keyof RegionalSettings, value: string) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const saveSettings = async () => {
    setIsSaving(true);
    try {
      await updateUserProfile(settings);
    } catch (error) {
      console.error('Error saving regional settings:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const selectedRegion = REGIONS.find(r => r.id === settings.region);
  const selectedLanguage = LANGUAGES.find(l => l.code === settings.language);

  return (
    <CollapsibleCard
      title="Regional Settings"
      subtitle="Currency, region & language"
      icon={<Globe className="w-5 h-5 text-gold" />}
      defaultExpanded={false}
    >
      <div className="space-y-4">
        {/* Compact Region Selection */}
        <div className="mb-4">
          <label className="block text-xs font-medium text-primary mb-2">
            Region & Currency
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {REGIONS.map((region) => (
              <button
                key={region.id}
                onClick={() => handleRegionChange(region.id)}
                className={`p-2 rounded-lg border transition-all text-left ${
                  settings.region === region.id
                    ? 'border-gold bg-gold/5'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm">{region.flag}</span>
                  <div>
                    <div className="font-medium text-primary text-xs">{region.name}</div>
                    <div className="text-[10px] text-primary/60">
                      {region.currencySymbol} {region.currency}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Compact Language & Timezone Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Language Selection */}
          <div>
            <label className="block text-xs font-medium text-primary mb-1">
              Language
            </label>
            <select
              value={settings.language}
              onChange={(e) => handleSettingChange('language', e.target.value)}
              className="glass-input w-full text-xs py-1"
            >
              {LANGUAGES.map((language) => (
                <option key={language.code} value={language.code}>
                  {language.flag} {language.name}
                </option>
              ))}
            </select>
          </div>

          {/* Timezone */}
          <div>
            <label className="block text-xs font-medium text-primary mb-1">
              Timezone
            </label>
            <select
              value={settings.timezone}
              onChange={(e) => handleSettingChange('timezone', e.target.value)}
              className="glass-input w-full text-xs py-1"
            >
              <option value="UTC">UTC</option>
              <option value="America/New_York">Eastern (US)</option>
              <option value="America/Chicago">Central (US)</option>
              <option value="America/Denver">Mountain (US)</option>
              <option value="America/Los_Angeles">Pacific (US)</option>
              <option value="Europe/London">London</option>
              <option value="Europe/Paris">Paris</option>
              <option value="Europe/Berlin">Berlin</option>
              <option value="Africa/Lagos">Lagos</option>
              <option value="Africa/Johannesburg">Johannesburg</option>
              <option value="Africa/Nairobi">Nairobi</option>
            </select>
          </div>
        </div>

        {/* Compact Preview & Examples */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Preview */}
          <div className="glass-subtle rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="w-3 h-3 text-gold" />
              <span className="text-xs font-medium text-primary">Preview</span>
            </div>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-primary/60">Currency:</span>
                <span className="text-primary font-medium">
                  {selectedRegion?.currencySymbol} {selectedRegion?.currency}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-primary/60">Date:</span>
                <span className="text-primary font-medium">
                  {new Date().toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit'
                  })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-primary/60">Language:</span>
                <span className="text-primary font-medium">
                  {selectedLanguage?.name}
                </span>
              </div>
            </div>
          </div>

          {/* Currency Examples */}
          <div className="glass-subtle rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-3 h-3 text-gold" />
              <span className="text-xs font-medium text-primary">Examples</span>
            </div>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-primary/60">Income:</span>
                <span className="text-gold font-medium">
                  +{selectedRegion?.currencySymbol}5,000
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-primary/60">Expense:</span>
                <span className="text-primary font-medium">
                  -{selectedRegion?.currencySymbol}1,250
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-primary/60">Net Worth:</span>
                <span className="text-primary font-medium">
                  {selectedRegion?.currencySymbol}125,750
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Compact Save Button */}
        <div className="flex justify-end">
          <GlassButton
            variant="primary"
            goldBorder
            size="sm"
            onClick={saveSettings}
            disabled={isSaving}
            className="text-xs"
          >
            {isSaving ? (
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
                Saving...
              </div>
            ) : (
              'Save Settings'
            )}
          </GlassButton>
        </div>
      </div>
    </CollapsibleCard>
  );
} 
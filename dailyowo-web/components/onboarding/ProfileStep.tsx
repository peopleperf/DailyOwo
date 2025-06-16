'use client';

import { useState } from 'react';
import { GlassContainer } from '@/components/ui/GlassContainer';
import { GlassButton } from '@/components/ui/GlassButton';
import { GlassInput } from '@/components/ui/GlassInput';
import { Icon } from '@/components/ui/Icon';

interface ProfileStepProps {
  data: any;
  onNext: (data: any) => void;
  onBack: () => void;
}

export function ProfileStep({ data, onNext, onBack }: ProfileStepProps) {
  const [profile, setProfile] = useState({
    firstName: data.firstName || '',
    lastName: data.lastName || '',
    age: data.age || '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!profile.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }
    
    if (!profile.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }
    
    if (!profile.age || parseInt(profile.age) < 13 || parseInt(profile.age) > 120) {
      newErrors.age = 'Please enter a valid age (13-120)';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleContinue = () => {
    if (validateForm()) {
      onNext(profile);
    }
  };

  const handleChange = (field: keyof typeof profile, value: string) => {
    setProfile(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <GlassContainer className="p-8 md:p-10">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-primary mb-2">
          Let's get to know you
        </h2>
        <p className="text-primary/70">
          This helps us personalize your experience
        </p>
      </div>

      <div className="space-y-6 mb-10">
        {/* Name fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-primary mb-2">
              First Name
            </label>
            <GlassInput
              type="text"
              value={profile.firstName}
              onChange={(e) => handleChange('firstName', e.target.value)}
              placeholder="John"
              error={errors.firstName}
              autoComplete="given-name"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-primary mb-2">
              Last Name
            </label>
            <GlassInput
              type="text"
              value={profile.lastName}
              onChange={(e) => handleChange('lastName', e.target.value)}
              placeholder="Doe"
              error={errors.lastName}
              autoComplete="family-name"
            />
          </div>
        </div>

        {/* Age field */}
        <div>
          <label className="block text-sm font-medium text-primary mb-2">
            Age
          </label>
          <GlassInput
            type="number"
            value={profile.age}
            onChange={(e) => handleChange('age', e.target.value)}
            placeholder="25"
            error={errors.age}
            min="13"
            max="120"
          />
          <p className="text-xs text-primary/50 mt-2">
            We use this to provide age-appropriate financial advice
          </p>
        </div>
      </div>

      {/* Privacy notice */}
      <div className="glass-subtle p-4 rounded-xl mb-8 flex items-start gap-3">
        <Icon name="shield" size="sm" className="text-gold mt-0.5" />
        <div className="text-sm text-primary/70">
          <p className="font-medium text-primary mb-1">Your privacy matters</p>
          <p>
            Your personal information is encrypted and never shared with third parties.
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-between">
        <GlassButton
          variant="ghost"
          onClick={onBack}
        >
          <Icon name="arrowLeft" size="sm" className="mr-2" />
          Back
        </GlassButton>
        <GlassButton
          variant="primary"
          goldBorder
          onClick={handleContinue}
        >
          Continue
          <Icon name="arrowRight" size="sm" className="ml-2" />
        </GlassButton>
      </div>
    </GlassContainer>
  );
} 
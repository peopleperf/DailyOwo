'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Edit3, Save, X } from 'lucide-react';
import { GlassButton } from '@/components/ui/GlassButton';
import { GlassInput } from '@/components/ui/GlassInput';
import { CollapsibleCard } from '@/components/ui/CollapsibleCard';
import { useAuth } from '@/lib/firebase/auth-context';
import { userProfileService } from '@/lib/firebase/user-profile-service';

interface PersonalInfo {
  firstName: string;
  lastName: string;
  age: number | '';
  displayName: string;
  bio: string;
}

export function PersonalInfoSection() {
  const { user, userProfile, updateUserProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState<PersonalInfo>(() => {
    const displayName = userProfile?.displayName || user?.displayName || '';
    const nameParts = displayName.split(' ');
    
    return {
      firstName: userProfile?.firstName || nameParts[0] || '',
      lastName: userProfile?.lastName || nameParts.slice(1).join(' ') || '',
      age: userProfile?.age || '',
      displayName: displayName,
      bio: userProfile?.bio || '',
    };
  });

  const handleInputChange = (field: keyof PersonalInfo, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }

    // Auto-update display name when first/last name changes
    if (field === 'firstName' || field === 'lastName') {
      const firstName = field === 'firstName' ? value : formData.firstName;
      const lastName = field === 'lastName' ? value : formData.lastName;
      setFormData(prev => ({
        ...prev,
        displayName: `${firstName} ${lastName}`.trim()
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }

    if (formData.age && (Number(formData.age) < 13 || Number(formData.age) > 120)) {
      newErrors.age = 'Age must be between 13 and 120';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm() || !user) return;

    setIsSaving(true);
    try {
      // Update both the main profile and userProfile service
      await Promise.all([
        updateUserProfile({
          firstName: formData.firstName,
          lastName: formData.lastName,
          age: formData.age ? Number(formData.age) : undefined,
          displayName: formData.displayName,
          bio: formData.bio,
        }),
        userProfileService.updateUserProfile(user.uid, {
          firstName: formData.firstName,
          lastName: formData.lastName,
          age: formData.age ? Number(formData.age) : undefined,
          displayName: formData.displayName,
          bio: formData.bio,
        })
      ]);
      
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      setErrors({ general: 'Failed to update profile. Please try again.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    // Reset form data to original values
    const displayName = userProfile?.displayName || user?.displayName || '';
    const nameParts = displayName.split(' ');
    
    setFormData({
      firstName: userProfile?.firstName || nameParts[0] || '',
      lastName: userProfile?.lastName || nameParts.slice(1).join(' ') || '',
      age: userProfile?.age || '',
      displayName: displayName,
      bio: userProfile?.bio || '',
    });
    
    setErrors({});
    setIsEditing(false);
  };

  const actionButton = !isEditing ? (
    <GlassButton
      variant="ghost"
      size="sm"
      onClick={() => setIsEditing(true)}
      className="px-4 py-2 font-light"
    >
      <Edit3 className="w-4 h-4 mr-2" />
      Edit
    </GlassButton>
  ) : (
    <div className="flex gap-3">
      <GlassButton
        variant="ghost"
        size="sm"
        onClick={handleCancel}
        disabled={isSaving}
        className="px-4 py-2 font-light"
      >
        <X className="w-4 h-4 mr-2" />
        Cancel
      </GlassButton>
      <GlassButton
        variant="primary"
        goldBorder
        size="sm"
        onClick={handleSave}
        disabled={isSaving}
        className="px-6 py-2 font-light bg-gold text-white"
      >
        {isSaving ? (
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            <span>Saving...</span>
          </div>
        ) : (
          <>
            <Save className="w-4 h-4 mr-2" />
            Save
          </>
        )}
      </GlassButton>
    </div>
  );

  return (
    <div className="glass p-8 rounded-2xl border border-white/20">
      {/* Premium Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 glass rounded-xl flex items-center justify-center">
            <User className="w-5 h-5 text-gold" />
          </div>
          <div>
            <h2 className="text-lg font-light text-primary">Personal Info</h2>
            <p className="text-xs font-light text-primary/40 uppercase tracking-wide">Your Profile Details</p>
          </div>
        </div>
        {actionButton}
      </div>
      
      {/* Error Message */}
      {errors.general && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 bg-red-50/50 border border-red-200/50 rounded-xl"
        >
          <p className="text-sm font-light text-red-600">{errors.general}</p>
        </motion.div>
      )}

      <div className="space-y-6">
        {/* Premium Name Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div>
            <label className="block text-xs font-light text-primary/60 mb-2 uppercase tracking-wide">
              First Name
            </label>
            {isEditing ? (
              <GlassInput
                type="text"
                value={formData.firstName}
                onChange={(e) => handleInputChange('firstName', e.target.value)}
                placeholder="First Name"
                error={errors.firstName}
                autoComplete="given-name"
                className="glass-input font-light py-3"
              />
            ) : (
              <div className="px-4 py-3 glass rounded-xl font-light text-primary">
                {formData.firstName || 'Not set'}
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-light text-primary/60 mb-2 uppercase tracking-wide">
              Last Name
            </label>
            {isEditing ? (
              <GlassInput
                type="text"
                value={formData.lastName}
                onChange={(e) => handleInputChange('lastName', e.target.value)}
                placeholder="Last Name"
                error={errors.lastName}
                autoComplete="family-name"
                className="glass-input font-light py-3"
              />
            ) : (
              <div className="px-4 py-3 glass rounded-xl font-light text-primary">
                {formData.lastName || 'Not set'}
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-light text-primary/60 mb-2 uppercase tracking-wide">
              Age
            </label>
            {isEditing ? (
              <GlassInput
                type="number"
                value={formData.age}
                onChange={(e) => handleInputChange('age', e.target.value)}
                placeholder="Age"
                error={errors.age}
                min="13"
                max="120"
                className="glass-input font-light py-3"
              />
            ) : (
              <div className="px-4 py-3 glass rounded-xl font-light text-primary">
                {formData.age || 'Not set'}
              </div>
            )}
          </div>
        </div>

        {/* Premium Display Name */}
        <div>
          <label className="block text-xs font-light text-primary/60 mb-2 uppercase tracking-wide">
            Full Name
          </label>
          <div className="px-4 py-3 glass rounded-xl font-light text-primary">
            {formData.displayName || 'Not set'}
            <span className="text-xs font-light text-primary/40 block mt-1">
              How you appear to family members
            </span>
          </div>
        </div>

        {/* Premium Bio */}
        {isEditing && (
          <div>
            <label className="block text-xs font-light text-primary/60 mb-2 uppercase tracking-wide">
              Bio (Optional)
            </label>
            <textarea
              value={formData.bio}
              onChange={(e) => handleInputChange('bio', e.target.value)}
              placeholder="Tell us about yourself..."
              className="w-full px-4 py-3 glass rounded-xl focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-all font-light resize-none"
              rows={3}
            />
          </div>
        )}

        {/* Premium Account Info */}
        <div className="border-t border-white/10 pt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-light text-primary/60 mb-2 uppercase tracking-wide">
                Email Address
              </label>
              <div className="px-4 py-3 glass rounded-xl font-light text-primary truncate">
                {user?.email}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-light text-primary/60 mb-2 uppercase tracking-wide">
                  Member Since
                </label>
                <div className="px-4 py-3 glass rounded-xl font-light text-primary">
                  {user?.metadata?.creationTime 
                    ? new Date(user.metadata.creationTime).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long' 
                      })
                    : 'Not available'
                  }
                </div>
              </div>
              <div>
                <label className="block text-xs font-light text-primary/60 mb-2 uppercase tracking-wide">
                  Onboarding Status
                </label>
                <div className="px-4 py-3 glass rounded-xl font-light text-primary">
                  {userProfile?.onboardingCompleted ? 'Completed' : 'Pending'}
                </div>
              </div>
            </div>
          </div>
          
          <p className="text-xs font-light text-primary/40 mt-4">
            Contact support to change your email address
          </p>
        </div>

        {/* Bio Display (when not editing) */}
        {!isEditing && formData.bio && (
          <div>
            <label className="block text-xs font-light text-primary/60 mb-2 uppercase tracking-wide">
              Bio
            </label>
            <div className="px-4 py-3 glass rounded-xl font-light text-primary min-h-[48px]">
              {formData.bio}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 
'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Edit3, Save, X } from 'lucide-react';
import { GlassButton } from '@/components/ui/GlassButton';
import { GlassInput } from '@/components/ui/GlassInput';
import { CollapsibleCard } from '@/components/ui/CollapsibleCard';
import { useAuth } from '@/lib/firebase/auth-context';

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
    if (!validateForm()) return;

    setIsSaving(true);
    try {
      await updateUserProfile({
        firstName: formData.firstName,
        lastName: formData.lastName,
        age: formData.age ? Number(formData.age) : undefined,
        displayName: formData.displayName,
        bio: formData.bio,
      });
      
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
    >
      <Edit3 className="w-3 h-3 mr-1" />
      Edit
    </GlassButton>
  ) : (
    <div className="flex gap-2">
      <GlassButton
        variant="ghost"
        size="sm"
        onClick={handleCancel}
        disabled={isSaving}
      >
        <X className="w-3 h-3 mr-1" />
        Cancel
      </GlassButton>
      <GlassButton
        variant="primary"
        goldBorder
        size="sm"
        onClick={handleSave}
        disabled={isSaving}
      >
        {isSaving ? (
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
            <span className="text-xs">Saving...</span>
          </div>
        ) : (
          <>
            <Save className="w-3 h-3 mr-1" />
            Save
          </>
        )}
      </GlassButton>
    </div>
  );

  return (
    <CollapsibleCard
      title="Personal Information"
      subtitle="Your basic details"
      icon={<User className="w-5 h-5 text-gold" />}
      defaultExpanded={true}
    >
      {/* Action Buttons */}
      <div className="flex justify-end mb-4">
        {actionButton}
      </div>
      
      {/* Error Message */}
      {errors.general && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg"
        >
          <p className="text-xs text-red-600">{errors.general}</p>
        </motion.div>
      )}

      <div className="space-y-4">
        {/* Compact Name Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
          <div>
            <label className="block text-xs font-medium text-primary mb-1">
              First Name
            </label>
            {isEditing ? (
              <GlassInput
                type="text"
                value={formData.firstName}
                onChange={(e) => handleInputChange('firstName', e.target.value)}
                placeholder="John"
                error={errors.firstName}
                autoComplete="given-name"
                className="text-sm py-2"
              />
            ) : (
              <div className="px-3 py-2 bg-gray-50 rounded-lg text-sm text-primary">
                {formData.firstName || 'Not set'}
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-primary mb-1">
              Last Name
            </label>
            {isEditing ? (
              <GlassInput
                type="text"
                value={formData.lastName}
                onChange={(e) => handleInputChange('lastName', e.target.value)}
                placeholder="Doe"
                error={errors.lastName}
                autoComplete="family-name"
                className="text-sm py-2"
              />
            ) : (
              <div className="px-3 py-2 bg-gray-50 rounded-lg text-sm text-primary">
                {formData.lastName || 'Not set'}
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-primary mb-1">
              Age
            </label>
            {isEditing ? (
              <GlassInput
                type="number"
                value={formData.age}
                onChange={(e) => handleInputChange('age', e.target.value)}
                placeholder="25"
                error={errors.age}
                min="13"
                max="120"
                className="text-sm py-2"
              />
            ) : (
              <div className="px-3 py-2 bg-gray-50 rounded-lg text-sm text-primary">
                {formData.age ? `${formData.age} years` : 'Not set'}
              </div>
            )}
          </div>
        </div>

        {/* Display Name (Read-only) */}
        <div>
          <label className="block text-xs font-medium text-primary mb-1">
            Display Name
          </label>
          <div className="px-3 py-2 bg-gray-50 rounded-lg text-sm text-primary/70">
            {formData.displayName || 'Auto-generated from name'}
            <span className="text-xs text-primary/40 block">
              How you appear to family members
            </span>
          </div>
        </div>

        {/* Compact Bio */}
        {isEditing && (
          <div>
            <label className="block text-xs font-medium text-primary mb-1">
              Bio (Optional)
            </label>
            <textarea
              value={formData.bio}
              onChange={(e) => handleInputChange('bio', e.target.value)}
              placeholder="Tell your family about yourself..."
              className="w-full px-3 py-2 bg-white/50 border border-gray-200 rounded-lg focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-all text-sm resize-none"
              rows={2}
            />
          </div>
        )}

        {/* Compact Account Info Row */}
        <div className="border-t border-gray-100 pt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-primary mb-1">
                Email Address
              </label>
              <div className="px-3 py-2 bg-gray-50 rounded-lg text-sm text-primary/70 truncate">
                {user?.email}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-primary mb-1">
                Member Since
              </label>
              <div className="px-3 py-2 bg-gray-50 rounded-lg text-sm text-primary/70">
                {userProfile?.createdAt?.toDate?.()?.toLocaleDateString() || 'Unknown'}
              </div>
            </div>
          </div>
          
          <p className="text-xs text-primary/40 mt-2">
            Contact support to change your email address
          </p>
        </div>

        {/* Bio Display (when not editing) */}
        {!isEditing && formData.bio && (
          <div>
            <label className="block text-xs font-medium text-primary mb-1">
              Bio
            </label>
            <div className="px-3 py-2 bg-gray-50 rounded-lg text-sm text-primary min-h-[40px]">
              {formData.bio}
            </div>
          </div>
        )}
      </div>
    </CollapsibleCard>
  );
} 
'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User } from 'firebase/auth';
import { Camera, Calendar, Mail, Crown, X, Check, Zap } from 'lucide-react';
import { GlassContainer } from '@/components/ui/GlassContainer';
import { GlassButton } from '@/components/ui/GlassButton';
import { UserProfile } from '@/lib/firebase/auth-context';
import { formatDate } from '@/lib/utils/date';

interface ProfileHeaderProps {
  user: User;
  userProfile: UserProfile;
}

// Region mapping for proper display
const REGION_DISPLAY_MAP: Record<string, string> = {
  'us': 'United States',
  'uk': 'United Kingdom', 
  'eu': 'European Union',
  'nigeria': 'Nigeria',
  'south-africa': 'South Africa',
  'kenya': 'Kenya'
};

export function ProfileHeader({ user, userProfile }: ProfileHeaderProps) {
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploadingPhoto(true);
    try {
      // TODO: Implement Firebase Storage upload
      console.log('Uploading photo:', file.name);
      // await uploadProfilePhoto(file);
    } catch (error) {
      console.error('Error uploading photo:', error);
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatRegionDisplay = (regionId: string) => {
    return REGION_DISPLAY_MAP[regionId] || regionId.toUpperCase();
  };

  // Construct display name from firstName and lastName if available
  const getDisplayName = () => {
    if (userProfile.firstName && userProfile.lastName) {
      return `${userProfile.firstName} ${userProfile.lastName}`;
    }
    return userProfile.displayName || user.displayName || 'User';
  };
  
  const displayName = getDisplayName();
  const memberSince = userProfile.createdAt?.toDate?.() || new Date();

  return (
    <>
      <GlassContainer className="p-4 md:p-6 mb-6">
        <div className="flex items-center gap-4">
          {/* Compact Profile Photo */}
          <div className="relative group">
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-full overflow-hidden bg-gradient-to-br from-gold/20 to-primary/20 flex items-center justify-center border-2 border-white/50 shadow-lg">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={displayName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-lg md:text-xl font-light text-primary/80">
                  {getInitials(displayName)}
                </span>
              )}
            </div>
            
            {/* Photo Upload Overlay */}
            <label className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
                disabled={isUploadingPhoto}
              />
              {isUploadingPhoto ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Camera className="w-4 h-4 text-white" />
              )}
            </label>
          </div>

          {/* Compact Profile Info */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <h1 className="text-xl md:text-2xl font-light text-primary">
                {displayName}
              </h1>
              
              {/* Subscription Button */}
              <GlassButton
                onClick={() => setIsSubscriptionModalOpen(true)}
                variant="primary"
                goldBorder
                size="sm"
                className="flex items-center gap-2"
              >
                <Crown className="w-4 h-4" />
                <span className="hidden sm:inline">Premium</span>
              </GlassButton>
            </div>
            
            {/* Compact Info Row */}
            <div className="flex items-center gap-2 text-xs text-primary/60 mb-3">
              <Mail className="w-3 h-3" />
              <span className="truncate">{user.email}</span>
              <span className="text-primary/40">•</span>
              <Calendar className="w-3 h-3" />
              <span>Since {formatDate(memberSince, { year: 'numeric', month: 'short' })}</span>
              <span className="text-primary/40">•</span>
              <span className="text-gold">85% Complete</span>
            </div>

            {/* Compact Stats Grid */}
            <div className="grid grid-cols-4 gap-2">
              <div className="text-center">
                <p className="text-xs font-medium text-primary">
                  {userProfile.currency || 'USD'}
                </p>
                <p className="text-[10px] text-primary/40 uppercase">Currency</p>
              </div>
              
              <div className="text-center">
                <p className="text-xs font-medium text-primary truncate">
                  {formatRegionDisplay(userProfile.region || 'global')}
                </p>
                <p className="text-[10px] text-primary/40 uppercase">Region</p>
              </div>
              
              <div className="text-center">
                <p className="text-xs font-medium text-gold">Active</p>
                <p className="text-[10px] text-primary/40 uppercase">Status</p>
              </div>
              
              <div className="text-center">
                <p className="text-xs font-medium text-primary">Premium</p>
                <p className="text-[10px] text-primary/40 uppercase">Plan</p>
              </div>
            </div>
          </div>
        </div>
      </GlassContainer>

      {/* Subscription Modal */}
      <AnimatePresence>
        {isSubscriptionModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto"
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gold/10 rounded-xl flex items-center justify-center">
                      <Crown className="w-5 h-5 text-gold" />
                    </div>
                    <div>
                      <h2 className="text-xl font-light text-primary">Premium Plan</h2>
                      <p className="text-sm text-primary/60">Unlock advanced features</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsSubscriptionModalOpen(false)}
                    className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
                  >
                    <X className="w-4 h-4 text-gray-600" />
                  </button>
                </div>
              </div>

              {/* Modal Content */}
              <div className="p-6">
                {/* Current Plan */}
                <div className="p-4 bg-gold/5 border border-gold/20 rounded-xl mb-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-primary">Current Plan: Premium</h3>
                      <p className="text-sm text-primary/60">Active until Dec 31, 2024</p>
                    </div>
                    <div className="w-8 h-8 bg-gold/20 rounded-full flex items-center justify-center">
                      <Check className="w-4 h-4 text-gold" />
                    </div>
                  </div>
                </div>

                {/* Features */}
                <div className="space-y-4 mb-6">
                  <h3 className="font-medium text-primary">Premium Features</h3>
                  
                  <div className="space-y-3">
                    {[
                      'Advanced portfolio analytics',
                      'AI-powered financial insights',
                      'Family financial planning',
                      'Unlimited transaction tracking',
                      'Priority customer support',
                      'Advanced security features'
                    ].map((feature, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
                          <Check className="w-3 h-3 text-green-600" />
                        </div>
                        <span className="text-sm text-primary">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Pricing */}
                <div className="space-y-3 mb-6">
                  <h3 className="font-medium text-primary">Subscription Options</h3>
                  
                  <div className="grid gap-3">
                    <div className="p-4 border border-gold/20 rounded-xl bg-gold/5">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-primary">Annual Plan</h4>
                          <p className="text-sm text-primary/60">Save 20%</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-medium text-gold">$99/year</p>
                          <p className="text-xs text-primary/40">$8.25/month</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-4 border border-gray-200 rounded-xl">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-primary">Monthly Plan</h4>
                          <p className="text-sm text-primary/60">Billed monthly</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-medium text-primary">$12/month</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-3">
                  <GlassButton
                    variant="ghost"
                    className="w-full justify-center"
                  >
                    Manage Subscription
                  </GlassButton>
                  
                  <div className="text-center">
                    <p className="text-xs text-primary/40">
                      Cancel anytime • No hidden fees • 30-day money-back guarantee
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
} 
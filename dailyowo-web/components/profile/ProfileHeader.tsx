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
      {/* Clean Profile Header Layout */}
      <div className="w-full">
        {/* Main Profile Section */}
        <div className="flex items-start gap-6 mb-6">
          {/* Profile Photo - Moved away from menu button */}
          <div className="relative group flex-shrink-0">
            <div className="w-20 h-20 rounded-full overflow-hidden bg-gradient-to-br from-gold/20 to-primary/20 flex items-center justify-center border-2 border-white/30 shadow-lg">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={displayName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-xl font-light text-primary/80">
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

          {/* Profile Info */}
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-light text-primary mb-1">
              {displayName}
            </h1>
            
            <p className="text-sm font-light text-primary/60 mb-4">
              {user.email}
            </p>

            {/* Quick Stats in a clean row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="text-left">
                <div className="flex items-center gap-2 text-primary/50 mb-1">
                  <Calendar className="w-4 h-4" />
                  <span className="text-xs font-light tracking-wide uppercase">Member Since</span>
                </div>
                <p className="text-sm font-medium text-primary">
                  {formatDate(memberSince)}
                </p>
              </div>
              
              <div className="text-left">
                <div className="flex items-center gap-2 text-primary/50 mb-1">
                  <Mail className="w-4 h-4" />
                  <span className="text-xs font-light tracking-wide uppercase">Email Status</span>
                </div>
                <p className="text-sm font-medium">
                  {user.emailVerified ? (
                    <span className="text-green-600">Verified</span>
                  ) : (
                    <span className="text-amber-600">Unverified</span>
                  )}
                </p>
              </div>

              <div className="text-left">
                <div className="flex items-center gap-2 text-primary/50 mb-1">
                  <Crown className="w-4 h-4" />
                  <span className="text-xs font-light tracking-wide uppercase">Plan</span>
                </div>
                <p className="text-sm font-medium text-primary">
                  {(userProfile as any)?.subscriptionStatus === 'active' ? (
                    <span className="text-gold">Premium</span>
                  ) : (
                    'Free'
                  )}
                </p>
              </div>

              <div className="text-left">
                <div className="flex items-center gap-2 text-primary/50 mb-1">
                  <Zap className="w-4 h-4" />
                  <span className="text-xs font-light tracking-wide uppercase">Region</span>
                </div>
                <p className="text-sm font-medium text-primary">
                  {formatRegionDisplay(userProfile.region || 'us')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Premium Subscription Modal */}
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
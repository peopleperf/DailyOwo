'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, 
  Key, 
  Monitor, 
  Smartphone, 
  AlertTriangle, 
  CheckCircle, 
  MoreVertical,
  Eye,
  EyeOff,
  Wifi,
  Lock,
  Unlock,
  X,
  LogOut
} from 'lucide-react';
import { GlassContainer } from '@/components/ui/GlassContainer';
import { GlassButton } from '@/components/ui/GlassButton';
import { PasswordChangeModal } from '@/components/profile/PasswordChangeModal';
import { TwoFactorSetupModal } from '@/components/profile/TwoFactorSetupModal';
import { CollapsibleCard } from '@/components/ui/CollapsibleCard';
import { useAuth } from '@/lib/firebase/auth-context';
import { sessionService, UserSession } from '@/lib/firebase/session-service';
import { twoFactorService } from '@/lib/firebase/two-factor-service';
import { userProfileService, UserProfile } from '@/lib/firebase/user-profile-service';

export function SecuritySettingsSection() {
  const { user, logout } = useAuth();
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false);
  const [is2FASetupModalOpen, setIs2FASetupModalOpen] = useState(false);
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isRevoking, setIsRevoking] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);
  const [showDisable2FAModal, setShowDisable2FAModal] = useState(false);
  const [disable2FACode, setDisable2FACode] = useState('');

  // Load real session data and user profile
  useEffect(() => {
    const loadUserDataAndSessions = async () => {
      if (!user) return;
      
      try {
        setIsLoading(true);
        setError(null);
        
        console.log('[SecuritySettings] Loading user data for:', user.uid);
        
        // Check authentication state first
        if (!user || !user.uid) {
          throw new Error('User not properly authenticated');
        }
        
        // Load user profile with detailed error handling
        try {
          console.log('[SecuritySettings] Loading user profile...');
          let profile = await userProfileService.getUserProfile(user.uid);
          console.log('[SecuritySettings] Profile loaded:', profile ? 'success' : 'not found');
          
          // Create profile if it doesn't exist
          if (!profile && user.email && user.displayName) {
            console.log('[SecuritySettings] Creating new profile...');
            await userProfileService.createUserProfile(user.uid, user.email, user.displayName);
            profile = await userProfileService.getUserProfile(user.uid);
          }
          
          setUserProfile(profile);
        } catch (profileError) {
          console.error('[SecuritySettings] Profile loading error:', profileError);
          // Don't fail completely - continue with limited functionality
          console.warn('[SecuritySettings] Continuing without profile data');
          setUserProfile(null);
        }
        
        // Load sessions with detailed error handling
        try {
          console.log('[SecuritySettings] Loading sessions...');
          const userSessions = await sessionService.getActiveSessions(user.uid);
          console.log('[SecuritySettings] Sessions loaded:', userSessions.length);
          setSessions(userSessions);
          
          // Create session if none exist (user just logged in)
          if (userSessions.length === 0) {
            console.log('[SecuritySettings] Creating new session...');
            await sessionService.createSession(user.uid, {});
            // Reload sessions after creation
            const newSessions = await sessionService.getActiveSessions(user.uid);
            setSessions(newSessions);
          }
        } catch (sessionError) {
          console.error('[SecuritySettings] Session loading error:', sessionError);
          // Don't throw here - sessions are not critical for basic profile display
          console.warn('[SecuritySettings] Sessions could not be loaded, continuing without them');
          setSessions([]);
        }
        
        // Check 2FA status with error handling
        try {
          console.log('[SecuritySettings] Checking 2FA status...');
          const twoFAEnabled = await twoFactorService.is2FAEnabled(user.uid);
          setIs2FAEnabled(twoFAEnabled);
          console.log('[SecuritySettings] 2FA status:', twoFAEnabled);
        } catch (twoFAError) {
          console.error('[SecuritySettings] 2FA check error:', twoFAError);
          // Default to false if we can't check
          setIs2FAEnabled(false);
        }
      } catch (err) {
        console.error('Error loading user data and sessions:', err);
        setError('Failed to load account data');
      } finally {
        setIsLoading(false);
      }
    };

    loadUserDataAndSessions();
  }, [user]);

  const formatLastActive = (lastActive: Date) => {
    const now = new Date();
    const diff = now.getTime() - lastActive.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const revokeSession = async (sessionId: string) => {
    if (!user) return;
    
    try {
      setIsRevoking(sessionId);
      await sessionService.revokeSession(user.uid, sessionId);
      
      // Remove from local state
      setSessions(prev => prev.filter(s => s.id !== sessionId));
    } catch (err) {
      console.error('Error revoking session:', err);
      setError('Failed to revoke session');
    } finally {
      setIsRevoking(null);
    }
  };

  const revokeAllOtherSessions = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      // Find current session (most recent one)
      const currentSession = sessions.find(s => 
        Math.abs(s.lastActivity.getTime() - new Date().getTime()) < 5 * 60 * 1000 // Within 5 minutes
      );
      
      await sessionService.revokeAllSessions(user.uid, currentSession?.id);
      
      // Reload sessions
      const userSessions = await sessionService.getActiveSessions(user.uid);
      setSessions(userSessions);
    } catch (err) {
      console.error('Error revoking all sessions:', err);
      setError('Failed to revoke sessions');
    } finally {
      setIsLoading(false);
    }
  };

  const getDeviceIcon = (device: string) => {
    if (device.toLowerCase().includes('iphone') || device.toLowerCase().includes('mobile')) {
      return Smartphone;
    }
    return Monitor;
  };

  const handle2FASetup = () => {
    if (!user || !user.email) return;
    setIs2FASetupModalOpen(true);
  };

  const handle2FASetupComplete = async () => {
    setIs2FAEnabled(true);
    setIs2FASetupModalOpen(false);
    // Reload user profile to get updated 2FA status
    if (user) {
      try {
        const profile = await userProfileService.getUserProfile(user.uid);
        setUserProfile(profile);
        // Refresh 2FA status from the service as well
        const twoFAEnabled = await twoFactorService.is2FAEnabled(user.uid);
        setIs2FAEnabled(twoFAEnabled);
      } catch (error) {
        console.error('Error refreshing profile after 2FA setup:', error);
      }
    }
  };

  const handle2FADisable = () => {
    setShowDisable2FAModal(true);
  };

  const confirmDisable2FA = async () => {
    if (!user || !disable2FACode.trim()) {
      setError('Please enter your verification code');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      // Get current 2FA settings to check if user has backup codes
      const settings = await twoFactorService.get2FASettings(user.uid);
      if (!settings) {
        setError('2FA settings not found');
        return;
      }

      await twoFactorService.disable2FA(user.uid, disable2FACode.trim());
      
      // Update local state
      setIs2FAEnabled(false);
      
      // Update user profile
      await userProfileService.update2FAStatus(user.uid, false);
      
      // Reload profile
      const profile = await userProfileService.getUserProfile(user.uid);
      setUserProfile(profile);
      
      // Close modal and reset
      setShowDisable2FAModal(false);
      setDisable2FACode('');
      
      console.log('2FA successfully disabled');
      
    } catch (error: any) {
      console.error('Error disabling 2FA:', error);
      if (error.message?.includes('Invalid verification code')) {
        setError('Invalid verification code. Please try again.');
      } else {
        setError('Failed to disable 2FA. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const cancelDisable2FA = () => {
    setShowDisable2FAModal(false);
    setDisable2FACode('');
    setError(null);
  };

  const onPasswordChanged = async () => {
    // Update password timestamp when password is changed
    if (user) {
      await userProfileService.updatePasswordChanged(user.uid);
      // Reload user profile
      const profile = await userProfileService.getUserProfile(user.uid);
      setUserProfile(profile);
    }
  };

  return (
    <>
      <CollapsibleCard
        title="Security & Authentication"
        subtitle="Manage your account security"
        icon={<Shield className="w-5 h-5 text-gold" />}
        defaultExpanded={false}
      >
        <div className="space-y-4">
          {/* Compact Security Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Password Card */}
            <div className="p-3 glass-subtle rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Key className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium text-primary">Password</span>
                </div>
                <CheckCircle className="w-4 h-4 text-green-600" />
              </div>
              <p className="text-xs text-primary/60 mb-2">
                {userProfile 
                  ? `Last changed ${userProfileService.formatPasswordAge(userProfile.passwordLastChanged)}`
                  : 'Loading...'
                }
              </p>
              <GlassButton 
                onClick={() => setIsChangePasswordModalOpen(true)}
                variant="ghost"
                size="sm"
                className="w-full text-xs"
              >
                Change Password
              </GlassButton>
            </div>

            {/* 2FA Card */}
            <div className="p-3 glass-subtle rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-primary">Two-Factor Auth</span>
                </div>
                {is2FAEnabled ? (
                  <CheckCircle className="w-4 h-4 text-green-600" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-yellow-600" />
                )}
              </div>
              <p className="text-xs text-primary/60 mb-2">
                {is2FAEnabled ? 'Enabled' : 'Recommended for security'}
              </p>
              <GlassButton 
                onClick={is2FAEnabled ? handle2FADisable : handle2FASetup}
                variant={is2FAEnabled ? "ghost" : "primary"}
                size="sm"
                className="w-full text-xs"
                disabled={isLoading}
              >
                {isLoading ? 'Loading...' : is2FAEnabled ? 'Disable 2FA' : 'Enable 2FA'}
              </GlassButton>
            </div>
          </div>

          {/* Compact Recent Activity */}
          <div className="glass-subtle rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Wifi className="w-4 h-4 text-purple-600" />
                <span className="text-sm font-medium text-primary">Recent Activity</span>
              </div>
              {sessions.length > 1 && (
                <GlassButton 
                  onClick={revokeAllOtherSessions}
                  variant="secondary"
                  size="sm"
                  disabled={isLoading}
                  className="text-xs"
                >
                  Revoke All Others
                </GlassButton>
              )}
            </div>

            {error && (
              <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-xs text-red-700">{error}</p>
              </div>
            )}

            {isLoading ? (
              <div className="flex items-center justify-center py-4">
                <div className="w-4 h-4 border-2 border-gold border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : sessions.length === 0 ? (
              <div className="text-center py-4">
                <div className="w-8 h-8 bg-purple-500/10 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <Wifi className="w-4 h-4 text-purple-600" />
                </div>
                <p className="text-xs text-primary/60">Creating session...</p>
              </div>
            ) : (
              <div className="space-y-2">
                {sessions.slice(0, 3).map((session) => {
                  const DeviceIcon = getDeviceIcon(session.device);
                  const isCurrent = Math.abs(session.lastActivity.getTime() - new Date().getTime()) < 5 * 60 * 1000;
                  
                  return (
                    <div key={session.id} className="p-2 bg-white/50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <DeviceIcon className="w-4 h-4 text-primary/60" />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <p className="text-xs font-medium text-primary truncate">
                                {session.device} - {session.browser}
                              </p>
                              {isCurrent && (
                                <span className="px-1 py-0.5 bg-green-100 text-green-700 text-[10px] rounded">
                                  Current
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-primary/60 truncate">
                              {session.location} • {formatLastActive(session.lastActivity)}
                            </p>
                          </div>
                        </div>
                        {!isCurrent && (
                          <GlassButton
                            onClick={() => revokeSession(session.id)}
                            variant="ghost"
                            size="sm"
                            disabled={isRevoking === session.id}
                            className="text-xs px-2 py-1"
                          >
                            {isRevoking === session.id ? (
                              <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
                            ) : (
                              'Revoke'
                            )}
                          </GlassButton>
                        )}
                      </div>
                    </div>
                  );
                })}
                
                {sessions.length > 3 && (
                  <div className="text-center pt-2">
                    <p className="text-xs text-primary/40">
                      +{sessions.length - 3} more sessions
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Compact Sign Out & Security Tips */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Sign Out Card */}
            <div className="glass-subtle rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <LogOut className="w-4 h-4 text-red-600" />
                <span className="text-sm font-medium text-primary">Sign Out</span>
              </div>
              
              <p className="text-xs text-primary/60 mb-3">
                End your current session safely
              </p>
              
              <GlassButton 
                onClick={logout}
                variant="secondary"
                size="sm"
                className="w-full border-red-200 text-red-700 hover:bg-red-50 text-xs"
              >
                <LogOut className="w-3 h-3 mr-1" />
                Sign Out
              </GlassButton>
              
              <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3 text-yellow-600" />
                  <p className="text-[10px] text-yellow-800">
                    Always sign out on shared devices
                  </p>
                </div>
              </div>
            </div>

            {/* Security Tips Card */}
            <div className="glass-subtle rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <Shield className="w-4 h-4 text-gold" />
                <span className="text-sm font-medium text-primary">Security Tips</span>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Lock className="w-3 h-3 text-gold" />
                  <span className="text-xs text-primary">Use strong passwords</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Eye className="w-3 h-3 text-gold" />
                  <span className="text-xs text-primary">Never share credentials</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Smartphone className="w-3 h-3 text-gold" />
                  <span className="text-xs text-primary">Enable 2FA when available</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Unlock className="w-3 h-3 text-gold" />
                  <span className="text-xs text-primary">Log out from public devices</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CollapsibleCard>

      {/* Password Change Modal */}
      <PasswordChangeModal 
        isOpen={isChangePasswordModalOpen}
        onClose={() => setIsChangePasswordModalOpen(false)}
        onPasswordChanged={onPasswordChanged}
      />

      {/* 2FA Setup Modal */}
      {user && user.email && (
        <TwoFactorSetupModal
          isOpen={is2FASetupModalOpen}
          onClose={() => setIs2FASetupModalOpen(false)}
          userUid={user.uid}
          userEmail={user.email}
          onSetupComplete={handle2FASetupComplete}
        />
      )}

      {/* 2FA Disable Modal */}
      <AnimatePresence>
        {showDisable2FAModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full"
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center">
                      <AlertTriangle className="w-5 h-5 text-red-500" />
                    </div>
                    <div>
                      <h2 className="text-lg font-medium text-primary">Disable Two-Factor Authentication</h2>
                      <p className="text-sm text-primary/60">This will reduce your account security</p>
                    </div>
                  </div>
                  <button
                    onClick={cancelDisable2FA}
                    className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
                  >
                    <X className="w-4 h-4 text-gray-600" />
                  </button>
                </div>
              </div>

              {/* Modal Content */}
              <div className="p-6">
                <div className="mb-6">
                  <div className="p-4 bg-red-50 border border-red-200 rounded-xl mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Shield className="w-4 h-4 text-red-600" />
                      <span className="text-sm font-medium text-red-800">Security Warning</span>
                    </div>
                    <p className="text-sm text-red-700">
                      Disabling 2FA will make your account more vulnerable to unauthorized access. 
                      Only disable if you're experiencing issues with your authenticator app.
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-primary mb-2">
                      Enter verification code to confirm
                    </label>
                    <input
                      type="text"
                      value={disable2FACode}
                      onChange={(e) => setDisable2FACode(e.target.value)}
                      placeholder="6-digit code or backup code"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold text-center text-lg tracking-widest"
                      maxLength={8}
                      autoComplete="off"
                    />
                    <p className="text-xs text-primary/50 mt-1">
                      Enter the 6-digit code from your authenticator app or use a backup code
                    </p>
                  </div>

                  {error && (
                    <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm text-red-600">{error}</p>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <GlassButton
                    variant="ghost"
                    onClick={cancelDisable2FA}
                    className="flex-1"
                    disabled={isLoading}
                  >
                    Cancel
                  </GlassButton>
                  <GlassButton
                    variant="danger"
                    onClick={confirmDisable2FA}
                    className="flex-1"
                    disabled={isLoading || !disable2FACode.trim()}
                  >
                    {isLoading ? 'Disabling...' : 'Disable 2FA'}
                  </GlassButton>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
} 
'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/lib/firebase/auth-context';
import { GlassButton } from '@/components/ui/GlassButton';

export function GlobalSignOut() {
  const { logout } = useAuth();
  const [isVisible, setIsVisible] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Show on Ctrl/Cmd + Shift + L
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'L') {
        e.preventDefault();
        setIsVisible(!isVisible);
      }
      
      // Hide on Escape
      if (e.key === 'Escape') {
        setIsVisible(false);
        setShowConfirmModal(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isVisible]);

  const handleSignOut = () => {
    setShowConfirmModal(true);
  };

  const confirmSignOut = async () => {
    setShowConfirmModal(false);
    setIsVisible(false);
    await logout();
  };

  return (
    <>
      {/* Floating Sign Out Button */}
      <div className="fixed bottom-4 left-4 z-40">
        <div 
          className="relative"
          onMouseEnter={() => setIsVisible(true)}
          onMouseLeave={() => setIsVisible(false)}
        >
          <AnimatePresence>
            {isVisible && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8, x: -20 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.8, x: -20 }}
                className="absolute bottom-0 left-0 mb-1"
              >
                <GlassButton
                  onClick={handleSignOut}
                  variant="secondary"
                  size="sm"
                  className="border-red-200 text-red-700 hover:bg-red-50 shadow-lg backdrop-blur-md"
                >
                  <LogOut className="w-3 h-3 mr-1" />
                  <span className="text-xs">Sign Out</span>
                </GlassButton>
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Hover Area */}
          <div className="w-8 h-8 rounded-full bg-gray-100/50 hover:bg-gray-200/50 flex items-center justify-center transition-colors cursor-pointer">
            <LogOut className="w-3 h-3 text-gray-400" />
          </div>
        </div>
        
        {/* Keyboard Shortcut Hint */}
        <AnimatePresence>
          {isVisible && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute -top-8 left-0 text-[10px] text-gray-400 whitespace-nowrap"
            >
              Ctrl+Shift+L
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showConfirmModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h3 className="font-medium text-primary">Confirm Sign Out</h3>
                  <p className="text-sm text-primary/60">Are you sure you want to sign out?</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-yellow-600" />
                    <div>
                      <p className="text-xs text-yellow-800 font-medium">Security Reminder</p>
                      <p className="text-xs text-yellow-700">
                        Make sure you've saved any important changes
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <GlassButton
                    onClick={() => setShowConfirmModal(false)}
                    variant="ghost"
                    className="flex-1"
                  >
                    Cancel
                  </GlassButton>
                  <GlassButton
                    onClick={confirmSignOut}
                    variant="primary"
                    className="flex-1 bg-red-600 hover:bg-red-700 border-red-600"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
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
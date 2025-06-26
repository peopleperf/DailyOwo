'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { GlassButton } from '@/components/ui/GlassButton';
import { Icon } from '@/components/ui/Icon';

export function Navbar() {
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const navigateTo = (path: string) => {
    router.push(path);
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      <motion.nav 
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
        className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-xl border-b border-gray-200/20 pt-safe"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Logo */}
            <motion.div 
              className="flex items-center gap-3 cursor-pointer"
              onClick={() => navigateTo('/')}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-gold to-gold-light rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-xl md:text-2xl font-light text-white">$</span>
              </div>
              <div className="hidden sm:block">
                <h1 className="text-xl md:text-2xl font-light text-primary">DailyOwo</h1>
                <p className="text-xs font-light text-primary/60 -mt-1">Smart Finance</p>
              </div>
            </motion.div>

            {/* Navigation Links - Desktop */}
            <div className="hidden md:flex items-center gap-8">
              <button 
                onClick={() => router.push('/how-it-works')}
                className="text-sm font-light text-primary/70 hover:text-primary transition-colors"
              >
                How It Works
              </button>
              <button 
                onClick={() => router.push('/pricing')}
                className="text-sm font-light text-primary/70 hover:text-primary transition-colors"
              >
                Pricing
              </button>
              <button 
                onClick={() => router.push('/about')}
                className="text-sm font-light text-primary/70 hover:text-primary transition-colors"
              >
                About
              </button>
            </div>

            {/* Desktop Action Buttons */}
            <div className="hidden md:flex items-center gap-3">
              <GlassButton
                variant="ghost"
                size="sm"
                onClick={() => router.push('/auth/login')}
              >
                Sign In
              </GlassButton>
              <GlassButton
                variant="primary"
                size="sm"
                goldBorder
                onClick={() => router.push('/auth/register')}
              >
                Get Started
              </GlassButton>
            </div>

            {/* Mobile Menu Button */}
            <motion.button
              onClick={toggleMobileMenu}
              className="md:hidden p-3 rounded-xl bg-white/50 backdrop-blur-sm border border-gray-200/50 min-w-[44px] min-h-[44px] flex items-center justify-center"
              whileTap={{ scale: 0.95 }}
            >
              <Icon 
                name={isMobileMenuOpen ? "x" : "menu"} 
                size="sm" 
                className="text-primary" 
              />
            </motion.button>
          </div>
        </div>
      </motion.nav>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 md:hidden"
              onClick={toggleMobileMenu}
            />
            
            {/* Mobile Menu */}
            <motion.div
              initial={{ x: "100%", opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-full w-80 bg-white/95 backdrop-blur-xl border-l border-gray-200/50 z-50 md:hidden pt-safe pb-safe"
            >
              <div className="flex flex-col h-full">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200/50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-gold to-gold-light rounded-xl flex items-center justify-center shadow-lg">
                      <span className="text-xl font-light text-white">$</span>
                    </div>
                    <div>
                      <h2 className="text-lg font-light text-primary">DailyOwo</h2>
                      <p className="text-xs font-light text-primary/60 -mt-1">Smart Finance</p>
                    </div>
                  </div>
                  <button
                    onClick={toggleMobileMenu}
                    className="p-2 rounded-lg hover:bg-gray-100/50 transition-colors"
                  >
                    <Icon name="x" size="sm" className="text-primary" />
                  </button>
                </div>

                {/* Navigation */}
                <div className="flex-1 px-6 py-8">
                  <nav className="space-y-6">
                    <motion.button
                      onClick={() => navigateTo('/how-it-works')}
                      className="flex items-center w-full text-left py-3 px-4 text-lg font-light text-primary hover:bg-gold/5 rounded-xl transition-colors"
                      whileHover={{ x: 4 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Icon name="brain" size="sm" className="mr-3 text-gold" />
                      How It Works
                    </motion.button>
                    
                    <motion.button
                      onClick={() => navigateTo('/pricing')}
                      className="flex items-center w-full text-left py-3 px-4 text-lg font-light text-primary hover:bg-gold/5 rounded-xl transition-colors"
                      whileHover={{ x: 4 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Icon name="credit-card" size="sm" className="mr-3 text-gold" />
                      Pricing
                    </motion.button>
                    
                    <motion.button
                      onClick={() => navigateTo('/about')}
                      className="flex items-center w-full text-left py-3 px-4 text-lg font-light text-primary hover:bg-gold/5 rounded-xl transition-colors"
                      whileHover={{ x: 4 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Icon name="info" size="sm" className="mr-3 text-gold" />
                      About
                    </motion.button>
                  </nav>
                </div>

                {/* Action Buttons */}
                <div className="px-6 pb-8 border-t border-gray-200/50 pt-6">
                  <div className="space-y-3">
                    <GlassButton
                      variant="ghost"
                      fullWidth
                      onClick={() => navigateTo('/auth/login')}
                      className="py-3"
                    >
                      Sign In
                    </GlassButton>
                    <GlassButton
                      variant="primary"
                      fullWidth
                      goldBorder
                      onClick={() => navigateTo('/auth/register')}
                      className="py-3"
                    >
                      Get Started Free
                    </GlassButton>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
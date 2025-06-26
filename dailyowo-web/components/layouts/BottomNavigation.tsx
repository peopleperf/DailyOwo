'use client';

import { usePathname, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  Home, Receipt, Target, TrendingUp, User, Calculator,
  Plus, Wallet, PiggyBank, CreditCard, Building2, Camera, Sparkles
} from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/lib/firebase/auth-context';
import { OwoAIModal } from '@/components/features/OwoAIModal';
import { OwoAIFloatButton } from '@/components/features/OwoAIFloatButton';

interface NavItem {
  id: string;
  label: string;
  icon: any;
  path: string;
}

const navItems: NavItem[] = [
  { id: 'home', label: 'Home', icon: Home, path: '/dashboard' },
  { id: 'transactions', label: 'Transactions', icon: Receipt, path: '/transactions' },
  { id: 'budgets', label: 'Budgets', icon: Calculator, path: '/budgets' },
  { id: 'goals', label: 'Goals', icon: Target, path: '/goals' },
  { id: 'portfolio', label: 'Portfolio', icon: TrendingUp, path: '/portfolio' },
  { id: 'profile', label: 'Profile', icon: User, path: '/profile' },
];

export function BottomNavigation() {
  const pathname = usePathname();
  const router = useRouter();
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [showAIAdvisor, setShowAIAdvisor] = useState(false);
  const { user, loading, userProfile } = useAuth();
  const isPremium = !!userProfile?.aiSettings?.enabled && userProfile?.aiSettings?.features?.insights;
  const userName = userProfile?.firstName || userProfile?.displayName || userProfile?.email?.split('@')[0] || '';
  
  // Get auth state
  let authUser = null;
  let authLoading = false;
  try {
    const auth = useAuth();
    authUser = auth.user;
    authLoading = auth.loading;
  } catch (e) {
    // Auth context not available, don't show navigation
    return null;
  }

  // Remove locale from pathname for comparison
  const currentPath = pathname || '/dashboard';

  const isRouteActive = (route: string): boolean => {
    if (route === '/dashboard' && currentPath === '') return true;
    return currentPath === route;
  };

  const handleNavigation = (path: string) => {
    router.push(path);
  };

  // Don't show bottom nav on auth pages, onboarding, or landing page
  if (!pathname || 
      pathname.includes('/auth/') ||
      pathname.includes('/onboarding') ||
      pathname.includes('/firebase-debug') ||
      pathname.includes('/test-auth') ||
      currentPath === '' ||  // Landing page (root of locale)
      currentPath === '/') {  // Landing page
    return null;
  }

  // Don't show navigation if user is not authenticated
  if (!authUser && !authLoading) {
    return null;
  }

  return (
    <>
      {/* Bottom Navigation Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-30">
        <div className="bg-white/90 backdrop-blur-xl border-t border-gray-100 shadow-lg">
          <div className="relative px-4 pb-safe">
            {/* Navigation Items */}
            <div className="flex items-center justify-between">
              {navItems.slice(0, 3).map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleNavigation(item.path)}
                  className="relative flex flex-col items-center py-3 px-3 min-w-[60px] group flex-1"
                >
                  <div className={`p-2 rounded-xl transition-all ${
                    isRouteActive(item.path) 
                      ? 'bg-primary/10' 
                      : 'group-hover:bg-gray-100'
                  }`}>
                    <item.icon className={`w-5 h-5 transition-colors ${
                      isRouteActive(item.path) 
                        ? 'text-primary' 
                        : 'text-primary/40 group-hover:text-primary/60'
                    }`} />
                  </div>
                  <span className={`text-[10px] mt-1 transition-colors ${
                    isRouteActive(item.path) 
                      ? 'text-primary font-medium' 
                      : 'text-primary/40 font-light'
                  }`}>
                    {item.label}
                  </span>
                  
                  {/* Active Indicator */}
                  {isRouteActive(item.path) && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute top-0 left-0 right-0 mx-auto w-12 h-0.5 bg-gold rounded-full"
                    />
                  )}
                </button>
              ))}

              {/* Center FAB Space */}
              <div className="relative w-20 h-16 flex items-center justify-center">
                {/* FAB Button */}
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowQuickAdd(!showQuickAdd)}
                  className="absolute -top-4 w-16 h-16 bg-gradient-to-br from-gold to-gold-dark rounded-full shadow-xl flex items-center justify-center group transform hover:scale-105 transition-transform"
                >
                  <div className="absolute inset-0 bg-gold/20 rounded-full blur-xl group-hover:blur-2xl transition-all" />
                  <Plus className={`w-7 h-7 text-white relative z-10 transition-transform ${
                    showQuickAdd ? 'rotate-45' : ''
                  }`} />
                </motion.button>
              </div>

              {navItems.slice(3).map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleNavigation(item.path)}
                  className="relative flex flex-col items-center py-3 px-3 min-w-[60px] group flex-1"
                >
                  <div className={`p-2 rounded-xl transition-all ${
                    isRouteActive(item.path) 
                      ? 'bg-primary/10' 
                      : 'group-hover:bg-gray-100'
                  }`}>
                    <item.icon className={`w-5 h-5 transition-colors ${
                      isRouteActive(item.path) 
                        ? 'text-primary' 
                        : 'text-primary/40 group-hover:text-primary/60'
                    }`} />
                  </div>
                  <span className={`text-[10px] mt-1 transition-colors ${
                    isRouteActive(item.path) 
                      ? 'text-primary font-medium' 
                      : 'text-primary/40 font-light'
                  }`}>
                    {item.label}
                  </span>
                  
                  {/* Active Indicator */}
                  {isRouteActive(item.path) && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute top-0 left-0 right-0 mx-auto w-12 h-0.5 bg-gold rounded-full"
                    />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Add Menu */}
      {showQuickAdd && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowQuickAdd(false)}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
          />

          {/* Quick Actions - Refined Premium Design */}
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 w-[340px]"
          >
            <div className="glass-container p-8 rounded-3xl shadow-2xl border border-white/20 bg-white/95">
              <h3 className="text-sm font-light tracking-wide uppercase text-primary/60 mb-6 text-center">Quick Actions</h3>
              
              <div className="grid grid-cols-2 gap-4">
                {/* Income & Expense */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    router.push('/transactions/new?type=income');
                    setShowQuickAdd(false);
                  }}
                  className="glass-subtle p-5 rounded-2xl hover:bg-white/60 transition-all group border border-transparent hover:border-gold/20"
                >
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-green-500/90 to-green-600/90 rounded-xl flex items-center justify-center shadow-sm group-hover:shadow-md transition-all">
                      <TrendingUp className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-xs font-light text-primary">Add Income</span>
                  </div>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    router.push('/transactions/new?type=expense');
                    setShowQuickAdd(false);
                  }}
                  className="glass-subtle p-5 rounded-2xl hover:bg-white/60 transition-all group border border-transparent hover:border-gold/20"
                >
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-red-500/90 to-red-600/90 rounded-xl flex items-center justify-center shadow-sm group-hover:shadow-md transition-all">
                      <Wallet className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-xs font-light text-primary">Add Expense</span>
                  </div>
                </motion.button>

              {/* Scan Receipt & Set Goal */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  router.push('/transactions/new?type=expense&receipt=true');
                  setShowQuickAdd(false);
                }}
                className="glass-subtle p-5 rounded-2xl hover:bg-white/60 transition-all group border border-transparent hover:border-gold/20"
              >
                <div className="flex flex-col items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500/90 to-purple-600/90 rounded-xl flex items-center justify-center shadow-sm group-hover:shadow-md transition-all">
                    <Camera className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-xs font-light text-primary">Scan Receipt</span>
                  </div>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    router.push('/goals');
                    setShowQuickAdd(false);
                  }}
                  className="glass-subtle p-5 rounded-2xl hover:bg-white/60 transition-all group border border-transparent hover:border-gold/20"
                >
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500/90 to-blue-600/90 rounded-xl flex items-center justify-center shadow-sm group-hover:shadow-md transition-all">
                      <Target className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-xs font-light text-primary">Set Goal</span>
                  </div>
                </motion.button>

                {/* Assets & Liabilities via Transactions */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    router.push('/transactions/new?type=asset');
                    setShowQuickAdd(false);
                  }}
                  className="glass-subtle p-5 rounded-2xl hover:bg-white/60 transition-all group border border-transparent hover:border-gold/20"
                >
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-emerald-500/90 to-emerald-600/90 rounded-xl flex items-center justify-center shadow-sm group-hover:shadow-md transition-all">
                      <PiggyBank className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-xs font-light text-primary">Add Asset</span>
                  </div>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    router.push('/transactions/new?type=liability');
                    setShowQuickAdd(false);
                  }}
                  className="glass-subtle p-5 rounded-2xl hover:bg-white/60 transition-all group border border-transparent hover:border-gold/20"
                >
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-orange-500/90 to-orange-600/90 rounded-xl flex items-center justify-center shadow-sm group-hover:shadow-md transition-all">
                      <CreditCard className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-xs font-light text-primary">Add Debt</span>
                  </div>
                </motion.button>

                {/* AI Financial Advisor */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setShowQuickAdd(false);
                    setShowAIAdvisor(true);
                  }}
                  className="glass-subtle p-5 rounded-2xl hover:bg-white/60 transition-all group border border-transparent hover:border-gold/20"
                >
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-pink-500/90 to-pink-600/90 rounded-xl flex items-center justify-center shadow-sm group-hover:shadow-md transition-all">
                      <Sparkles className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-xs font-light text-primary">AI Financial Advisor</span>
                  </div>
                </motion.button>

              </div>
            </div>
          </motion.div>
        </>
      )}

      {/* AI Financial Advisor Modal */}
      <OwoAIFloatButton
        onClick={() => setShowAIAdvisor(true)}
        isPremium={!!isPremium}
        isLoggedIn={!!user}
      />
      <OwoAIModal
        isOpen={showAIAdvisor}
        onClose={() => setShowAIAdvisor(false)}
        isPremium={!!isPremium}
        userName={userName}
      />

      {/* Add padding to main content to account for bottom nav */}
      <style jsx global>{`
        main {
          padding-bottom: 80px !important;
        }
        
        .pb-safe {
          padding-bottom: env(safe-area-inset-bottom);
        }
        
        .glass-container {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(20px) saturate(180%);
          -webkit-backdrop-filter: blur(20px) saturate(180%);
        }
        
        .glass-subtle {
          background: rgba(255, 255, 255, 0.6);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          border: 1px solid rgba(229, 229, 229, 0.3);
        }
      `}</style>
    </>
  );
}
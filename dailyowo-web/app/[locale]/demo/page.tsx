'use client';

import { useState } from 'react';
import { Container } from '@/components/layouts/Container';
import { Grid, GridItem } from '@/components/layouts/Grid';
import { GlassContainer } from '@/components/ui/GlassContainer';
import { GlassButton } from '@/components/ui/GlassButton';
import { GlassInput } from '@/components/ui/GlassInput';
import { Skeleton, CardSkeleton, TransactionSkeleton, DashboardSkeleton } from '@/components/ui/Skeleton';
import { Loader, PageLoader } from '@/components/ui/Loader';
import { motion } from 'framer-motion';
import { staggerContainer, staggerItem, fadeInUp } from '@/lib/utils/animations';
import { User, Lock, Mail, Search, DollarSign } from 'lucide-react';
import { Icon } from '@/components/ui/Icon';
import { useRouter } from 'next/navigation';

export default function DemoPage() {
  const router = useRouter();
  const [showPageLoader, setShowPageLoader] = useState(false);
  const [showDashboardSkeleton, setShowDashboardSkeleton] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    amount: '',
  });

  return (
    <>
      {/* Page Loader Demo */}
      {showPageLoader && <PageLoader progress={75} />}

      <div className="min-h-screen bg-white relative">
        {/* Background pattern for glass effect visibility */}
        <div className="fixed inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-br from-gray-50 via-white to-gray-50" />
          <div className="absolute top-0 -left-4 w-72 h-72 bg-gold/5 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob" />
          <div className="absolute top-0 -right-4 w-72 h-72 bg-primary/5 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000" />
          <div className="absolute -bottom-8 left-20 w-72 h-72 bg-gold/5 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000" />
        </div>

        <Container size="lg" className="py-8 space-y-8 relative">
          {/* Header */}
          <motion.div {...fadeInUp} className="text-center space-y-2">
            <h1 className="text-3xl font-bold text-gradient">Component Demo</h1>
            <p className="text-primary/70">Premium glassmorphic components with Apple-like design</p>
          </motion.div>

          {/* Grid System Demo */}
          <motion.section variants={staggerContainer} initial="initial" animate="animate" className="space-y-4">
            <h2 className="text-xl font-semibold text-primary">Responsive Grid</h2>
            <Grid cols={{ default: 1, sm: 2, md: 3, lg: 4 }} gap="md">
              {[1, 2, 3, 4].map((item) => (
                <motion.div key={item} variants={staggerItem}>
                  <GlassContainer className="p-4 text-center" goldBorder glowAnimation>
                    <div className="text-2xl font-bold text-gradient-gold mb-2">{item}</div>
                    <p className="text-sm text-primary/70">Grid Item</p>
                  </GlassContainer>
                </motion.div>
              ))}
            </Grid>
          </motion.section>

          {/* Glass Containers */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-primary">Glass Containers (Pure Glass Effect)</h2>
            <Grid cols={{ default: 1, md: 3 }} gap="md">
              <GlassContainer variant="default" className="p-6">
                <h3 className="font-semibold mb-2 text-primary">Default Glass</h3>
                <p className="text-sm text-primary/70">Clean glassmorphic effect with white base</p>
              </GlassContainer>
              <GlassContainer variant="dark" className="p-6">
                <h3 className="font-semibold mb-2 text-primary">Dark Glass</h3>
                <p className="text-sm text-primary/70">Slightly darker variant for contrast</p>
              </GlassContainer>
              <GlassContainer variant="light" goldBorder glowAnimation className="p-6">
                <h3 className="font-semibold mb-2 text-primary">Light Glass + Gold Border</h3>
                <p className="text-sm text-primary/70">With animated gold border effect</p>
              </GlassContainer>
            </Grid>
          </section>

          {/* Buttons */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-primary">Buttons (44px Touch Target)</h2>
            <div className="flex flex-wrap gap-3">
              <GlassButton variant="primary">Primary</GlassButton>
              <GlassButton variant="primary" goldBorder>Primary + Gold</GlassButton>
              <GlassButton variant="secondary">Secondary Glass</GlassButton>
              <GlassButton variant="secondary" goldBorder>Secondary + Gold</GlassButton>
              <GlassButton variant="gold">Gold Premium</GlassButton>
              <GlassButton variant="ghost">Ghost</GlassButton>
              <GlassButton variant="danger">Danger</GlassButton>
              <GlassButton size="sm">Small</GlassButton>
              <GlassButton size="lg">Large</GlassButton>
              <GlassButton disabled>Disabled</GlassButton>
              <GlassButton loading>Loading</GlassButton>
            </div>
          </section>

          {/* Inputs */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-primary">Glass Inputs (Mobile Optimized)</h2>
            <Grid cols={{ default: 1, md: 2 }} gap="md">
              <GlassInput
                label="Email"
                type="email"
                placeholder="Enter your email"
                icon={<Mail size={18} />}
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
              <GlassInput
                label="Password"
                type="password"
                placeholder="Enter password"
                icon={<Lock size={18} />}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
              <GlassInput
                label="Amount"
                type="number"
                placeholder="0.00"
                icon={<DollarSign size={18} />}
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              />
              <GlassInput
                label="Search (with error)"
                placeholder="Search transactions..."
                icon={<Search size={18} />}
                error="This is an error message"
              />
              <GlassInput
                label="Gold Border Input"
                placeholder="Premium input style"
              />
            </Grid>
          </section>

          {/* Loaders */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-primary">Loading States</h2>
            <Grid cols={{ default: 2, md: 4 }} gap="md">
              <GlassContainer className="p-6 flex flex-col items-center gap-2">
                <Loader size="sm" />
                <span className="text-xs text-primary/70">Small</span>
              </GlassContainer>
              <GlassContainer className="p-6 flex flex-col items-center gap-2">
                <Loader size="md" />
                <span className="text-xs text-primary/70">Medium</span>
              </GlassContainer>
              <GlassContainer className="p-6 flex flex-col items-center gap-2">
                <Loader size="lg" variant="gold" />
                <span className="text-xs text-primary/70">Large Gold</span>
              </GlassContainer>
              <GlassContainer className="p-6 flex flex-col items-center gap-2">
                <Loader text="Loading..." />
                <span className="text-xs text-primary/70">With Text</span>
              </GlassContainer>
            </Grid>
            
            <div className="flex gap-3">
              <GlassButton onClick={() => setShowPageLoader(true)} goldBorder>
                Show Page Loader
              </GlassButton>
              {showPageLoader && (
                <GlassButton variant="ghost" onClick={() => setShowPageLoader(false)}>
                  Hide Page Loader
                </GlassButton>
              )}
            </div>
          </section>

          {/* Skeletons */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-primary">Skeleton Loading</h2>
            
            <div className="space-y-4">
              <GlassContainer className="p-4 space-y-3">
                <Skeleton width="60%" height={20} />
                <Skeleton width="100%" height={16} />
                <Skeleton width="80%" height={16} />
              </GlassContainer>

              <Grid cols={{ default: 1, md: 2 }} gap="md">
                <GlassContainer goldBorder>
                  <CardSkeleton />
                </GlassContainer>
                <GlassContainer className="space-y-1">
                  <TransactionSkeleton />
                  <TransactionSkeleton />
                </GlassContainer>
              </Grid>

              <div>
                <GlassButton 
                  onClick={() => setShowDashboardSkeleton(!showDashboardSkeleton)}
                  className="mb-4"
                  goldBorder
                >
                  Toggle Dashboard Skeleton
                </GlassButton>
                {showDashboardSkeleton && (
                  <GlassContainer variant="dark" className="max-w-md mx-auto">
                    <DashboardSkeleton />
                  </GlassContainer>
                )}
              </div>
            </div>
          </section>

          {/* Mobile-First Features */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-primary">Premium Design Features</h2>
            <GlassContainer className="p-6 space-y-4" goldBorder glowAnimation>
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-gold animate-pulse" />
                <span className="text-primary">Pure glass effect (no blue tint)</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-gold animate-pulse" />
                <span className="text-primary">White background for clean aesthetic</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-gold animate-pulse" />
                <span className="text-primary">Navy blue (#262659) as primary color</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-gold animate-pulse" />
                <span className="text-primary">Gold (#A67C00) accent borders</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-gold animate-pulse" />
                <span className="text-primary">Animated gold border glow effect</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-gold animate-pulse" />
                <span className="text-primary">Apple-inspired glassmorphism</span>
              </div>
            </GlassContainer>
          </section>

          {/* Color Palette */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-primary">Color Palette</h2>
            <Grid cols={{ default: 2, md: 4 }} gap="md">
              <GlassContainer className="p-4 text-center">
                <div className="w-full h-20 rounded-lg bg-white mb-2 border" />
                <p className="text-sm font-medium">Background</p>
                <p className="text-xs text-primary/70">#FFFFFF</p>
              </GlassContainer>
              <GlassContainer className="p-4 text-center">
                <div className="w-full h-20 rounded-lg bg-primary mb-2" />
                <p className="text-sm font-medium">Primary</p>
                <p className="text-xs text-primary/70">#262659</p>
              </GlassContainer>
              <GlassContainer className="p-4 text-center">
                <div className="w-full h-20 rounded-lg bg-primary-light mb-2" />
                <p className="text-sm font-medium">Primary Light</p>
                <p className="text-xs text-primary/70">#3D3D73</p>
              </GlassContainer>
              <GlassContainer className="p-4 text-center">
                <div className="w-full h-20 rounded-lg bg-gold mb-2" />
                <p className="text-sm font-medium">Gold</p>
                <p className="text-xs text-primary/70">#A67C00</p>
              </GlassContainer>
            </Grid>
          </section>

          {/* Typography System */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-primary">Typography System</h2>
            <GlassContainer className="p-6 space-y-4">
              <div className="space-y-2">
                <p className="text-caption text-primary/50">Display</p>
                <h1 className="text-display">Beautiful Finance</h1>
              </div>
              <div className="space-y-2">
                <p className="text-caption text-primary/50">Headings</p>
                <h1>Heading 1 - DailyOwo Premium</h1>
                <h2>Heading 2 - Financial Freedom</h2>
                <h3>Heading 3 - Smart Budgeting</h3>
                <h4>Heading 4 - Track Expenses</h4>
                <h5>Heading 5 - Investment Goals</h5>
                <h6>Heading 6 - Monthly Reports</h6>
              </div>
              <div className="space-y-2">
                <p className="text-caption text-primary/50">Body Text</p>
                <p className="text-body-lg">Large body text for important content and introductions.</p>
                <p className="text-body">Regular body text for general content and descriptions throughout the app.</p>
                <p className="text-body-sm">Small body text for secondary information and helper text.</p>
              </div>
              <div className="space-y-2">
                <p className="text-caption text-primary/50">Special Styles</p>
                <p className="text-caption">CAPTION TEXT FOR LABELS</p>
                <p className="text-overline">OVERLINE TEXT</p>
                <p className="text-quote">"Your financial journey starts with a single step."</p>
              </div>
            </GlassContainer>
          </section>

          {/* Icon System */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-primary">Icon System</h2>
            <GlassContainer className="p-6 space-y-6">
              <div>
                <p className="text-caption text-primary/50 mb-3">Sizes</p>
                <div className="flex items-center gap-4 flex-wrap">
                  {(['xs', 'sm', 'md', 'lg', 'xl', '2xl'] as const).map((size) => (
                    <GlassContainer 
                      key={size} 
                      variant="light" 
                      className="p-4 text-center hover:scale-105 transition-transform"
                    >
                      <Icon name="wallet" size={size} className="text-gold mx-auto mb-2" />
                      <p className="text-xs font-medium">{size}</p>
                    </GlassContainer>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-caption text-primary/50 mb-3">Finance Icons</p>
                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-12 gap-3">
                  {['dollar', 'euro', 'pound', 'wallet', 'creditCard', 'cash', 'receipt', 'calculator', 'piggyBank', 'trendingUp', 'trendingDown', 'barChart'].map((icon) => (
                    <motion.div
                      key={icon}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="text-center"
                    >
                      <div className="glass-subtle p-3 rounded-xl mb-1 hover:bg-white/40 transition-colors cursor-pointer">
                        <Icon 
                          name={icon} 
                          size="lg" 
                          className="text-gold mx-auto" 
                        />
                      </div>
                      <p className="text-[10px] text-primary/70">{icon}</p>
                    </motion.div>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-caption text-primary/50 mb-3">Category Icons</p>
                <div className="grid grid-cols-5 sm:grid-cols-10 gap-3">
                  {['shopping', 'transport', 'housing', 'food', 'health', 'work', 'education', 'travel', 'gift', 'utilities'].map((icon) => (
                    <motion.div
                      key={icon}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="text-center"
                    >
                      <div className="glass-subtle p-3 rounded-xl mb-1 hover:bg-white/50 transition-colors cursor-pointer">
                        <Icon 
                          name={icon} 
                          size="md" 
                          className="text-primary mx-auto" 
                        />
                      </div>
                      <p className="text-[10px] text-primary/70">{icon}</p>
                    </motion.div>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-caption text-primary/50 mb-3">Action Icons</p>
                <div className="flex gap-3 flex-wrap">
                  {['plus', 'edit', 'delete', 'save', 'download', 'share', 'search', 'filter', 'settings'].map((icon) => (
                    <GlassButton 
                      key={icon} 
                      variant="secondary" 
                      size="sm"
                      className="group"
                    >
                      <Icon 
                        name={icon} 
                        size="sm" 
                        className="mr-2 group-hover:scale-110 transition-transform" 
                      />
                      <span className="capitalize">{icon}</span>
                    </GlassButton>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-caption text-primary/50 mb-3">Interactive Examples</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Glass Icon Card */}
                  <GlassContainer goldBorder className="p-6 text-center">
                    <div className="w-16 h-16 glass-subtle rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Icon name="wallet" size="xl" className="text-gold" />
                    </div>
                    <h4 className="font-semibold mb-1">Premium Wallet</h4>
                    <p className="text-sm text-primary/70">Track expenses in style</p>
                  </GlassContainer>

                  {/* Status Icon Examples */}
                  <GlassContainer className="p-6">
                    <h4 className="font-semibold mb-4">Status Icons</h4>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 glass-subtle rounded-lg flex items-center justify-center">
                          <Icon name="check" size="sm" className="text-success" />
                        </div>
                        <span className="text-sm">Success</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 glass-subtle rounded-lg flex items-center justify-center">
                          <Icon name="alert" size="sm" className="text-warning" />
                        </div>
                        <span className="text-sm">Warning</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 glass-subtle rounded-lg flex items-center justify-center">
                          <Icon name="info" size="sm" className="text-info" />
                        </div>
                        <span className="text-sm">Information</span>
                      </div>
                    </div>
                  </GlassContainer>

                  {/* Animated Icon */}
                  <GlassContainer className="p-6 text-center">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                      className="w-16 h-16 glass-subtle rounded-full flex items-center justify-center mx-auto mb-4"
                    >
                      <Icon name="settings" size="xl" className="text-primary" />
                    </motion.div>
                    <h4 className="font-semibold mb-1">Animated Icons</h4>
                    <p className="text-sm text-primary/70">Smooth interactions</p>
                  </GlassContainer>
                </div>
              </div>
            </GlassContainer>
          </section>
        </Container>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="text-center"
        >
          <GlassButton
            variant="primary"
            size="lg"
            goldBorder
            onClick={() => router.push('/auth/register')}
          >
            Start Your Free Trial
            <Icon name="arrowRight" size="sm" className="ml-2" />
          </GlassButton>
        </motion.div>
      </div>
    </>
  );
} 
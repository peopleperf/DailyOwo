'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

import { Navbar } from '@/components/layouts/Navbar';
import { GlassContainer } from '@/components/ui/GlassContainer';
import { GlassButton } from '@/components/ui/GlassButton';
import { Icon } from '@/components/ui/Icon';
import { HowItWorksModal } from '@/components/modals/HowItWorksModal';

import { isFirebaseConfigured, FIREBASE_SETUP_INSTRUCTIONS } from '@/lib/firebase/config';

export default function HomePage() {
  const router = useRouter();
  const firebaseConfigured = isFirebaseConfigured();
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Show setup instructions if Firebase is not configured
  if (!firebaseConfigured) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="pt-20">
          <div className="max-w-4xl mx-auto px-4 py-12">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <GlassContainer className="p-8 md:p-10">
                <div className="text-center mb-8">
                  <div className="w-20 h-20 glass-subtle rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Icon name="settings" size="xl" className="text-gold" />
                  </div>
                  <h1 className="text-3xl font-light text-primary mb-2">Setup Required</h1>
                  <p className="text-primary/70 font-light">Let's set up Firebase for DailyOwo</p>
                </div>

                <div className="prose prose-primary max-w-none">
                  <pre className="bg-primary/5 p-6 rounded-xl overflow-x-auto text-sm font-mono">
                    <code>{FIREBASE_SETUP_INSTRUCTIONS}</code>
                  </pre>
                </div>

                <div className="mt-8 flex justify-center gap-4">
                  <GlassButton 
                    variant="primary" 
                    goldBorder
                    onClick={() => window.open('https://console.firebase.google.com/', '_blank')}
                  >
                    <Icon name="globe" size="sm" className="mr-2" />
                    Open Firebase Console
                  </GlassButton>
                  <GlassButton 
                    variant="ghost"
                    onClick={() => window.location.reload()}
                  >
                    <Icon name="loader" size="sm" className="mr-2" />
                    I've added the config
                  </GlassButton>
                </div>
              </GlassContainer>
            </motion.div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Navbar />
      
      {/* Hero Section 1 - Welcome */}
      <section className="min-h-screen flex items-center justify-center overflow-hidden bg-white pt-20 pt-safe">
        {/* Elegant Background */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-br from-white via-gray-50/20 to-white" />
          <motion.div 
            animate={{ 
              scale: [1, 1.1, 1],
              opacity: [0.3, 0.5, 0.3]
            }}
            transition={{ duration: 8, repeat: Infinity, repeatType: "reverse" }}
            className="absolute top-1/4 -left-32 w-96 h-96 bg-gold/3 rounded-full mix-blend-multiply filter blur-3xl"
          />
          <motion.div 
            animate={{ 
              scale: [1.1, 1, 1.1],
              opacity: [0.4, 0.6, 0.4]
            }}
            transition={{ duration: 10, delay: 2, repeat: Infinity, repeatType: "reverse" }}
            className="absolute bottom-1/4 -right-32 w-96 h-96 bg-primary/3 rounded-full mix-blend-multiply filter blur-3xl"
          />
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            {/* Elegant Logo Icon */}
            <motion.div 
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ duration: 0.8, delay: 0.2, type: "spring", stiffness: 100 }}
              className="inline-flex items-center justify-center w-20 h-20 md:w-24 md:h-24 bg-gradient-to-br from-gold to-gold-light rounded-3xl shadow-2xl mb-8"
            >
              <span className="text-3xl md:text-4xl font-light text-white">$</span>
            </motion.div>

            <motion.h1 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="text-5xl md:text-6xl lg:text-7xl font-light text-primary mb-6 leading-tight"
            >
              Your wealth, <br />
              <span className="text-gold">simplified</span>
            </motion.h1>

            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="text-xl md:text-2xl font-light text-primary/60 mb-12 max-w-2xl mx-auto"
            >
              Smart financial management for the modern world
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.8 }}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            >
              <GlassButton
                variant="primary"
                size="lg"
                goldBorder
                onClick={() => router.push('/auth/register')}
                className="px-10 py-4 text-lg font-light w-full sm:w-auto min-h-[48px]"
              >
                Start Free Today
              </GlassButton>
              <GlassButton
                variant="ghost"
                size="lg"
                onClick={() => setIsModalOpen(true)}
                className="px-10 py-4 text-lg font-light w-full sm:w-auto min-h-[48px]"
              >
                Learn More
              </GlassButton>
            </motion.div>

            {/* Trust indicators */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 1.2 }}
              className="flex items-center justify-center gap-8 mt-16 text-primary/40"
            >
              <div className="flex items-center gap-2">
                <Icon name="shield" size="sm" className="text-gold" />
                <span className="text-sm font-light">Bank-level security</span>
              </div>
              <div className="flex items-center gap-2">
                <Icon name="users" size="sm" className="text-gold" />
                <span className="text-sm font-light">10,000+ users</span>
              </div>
              <div className="flex items-center gap-2">
                <Icon name="star" size="sm" className="text-gold" />
                <span className="text-sm font-light">4.9/5 rating</span>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Hero Section 2 - AI Intelligence */}
      <section className="min-h-screen flex items-center justify-center overflow-hidden bg-gray-50/30 py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            viewport={{ once: true }}
          >
            <motion.div 
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              viewport={{ once: true }}
              className="inline-flex items-center justify-center w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-gold/20 to-primary/20 rounded-2xl backdrop-blur-sm border border-gold/20 mb-8"
            >
              <Icon name="brain" size="xl" className="text-gold" />
            </motion.div>

            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              viewport={{ once: true }}
              className="text-4xl md:text-5xl lg:text-6xl font-light text-primary mb-6 leading-tight"
            >
              Intelligence that <br />
              <span className="text-gold">learns</span>
            </motion.h1>

            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              viewport={{ once: true }}
              className="text-xl md:text-2xl font-light text-primary/60 mb-12 max-w-2xl mx-auto"
            >
              AI-powered insights that understand your unique financial patterns
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              viewport={{ once: true }}
            >
              <GlassButton
                variant="primary"
                size="lg"
                goldBorder
                onClick={() => router.push('/how-it-works/ai-insights')}
                className="px-8 py-4 text-lg font-light"
              >
                Discover AI Features
              </GlassButton>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Hero Section 3 - Complete Control */}
      <section className="min-h-screen flex items-center justify-center overflow-hidden bg-white py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            viewport={{ once: true }}
          >
            <motion.div 
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              viewport={{ once: true }}
              className="inline-flex items-center justify-center w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-gold/20 to-primary/20 rounded-2xl backdrop-blur-sm border border-gold/20 mb-8"
            >
              <Icon name="trending-up" size="xl" className="text-gold" />
            </motion.div>

            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              viewport={{ once: true }}
              className="text-4xl md:text-5xl lg:text-6xl font-light text-primary mb-6 leading-tight"
            >
              Complete <br />
              <span className="text-gold">control</span>
            </motion.h1>

            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              viewport={{ once: true }}
              className="text-xl md:text-2xl font-light text-primary/60 mb-12 max-w-2xl mx-auto"
            >
              Everything you need in one elegant dashboard
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              viewport={{ once: true }}
            >
              <GlassButton
                variant="primary"
                size="lg"
                goldBorder
                onClick={() => router.push('/how-it-works/dashboard')}
                className="px-8 py-4 text-lg font-light"
              >
                Explore Features
              </GlassButton>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Hero Section 4 - Growth Goals */}
      <section className="min-h-screen flex items-center justify-center overflow-hidden bg-gray-50/30 py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            viewport={{ once: true }}
          >
            <motion.div 
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              viewport={{ once: true }}
              className="inline-flex items-center justify-center w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-gold/20 to-primary/20 rounded-2xl backdrop-blur-sm border border-gold/20 mb-8"
            >
              <Icon name="target" size="xl" className="text-gold" />
            </motion.div>

            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              viewport={{ once: true }}
              className="text-4xl md:text-5xl lg:text-6xl font-light text-primary mb-6 leading-tight"
            >
              Goals that <br />
              <span className="text-gold">inspire</span>
            </motion.h1>

            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              viewport={{ once: true }}
              className="text-xl md:text-2xl font-light text-primary/60 mb-12 max-w-2xl mx-auto"
            >
              Smart guidance that helps you achieve more
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              viewport={{ once: true }}
            >
              <GlassButton
                variant="primary"
                size="lg"
                goldBorder
                onClick={() => router.push('/how-it-works/goals')}
                className="px-8 py-4 text-lg font-light"
              >
                Learn About Goals
              </GlassButton>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Hero Section 5 - Final CTA */}
      <section className="min-h-screen flex items-center justify-center overflow-hidden bg-white py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            viewport={{ once: true }}
          >
            <motion.div 
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              viewport={{ once: true }}
              className="inline-flex items-center justify-center w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-gold/20 to-primary/20 rounded-2xl backdrop-blur-sm border border-gold/20 mb-8"
            >
              <Icon name="rocket" size="xl" className="text-gold" />
            </motion.div>

            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              viewport={{ once: true }}
              className="text-4xl md:text-5xl lg:text-6xl font-light text-primary mb-6 leading-tight"
            >
              Ready to <br />
              <span className="text-gold">transform</span>?
            </motion.h1>

            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              viewport={{ once: true }}
              className="text-xl md:text-2xl font-light text-primary/60 mb-12 max-w-2xl mx-auto"
            >
              Join thousands building their financial future with DailyOwo
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              viewport={{ once: true }}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            >
              <GlassButton
                variant="primary"
                size="lg"
                goldBorder
                onClick={() => router.push('/auth/register')}
                className="px-10 py-4 text-lg font-light w-full sm:w-auto"
              >
                Start Your Journey
              </GlassButton>
              <GlassButton
                variant="ghost"
                size="lg"
                onClick={() => router.push('/auth/login')}
                className="px-10 py-4 text-lg font-light w-full sm:w-auto"
              >
                Sign In
              </GlassButton>
            </motion.div>
          </motion.div>
        </div>
      </section>
      
      {/* Footer section */}
      <footer className="bg-gray-50/50 py-16 px-4 pb-safe">
        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <p className="text-sm font-light text-primary/60 mb-4">
              Ready to transform your financial future?
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <GlassButton
                variant="ghost"
                onClick={() => router.push('/auth/login')}
                className="min-h-[48px]"
              >
                Sign In
              </GlassButton>
              <GlassButton
                variant="primary"
                goldBorder
                onClick={() => router.push('/auth/register')}
                className="min-h-[48px]"
              >
                Get Started Free
              </GlassButton>
            </div>
          </motion.div>
        </div>
      </footer>

      {/* How It Works Modal */}
      <HowItWorksModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </>
  );
}
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

import { Navbar } from '@/components/layouts/Navbar';
import { GlassContainer } from '@/components/ui/GlassContainer';
import { GlassButton } from '@/components/ui/GlassButton';
import { Icon } from '@/components/ui/Icon';
import { HowItWorksModal } from '@/components/modals/HowItWorksModal';

export default function HowItWorksPage() {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const features = [
    {
      icon: 'brain',
      title: 'AI-Powered Intelligence',
      description: 'Our smart system learns your spending patterns and provides personalized insights to help you make better financial decisions.'
    },
    {
      icon: 'trending-up',
      title: 'Complete Dashboard',
      description: 'Track your net worth, expenses, and investments all in one beautiful, easy-to-use dashboard.'
    },
    {
      icon: 'target',
      title: 'Smart Goal Setting',
      description: 'Set financial goals and receive intelligent recommendations to achieve them faster than ever before.'
    },
    {
      icon: 'zap',
      title: 'Crypto Trading Alerts',
      description: 'Stay ahead of the crypto market with intelligent trading alerts and portfolio monitoring.'
    },
    {
      icon: 'shield',
      title: 'Bank-Level Security',
      description: 'Your data is protected with enterprise-grade encryption and security measures.'
    }
  ];

  return (
    <>
      <Navbar />
      
      <div className="min-h-screen bg-white pt-20">
        {/* Hero Section */}
        <section className="py-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center justify-center w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-gold to-gold-light rounded-3xl shadow-2xl mb-8">
                <Icon name="lightbulb" size="xl" className="text-white" />
              </div>

              <h1 className="text-5xl md:text-6xl font-light text-primary mb-6 leading-tight">
                How DailyOwo <br />
                <span className="text-gold">works</span>
              </h1>

              <p className="text-xl md:text-2xl font-light text-primary/60 mb-12 max-w-2xl mx-auto">
                Smart financial management made simple and elegant
              </p>
            </motion.div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="py-20 bg-gray-50/30">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  viewport={{ once: true }}
                >
                  <GlassContainer className="p-8 h-full hover:shadow-xl transition-all cursor-pointer" onClick={() => setIsModalOpen(true)}>
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-gold/20 to-primary/20 rounded-xl flex items-center justify-center">
                        <Icon name={feature.icon as any} size="lg" className="text-gold" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-light text-primary mb-3">{feature.title}</h3>
                        <p className="text-primary/70 font-light leading-relaxed mb-4">{feature.description}</p>
                        <div className="flex items-center text-gold text-sm font-light">
                          Learn more <Icon name="arrow-right" size="sm" className="ml-2" />
                        </div>
                      </div>
                    </div>
                  </GlassContainer>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <h2 className="text-4xl md:text-5xl font-light text-primary mb-6">
                Ready to start your <br />
                <span className="text-gold">financial journey</span>?
              </h2>

              <p className="text-xl font-light text-primary/60 mb-12">
                Join thousands who have transformed their financial lives
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <GlassButton
                  variant="primary"
                  size="lg"
                  goldBorder
                  onClick={() => router.push('/auth/register')}
                  className="px-10 py-4 text-lg font-light"
                >
                  Get Started Free
                </GlassButton>
                <GlassButton
                  variant="ghost"
                  size="lg"
                  onClick={() => router.push('/')}
                  className="px-10 py-4 text-lg font-light"
                >
                  Back to Home
                </GlassButton>
              </div>
            </motion.div>
          </div>
        </section>
      </div>

      {/* How It Works Modal */}
      <HowItWorksModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </>
  );
}
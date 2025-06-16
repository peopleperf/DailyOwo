'use client';

import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Container } from '@/components/layouts/Container';
import { GlassContainer } from '@/components/ui/GlassContainer';
import { GlassButton } from '@/components/ui/GlassButton';
import { Icon } from '@/components/ui/Icon';
import { LanguageSelector } from '@/components/ui/LanguageSelector';
import { fadeInUp } from '@/lib/utils/animations';
import { isFirebaseConfigured, FIREBASE_SETUP_INSTRUCTIONS } from '@/lib/firebase/config';

export default function HomePage() {
  const router = useRouter();
  const t = useTranslations();
  const firebaseConfigured = isFirebaseConfigured();

  // Show setup instructions if Firebase is not configured
  if (!firebaseConfigured) {
    return (
      <div className="min-h-screen bg-white">
        {/* Language Selector */}
        <div className="absolute top-6 right-6 z-20">
          <LanguageSelector />
        </div>
        
        <Container size="lg" className="py-12">
          <motion.div {...fadeInUp}>
            <GlassContainer className="p-8 md:p-10">
              <div className="text-center mb-8">
                <div className="w-20 h-20 glass-subtle rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Icon name="settings" size="xl" className="text-gold" />
                </div>
                <h1 className="text-3xl font-bold text-primary mb-2">Setup Required</h1>
                <p className="text-primary/70">Let's set up Firebase for {t('common.appName')}</p>
              </div>

              <div className="prose prose-primary max-w-none">
                <pre className="bg-primary/5 p-6 rounded-xl overflow-x-auto text-sm">
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
        </Container>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white relative">
      {/* Language Selector */}
      <div className="absolute top-6 right-6 z-20">
        <LanguageSelector />
      </div>

      {/* Background pattern */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-50 via-white to-gray-50" />
        <div className="absolute top-0 -left-4 w-72 h-72 bg-gold/5 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob" />
        <div className="absolute top-0 -right-4 w-72 h-72 bg-primary/5 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000" />
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-gold/5 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000" />
      </div>

      <Container size="lg" className="py-12 relative">
        <motion.div {...fadeInUp} className="text-center mb-16">
          <div className="w-32 h-32 glass rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl">
            <span className="text-6xl font-bold text-gradient-gold">D</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-primary mb-4">
            {t('common.appName')}
          </h1>
          <p className="text-xl text-primary/70 mb-8">
            {t('landing.tagline')}
          </p>
          
          <div className="flex gap-4 justify-center">
            <GlassButton 
              variant="primary" 
              size="lg" 
              goldBorder
              onClick={() => router.push('/auth/register')}
            >
              {t('landing.getStarted')}
            </GlassButton>
            <GlassButton 
              variant="ghost" 
              size="lg"
              onClick={() => router.push('/auth/login')}
            >
              {t('landing.signIn')}
            </GlassButton>
          </div>
        </motion.div>

        {/* Features Grid */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          <GlassContainer className="p-6 text-center">
            <div className="w-16 h-16 glass-subtle rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Icon name="wallet" size="xl" className="text-gold" />
            </div>
            <h3 className="text-xl font-semibold text-primary mb-2">{t('landing.features.track.title')}</h3>
            <p className="text-primary/70">{t('landing.features.track.description')}</p>
          </GlassContainer>

          <GlassContainer className="p-6 text-center" goldBorder glowAnimation>
            <div className="w-16 h-16 glass-subtle rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Icon name="ai" size="xl" className="text-gold" />
            </div>
            <h3 className="text-xl font-semibold text-primary mb-2">{t('landing.features.ai.title')}</h3>
            <p className="text-primary/70">{t('landing.features.ai.description')}</p>
          </GlassContainer>

          <GlassContainer className="p-6 text-center">
            <div className="w-16 h-16 glass-subtle rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Icon name="users" size="xl" className="text-gold" />
            </div>
            <h3 className="text-xl font-semibold text-primary mb-2">{t('landing.features.family.title')}</h3>
            <p className="text-primary/70">{t('landing.features.family.description')}</p>
          </GlassContainer>
        </motion.div>

        {/* Demo link */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-center mt-12"
        >
          <p className="text-primary/60 mb-4">{t('landing.demo.question')}</p>
          <GlassButton
            variant="secondary"
            onClick={() => router.push('/demo')}
          >
            <Icon name="play" size="sm" className="mr-2" />
            {t('landing.demo.button')}
          </GlassButton>
        </motion.div>
      </Container>
    </div>
  );
}

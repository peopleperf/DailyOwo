'use client';

import { useLocale } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';
import { locales, localeNames } from '@/i18n';
import { GlassContainer } from '@/components/ui/GlassContainer';
import { Icon } from '@/components/ui/Icon';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLanguageChange = (newLocale: string) => {
    if (!pathname) return;
    
    // Get the current pathname without the locale
    const pathWithoutLocale = pathname.replace(`/${locale}`, '') || '/';
    
    // Navigate to the new locale
    router.push(`/${newLocale}${pathWithoutLocale}`);
    router.refresh();
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="glass-subtle px-3 py-2 rounded-xl flex items-center gap-2 hover:bg-white/20 transition-colors"
      >
        <Icon name="globe" size="sm" />
        <span className="text-sm font-medium">{localeNames[locale as keyof typeof localeNames]}</span>
        <Icon name={isOpen ? 'chevronUp' : 'chevronDown'} size="xs" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full mt-2 right-0 z-50"
          >
            <GlassContainer className="p-2 min-w-[180px]">
              {locales.map((loc) => (
                <button
                  key={loc}
                  onClick={() => handleLanguageChange(loc)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                    locale === loc
                      ? 'bg-gold/10 text-gold font-medium'
                      : 'hover:bg-white/10 text-primary'
                  }`}
                >
                  <span className="flex items-center justify-between">
                    {localeNames[loc]}
                    {locale === loc && <Icon name="check" size="xs" />}
                  </span>
                </button>
              ))}
            </GlassContainer>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
} 
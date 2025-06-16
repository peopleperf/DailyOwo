'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useLocale } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Globe } from 'lucide-react';
import { locales } from '@/i18n';

interface Language {
  code: string;
  name: string;
  flag: string;
}

const languages: Language[] = [
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'it', name: 'Italiano', flag: '🇮🇹' },
  { code: 'pt', name: 'Português', flag: '🇵🇹' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'nl', name: 'Nederlands', flag: '🇳🇱' },
  { code: 'yo', name: 'Yorùbá', flag: '🇳🇬' },
  { code: 'sw', name: 'Kiswahili', flag: '🇰🇪' },
  { code: 'ar', name: 'العربية', flag: '🇸🇦' },
];

export function LanguageSelector() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentLanguage = languages.find(lang => lang.code === locale) || languages[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLanguageChange = (langCode: string) => {
    if (langCode === locale) {
      setIsOpen(false);
      return;
    }

    if (!pathname) return;
    
    const segments = pathname.split('/');
    segments[1] = langCode; // Replace the locale segment
    const newPathname = segments.join('/');
    
    router.push(newPathname);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setIsOpen(!isOpen)}
        className="glass-subtle px-4 py-2 rounded-lg flex items-center gap-2 text-primary hover:bg-white/40 transition-colors"
      >
        <Globe size={16} className="text-gold" />
        <span className="text-sm font-medium">{currentLanguage.flag} {currentLanguage.name}</span>
        <ChevronDown 
          size={16} 
          className={`transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full mt-2 right-0 w-48 glass rounded-xl shadow-xl overflow-hidden z-50"
          >
            <div className="py-1">
              {languages.map((language) => (
                <motion.button
                  key={language.code}
                  whileHover={{ backgroundColor: 'rgba(166, 124, 0, 0.1)' }}
                  onClick={() => handleLanguageChange(language.code)}
                  className={`w-full px-4 py-2 text-left flex items-center gap-3 transition-colors ${
                    language.code === locale ? 'bg-gold/10 text-gold' : 'text-primary hover:text-gold'
                  }`}
                >
                  <span className="text-lg">{language.flag}</span>
                  <span className="text-sm">{language.name}</span>
                  {language.code === locale && (
                    <motion.div
                      layoutId="selected-language"
                      className="ml-auto w-2 h-2 bg-gold rounded-full"
                    />
                  )}
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
} 
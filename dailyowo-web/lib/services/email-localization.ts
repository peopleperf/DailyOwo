import { getUserLocale } from '@/lib/utils/user-locale';

type EmailTemplate = 
  | 'welcome'
  | 'verification' 
  | 'password-reset'
  | 'family-invitation'
  | 'transaction-alert'
  | 'budget-alert'
  | 'goal-achievement'
  | 'goal-reminder'
  | 'security-alert'
  | 'monthly-report'
  | 'payment-reminder';

export type EmailLocale = 'en' | 'es' | 'fr' | 'de' | 'pt' | 'zh' | 'ja' | 'ar' | 'sw' | 'yo' | 'ha';

interface LocalizedContent {
  subject: string;
  preview: string;
  heading: string;
  greeting: string;
  signoff: string;
  teamName: string;
  common: {
    viewDetails: string;
    updateSettings: string;
    learnMore: string;
    getStarted: string;
    continue: string;
    [key: string]: string;
  };
}

interface PartialLocalizedContent {
  subject?: string;
  preview?: string;
  heading?: string;
  greeting?: string;
  signoff?: string;
  teamName?: string;
  common?: {
    [key: string]: string;
  };
}

// Email content translations
const emailTranslations: Record<EmailLocale, Partial<Record<EmailTemplate, PartialLocalizedContent>>> = {
  en: {
    welcome: {
      subject: 'Welcome to DailyOwo',
      preview: 'Your financial journey begins',
      heading: 'Welcome',
      greeting: 'Hello',
      signoff: 'Best regards',
      teamName: 'The DailyOwo Team',
      common: {
        viewDetails: 'Enter Dashboard',
        getStarted: 'Get Started',
      },
    },
    verification: {
      subject: 'Verify your DailyOwo email',
      preview: 'Verify your DailyOwo email',
      heading: 'Email verification',
      common: {
        verificationCode: 'VERIFICATION CODE',
        expiresIn: 'This code expires in 24 hours',
      },
    },
    'password-reset': {
      subject: 'Reset your DailyOwo password',
      preview: 'Reset your DailyOwo password',
      heading: 'Password reset request',
      common: {
        resetButton: 'Reset Password',
        expiresIn: 'This link expires in 1 hour for security',
      },
    },
    'monthly-report': {
      subject: '{month} {year} Financial Summary - DailyOwo',
      preview: '{month} {year} financial summary',
      heading: '{month} {year} summary',
      common: {
        income: 'INCOME',
        expenses: 'EXPENSES',
        netSavings: 'NET SAVINGS',
        netDeficit: 'NET DEFICIT',
        savingsRate: 'savings rate',
        viewAnalytics: 'View Detailed Analytics',
      },
    },
  },
  es: {
    welcome: {
      subject: 'Bienvenido a DailyOwo',
      preview: 'Tu viaje financiero comienza',
      heading: 'Bienvenido',
      greeting: 'Hola',
      signoff: 'Saludos cordiales',
      teamName: 'El equipo de DailyOwo',
      common: {
        viewDetails: 'Entrar al Panel',
        getStarted: 'Comenzar',
      },
    },
    verification: {
      subject: 'Verifica tu correo de DailyOwo',
      preview: 'Verifica tu correo de DailyOwo',
      heading: 'Verificación de correo',
      common: {
        verificationCode: 'CÓDIGO DE VERIFICACIÓN',
        expiresIn: 'Este código expira en 24 horas',
      },
    },
    'password-reset': {
      subject: 'Restablecer tu contraseña de DailyOwo',
      preview: 'Restablecer tu contraseña de DailyOwo',
      heading: 'Solicitud de restablecimiento de contraseña',
      common: {
        resetButton: 'Restablecer Contraseña',
        expiresIn: 'Este enlace expira en 1 hora por seguridad',
      },
    },
    'monthly-report': {
      subject: 'Resumen Financiero {month} {year} - DailyOwo',
      preview: 'Resumen financiero {month} {year}',
      heading: 'Resumen {month} {year}',
      common: {
        income: 'INGRESOS',
        expenses: 'GASTOS',
        netSavings: 'AHORRO NETO',
        netDeficit: 'DÉFICIT NETO',
        savingsRate: 'tasa de ahorro',
        viewAnalytics: 'Ver Análisis Detallado',
      },
    },
  },
  fr: {
    welcome: {
      subject: 'Bienvenue sur DailyOwo',
      preview: 'Votre parcours financier commence',
      heading: 'Bienvenue',
      greeting: 'Bonjour',
      signoff: 'Cordialement',
      teamName: "L'équipe DailyOwo",
      common: {
        viewDetails: 'Accéder au Tableau de bord',
        getStarted: 'Commencer',
      },
    },
    verification: {
      subject: 'Vérifiez votre email DailyOwo',
      preview: 'Vérifiez votre email DailyOwo',
      heading: 'Vérification email',
      common: {
        verificationCode: 'CODE DE VÉRIFICATION',
        expiresIn: 'Ce code expire dans 24 heures',
      },
    },
    'monthly-report': {
      subject: 'Résumé Financier {month} {year} - DailyOwo',
      preview: 'Résumé financier {month} {year}',
      heading: 'Résumé {month} {year}',
      common: {
        income: 'REVENUS',
        expenses: 'DÉPENSES',
        netSavings: 'ÉPARGNE NETTE',
        netDeficit: 'DÉFICIT NET',
        savingsRate: "taux d'épargne",
        viewAnalytics: 'Voir les Analyses Détaillées',
      },
    },
  },
  pt: {
    welcome: {
      subject: 'Bem-vindo ao DailyOwo',
      preview: 'Sua jornada financeira começa',
      heading: 'Bem-vindo',
      greeting: 'Olá',
      signoff: 'Atenciosamente',
      teamName: 'Equipe DailyOwo',
      common: {
        viewDetails: 'Entrar no Painel',
        getStarted: 'Começar',
      },
    },
  },
  de: {
    welcome: {
      subject: 'Willkommen bei DailyOwo',
      preview: 'Ihre finanzielle Reise beginnt',
      heading: 'Willkommen',
      greeting: 'Hallo',
      signoff: 'Mit freundlichen Grüßen',
      teamName: 'Das DailyOwo Team',
      common: {
        viewDetails: 'Zum Dashboard',
        getStarted: 'Loslegen',
      },
    },
  },
  zh: {
    welcome: {
      subject: '欢迎使用 DailyOwo',
      preview: '您的财务之旅开始了',
      heading: '欢迎',
      greeting: '您好',
      signoff: '此致敬礼',
      teamName: 'DailyOwo 团队',
      common: {
        viewDetails: '进入仪表板',
        getStarted: '开始使用',
      },
    },
    'monthly-report': {
      subject: '{year}年{month} 财务摘要 - DailyOwo',
      preview: '{year}年{month} 财务摘要',
      heading: '{year}年{month} 摘要',
      common: {
        income: '收入',
        expenses: '支出',
        netSavings: '净储蓄',
        netDeficit: '净赤字',
        savingsRate: '储蓄率',
        viewAnalytics: '查看详细分析',
      },
    },
  },
  ja: {
    welcome: {
      subject: 'DailyOwoへようこそ',
      preview: 'あなたの金融の旅が始まります',
      heading: 'ようこそ',
      greeting: 'こんにちは',
      signoff: 'よろしくお願いいたします',
      teamName: 'DailyOwoチーム',
      common: {
        viewDetails: 'ダッシュボードへ',
        getStarted: '始める',
      },
    },
  },
  ar: {
    welcome: {
      subject: 'مرحباً بك في DailyOwo',
      preview: 'رحلتك المالية تبدأ',
      heading: 'مرحباً',
      greeting: 'مرحباً',
      signoff: 'مع أطيب التحيات',
      teamName: 'فريق DailyOwo',
      common: {
        viewDetails: 'الدخول إلى لوحة التحكم',
        getStarted: 'ابدأ',
      },
    },
  },
  sw: {
    welcome: {
      subject: 'Karibu DailyOwo',
      preview: 'Safari yako ya kifedha inaanza',
      heading: 'Karibu',
      greeting: 'Habari',
      signoff: 'Kwa heri',
      teamName: 'Timu ya DailyOwo',
      common: {
        viewDetails: 'Ingia kwenye Dashibodi',
        getStarted: 'Anza',
      },
    },
  },
  yo: {
    welcome: {
      subject: 'Kaabo si DailyOwo',
      preview: 'Irin ajo owo re bere',
      heading: 'Kaabo',
      greeting: 'Bawo',
      signoff: 'E ku daadaa',
      teamName: 'Egbe DailyOwo',
      common: {
        viewDetails: 'Wo inu Dashboard',
        getStarted: 'Bere',
      },
    },
  },
  ha: {
    welcome: {
      subject: 'Barka da zuwa DailyOwo',
      preview: 'Tafiyar kuɗin ku ta fara',
      heading: 'Barka da zuwa',
      greeting: 'Sannu',
      signoff: 'Da fatan alheri',
      teamName: 'Ƙungiyar DailyOwo',
      common: {
        viewDetails: 'Shiga Dashboard',
        getStarted: 'Fara',
      },
    },
  },
};

// Month names in different languages
const monthNames: Record<EmailLocale, string[]> = {
  en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
  es: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'],
  fr: ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'],
  pt: ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'],
  de: ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'],
  zh: ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'],
  ja: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
  ar: ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'],
  sw: ['Januari', 'Februari', 'Machi', 'Aprili', 'Mei', 'Juni', 'Julai', 'Agosti', 'Septemba', 'Oktoba', 'Novemba', 'Desemba'],
  yo: ['Oṣu Kinni', 'Oṣu Keji', 'Oṣu Kẹta', 'Oṣu Kẹrin', 'Oṣu Karun', 'Oṣu Kẹfa', 'Oṣu Keje', 'Oṣu Kẹjọ', 'Oṣu Kẹsan', 'Oṣu Kẹwa', 'Oṣu Kọkanla', 'Oṣu Kejila'],
  ha: ['Janairu', 'Fabrairu', 'Maris', 'Afrilu', 'Mayu', 'Yuni', 'Yuli', 'Agusta', 'Satumba', 'Oktoba', 'Nuwamba', 'Disamba'],
};

/**
 * Get localized email content
 */
export function getLocalizedEmailContent(
  template: EmailTemplate,
  locale: EmailLocale,
  data?: Record<string, any>
): LocalizedContent {
  const defaultLocale: EmailLocale = 'en';
  const templateContent = emailTranslations[locale]?.[template] || emailTranslations[defaultLocale][template];
  const defaultContent = emailTranslations[defaultLocale][template];
  
  // Default common strings
  const defaultCommon = {
    viewDetails: 'View Details',
    updateSettings: 'Update Settings',
    learnMore: 'Learn More',
    getStarted: 'Get Started',
    continue: 'Continue',
  };
  
  // Replace placeholders in subject, preview, and heading
  let localizedContent = {
    subject: '',
    preview: '',
    heading: '',
    greeting: 'Hello',
    signoff: 'Best regards',
    teamName: 'The DailyOwo Team',
    ...defaultContent,
    ...templateContent,
    common: {
      ...defaultCommon,
      ...defaultContent?.common,
      ...templateContent?.common,
    },
  } as LocalizedContent;
  
  // Replace placeholders like {month}, {year}
  if (data) {
    Object.entries(localizedContent).forEach(([key, value]) => {
      if (typeof value === 'string') {
        localizedContent[key as keyof LocalizedContent] = replacePlaceholders(value, data, locale) as any;
      }
    });
  }
  
  return localizedContent;
}

/**
 * Replace placeholders in text
 */
function replacePlaceholders(text: string, data: Record<string, any>, locale: EmailLocale): string {
  return text.replace(/{(\w+)}/g, (match, key) => {
    if (key === 'month' && data.month) {
      // Convert month name to localized version
      const monthIndex = monthNames.en.findIndex(m => m === data.month);
      if (monthIndex !== -1 && monthNames[locale]) {
        return monthNames[locale][monthIndex];
      }
    }
    return data[key] || match;
  });
}

/**
 * Get user's preferred email locale
 */
export async function getUserEmailLocale(userId: string): Promise<EmailLocale> {
  try {
    const locale = await getUserLocale(userId);
    
    // Map user locale to supported email locale
    const localeMap: Record<string, EmailLocale> = {
      'en': 'en',
      'en-US': 'en',
      'en-GB': 'en',
      'es': 'es',
      'es-ES': 'es',
      'es-MX': 'es',
      'fr': 'fr',
      'fr-FR': 'fr',
      'de': 'de',
      'de-DE': 'de',
      'pt': 'pt',
      'pt-BR': 'pt',
      'pt-PT': 'pt',
      'zh': 'zh',
      'zh-CN': 'zh',
      'zh-TW': 'zh',
      'ja': 'ja',
      'ja-JP': 'ja',
      'ar': 'ar',
      'ar-SA': 'ar',
      'sw': 'sw',
      'sw-KE': 'sw',
      'yo': 'yo',
      'yo-NG': 'yo',
      'ha': 'ha',
      'ha-NG': 'ha',
    };
    
    return localeMap[locale] || 'en';
  } catch (error) {
    console.error('Error getting user email locale:', error);
    return 'en';
  }
}

/**
 * Format currency based on locale
 */
export function formatCurrencyForLocale(amount: number, currency: string, locale: EmailLocale): string {
  const localeMap: Record<EmailLocale, string> = {
    en: 'en-US',
    es: 'es-ES',
    fr: 'fr-FR',
    de: 'de-DE',
    pt: 'pt-BR',
    zh: 'zh-CN',
    ja: 'ja-JP',
    ar: 'ar-SA',
    sw: 'sw-KE',
    yo: 'en-NG',
    ha: 'en-NG',
  };
  
  try {
    return new Intl.NumberFormat(localeMap[locale], {
      style: 'currency',
      currency: currency,
    }).format(amount);
  } catch (error) {
    // Fallback to basic formatting
    return `${currency}${amount.toFixed(2)}`;
  }
}

/**
 * Get RTL languages
 */
export function isRTLLocale(locale: EmailLocale): boolean {
  return locale === 'ar';
} 
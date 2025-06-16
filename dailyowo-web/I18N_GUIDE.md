# DailyOwo Internationalization (i18n) Guide

## Overview

DailyOwo supports 10 languages out of the box:
- 🇬🇧 English (default)
- 🇪🇸 Spanish
- 🇫🇷 French
- 🇮🇹 Italian
- 🇵🇹 Portuguese
- 🇩🇪 German
- 🇳🇱 Dutch
- 🇳🇬 Yoruba
- 🇰🇪 Swahili
- 🇸🇦 Arabic

## How It Works

### 1. URL Structure
- Default language (English): `dailyowo.com/dashboard`
- Other languages: `dailyowo.com/es/dashboard`, `dailyowo.com/fr/dashboard`

### 2. Language Switching
- Use the language switcher in the top-right corner of the onboarding flow
- The app remembers the user's language preference
- Language selection is synced with the user's profile

### 3. Using Translations in Components

#### Client Components
```tsx
'use client';

import { useTranslations } from 'next-intl';

export function MyComponent() {
  const t = useTranslations('dashboard');
  const tCommon = useTranslations('common');
  
  return (
    <div>
      <h1>{t('title')}</h1>
      <button>{tCommon('save')}</button>
    </div>
  );
}
```

#### Server Components
```tsx
import { getTranslations } from 'next-intl/server';

export default async function Page() {
  const t = await getTranslations('dashboard');
  
  return <h1>{t('title')}</h1>;
}
```

### 4. Translation Files Structure

All translations are in `/messages/{locale}.json`:

```json
{
  "common": {
    "appName": "DailyOwo",
    "save": "Save",
    "cancel": "Cancel"
  },
  "dashboard": {
    "greeting": {
      "morning": "Good morning, {name} 👋",
      "afternoon": "Good afternoon, {name} 👋"
    }
  }
}
```

### 5. Interpolation

Use placeholders for dynamic content:

```json
{
  "welcome": "Welcome, {name}!",
  "balance": "Your balance is {amount}"
}
```

```tsx
t('welcome', { name: 'John' }) // "Welcome, John!"
t('balance', { amount: '$1,000' }) // "Your balance is $1,000"
```

### 6. Formatting

The app automatically formats based on locale:

```tsx
import { formatCurrency, formatDate, formatNumber } from '@/lib/utils/format';
import { useLocale } from 'next-intl';

function MyComponent() {
  const locale = useLocale();
  
  // Currency formatting
  formatCurrency(1000, { 
    currency: 'USD', 
    locale: locale 
  }); // $1,000.00 (en), 1.000,00 $ (es), etc.
  
  // Date formatting
  formatDate(new Date(), { 
    locale: locale,
    format: 'medium' 
  }); // Dec 15, 2024 (en), 15 dic 2024 (es), etc.
}
```

## Adding New Translations

### 1. Add to English file first (`messages/en.json`)
```json
{
  "newFeature": {
    "title": "New Feature",
    "description": "This is a new feature"
  }
}
```

### 2. Add to other language files
Either manually translate or use the translation script:

```bash
# This creates template files for missing translations
node scripts/generate-translations.js
```

### 3. Use in your component
```tsx
const t = useTranslations('newFeature');
return <h1>{t('title')}</h1>;
```

## Professional Translation

For production, we recommend:

1. **Export translations for professional service:**
   ```bash
   # Export all English strings that need translation
   node scripts/export-for-translation.js
   ```

2. **Use a translation management service:**
   - Crowdin
   - Lokalise
   - Phrase
   - POEditor

3. **Import completed translations:**
   ```bash
   # Import translated files back
   node scripts/import-translations.js
   ```

## Language Detection

The app automatically detects language based on:
1. URL parameter (highest priority)
2. User's saved preference (if logged in)
3. Browser language settings
4. Default to English

## RTL Support

Arabic is configured for right-to-left (RTL) layout:

```tsx
// Automatically applied when locale is 'ar'
<html dir={locale === 'ar' ? 'rtl' : 'ltr'}>
```

## Currency & Regional Settings

When users select their region in onboarding:
- Currency symbol and code are set
- Date format preferences are saved
- Number formatting follows regional conventions

## Testing Translations

1. **Check for missing translations:**
   ```bash
   npm run i18n:check
   ```

2. **Test different languages:**
   - Visit `/es`, `/fr`, `/de`, etc.
   - Use language switcher
   - Check formatting (dates, numbers, currency)

3. **Test RTL layout:**
   - Switch to Arabic (`/ar`)
   - Verify layout mirrors correctly

## Best Practices

1. **Always use translation keys** - Never hardcode text
2. **Keep keys organized** - Use nested structure
3. **Avoid HTML in translations** - Use interpolation instead
4. **Test with longest translations** - German text is often 30% longer
5. **Consider cultural differences** - Colors, icons, and imagery
6. **Use proper plural forms** - Some languages have multiple plural forms

## Troubleshooting

### Missing translations
If you see `[KEY]` instead of translated text:
1. Check if key exists in translation file
2. Verify correct namespace is used
3. Check for typos in key name

### Wrong formatting
1. Ensure locale is passed to formatting functions
2. Check regional settings in user profile
3. Verify currency/date format settings

### Language not switching
1. Clear browser cache
2. Check URL structure
3. Verify language files exist

## Future Enhancements

- [ ] Add more African languages (Hausa, Zulu, Amharic)
- [ ] Implement number localization (e.g., Lakh/Crore for India)
- [ ] Add voice support for accessibility
- [ ] Create translation memory for consistency
- [ ] Add in-app language learning tooltips 
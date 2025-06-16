# DailyOwo - Quick Start Guide

## 🚀 Running the App

The app is currently running at http://localhost:3000

## 📱 Available Pages

Since the app uses internationalization (i18n), all pages require a locale prefix. Here are the correct URLs:

### Public Pages (No Authentication Required)
- **English Home**: http://localhost:3000/en
- **Spanish Home**: http://localhost:3000/es
- **French Home**: http://localhost:3000/fr
- **Component Demo**: http://localhost:3000/en/demo
- **Login**: http://localhost:3000/en/auth/login
- **Register**: http://localhost:3000/en/auth/register

### Protected Pages (Requires Authentication)
- **Dashboard**: http://localhost:3000/en/dashboard
- **Onboarding**: http://localhost:3000/en/onboarding

## 🔥 Firebase Setup Required

The app is running in demo mode because Firebase is not configured. To enable full functionality:

1. Create a file named `.env.local` in the `dailyowo-web` directory
2. Add your Firebase configuration:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain_here
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id_here
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket_here
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id_here
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id_here
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id_here
```

3. Get these values from:
   - Go to https://console.firebase.google.com/
   - Create a new project or select existing
   - Go to Project Settings > General
   - Scroll to "Your apps" and create a Web app
   - Copy the configuration values

4. Restart the development server after adding the `.env.local` file

## 🌍 Supported Languages

The app supports 10 languages:
- English (en)
- Spanish (es)
- French (fr)
- Italian (it)
- Portuguese (pt)
- German (de)
- Dutch (nl)
- Yoruba (yo)
- Swahili (sw)
- Arabic (ar)

## 💡 Tips

- The root URL (http://localhost:3000) will automatically redirect to your browser's language or English by default
- You'll see a Firebase setup notice in the bottom-right corner until Firebase is configured
- The component demo page (http://localhost:3000/en/demo) showcases all the glassmorphic UI components 
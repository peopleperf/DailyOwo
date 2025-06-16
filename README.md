# 💰 DailyOwo - Your Daily Money Manager

<div align="center">
  <img src="public/icons/icon-512x512.png" alt="DailyOwo Logo" width="120" height="120">
  
  [![Next.js](https://img.shields.io/badge/Next.js-14-black.svg)](https://nextjs.org)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org)
  [![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.0-38B2AC.svg)](https://tailwindcss.com)
  [![Firebase](https://img.shields.io/badge/Firebase-Latest-orange.svg)](https://firebase.google.com)
  [![PWA](https://img.shields.io/badge/PWA-Ready-5A0FC8.svg)](https://web.dev/progressive-web-apps/)
  [![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
</div>

## 📱 About DailyOwo

DailyOwo is a premium AI-powered personal finance management Progressive Web App (PWA) that helps you take control of your financial future. Built with Next.js and powered by Google's Gemini AI, DailyOwo offers intelligent automation, personalized insights, and family collaboration features—all in a beautiful, native-like web experience.

### ✨ Key Features

- 💳 **Smart Transaction Tracking** - Manual entry with AI-powered categorization
- 🎯 **Goal Setting & Tracking** - Set and achieve your financial milestones
- 📊 **Budget Management** - Create and monitor budgets with real-time insights
- 🤖 **Embedded AI Intelligence** - Get personalized financial advice without a chatbot
- 👨‍👩‍👧‍👦 **Family Collaboration** - Share finances with family members securely
- 📱 **Works Everywhere** - PWA technology for iOS, Android, and desktop
- 🔌 **Offline-First** - Works without internet, syncs when connected
- 🌍 **Multi-Currency Support** - Support for USD, EUR, GBP, NGN, and more
- 🔒 **Privacy-First** - Your data stays secure with encryption
- 🎨 **Premium Glassmorphic Design** - Beautiful, modern UI with smooth animations

## 🚀 Getting Started

### Prerequisites

- Node.js 18.0.0 or higher
- npm or yarn package manager
- Firebase account
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/dailyowo.git
   cd dailyowo
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Set up environment variables**
   Create a `.env.local` file in the root directory:
   ```env
   # Firebase Configuration (Required)
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
   NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id # Optional
   
   # Firebase Admin SDK (Required for server-side operations)
   FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"..."}
   
   # Email Configuration (Required for email features)
   RESEND_API_KEY=re_your_resend_api_key
   EMAIL_FROM=DailyOwo <noreply@yourdomain.com>
   EMAIL_REPLY_TO=support@yourdomain.com
   
   # Application Configuration (Required)
   NEXT_PUBLIC_APP_URL=http://localhost:3000 # Change to your production URL
   
   # Gemini AI (Required for AI features)
   GEMINI_API_KEY=your_gemini_api_key
   
   # Encryption (Optional but recommended)
   NEXT_PUBLIC_ENCRYPTION_KEY=your_32_char_encryption_key_here
   
   # Development Only (Optional)
   NEXT_PUBLIC_USE_FIREBASE_EMULATORS=false # Set to true to use Firebase emulators
   ```

   **Important Notes:**
   - Get your Resend API key from [https://resend.com/api-keys](https://resend.com/api-keys)
   - Firebase Service Account Key can be generated from Firebase Console → Project Settings → Service Accounts
   - Ensure your production `NEXT_PUBLIC_APP_URL` uses HTTPS
   - The encryption key should be 32 characters long for AES-256 encryption

4. **Set up Firebase**
   - Create a new Firebase project
   - Enable Authentication (Email/Password, Google)
   - Create a Firestore database
   - Deploy Cloud Functions for AI features
   
5. **Run the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🏗️ Project Structure

```
dailyowo/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── (auth)/            # Authentication pages
│   │   ├── (dashboard)/       # Main app pages
│   │   ├── api/               # API routes
│   │   └── layout.tsx         # Root layout
│   ├── components/            # Reusable components
│   │   ├── ui/               # UI components (buttons, cards, etc.)
│   │   ├── features/         # Feature-specific components
│   │   └── layouts/          # Layout components
│   ├── features/             # Feature modules
│   │   ├── auth/            # Authentication logic
│   │   ├── transactions/    # Transaction management
│   │   ├── budgets/         # Budget features
│   │   ├── goals/           # Goals tracking
│   │   ├── ai/              # AI integration
│   │   └── family/          # Family features
│   ├── hooks/                # Custom React hooks
│   ├── lib/                  # Libraries and utilities
│   │   ├── firebase/        # Firebase configuration
│   │   ├── db/              # Database utilities
│   │   └── utils/           # Helper functions
│   ├── services/            # External service integrations
│   ├── stores/              # State management (Zustand)
│   ├── styles/              # Global styles
│   └── types/               # TypeScript types
├── public/                   # Static assets
│   ├── icons/               # PWA icons
│   └── images/              # Images
├── functions/               # Firebase Cloud Functions
├── next.config.js          # Next.js configuration
├── tailwind.config.js      # Tailwind CSS configuration
├── manifest.json           # PWA manifest
└── package.json           # Dependencies
```

## 🎨 Design Philosophy

DailyOwo features a premium glassmorphic design with:
- 🌊 Deep sapphire blue primary color
- ✨ Royal gold accents
- 🧊 Frosted glass effects using Tailwind CSS
- 🎭 Smooth animations with Framer Motion
- 📱 Mobile-first responsive design
- ♿ Accessible UI components

## 📱 PWA Features

- **Installable** - Add to home screen on any device
- **Offline Support** - Core features work without internet
- **Push Notifications** - Get timely financial insights
- **Background Sync** - Data syncs when connection returns
- **App-like Experience** - Feels native on every platform

## 🧪 Testing

```bash
# Run unit tests
npm run test

# Run E2E tests
npm run test:e2e

# Run linting
npm run lint

# Type checking
npm run type-check
```

## 📦 Building for Production

```bash
# Build the application
npm run build

# Start production server
npm run start

# Export as static site (if needed)
npm run export
```

## 🚀 Deployment

DailyOwo can be deployed to any platform that supports Node.js:

### Vercel (Recommended)
```bash
npx vercel
```

### Other Platforms
- Netlify
- Firebase Hosting
- AWS Amplify
- DigitalOcean App Platform

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Next.js team for the amazing framework
- Tailwind CSS for the utility-first CSS framework
- Firebase team for the backend infrastructure
- Google Gemini team for the AI capabilities
- All contributors who help make DailyOwo better

## 📞 Contact

- Website: [dailyowo.com](https://dailyowo.com)
- Email: support@dailyowo.com
- Twitter: [@dailyowo](https://twitter.com/dailyowo)

---

<div align="center">
  Made with ❤️ by the DailyOwo Team
</div> 
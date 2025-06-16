# Firebase Setup Guide for DailyOwo

## Quick Start

1. **Create a Firebase Project**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Click "Create a project" or select an existing one
   - Enter project name (e.g., "dailyowo-prod")
   - Disable Google Analytics for now (optional)

2. **Add a Web App**
   - In your Firebase project, click the gear icon ⚙️ → Project settings
   - Scroll down to "Your apps" section
   - Click the "</>" (Web) icon
   - Register app with nickname (e.g., "DailyOwo Web")
   - Copy the configuration values

3. **Create Environment File**
   - Create a new file called `.env.local` in the `dailyowo-web` directory
   - Add the following content with your values:

```bash
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain_here
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id_here
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket_here
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id_here
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id_here
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id_here

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=DailyOwo
NEXT_PUBLIC_APP_ENV=development
```

4. **Enable Authentication**
   - In Firebase Console, go to Authentication → Get started
   - Enable Email/Password provider
   - Enable Google provider (optional)
   - Add `localhost` to authorized domains

5. **Setup Firestore Database**
   - Go to Firestore Database → Create database
   - Choose "Start in test mode" for development
   - Select your preferred location
   - Click "Enable"

6. **Setup Storage (Optional)**
   - Go to Storage → Get started
   - Start in test mode for development
   - Choose your storage location

7. **Restart Development Server**
   ```bash
   npm run dev
   ```

## Security Rules (Production)

### Firestore Rules
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Transactions belong to users
    match /users/{userId}/transactions/{transactionId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Family members can access shared data
    match /families/{familyId} {
      allow read: if request.auth != null && 
        request.auth.uid in resource.data.members;
      allow write: if request.auth != null && 
        request.auth.uid in resource.data.admins;
    }
  }
}
```

### Storage Rules
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // User profile pictures
    match /users/{userId}/profile/{fileName} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Receipt images
    match /users/{userId}/receipts/{fileName} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## Troubleshooting

### Common Issues

1. **"Firebase is not configured" error**
   - Make sure `.env.local` file exists
   - Check that all environment variables are set
   - Restart the development server

2. **Authentication not working**
   - Verify Email/Password auth is enabled in Firebase Console
   - Check that localhost is in authorized domains
   - Clear browser cache and cookies

3. **Firestore permission denied**
   - Check Firestore rules
   - Ensure user is authenticated
   - Verify the data structure matches rules

### Environment Variables Not Loading

If your environment variables aren't loading:

1. Make sure the file is named exactly `.env.local` (not `.env`)
2. Restart the development server after creating the file
3. Check that variables start with `NEXT_PUBLIC_`
4. No quotes needed around values unless they contain spaces

## Next Steps

After setting up Firebase:

1. Test authentication by creating an account
2. Try adding some test transactions
3. Set up production security rules before deploying
4. Consider enabling additional features:
   - Cloud Functions for server-side logic
   - Firebase Analytics for usage tracking
   - Performance Monitoring
   - Crashlytics for error tracking

## Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)
- [Firebase Security Rules](https://firebase.google.com/docs/rules) 
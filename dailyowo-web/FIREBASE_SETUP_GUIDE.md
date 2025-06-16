# 🔥 Firebase Setup Guide for DailyOwo

## 🚨 Getting "5 NOT_FOUND" Error?
**This means Firestore Database hasn't been created yet!** Jump to [Step 4](#4--important-create-firestore-database) to fix this immediately.

## Quick Fix for "Client is Offline" Error

### 1. Enable Anonymous Authentication
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project: **dailyowo**
3. Navigate to **Authentication** → **Sign-in method**
4. Find **Anonymous** in the list
5. Click on it and **Enable** it
6. Click **Save**

### 2. Update Firestore Security Rules
1. In Firebase Console, go to **Firestore Database** → **Rules**
2. Replace the existing rules with these development rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow authenticated users to read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Allow authenticated users to manage their transactions
    match /users/{userId}/transactions/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Allow authenticated users to manage their budgets
    match /users/{userId}/budgets/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Allow authenticated users to manage their goals
    match /users/{userId}/goals/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Test collection for debugging (remove in production)
    match /test/{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

3. Click **Publish**

### 3. Enable Email/Password Authentication (Already Done)
This should already be enabled, but verify:
1. **Authentication** → **Sign-in method**
2. Ensure **Email/Password** is enabled

### 4. ⚠️ IMPORTANT: Create Firestore Database
**This is likely your issue!** The "5 NOT_FOUND" error means Firestore hasn't been created yet.

1. Go to **Firestore Database** in Firebase Console
2. You'll see a "Create Database" button - **Click it**
3. Choose **Start in production mode** (we'll set rules later)
4. Select a location closest to you:
   - **US**: us-central1 (Iowa)
   - **Europe**: europe-west1 (Belgium)
   - **Asia**: asia-southeast1 (Singapore)
5. Click **Create**
6. Wait for the database to be provisioned (usually takes 1-2 minutes)
7. Once created, go to the **Rules** tab and update with the rules from step 2

### 5. Verify Environment Variables
Your `.env.local` file should have these variables (no quotes or spaces):
```
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=dailyowo.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=dailyowo
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=dailyowo.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
```

### 6. Test the Connection
After making these changes:
1. Restart your development server: `npm run dev`
2. Try logging in or registering a new account
3. Check the browser console for any errors

## Common Issues and Solutions

### "5 NOT_FOUND" Error
- **Cause**: Firestore database doesn't exist
- **Fix**: Create the database (step 4) - This is your current issue!

### "Failed to get document because the client is offline"
- **Cause**: Usually authentication or network issues
- **Fix**: Follow steps 1-5 above

### "Missing or insufficient permissions"
- **Cause**: Firestore rules are too restrictive
- **Fix**: Update rules as shown in step 2

### "Firebase: Error (auth/admin-restricted-operation)"
- **Cause**: Anonymous auth is disabled
- **Fix**: Enable anonymous authentication (step 1)

### "Cannot read properties of undefined"
- **Cause**: Firebase not properly initialized
- **Fix**: Check environment variables (step 5)

## Project Structure for Firebase

```
dailyowo/
├── users/
│   └── {userId}/
│       ├── profile (document)
│       ├── settings (document)
│       ├── transactions/ (subcollection)
│       ├── budgets/ (subcollection)
│       ├── goals/ (subcollection)
│       └── insights/ (subcollection)
├── categories/ (for shared category definitions)
└── test/ (for debugging - remove in production)
```

## Need More Help?

1. Run the debug script: `node scripts/debug-firebase-connection.mjs`
2. Check browser DevTools Network tab for failed requests
3. Look for errors in the Console tab
4. Verify project ID matches in Firebase Console and `.env.local` 
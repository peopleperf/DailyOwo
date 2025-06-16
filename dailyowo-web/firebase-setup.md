# Firebase Setup Guide

## Enable Firestore Database

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project (dailyowo...)
3. Click on "Firestore Database" in the left sidebar
4. Click "Create database"
5. Choose "Start in production mode" or "Start in test mode"
6. Select your Cloud Firestore location (choose closest to your users)

## Set Up Security Rules

For development/testing, use these rules in Firestore:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow authenticated users to read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Allow authenticated users to read/write their own transactions
    match /users/{userId}/transactions/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Allow authenticated users to read/write their own budgets
    match /users/{userId}/budgets/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Allow authenticated users to read/write their own goals
    match /users/{userId}/goals/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## Enable Authentication Methods

1. In Firebase Console, go to "Authentication"
2. Click "Get started" if not already enabled
3. Go to "Sign-in method" tab
4. Enable:
   - Email/Password
   - Google (configure with your OAuth credentials)

## Common Issues

### "Failed to get document because the client is offline"
This error can occur when:
- Firestore is not enabled in your project
- Network connectivity issues
- Browser blocking IndexedDB (check browser console for errors)

### 400 Bad Request on Firestore
This usually means:
- Firestore is not enabled
- Wrong project ID
- Security rules are blocking access

## Next Steps

After setting up Firestore:
1. Refresh your application
2. Try logging in again
3. The dashboard should load without errors 
# Firebase Diagnostic Tools

This document describes the diagnostic tools available for testing Firebase and authentication functionality without requiring login.

## 🛡️ Admin Mode Features

All diagnostic tools now work in "Admin Mode" - no authentication required for testing.

## 📍 Available Diagnostic Pages

### 1. Firebase Debug Tool (`/firebase-debug`)
- **Purpose**: Comprehensive Firebase and Firestore diagnostics
- **Features**:
  - ✅ Test Firebase configuration
  - ✅ Check Firestore connectivity
  - ✅ Run read/write operations
  - ✅ Monitor active/failed listeners
  - ✅ Reset connections
  - ✅ Full Firestore restart
  - ✅ Clear cache
- **Access**: Navigate to `/firebase-debug` or `/[locale]/firebase-debug`

### 2. Auth Test Page (`/test-auth`)
- **Purpose**: Quick auth service validation
- **Features**:
  - ✅ Test Firebase initialization
  - ✅ Check auth service availability
  - ✅ Verify Firestore access
  - ✅ Test auth persistence
- **Access**: Navigate to `/test-auth` or `/[locale]/test-auth`

## 🖥️ Console Commands

Open your browser's developer console and use these commands:

```javascript
// Show all available commands
firestoreDiag.help()

// Get current diagnostics
firestoreDiag.getDiagnostics()

// Log diagnostics to console
firestoreDiag.logDiagnostics()

// Reset Firestore connection
await firestoreDiag.resetConnection()

// Full Firestore restart
await firestoreDiag.restart()

// Force offline/online
await firestoreDiag.forceOffline()
await firestoreDiag.forceOnline()

// Clear last error
firestoreDiag.clearError()

// Clean up all listeners
firestoreDiag.cleanupListeners()
```

## 🔍 Auth Diagnostics Widget

In development mode, a small diagnostic widget appears in the bottom-right corner showing:
- Current auth state
- Firestore connection status
- Active/failed listeners
- Last error (if any)

## 🚀 Quick Start Testing

1. **Start the development server**:
   ```bash
   cd dailyowo-web
   npm run dev
   ```

2. **Open the Firebase Debug Tool**:
   - Navigate to `http://localhost:3000/firebase-debug`
   - Click "Run Diagnostics" to test everything

3. **Check console for diagnostics**:
   - Open browser developer console
   - Type `firestoreDiag.logDiagnostics()`

4. **Monitor real-time status**:
   - Look for the Auth Diagnostics widget in bottom-right
   - Click refresh icon to update

## 🔧 Troubleshooting Common Issues

### Firestore Internal Assertion Errors
1. Navigate to `/firebase-debug`
2. Click "Full Restart"
3. If persists, click "Clear Cache & Reload"

### Auth State Lost
1. Check the Auth Diagnostics widget
2. Run `await firestoreDiag.resetConnection()` in console
3. Navigate to `/firebase-debug` and click "Fix Connection"

### No Connection
1. Check your `.env.local` file has all Firebase config
2. Run diagnostics at `/firebase-debug`
3. Check console for specific errors

## 📝 Notes

- All diagnostic pages work without authentication
- Admin mode is automatically enabled for testing
- Changes are temporary and don't affect production
- Console commands are only available in development mode

## 🔗 Related Documentation

- [Firestore Auth Fixes Summary](./FIRESTORE_AUTH_FIXES_SUMMARY.md)
- [Firebase Setup Instructions](./README.md#firebase-setup) 
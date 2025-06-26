# Firebase Storage CORS Setup

## Problem
The receipt scanning feature is failing with CORS errors when trying to upload images to Firebase Storage.

## Cost Information
- **Google Cloud SDK**: FREE to install and use
- **CORS Configuration**: FREE (just a settings change)
- **Firebase Storage**: FREE up to 5GB storage and reasonable daily usage
- Your app usage will likely stay within the free tier

## Solution Options

### Option 1: Firebase Console Method (Simplest - Try This First!)

Unfortunately, Firebase Console doesn't provide a direct UI for CORS configuration. You need to use one of the following methods:

### Option 2: Google Cloud Console Terminal (In Browser - No Installation)

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Select your project: **daily-owo**
3. Click the **Cloud Shell** button (terminal icon) in the top right corner
4. Wait for the cloud shell to load (it's a free terminal in your browser)
5. In the cloud shell, create the CORS file:
   ```bash
   cat > cors.json << 'EOF'
   [
     {
       "origin": ["*"],
       "method": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
       "responseHeader": ["Content-Type", "Authorization", "Content-Length", "User-Agent", "x-goog-resumable"],
       "maxAgeSeconds": 3600
     }
   ]
   EOF
   ```
6. Apply it to your bucket:
   ```bash
   gsutil cors set cors.json gs://daily-owo.firebasestorage.app
   ```
7. Verify it worked:
   ```bash
   gsutil cors get gs://daily-owo.firebasestorage.app
   ```

### Option 3: Local Command Line (If Cloud Shell Doesn't Work)

1. **Install Google Cloud SDK** (if not already installed):
   ```bash
   # macOS
   brew install --cask google-cloud-sdk
   
   # Or download from: https://cloud.google.com/sdk/docs/install
   ```

2. **Authenticate**:
   ```bash
   gcloud auth login
   ```

3. **Set your project**:
   ```bash
   gcloud config set project daily-owo
   ```

4. **Apply CORS** (from the dailyowo-web directory):
   ```bash
   gsutil cors set cors.json gs://daily-owo.firebasestorage.app
   ```

## Testing CORS Configuration

After applying CORS:
1. Refresh your DailyOwo app
2. Try scanning a receipt again
3. It should now use real OCR instead of demo data

## Troubleshooting

If you still see "This is demo data" message:
1. Clear your browser cache
2. Check the browser console for any remaining CORS errors
3. Verify CORS was applied: `gsutil cors get gs://daily-owo.firebasestorage.app`

## Note About Storage Rules

The `storage.rules` file has already been created to ensure authenticated users can upload receipts. You'll need to deploy these rules:

```bash
# From dailyowo-web directory
firebase deploy --only storage:rules
```

## Common Issues

- **Still getting CORS errors**: Wait 5-10 minutes for changes to propagate
- **Authentication errors**: Make sure the user is properly authenticated
- **File size errors**: Check that images are under 10MB

## Do I Need to Pay?

**No!** For typical personal/small app usage:
- Installing Google Cloud SDK: FREE
- Configuring CORS: FREE
- Firebase Storage free tier: 5GB storage, reasonable daily operations
- You only pay if you exceed the generous free tier limits 
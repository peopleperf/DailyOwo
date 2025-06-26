# Edge Runtime and Firebase Admin Integration

## Edge Runtime Limitations

The application supports Edge Runtime for improved performance, but with some limitations:

1. **Node.js Modules**: Edge Runtime doesn't support most Node.js core modules. We've configured webpack fallbacks for common modules.
2. **Firebase Admin**: Cannot be used directly in Edge Runtime due to Node.js dependencies.
3. **Filesystem Access**: No direct filesystem access in Edge Runtime.

## Firebase Admin Usage Restrictions

The Firebase Admin SDK has specific usage constraints:

- ❌ **Cannot be used** in Edge Runtime functions
- ✅ **Can be used** in traditional server environments (API routes, getServerSideProps, etc.)

### Error Handling
Attempting to use Firebase Admin in Edge Runtime will throw a clear error with guidance.

## Workarounds for Edge Functionality

When you need Firebase functionality in Edge Runtime:

1. **Use Client SDK**: For client-side operations (auth, Firestore reads)
2. **Proxy Requests**: Call a traditional API route that uses Admin SDK
3. **Edge-Compatible Alternatives**:
   - `@supabase/supabase-js` for auth
   - `@upstash/redis` for caching

## Configuration Details

### Webpack Fallbacks
Configured in `next.config.js` to handle Node.js core modules in client bundles.

### TypeScript Support
Added `edge-runtime` types in `tsconfig.json` for better type checking.

### Environment Variables
Ensure these are set for Firebase Admin:
- `FIREBASE_SERVICE_ACCOUNT_KEY` (required)
- `FIREBASE_DATABASE_URL` (optional)
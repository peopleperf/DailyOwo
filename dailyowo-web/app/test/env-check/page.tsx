'use client';

export default function EnvCheckPage() {
  const checks = {
    'RESEND_API_KEY': process.env.NEXT_PUBLIC_RESEND_API_KEY ? '✅ Set' : '❌ Not set',
    'EMAIL_FROM': process.env.NEXT_PUBLIC_EMAIL_FROM || '⚠️ Not set (using default)',
    'EMAIL_REPLY_TO': process.env.NEXT_PUBLIC_EMAIL_REPLY_TO || '⚠️ Not set (using default)',
    'APP_URL': process.env.NEXT_PUBLIC_APP_URL || '❌ Not set',
    'FIREBASE_API_KEY': process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? '✅ Set' : '❌ Not set',
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-8">Environment Variables Check</h1>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Email Configuration</h2>
          <div className="space-y-2">
            {Object.entries(checks).map(([key, status]) => (
              <div key={key} className="flex justify-between items-center py-2 border-b">
                <code className="text-sm bg-gray-100 px-2 py-1 rounded">{key}</code>
                <span className="text-sm">{status}</span>
              </div>
            ))}
          </div>
          
          <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
            <h3 className="font-semibold text-yellow-800 mb-2">⚠️ Important Note</h3>
            <p className="text-sm text-yellow-700">
              For security reasons, server-side environment variables (without NEXT_PUBLIC_ prefix) 
              cannot be accessed in client components. The actual RESEND_API_KEY should be in your 
              .env.local file as:
            </p>
            <pre className="mt-2 bg-white p-2 rounded text-xs">
              RESEND_API_KEY=re_xxxxxxxxxxxx
            </pre>
            <p className="text-sm text-yellow-700 mt-2">
              This key is only accessible on the server side (API routes, server components).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 
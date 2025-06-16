'use client';

import { useState, useEffect } from 'react';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

export default function EmailTestPage() {
  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkConfiguration();
  }, []);

  const checkConfiguration = async () => {
    try {
      const response = await fetch('/api/test-email');
      const data = await response.json();
      setConfig(data);
    } catch (error) {
      setConfig({ error: 'Failed to check configuration' });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold">Email Configuration Test</h1>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="mb-4">
            <h2 className="text-xl font-semibold">Configuration Status</h2>
            <p className="text-gray-600 text-sm">
              Check if your email service is properly configured
            </p>
          </div>
          <div>
            {config.error ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start">
                  <XCircle className="h-5 w-5 text-red-500 mr-3 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-red-800">Configuration Error</h3>
                    <div className="mt-2 text-red-700">
                      <p className="mb-2">{config.error}</p>
                      {config.instructions && (
                        <div className="mt-4">
                          <p className="font-semibold mb-2">To fix this:</p>
                          <ol className="list-decimal list-inside space-y-1">
                            {config.instructions.map((instruction: string, index: number) => (
                              <li key={index} className="text-sm">{instruction}</li>
                            ))}
                          </ol>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
                  <div>
                    <h3 className="font-semibold text-green-800">{config.message}</h3>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 
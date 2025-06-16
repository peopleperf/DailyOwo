'use client';

import { useState } from 'react';
import { GlassContainer } from '@/components/ui/GlassContainer';
import { GlassButton } from '@/components/ui/GlassButton';
import { Icon } from '@/components/ui/Icon';
import { isFirebaseConfigured, FIREBASE_SETUP_INSTRUCTIONS } from '@/lib/firebase/config';

export function FirebaseSetupNotice() {
  const [showInstructions, setShowInstructions] = useState(false);

  if (isFirebaseConfigured()) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-md">
      <GlassContainer className="p-4" goldBorder>
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 glass-subtle rounded-full flex items-center justify-center flex-shrink-0">
            <Icon name="alert" size="sm" className="text-gold" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-primary mb-1">
              Firebase Not Configured
            </h3>
            <p className="text-sm text-primary/70 mb-3">
              Firebase authentication is required for full functionality. The app is running in demo mode.
            </p>
            <GlassButton
              variant="secondary"
              size="sm"
              onClick={() => setShowInstructions(!showInstructions)}
            >
              {showInstructions ? 'Hide' : 'Show'} Setup Instructions
              <Icon 
                name={showInstructions ? 'chevronUp' : 'chevronDown'} 
                size="sm" 
                className="ml-1" 
              />
            </GlassButton>
          </div>
        </div>
        
        {showInstructions && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <pre className="text-xs text-primary/80 whitespace-pre-wrap font-mono bg-gray-50 p-3 rounded-lg overflow-x-auto">
              {FIREBASE_SETUP_INSTRUCTIONS}
            </pre>
          </div>
        )}
      </GlassContainer>
    </div>
  );
} 
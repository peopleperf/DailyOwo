'use client';

import { Suspense } from 'react';
import JoinFamilyContent from './JoinFamilyContent';

export default function JoinFamilyPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <JoinFamilyContent />
    </Suspense>
  );
}
'use client';

import dynamic from "next/dynamic";

const AccountSection = dynamic(() => import("@/components/settings/AccountSection"), {
  ssr: false,
});

export default function AccountSettingsPage() {
  return <AccountSection />;
}

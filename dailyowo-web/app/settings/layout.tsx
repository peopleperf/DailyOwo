import React from "react";
import SettingsSidebar from "@/components/settings/SettingsSidebar";

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen bg-white">
      {/* Subtle background blobs */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-50 via-white to-gray-50" />
        <div className="absolute top-20 -left-32 w-[500px] h-[500px] bg-gold/[0.03] rounded-full mix-blend-multiply filter blur-3xl" />
        <div className="absolute top-60 -right-32 w-[500px] h-[500px] bg-primary/[0.03] rounded-full mix-blend-multiply filter blur-3xl" />
      </div>

      <div className="flex min-h-screen">
        <SettingsSidebar />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}

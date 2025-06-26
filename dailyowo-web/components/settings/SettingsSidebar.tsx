"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useParams } from "next/navigation";
import { LogOut, Menu, User, Sliders, Users, Shield, Brain } from "lucide-react";
import { GlassButton } from "@/components/ui/GlassButton";
import { GlassContainer } from "@/components/ui/GlassContainer";
import { useAuth } from "@/lib/firebase/auth-context";

interface SidebarItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  href: string;
}

const SIDEBAR_ITEMS: SidebarItem[] = [
  { id: "account", label: "Account", icon: <User className="w-4 h-4" />, href: "account" },
  { id: "preferences", label: "Preferences", icon: <Sliders className="w-4 h-4" />, href: "preferences" },
  { id: "ai", label: "AI Settings", icon: <Brain className="w-4 h-4" />, href: "ai" },
  { id: "family", label: "Family", icon: <Users className="w-4 h-4" />, href: "family" },
  { id: "security", label: "Security", icon: <Shield className="w-4 h-4" />, href: "security" },
];

export default function SettingsSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const params = useParams<{ locale: string }>();
  const locale = params?.locale ?? "en";
  const { logout } = useAuth();

  const toggleCollapsed = () => setCollapsed(!collapsed);

  return (
    <aside
      className={`transition-all duration-300 h-full bg-white/30 backdrop-blur-lg border-r border-white/50 flex flex-col ${
        collapsed ? "w-16" : "w-64"
      }`}
    >
      {/* brand + toggle */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/50">
        {!collapsed && (
          <span className="text-lg font-semibold text-primary">DailyOwo</span>
        )}
        <button
          onClick={toggleCollapsed}
          className="p-2 rounded-lg hover:bg-white/40 transition-colors"
        >
          <Menu className="w-5 h-5 text-primary" />
        </button>
      </div>

      {/* nav items */}
      <nav className="flex-1 overflow-y-auto py-4 space-y-1">
        {SIDEBAR_ITEMS.map(item => {
          const active = pathname?.includes(`/settings/${item.href}`);
          return (
            <Link key={item.id} href={`/${locale}/settings/${item.href}`} className="block px-3">
              <GlassButton
                variant={active ? "primary" : "ghost"}
                className="w-full flex items-center gap-3 justify-start py-2"
              >
                {item.icon}
                {!collapsed && <span>{item.label}</span>}
              </GlassButton>
            </Link>
          );
        })}
      </nav>

      {/* logout */}
      <div className="p-4 border-t border-white/50">
        <GlassButton
          variant="ghost"
          className="w-full flex items-center gap-3 justify-start py-2"
          onClick={logout}
        >
          <LogOut className="w-4 h-4" />
          {!collapsed && <span>Log out</span>}
        </GlassButton>
      </div>
    </aside>
  );
}

"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, Database, Cpu, Key, Rocket,
  MessageSquare, LogOut, Menu, X, ChevronRight, User, Users, Trophy
} from "lucide-react";
import { api } from "@/lib/api";
import AttestlyLogo from "@/components/AttestlyLogo";
import ThemeToggle from "@/components/ThemeToggle";

const NAV_ITEMS = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Overview" },
  { href: "/dashboard/datasets", icon: Database, label: "Datasets" },
  { href: "/dashboard/jobs", icon: Cpu, label: "Fine-Tuning" },
  { href: "/dashboard/deployments", icon: Rocket, label: "Deployments" },
  { href: "/dashboard/keys", icon: Key, label: "API Keys" },
  { href: "/dashboard/playground", icon: MessageSquare, label: "Playground" },
  { href: "/community", icon: Users, label: "Community Models" },
  { href: "/leaderboard", icon: Trophy, label: "Leaderboard" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const token = api.getToken();
    if (!token) { router.push("/login"); return; }
    const stored = localStorage.getItem("forgeai_user");
    if (stored) setUser(JSON.parse(stored));
  }, [router]);

  const handleLogout = () => {
    api.clearToken();
    router.push("/login");
  };

  return (
    <div className="min-h-screen flex bg-background selection:bg-attestly-500/30">
      {/* Sidebar — Desktop */}
      <aside className="hidden lg:flex flex-col w-64 border-r border-structural bg-surface-1 shrink-0">
        <div className="h-20 flex items-center gap-3 px-6 border-b border-structural">
          <AttestlyLogo className="w-8 h-8" />
          <span className="text-xl font-display font-bold tracking-tight text-text-primary uppercase">ATTESTLY</span>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2">
          {NAV_ITEMS.map(item => {
            const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
            return (
              <Link key={item.href} href={item.href}
                className={`flex items-center gap-4 px-4 py-3 text-sm font-display font-medium uppercase tracking-wider transition-all ${
                  active ? "bg-text-primary text-background" : "text-text-secondary hover:text-text-primary hover:bg-surface-2"
                }`}>
                <item.icon className="w-4.5 h-4.5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-structural">
          <div className="flex items-center gap-3 px-4 py-3 bg-surface-2 mb-3 border border-structural">
            <div className="w-8 h-8 flex items-center justify-center bg-background border border-structural">
              <User className="w-4 h-4 text-attestly-500" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-display font-bold uppercase truncate text-text-primary">{user?.username || "User"}</div>
              <div className="text-[10px] text-text-muted truncate uppercase tracking-widest">{user?.email || ""}</div>
            </div>
          </div>
          <button onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm font-display font-bold uppercase tracking-wider text-text-muted hover:text-accent-rose hover:bg-surface-2 border border-transparent hover:border-structural transition-all">
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
            <motion.aside initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }}
              transition={{ type: "spring", damping: 25 }}
              className="fixed left-0 top-0 bottom-0 w-64 bg-surface-1 border-r border-structural z-50 lg:hidden flex flex-col">
              <div className="h-20 flex items-center justify-between px-6 border-b border-structural">
                <div className="flex items-center gap-3">
                  <AttestlyLogo className="w-7 h-7" />
                  <span className="font-display font-bold uppercase text-lg">ATTESTLY</span>
                </div>
                <button onClick={() => setSidebarOpen(false)}><X className="w-6 h-6 text-text-primary" /></button>
              </div>
              <nav className="flex-1 px-4 py-6 space-y-2">
                {NAV_ITEMS.map(item => {
                  const active = pathname === item.href;
                  return (
                    <Link key={item.href} href={item.href} onClick={() => setSidebarOpen(false)}
                      className={`flex items-center gap-4 px-4 py-3 text-sm font-display font-medium uppercase tracking-wider transition-all ${
                        active ? "bg-text-primary text-background" : "text-text-secondary"
                      }`}>
                      <item.icon className="w-4.5 h-4.5" /> {item.label}
                    </Link>
                  );
                })}
              </nav>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-20 flex items-center justify-between px-8 border-b border-structural bg-background shrink-0">
          <div className="flex items-center gap-4">
            <button className="lg:hidden" onClick={() => setSidebarOpen(true)}>
              <Menu className="w-6 h-6 text-text-primary" />
            </button>
            <div className="hidden sm:flex items-center gap-3 text-sm font-display font-medium uppercase tracking-widest text-text-muted">
              <Link href="/dashboard" className="hover:text-text-primary transition-colors">Dashboard</Link>
              {pathname !== "/dashboard" && (
                <>
                  <ChevronRight className="w-4 h-4" />
                  <span className="text-text-primary">{pathname.split("/").pop()}</span>
                </>
              )}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <span className="text-xs font-mono text-text-muted hidden sm:block">v0.1.0</span>
            <div className="w-2 h-2 rounded-none bg-attestly-emerald animate-pulse" title="System healthy" />
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-8 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

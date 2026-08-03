"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Database, Cpu, Rocket, Key, Zap } from "lucide-react";
import Link from "next/link";

const STATS = [
  { label: "Datasets", value: "3", icon: Database, color: "#14B8A6", href: "/dashboard/datasets" },
  { label: "Training Jobs", value: "7", icon: Cpu, color: "#0D9488", href: "/dashboard/jobs" },
  { label: "Deployments", value: "2", icon: Rocket, color: "#16A34A", href: "/dashboard/deployments" },
  { label: "API Keys", value: "4", icon: Key, color: "#22C55E", href: "/dashboard/keys" },
];

const RECENT_JOBS = [
  { id: "1", name: "Customer Support Bot v2", model: "Llama 3.1 8B", status: "completed", progress: 100, time: "2h ago" },
  { id: "2", name: "Code Assistant", model: "Mistral 7B", status: "training", progress: 67, time: "Running" },
  { id: "3", name: "Medical QA", model: "Qwen 2.5 7B", status: "queued", progress: 0, time: "Queued" },
  { id: "4", name: "Legal Document Analyzer", model: "Phi-3.5 Mini", status: "completed", progress: 100, time: "1d ago" },
];

const STATUS_COLORS: Record<string, string> = {
  completed: "#14B8A6",
  training: "#0D9488",
  queued: "#F59E0B",
  failed: "#E11D48",
  pending: "#64748B",
};

export default function DashboardOverview() {
  const [user, setUser] = useState<any>(null);
  useEffect(() => {
    const stored = localStorage.getItem("forgeai_user");
    if (stored) setUser(JSON.parse(stored));
  }, []);

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Welcome */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-display font-bold uppercase tracking-tight mb-2">Workspace overview</h1>
        <p className="text-text-secondary text-sm font-light">
          {user ? `Welcome back, ${user.full_name || user.username}. ` : ""}
          Manage your models, datasets, and deployments.
        </p>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-[1px] bg-structural border border-structural">
        {STATS.map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            transition={{ delay: i * 0.08 }}>
            <Link href={s.href} className="bg-surface-1 p-6 flex flex-col gap-4 group block hover:bg-surface-2 transition-colors duration-300 h-full">
              <div className="flex items-center justify-between">
                <s.icon className="w-6 h-6 group-hover:scale-110 transition-transform duration-300" style={{ color: s.color }} />
                <span className="text-4xl font-display font-bold">{s.value}</span>
              </div>
              <span className="text-sm text-text-muted font-display uppercase tracking-widest">{s.label}</span>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Recent Jobs + Quick Actions */}
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Recent Jobs */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="lg:col-span-2 bg-surface-1 border border-structural">
          <div className="flex items-center justify-between px-8 py-5 border-b border-structural">
            <h2 className="text-sm font-display font-bold uppercase tracking-widest">Recent Training Jobs</h2>
            <Link href="/dashboard/jobs" className="text-xs text-attestly-500 hover:text-attestly-400 font-bold uppercase">View all</Link>
          </div>
          <div className="divide-y divide-structural">
            {RECENT_JOBS.map(job => (
              <div key={job.id} className="px-8 py-5 flex items-center gap-6 hover:bg-surface-2 transition-colors">
                <div className="w-2 h-2 shrink-0" style={{ background: STATUS_COLORS[job.status] }} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold uppercase truncate">{job.name}</div>
                  <div className="text-xs text-text-muted mt-1 font-mono">{job.model}</div>
                </div>
                {job.status === "training" && (
                  <div className="w-24 h-1 bg-surface-3 overflow-hidden">
                    <div className="h-full bg-attestly-500 transition-all" style={{ width: `${job.progress}%` }} />
                  </div>
                )}
                <div className="text-xs text-text-muted shrink-0 font-mono">{job.time}</div>
                <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider border"
                  style={{ borderColor: STATUS_COLORS[job.status], color: STATUS_COLORS[job.status] }}>
                  {job.status}
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="space-y-8">
          <div className="bg-surface-1 border border-structural p-8">
            <h2 className="text-sm font-display font-bold uppercase tracking-widest mb-6">Quick Actions</h2>
            <div className="space-y-3">
              {[
                { label: "Upload Dataset", href: "/dashboard/datasets", icon: Database },
                { label: "New Training Job", href: "/dashboard/jobs", icon: Cpu },
                { label: "Deploy Model", href: "/dashboard/deployments", icon: Rocket },
                { label: "Test in Playground", href: "/dashboard/playground", icon: Zap },
              ].map(a => (
                <Link key={a.label} href={a.href}
                  className="flex items-center gap-4 px-4 py-3 bg-background border border-structural hover:border-attestly-500 transition-all group">
                  <a.icon className="w-5 h-5 text-text-muted group-hover:text-attestly-500 transition-colors" />
                  <span className="text-xs font-display font-bold uppercase tracking-wider text-text-secondary group-hover:text-text-primary transition-colors">{a.label}</span>
                </Link>
              ))}
            </div>
          </div>

          <div className="bg-surface-1 border border-structural p-8">
            <h2 className="text-sm font-display font-bold uppercase tracking-widest mb-6">System Status</h2>
            <div className="space-y-4">
              {[
                { label: "API Gateway", status: "Operational" },
                { label: "Training Fleet", status: "Operational" },
                { label: "Model Serving", status: "Operational" },
              ].map(s => (
                <div key={s.label} className="flex items-center justify-between text-xs font-display font-medium uppercase tracking-wider">
                  <span className="text-text-secondary">{s.label}</span>
                  <span className="flex items-center gap-2 text-attestly-emerald">
                    <span className="w-1.5 h-1.5 bg-attestly-emerald" /> {s.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

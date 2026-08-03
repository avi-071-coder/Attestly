"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Key, Plus, Copy, Trash2, Check, X, Eye, EyeOff, Shield } from "lucide-react";

interface APIKeyItem {
  id: string; name: string; prefix: string; created: string;
  lastUsed: string | null; isActive: boolean; fullKey?: string;
}

const DEMO_KEYS: APIKeyItem[] = [
  { id: "1", name: "Production API", prefix: "fai_aBcDeFg1", created: "2026-07-20", lastUsed: "2 min ago", isActive: true },
  { id: "2", name: "Development", prefix: "fai_xYz12345", created: "2026-07-15", lastUsed: "3h ago", isActive: true },
  { id: "3", name: "CI/CD Pipeline", prefix: "fai_PqRsT678", created: "2026-07-10", lastUsed: null, isActive: false },
];

export default function KeysPage() {
  const [keys, setKeys] = useState<APIKeyItem[]>(DEMO_KEYS);
  const [showNew, setShowNew] = useState(false);
  const [newName, setNewName] = useState("");
  const [newKey, setNewKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleCreate = () => {
    if (!newName) return;
    const raw = `fai_${Array.from({ length: 48 }, () => "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"[Math.floor(Math.random() * 62)]).join("")}`;
    const k: APIKeyItem = { id: String(Date.now()), name: newName, prefix: raw.slice(0, 12),
      created: new Date().toISOString().split("T")[0], lastUsed: null, isActive: true, fullKey: raw };
    setKeys(prev => [k, ...prev]);
    setNewKey(raw);
    setNewName("");
  };

  const copyKey = () => {
    if (newKey) { navigator.clipboard.writeText(newKey); setCopied(true); setTimeout(() => setCopied(false), 2000); }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-xl font-bold">API Keys</h1>
          <p className="text-sm text-text-secondary mt-1">Manage your API access credentials</p></div>
        <button onClick={() => { setShowNew(true); setNewKey(null); }}
          className="px-6 py-3 bg-text-primary text-background text-sm font-display font-bold uppercase tracking-widest flex items-center gap-2 hover:bg-attestly-500 hover:text-white transition-colors">
          <Plus className="w-4 h-4" /> Create Key
        </button>
      </div>

      {/* Security Notice */}
      <div className="bg-surface-1 border border-structural p-4 flex items-start gap-3 border-accent-cyan/20">
        <Shield className="w-5 h-5 text-accent-cyan shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-accent-cyan">Security Notice</p>
          <p className="text-xs text-text-secondary mt-0.5">API keys are shown only once at creation. Store them securely — we hash them with SHA-256 and cannot recover lost keys.</p>
        </div>
      </div>

      {/* Create Key Modal */}
      <AnimatePresence>
        {showNew && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center px-6" onClick={() => setShowNew(false)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              onClick={e => e.stopPropagation()} className="bg-surface-1 border border-structural p-8 w-full max-w-md">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold">{newKey ? "Key Created!" : "Create API Key"}</h2>
                <button onClick={() => setShowNew(false)}><X className="w-5 h-5 text-text-muted" /></button>
              </div>
              {!newKey ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-text-secondary mb-1">Key Name</label>
                    <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="e.g., Production API"
                      className="w-full px-4 py-2.5 rounded-xl bg-surface-2 border border-border-default text-sm focus:border-forge-500 focus:outline-none" />
                  </div>
                  <button onClick={handleCreate} disabled={!newName}
                    className="w-full mt-4 py-4 bg-text-primary text-background font-display font-bold uppercase tracking-widest text-sm hover:bg-attestly-500 hover:text-white disabled:opacity-50 transition-colors">
                    Generate Key
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-accent-cyan/5 border border-accent-cyan/20">
                    <p className="text-xs text-accent-amber mb-2 font-medium">⚠️ Copy this key now — it won&apos;t be shown again!</p>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 text-xs font-mono text-accent-cyan break-all bg-surface-2 p-2 rounded-lg">{newKey}</code>
                      <button onClick={copyKey} className="p-2 rounded-lg bg-surface-3 hover:bg-surface-4 transition-colors shrink-0">
                        {copied ? <Check className="w-4 h-4 text-accent-cyan" /> : <Copy className="w-4 h-4 text-text-muted" />}
                      </button>
                    </div>
                  </div>
                  <button onClick={() => setShowNew(false)}
                    className="w-full py-3 rounded-xl border border-border-default text-sm font-medium hover:bg-surface-3 transition-all">
                    Done
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Keys List */}
      <div className="space-y-3">
        {keys.map((k, i) => (
          <motion.div key={k.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className={`bg-surface-1 border border-structural p-6 flex items-center gap-4 ${!k.isActive ? "opacity-50" : ""}`}>
            <div className="w-10 h-10 rounded-xl bg-accent-rose/10 border border-accent-rose/20 flex items-center justify-center shrink-0">
              <Key className="w-5 h-5 text-accent-rose" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold">{k.name}</div>
              <div className="text-xs font-mono text-text-muted mt-0.5">{k.prefix}••••••••</div>
            </div>
            <div className="flex items-center gap-4 shrink-0 text-xs text-text-muted">
              <span>Created {k.created}</span>
              {k.lastUsed && <span>Used {k.lastUsed}</span>}
              <span className={`px-2 py-0.5 rounded-md font-medium ${k.isActive ? "bg-accent-cyan/10 text-accent-cyan" : "bg-surface-3 text-text-muted"}`}>
                {k.isActive ? "Active" : "Revoked"}
              </span>
              {k.isActive && (
                <button onClick={() => setKeys(ks => ks.map(x => x.id === k.id ? { ...x, isActive: false } : x))}
                  className="p-1.5 rounded-lg hover:bg-accent-rose/10 text-text-muted hover:text-accent-rose transition-all">
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

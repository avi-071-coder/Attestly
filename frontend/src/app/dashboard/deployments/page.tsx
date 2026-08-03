"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Rocket, Power, Trash2, Globe, ExternalLink, Activity } from "lucide-react";

interface Depl {
  id: string; name: string; model: string; backend: string; endpoint: string;
  active: boolean; requests: number; tokensIn: number; tokensOut: number; created: string;
}

const DEMO: Depl[] = [
  { id: "1", name: "support-bot-v2", model: "Llama 3.1 8B", backend: "ollama", endpoint: "/v1/deployments/support-bot-v2/inference",
    active: true, requests: 12450, tokensIn: 2_340_000, tokensOut: 1_870_000, created: "2026-07-28" },
  { id: "2", name: "code-review", model: "Mistral 7B", backend: "vllm", endpoint: "/v1/deployments/code-review/inference",
    active: false, requests: 3200, tokensIn: 890_000, tokensOut: 560_000, created: "2026-07-25" },
];

function fmtNum(n: number) { return n >= 1_000_000 ? (n / 1_000_000).toFixed(1) + "M" : n >= 1_000 ? (n / 1_000).toFixed(1) + "K" : String(n); }

export default function DeploymentsPage() {
  const [depls, setDepls] = useState<Depl[]>(DEMO);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold">Deployments</h1>
        <p className="text-sm text-text-secondary mt-1">Manage your model endpoints</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {depls.map((d, i) => (
          <motion.div key={d.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }} className="bg-surface-1 border border-structural p-8 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${d.active ? "bg-accent-cyan/10 border border-accent-cyan/20" : "bg-surface-3"}`}>
                  <Rocket className={`w-5 h-5 ${d.active ? "text-accent-cyan" : "text-text-muted"}`} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold">{d.name}</h3>
                  <p className="text-xs text-text-muted">{d.model} · {d.backend}</p>
                </div>
              </div>
              <div className={`w-2 h-2 rounded-full ${d.active ? "bg-accent-cyan animate-pulse" : "bg-text-muted"}`} />
            </div>

            <div className="p-3 rounded-lg bg-surface-2 font-mono text-xs text-text-secondary break-all">
              <span className="text-text-muted">POST</span> {d.endpoint}
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="text-center p-3 rounded-lg bg-surface-2">
                <div className="text-lg font-bold">{fmtNum(d.requests)}</div>
                <div className="text-[10px] text-text-muted">Requests</div>
              </div>
              <div className="text-center p-3 rounded-lg bg-surface-2">
                <div className="text-lg font-bold">{fmtNum(d.tokensIn)}</div>
                <div className="text-[10px] text-text-muted">Tokens In</div>
              </div>
              <div className="text-center p-3 rounded-lg bg-surface-2">
                <div className="text-lg font-bold">{fmtNum(d.tokensOut)}</div>
                <div className="text-[10px] text-text-muted">Tokens Out</div>
              </div>
            </div>

            <div className="flex gap-2">
              <button onClick={() => setDepls(ds => ds.map(x => x.id === d.id ? { ...x, active: !x.active } : x))}
                className={`flex-1 py-2 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 transition-all ${
                  d.active ? "bg-accent-amber/10 text-accent-amber border border-accent-amber/20 hover:bg-accent-amber/15"
                    : "bg-accent-cyan/10 text-accent-cyan border border-accent-cyan/20 hover:bg-accent-cyan/15"}`}>
                <Power className="w-3.5 h-3.5" /> {d.active ? "Stop" : "Start"}
              </button>
              <button onClick={() => setDepls(ds => ds.filter(x => x.id !== d.id))}
                className="px-4 py-2 rounded-xl text-xs font-medium bg-accent-rose/10 text-accent-rose border border-accent-rose/20 hover:bg-accent-rose/15 transition-all flex items-center gap-1.5">
                <Trash2 className="w-3.5 h-3.5" /> Delete
              </button>
            </div>
          </motion.div>
        ))}

        {depls.length === 0 && (
          <div className="col-span-2 text-center py-16 text-text-muted">
            <Rocket className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No deployments yet. Complete a training job first.</p>
          </div>
        )}
      </div>
    </div>
  );
}

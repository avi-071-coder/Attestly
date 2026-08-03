"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Cpu, Plus, X, Play, Square, Clock, Check, AlertTriangle, Loader2,
  Share2, Shield, Eye, Lock, CheckCircle2, AlertOctagon, Tag
} from "lucide-react";
import { api } from "@/lib/api";

const MODELS = [
  { id: "meta-llama/Llama-3.1-8B", name: "Llama 3.1 8B", provider: "Meta", vram: "6 GB" },
  { id: "mistralai/Mistral-7B-v0.3", name: "Mistral 7B v0.3", provider: "Mistral AI", vram: "6 GB" },
  { id: "Qwen/Qwen2.5-7B", name: "Qwen 2.5 7B", provider: "Alibaba", vram: "6 GB" },
  { id: "microsoft/Phi-3.5-mini-instruct", name: "Phi-3.5 Mini", provider: "Microsoft", vram: "4 GB" },
  { id: "google/gemma-2-9b", name: "Gemma 2 9B", provider: "Google", vram: "8 GB" },
  { id: "deepseek-ai/DeepSeek-V2-Lite", name: "DeepSeek V2 Lite", provider: "DeepSeek", vram: "10 GB" },
  { id: "tiiuae/falcon-7b", name: "Falcon 7B", provider: "TII", vram: "6 GB" },
];

interface Job {
  id: string;
  name: string;
  model: string;
  status: string;
  progress: number;
  loss: number | null;
  epoch: string;
  created: string;
  is_public?: boolean;
  public_title?: string;
  public_description?: string;
  tags?: string;
  sample_count?: number;
  public_usage_count?: number;
}

const DEMO_JOBS: Job[] = [
  {
    id: "1",
    name: "Customer Support Bot v2",
    model: "Llama 3.1 8B",
    status: "completed",
    progress: 100,
    loss: 0.342,
    epoch: "3/3",
    created: "2h ago",
    is_public: false,
    sample_count: 1200,
    public_usage_count: 0
  },
  {
    id: "2",
    name: "Code Review Assistant",
    model: "Mistral 7B",
    status: "training",
    progress: 67,
    loss: 0.518,
    epoch: "2/3",
    created: "45m ago",
    is_public: false,
    sample_count: 3400
  },
  {
    id: "3",
    name: "Medical QA v1",
    model: "Qwen 2.5 7B",
    status: "queued",
    progress: 0,
    loss: null,
    epoch: "0/3",
    created: "10m ago",
    is_public: false,
    sample_count: 850
  },
  {
    id: "4",
    name: "Legal Summarizer",
    model: "Phi-3.5 Mini",
    status: "failed",
    progress: 45,
    loss: null,
    epoch: "1/3",
    created: "5h ago",
    is_public: false,
    sample_count: 420
  },
];

const SC: Record<string, { color: string; icon: any; label: string }> = {
  completed: { color: "#06d6a0", icon: Check, label: "Completed" },
  training: { color: "#667eea", icon: Loader2, label: "Training" },
  queued: { color: "#ffd166", icon: Clock, label: "Queued" },
  failed: { color: "#ef476f", icon: AlertTriangle, label: "Failed" },
  pending: { color: "#a0a0b8", icon: Clock, label: "Pending" },
};

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>(DEMO_JOBS);
  const [showNew, setShowNew] = useState(false);
  const [newJob, setNewJob] = useState({
    name: "",
    model: MODELS[0].id,
    dataset: "customer_support_v2",
    lora_r: 16,
    lora_alpha: 32,
    lr: 0.0002,
    epochs: 3,
    batch: 4,
    seq_len: 512,
    use_4bit: true,
  });

  // Opt-in Share Modal state
  const [shareJob, setShareJob] = useState<Job | null>(null);
  const [publicTitle, setPublicTitle] = useState("");
  const [publicDesc, setPublicDesc] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [ackWarning, setAckWarning] = useState(false);
  const [shareLoading, setShareLoading] = useState(false);
  const [shareError, setShareError] = useState<string | null>(null);

  const handleCreate = () => {
    const model = MODELS.find((m) => m.id === newJob.model);
    const j: Job = {
      id: String(Date.now()),
      name: newJob.name,
      model: model?.name || newJob.model,
      status: "queued",
      progress: 0,
      loss: null,
      epoch: `0/${newJob.epochs}`,
      created: "Just now",
      is_public: false,
      sample_count: 500,
    };
    setJobs((prev) => [j, ...prev]);
    setShowNew(false);
    setNewJob({ ...newJob, name: "" });
  };

  const openShareModal = (job: Job) => {
    setShareJob(job);
    setPublicTitle(job.public_title || job.name);
    setPublicDesc(
      job.public_description ||
        `Fine-tuned adapter for ${job.name} built on base model ${job.model}.`
    );
    setTagsInput(job.tags || "Legal, Summarization, Fine-Tune");
    setAckWarning(false);
    setShareError(null);
  };

  const handleTogglePublish = async () => {
    if (!shareJob) return;

    if (!shareJob.is_public && !ackWarning) {
      setShareError("You must acknowledge the privacy & data leakage warning before publishing.");
      return;
    }

    setShareLoading(true);
    setShareError(null);

    try {
      if (shareJob.is_public) {
        // Unpublish
        await api.unpublishJobModel(shareJob.id).catch(() => {});
        setJobs((prev) =>
          prev.map((j) => (j.id === shareJob.id ? { ...j, is_public: false } : j))
        );
      } else {
        // Publish
        await api
          .publishJobModel(shareJob.id, {
            public_title: publicTitle,
            public_description: publicDesc,
            tags: tagsInput,
            acknowledge_leakage_warning: ackWarning,
          })
          .catch(() => {});

        setJobs((prev) =>
          prev.map((j) =>
            j.id === shareJob.id
              ? {
                  ...j,
                  is_public: true,
                  public_title: publicTitle,
                  public_description: publicDesc,
                  tags: tagsInput,
                }
              : j
          )
        );
      }
      setShareJob(null);
    } catch (err: any) {
      setShareError(err.message || "Failed to update public status.");
    } finally {
      setShareLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold font-display uppercase tracking-tight">Fine-Tuning Jobs</h1>
          <p className="text-sm text-text-secondary mt-1">Train & manage LoRA/QLoRA adapters on open models</p>
        </div>
        <button
          onClick={() => setShowNew(true)}
          className="px-6 py-3 bg-text-primary text-background text-sm font-display font-bold uppercase tracking-widest flex items-center gap-2 hover:bg-attestly-500 hover:text-white transition-colors"
        >
          <Plus className="w-4 h-4" /> New Job
        </button>
      </div>

      {/* New Job Modal */}
      <AnimatePresence>
        {showNew && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center px-6 overflow-y-auto py-8"
            onClick={() => setShowNew(false)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-surface-1 border border-structural p-8 w-full max-w-lg"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold font-display uppercase">Create Fine-Tuning Job</h2>
                <button onClick={() => setShowNew(false)}>
                  <X className="w-5 h-5 text-text-muted hover:text-text-primary" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-display font-bold uppercase tracking-wider text-text-secondary mb-1">
                    Job Name
                  </label>
                  <input
                    value={newJob.name}
                    onChange={(e) => setNewJob({ ...newJob, name: e.target.value })}
                    className="w-full px-4 py-2.5 bg-background border border-structural text-sm focus:border-attestly-500 focus:outline-none font-mono"
                    placeholder="My Legal Contract Fine-Tune"
                  />
                </div>
                <div>
                  <label className="block text-xs font-display font-bold uppercase tracking-wider text-text-secondary mb-1">
                    Base Model
                  </label>
                  <select
                    value={newJob.model}
                    onChange={(e) => setNewJob({ ...newJob, model: e.target.value })}
                    className="w-full px-4 py-2.5 bg-background border border-structural text-sm focus:border-attestly-500 focus:outline-none font-mono"
                  >
                    {MODELS.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} — {m.provider} ({m.vram})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-display font-bold uppercase tracking-wider text-text-secondary mb-1">
                      LoRA Rank (r)
                    </label>
                    <input
                      type="number"
                      value={newJob.lora_r}
                      onChange={(e) => setNewJob({ ...newJob, lora_r: +e.target.value })}
                      className="w-full px-3 py-2 bg-background border border-structural text-sm font-mono focus:border-attestly-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-display font-bold uppercase tracking-wider text-text-secondary mb-1">
                      LoRA Alpha
                    </label>
                    <input
                      type="number"
                      value={newJob.lora_alpha}
                      onChange={(e) => setNewJob({ ...newJob, lora_alpha: +e.target.value })}
                      className="w-full px-3 py-2 bg-background border border-structural text-sm font-mono focus:border-attestly-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-display font-bold uppercase tracking-wider text-text-secondary mb-1">
                      Learning Rate
                    </label>
                    <input
                      type="number"
                      step="0.0001"
                      value={newJob.lr}
                      onChange={(e) => setNewJob({ ...newJob, lr: +e.target.value })}
                      className="w-full px-3 py-2 bg-background border border-structural text-sm font-mono focus:border-attestly-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-display font-bold uppercase tracking-wider text-text-secondary mb-1">
                      Epochs
                    </label>
                    <input
                      type="number"
                      value={newJob.epochs}
                      onChange={(e) => setNewJob({ ...newJob, epochs: +e.target.value })}
                      className="w-full px-3 py-2 bg-background border border-structural text-sm font-mono focus:border-attestly-500 focus:outline-none"
                    />
                  </div>
                </div>
                <label className="flex items-center gap-2 cursor-pointer pt-2">
                  <input
                    type="checkbox"
                    checked={newJob.use_4bit}
                    onChange={(e) => setNewJob({ ...newJob, use_4bit: e.target.checked })}
                    className="w-4 h-4 accent-attestly-500"
                  />
                  <span className="text-xs font-display font-bold uppercase tracking-wider text-text-secondary">
                    Use 4-bit Quantization (QLoRA)
                  </span>
                </label>
                <button
                  onClick={handleCreate}
                  disabled={!newJob.name}
                  className="w-full mt-4 py-4 bg-text-primary text-background font-display font-bold uppercase tracking-widest text-sm hover:bg-attestly-500 hover:text-white disabled:opacity-50 transition-colors"
                >
                  Start Training
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Opt-in Model Share Modal */}
      <AnimatePresence>
        {shareJob && (
          <div
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6"
            onClick={() => setShareJob(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-surface-1 border border-structural w-full max-w-xl p-8"
            >
              <div className="flex items-center justify-between mb-4 border-b border-structural pb-4">
                <div className="flex items-center gap-3">
                  <Share2 className="w-5 h-5 text-attestly-500" />
                  <h3 className="text-xl font-display font-bold uppercase">
                    {shareJob.is_public ? "Manage Public Sharing" : "Publish to Community Models"}
                  </h3>
                </div>
                <button onClick={() => setShareJob(null)}>
                  <X className="w-5 h-5 text-text-muted hover:text-text-primary" />
                </button>
              </div>

              {/* Data Leakage Warning Box */}
              {!shareJob.is_public && (
                <div className="p-4 bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs mb-6 space-y-2">
                  <div className="flex items-center gap-2 font-display font-bold uppercase tracking-wider text-amber-400">
                    <AlertTriangle className="w-4 h-4 shrink-0" /> Important Data Privacy Notice
                  </div>
                  <p className="leading-relaxed">
                    Fine-tuned models can sometimes leak details from their training data. Only share models trained on data you are comfortable being partially inferable.
                  </p>
                  <div className="flex items-center gap-2 text-[11px] font-mono text-attestly-emerald pt-1">
                    <Shield className="w-3.5 h-3.5" /> Note: Your raw uploaded dataset will NEVER be public or exposed.
                  </div>
                </div>
              )}

              {/* Small Dataset Guardrail Warning */}
              {shareJob.sample_count && shareJob.sample_count < 50 && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-300 text-xs font-mono mb-4 flex items-center gap-2">
                  <AlertOctagon className="w-4 h-4 text-red-400 shrink-0" />
                  Warning: Dataset contains only {shareJob.sample_count} samples (&lt;50). High memorization risk!
                </div>
              )}

              {shareError && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-mono mb-4">
                  {shareError}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-display font-bold uppercase tracking-wider text-text-secondary mb-1">
                    Public Model Title
                  </label>
                  <input
                    value={publicTitle}
                    onChange={(e) => setPublicTitle(e.target.value)}
                    disabled={shareJob.is_public}
                    className="w-full px-4 py-2.5 bg-background border border-structural text-sm focus:border-attestly-500 focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-display font-bold uppercase tracking-wider text-text-secondary mb-1">
                    Public Description & Use-Case
                  </label>
                  <textarea
                    rows={3}
                    value={publicDesc}
                    onChange={(e) => setPublicDesc(e.target.value)}
                    disabled={shareJob.is_public}
                    className="w-full p-3 bg-background border border-structural text-sm focus:border-attestly-500 focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-display font-bold uppercase tracking-wider text-text-secondary mb-1">
                    Category Tags (Comma-separated)
                  </label>
                  <input
                    value={tagsInput}
                    onChange={(e) => setTagsInput(e.target.value)}
                    disabled={shareJob.is_public}
                    placeholder="Legal, Summarization, Contracts"
                    className="w-full px-4 py-2.5 bg-background border border-structural text-sm focus:border-attestly-500 focus:outline-none font-mono"
                  />
                </div>

                {!shareJob.is_public && (
                  <label className="flex items-start gap-3 pt-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={ackWarning}
                      onChange={(e) => setAckWarning(e.target.checked)}
                      className="mt-0.5 w-4 h-4 accent-attestly-500"
                    />
                    <span className="text-xs text-text-secondary leading-relaxed">
                      I confirm this model contains no confidential or sensitive private data, and I understand fine-tuned weights will be published in the Community Models gallery.
                    </span>
                  </label>
                )}

                <div className="pt-4 flex items-center justify-between gap-4">
                  {shareJob.is_public ? (
                    <button
                      onClick={handleTogglePublish}
                      disabled={shareLoading}
                      className="w-full py-3.5 bg-red-600 text-white font-display font-bold uppercase tracking-widest text-xs hover:bg-red-700 transition-colors"
                    >
                      {shareLoading ? "Revoking Access..." : "Revoke Public Sharing (Unpublish)"}
                    </button>
                  ) : (
                    <button
                      onClick={handleTogglePublish}
                      disabled={shareLoading || !ackWarning}
                      className="w-full py-3.5 bg-text-primary text-background font-display font-bold uppercase tracking-widest text-xs hover:bg-attestly-500 hover:text-white disabled:opacity-50 transition-colors"
                    >
                      {shareLoading ? "Publishing..." : "Publish to Community Models"}
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Jobs List */}
      <div className="space-y-3">
        {jobs.map((j, i) => {
          const s = SC[j.status] || SC.pending;
          const Icon = s.icon;
          return (
            <motion.div
              key={j.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-surface-1 border border-structural p-6"
            >
              <div className="flex items-center gap-4">
                <div
                  className="w-10 h-10 flex items-center justify-center shrink-0"
                  style={{ background: `${s.color}12`, border: `1px solid ${s.color}20` }}
                >
                  <Icon
                    className={`w-5 h-5 ${j.status === "training" ? "animate-spin" : ""}`}
                    style={{ color: s.color }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <span className="text-base font-display font-bold uppercase tracking-tight truncate">
                      {j.name}
                    </span>
                    {j.is_public && (
                      <span className="px-2 py-0.5 bg-attestly-teal/10 border border-attestly-teal/30 text-attestly-teal text-[10px] font-mono font-bold uppercase">
                        Public Community
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-text-muted mt-0.5">
                    {j.model} · Epoch {j.epoch}
                  </div>
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  {j.loss !== null && (
                    <span className="text-xs font-mono text-text-secondary">
                      Loss: {j.loss.toFixed(3)}
                    </span>
                  )}
                  <span className="text-xs text-text-muted font-mono">{j.created}</span>
                  <span
                    className="px-2.5 py-1 text-[10px] font-display font-bold uppercase tracking-wider"
                    style={{ background: `${s.color}15`, color: s.color }}
                  >
                    {s.label}
                  </span>

                  {/* Opt-in Public Share Button for completed jobs */}
                  {j.status === "completed" && (
                    <button
                      onClick={() => openShareModal(j)}
                      className={`px-3 py-1.5 border text-xs font-display font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors ${
                        j.is_public
                          ? "bg-attestly-teal/20 border-attestly-teal text-attestly-teal hover:bg-attestly-teal/30"
                          : "bg-surface-2 border-structural text-text-secondary hover:border-attestly-500 hover:text-text-primary"
                      }`}
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      {j.is_public ? "Public" : "Share"}
                    </button>
                  )}
                </div>
              </div>
              {j.status === "training" && (
                <div className="mt-3 w-full h-1.5 bg-surface-3 border border-structural overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${j.progress}%` }}
                    className="h-full bg-attestly-500"
                  />
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

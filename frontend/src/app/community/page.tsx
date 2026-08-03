"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Shield, Tag, Cpu, Play, Terminal, ArrowRight, X,
  Layers, Users, AlertTriangle, Send, Loader2, CheckCircle2, Lock
} from "lucide-react";
import Link from "next/link";
import AttestlyLogo from "@/components/AttestlyLogo";
import ThemeToggle from "@/components/ThemeToggle";
import { api } from "@/lib/api";

interface CommunityModel {
  id: string;
  public_title: string;
  public_description: string;
  base_model: string;
  tags: string[];
  author_name: string;
  public_usage_count: number;
  created_at: string;
  dataset_sample_count?: number;
}

const CATEGORY_TAGS = ["All", "Legal", "Healthcare", "Coding", "Finance", "Summarization", "Chat"];

// Initial mock fallback community models so gallery is populated immediately
const INITIAL_COMMUNITY_MODELS: CommunityModel[] = [
  {
    id: "cm_legal_llama3",
    public_title: "LegalContract-LLaMA 3.1 8B",
    public_description: "Fine-tuned on 1,200 annotated commercial contracts. Specialized in identifying liability clauses, indemnity caps, and breach conditions.",
    base_model: "meta-llama/Llama-3.1-8B",
    tags: ["Legal", "Contract Analysis"],
    author_name: "lex_labs",
    public_usage_count: 1420,
    created_at: "2026-07-28T10:00:00Z",
    dataset_sample_count: 1200
  },
  {
    id: "cm_med_qwen7b",
    public_title: "BioDiagnostix-Qwen 2.5 7B",
    public_description: "Trained on anonymized clinical encounter summaries. Optimized for structuring unstructured physician notes into ICD-10 diagnostic codes.",
    base_model: "Qwen/Qwen2.5-7B",
    tags: ["Healthcare", "Diagnostics"],
    author_name: "health_ai",
    public_usage_count: 890,
    created_at: "2026-07-30T14:20:00Z",
    dataset_sample_count: 850
  },
  {
    id: "cm_code_mistral7b",
    public_title: "PyOptimizer-Mistral 7B",
    public_description: "Refined on Python async performance benchmarks. Converts blocking synchronous Python code into high-throughput asyncio constructs.",
    base_model: "mistralai/Mistral-7B-v0.3",
    tags: ["Coding", "Python"],
    author_name: "dev_ops_pro",
    public_usage_count: 2310,
    created_at: "2026-07-25T09:15:00Z",
    dataset_sample_count: 3400
  },
  {
    id: "cm_fin_phi35",
    public_title: "SEC-Extractor Phi 3.5",
    public_description: "Compact model fine-tuned for extracting key financial covenants, debt ratios, and EBITDA adjustments from 10-K filings.",
    base_model: "microsoft/Phi-3.5-mini",
    tags: ["Finance", "Summarization"],
    author_name: "alpha_quants",
    public_usage_count: 670,
    created_at: "2026-07-31T11:40:00Z",
    dataset_sample_count: 420
  }
];

export default function CommunityModelsPage() {
  const [models, setModels] = useState<CommunityModel[]>(INITIAL_COMMUNITY_MODELS);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState("All");
  const [activeTestModel, setActiveTestModel] = useState<CommunityModel | null>(null);
  
  // Test modal state
  const [promptInput, setPromptInput] = useState("");
  const [inferenceResult, setInferenceResult] = useState<string | null>(null);
  const [testingLoading, setTestingLoading] = useState(false);

  useEffect(() => {
    async function loadModels() {
      try {
        const data = await api.listCommunityModels();
        if (data && data.models && data.models.length > 0) {
          setModels(data.models);
        }
      } catch (err) {
        // Fallback to pre-populated community models
      }
    }
    loadModels();
  }, []);

  const filteredModels = models.filter((m) => {
    const matchesSearch =
      m.public_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.public_description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.base_model.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesTag =
      selectedTag === "All" ||
      m.tags.some((t) => t.toLowerCase() === selectedTag.toLowerCase());

    return matchesSearch && matchesTag;
  });

  const handleRunPublicInference = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promptInput.trim() || !activeTestModel) return;

    setTestingLoading(true);
    setInferenceResult(null);

    try {
      const res = await api.runPublicInference(activeTestModel.id, promptInput);
      setInferenceResult(res.generated_text);
      // Update local usage counter
      setModels((prev) =>
        prev.map((mod) =>
          mod.id === activeTestModel.id
            ? { ...mod, public_usage_count: mod.public_usage_count + 1 }
            : mod
        )
      );
    } catch (err: any) {
      setInferenceResult(`Error: ${err.message || "Failed to execute inference."}`);
    } finally {
      setTestingLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-text-primary selection:bg-attestly-500/30">
      
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-structural">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <AttestlyLogo className="w-8 h-8" />
            <span className="text-xl font-display font-bold tracking-tight text-text-primary">ATTESTLY</span>
          </Link>

          <div className="hidden md:flex items-center gap-8 text-sm font-display font-medium uppercase tracking-wider text-text-secondary">
            <Link href="/" className="hover:text-text-primary transition-colors">Platform</Link>
            <Link href="/community" className="text-text-primary border-b-2 border-attestly-500 pb-1">Community Models</Link>
            <Link href="/leaderboard" className="hover:text-text-primary transition-colors">Leaderboard</Link>
          </div>

          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Link href="/login" className="px-4 py-2 text-sm font-display uppercase font-medium hover:text-attestly-500">
              Log In
            </Link>
            <Link href="/dashboard" className="px-5 py-2.5 bg-text-primary text-background font-display font-bold uppercase tracking-wider text-xs hover:bg-attestly-500 hover:text-white transition-colors">
              Fine-Tune Model
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-36 pb-16 px-6 border-b border-structural bg-surface-1">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-8 mb-12">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-surface-2 border border-structural text-xs font-display font-bold uppercase tracking-widest text-attestly-500 mb-4">
                <Users className="w-4 h-4" /> Open Community Registry
              </div>
              <h1 className="text-4xl md:text-6xl font-display font-bold uppercase tracking-tight leading-none mb-4">
                Shared Community Models
              </h1>
              <p className="text-text-secondary text-lg max-w-2xl font-light">
                Browse fine-tuned weights published by developers. Query models directly without requiring an account.
              </p>
            </div>

            <div className="p-4 bg-background border border-structural max-w-md">
              <div className="flex items-center gap-2 text-xs font-display font-bold uppercase tracking-wider text-attestly-emerald mb-2">
                <Shield className="w-4 h-4" /> Zero Dataset Exposure
              </div>
              <p className="text-xs text-text-secondary leading-relaxed">
                Models in this registry share fine-tuned weights only. Training datasets remain strictly private and un-exposed.
              </p>
            </div>
          </div>

          {/* Search & Category Filter */}
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              <input
                type="text"
                placeholder="Search models, base models, or tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-background border border-structural text-sm focus:outline-none focus:border-attestly-500 font-display transition-colors"
              />
            </div>

            <div className="flex flex-wrap gap-2 w-full md:w-auto">
              {CATEGORY_TAGS.map((tag) => (
                <button
                  key={tag}
                  onClick={() => setSelectedTag(tag)}
                  className={`px-4 py-2 text-xs font-display font-bold uppercase tracking-wider border transition-colors ${
                    selectedTag === tag
                      ? "bg-text-primary text-background border-text-primary"
                      : "bg-background text-text-secondary border-structural hover:border-attestly-500 hover:text-text-primary"
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Community Model Cards Grid */}
      <section className="py-16 px-6">
        <div className="max-w-7xl mx-auto">
          {filteredModels.length === 0 ? (
            <div className="py-20 text-center border border-structural bg-surface-1">
              <Cpu className="w-12 h-12 text-text-muted mx-auto mb-4" />
              <h3 className="text-xl font-display font-bold uppercase mb-2">No Matching Models Found</h3>
              <p className="text-text-secondary text-sm">Try adjusting your search query or selected tag.</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-8">
              {filteredModels.map((model) => (
                <motion.div
                  key={model.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-surface-1 border border-structural p-8 flex flex-col justify-between hover:border-attestly-500 transition-colors group"
                >
                  <div>
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div>
                        <span className="text-[10px] font-mono text-attestly-teal uppercase tracking-widest block mb-1">
                          Base: {model.base_model}
                        </span>
                        <h2 className="text-2xl font-display font-bold uppercase tracking-tight group-hover:text-attestly-500 transition-colors">
                          {model.public_title}
                        </h2>
                      </div>
                      <span className="px-2.5 py-1 bg-surface-2 border border-structural text-[11px] font-mono text-text-muted">
                        @{model.author_name}
                      </span>
                    </div>

                    <p className="text-text-secondary text-sm leading-relaxed mb-6 font-light">
                      {model.public_description}
                    </p>

                    <div className="flex flex-wrap gap-2 mb-6">
                      {model.tags.map((t) => (
                        <span
                          key={t}
                          className="px-2.5 py-1 bg-background border border-structural text-[11px] font-display font-bold uppercase tracking-wider text-text-secondary"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="pt-6 border-t border-structural flex items-center justify-between">
                    <div className="flex items-center gap-4 text-xs font-mono text-text-muted">
                      <span>{model.public_usage_count} Public Queries</span>
                      {model.dataset_sample_count && (
                        <span>• {model.dataset_sample_count} Training Samples</span>
                      )}
                    </div>

                    <button
                      onClick={() => {
                        setActiveTestModel(model);
                        setPromptInput("");
                        setInferenceResult(null);
                      }}
                      className="px-5 py-2.5 bg-text-primary text-background font-display font-bold uppercase tracking-widest text-xs flex items-center gap-2 hover:bg-attestly-500 hover:text-white transition-colors"
                    >
                      <Play className="w-3.5 h-3.5" /> Test Model
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Public Model Test Modal (No Auth Required) */}
      <AnimatePresence>
        {activeTestModel && (
          <div
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6"
            onClick={() => setActiveTestModel(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-surface-1 border border-structural w-full max-w-2xl p-8 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-start justify-between mb-6 border-b border-structural pb-4">
                <div>
                  <span className="text-[10px] font-mono text-attestly-500 uppercase tracking-widest">
                    Public Test Endpoint • Rate Limited (100 req/day)
                  </span>
                  <h3 className="text-2xl font-display font-bold uppercase tracking-tight">
                    {activeTestModel.public_title}
                  </h3>
                  <p className="text-xs text-text-muted font-mono mt-1">
                    Base: {activeTestModel.base_model} | By @{activeTestModel.author_name}
                  </p>
                </div>
                <button
                  onClick={() => setActiveTestModel(null)}
                  className="p-1 hover:text-attestly-500 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleRunPublicInference} className="space-y-6">
                <div>
                  <label className="block text-xs font-display font-bold uppercase tracking-wider text-text-secondary mb-2">
                    Enter Prompt
                  </label>
                  <textarea
                    rows={4}
                    value={promptInput}
                    onChange={(e) => setPromptInput(e.target.value)}
                    placeholder={`Test input for ${activeTestModel.public_title}...`}
                    className="w-full p-4 bg-background border border-structural text-sm focus:outline-none focus:border-attestly-500 font-mono transition-colors"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={testingLoading || !promptInput.trim()}
                  className="w-full py-4 bg-text-primary text-background font-display font-bold uppercase tracking-widest text-sm hover:bg-attestly-500 hover:text-white transition-colors disabled:opacity-50 flex items-center justify-center gap-3"
                >
                  {testingLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" /> Querying Model...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" /> Run Public Inference
                    </>
                  )}
                </button>
              </form>

              {/* Output Display */}
              {inferenceResult && (
                <div className="mt-8 border border-structural bg-background p-6">
                  <div className="flex items-center justify-between text-xs font-mono text-attestly-emerald mb-3">
                    <span className="flex items-center gap-2">
                      <Terminal className="w-4 h-4" /> Response Output
                    </span>
                    <span>Usage Count: {activeTestModel.public_usage_count + 1}</span>
                  </div>
                  <pre className="text-sm font-mono whitespace-pre-wrap leading-relaxed text-text-primary">
                    {inferenceResult}
                  </pre>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="border-t border-structural px-6 py-12 bg-surface-1">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <AttestlyLogo className="w-6 h-6 opacity-50" />
            <span className="font-display font-bold uppercase tracking-widest text-text-secondary">ATTESTLY</span>
          </div>
          <div className="flex items-center gap-8 text-sm font-display font-medium text-text-muted uppercase tracking-wider">
            <Link href="/" className="hover:text-text-primary transition-colors">Home</Link>
            <Link href="/community" className="text-text-primary">Community</Link>
            <Link href="/leaderboard" className="hover:text-text-primary transition-colors">Leaderboard</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

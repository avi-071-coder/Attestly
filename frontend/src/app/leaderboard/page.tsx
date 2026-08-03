"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Trophy, ArrowUpDown, ChevronDown, ChevronUp, Cpu, Zap,
  ExternalLink, Sparkles, CheckCircle2, Sliders, Shield
} from "lucide-react";
import Link from "next/link";
import AttestlyLogo from "@/components/AttestlyLogo";
import ThemeToggle from "@/components/ThemeToggle";
import { api } from "@/lib/api";

interface BenchmarkModel {
  id: string;
  model_name: string;
  provider: string;
  parameters: string;
  context_window: string;
  mmlu: number;
  gsm8k: number;
  humaneval: number;
  legalbench: number;
  biommlu: number;
  overall_score: number;
}

const DEFAULT_BENCHMARKS: BenchmarkModel[] = [
  {
    id: "qwen-2.5-72b",
    model_name: "Qwen 2.5 72B Instruct",
    provider: "Alibaba",
    parameters: "72B",
    context_window: "128k",
    mmlu: 86.2,
    gsm8k: 95.1,
    humaneval: 86.6,
    legalbench: 85.0,
    biommlu: 83.5,
    overall_score: 87.3
  },
  {
    id: "mistral-large-2",
    model_name: "Mistral Large 2",
    provider: "Mistral AI",
    parameters: "123B",
    context_window: "128k",
    mmlu: 84.0,
    gsm8k: 91.2,
    humaneval: 92.0,
    legalbench: 84.8,
    biommlu: 82.0,
    overall_score: 86.8
  },
  {
    id: "llama-3.1-70b",
    model_name: "Llama 3.1 70B Instruct",
    provider: "Meta AI",
    parameters: "70B",
    context_window: "128k",
    mmlu: 86.0,
    gsm8k: 93.4,
    humaneval: 80.5,
    legalbench: 87.2,
    biommlu: 84.1,
    overall_score: 86.2
  },
  {
    id: "qwen-2.5-7b",
    model_name: "Qwen 2.5 7B Instruct",
    provider: "Alibaba",
    parameters: "7B",
    context_window: "128k",
    mmlu: 74.2,
    gsm8k: 83.1,
    humaneval: 79.9,
    legalbench: 73.4,
    biommlu: 71.8,
    overall_score: 76.5
  },
  {
    id: "llama-3.1-8b",
    model_name: "Llama 3.1 8B Instruct",
    provider: "Meta AI",
    parameters: "8B",
    context_window: "128k",
    mmlu: 69.4,
    gsm8k: 84.5,
    humaneval: 72.6,
    legalbench: 71.0,
    biommlu: 68.2,
    overall_score: 73.1
  },
  {
    id: "gemma-2-27b",
    model_name: "Gemma 2 27B",
    provider: "Google",
    parameters: "27B",
    context_window: "8k",
    mmlu: 75.2,
    gsm8k: 78.4,
    humaneval: 61.6,
    legalbench: 76.5,
    biommlu: 74.0,
    overall_score: 73.1
  },
  {
    id: "phi-3.5-mini",
    model_name: "Phi-3.5 Mini Instruct",
    provider: "Microsoft",
    parameters: "3.8B",
    context_window: "128k",
    mmlu: 69.0,
    gsm8k: 83.8,
    humaneval: 73.8,
    legalbench: 67.5,
    biommlu: 66.0,
    overall_score: 72.0
  },
  {
    id: "mistral-7b-v0.3",
    model_name: "Mistral 7B Instruct v0.3",
    provider: "Mistral AI",
    parameters: "7B",
    context_window: "32k",
    mmlu: 65.5,
    gsm8k: 62.0,
    humaneval: 46.3,
    legalbench: 69.0,
    biommlu: 64.2,
    overall_score: 61.4
  }
];

type SortField = "overall_score" | "mmlu" | "gsm8k" | "humaneval" | "legalbench" | "biommlu";

export default function LeaderboardPage() {
  const [data, setData] = useState<BenchmarkModel[]>(DEFAULT_BENCHMARKS);
  const [activeCategory, setActiveCategory] = useState<"ALL" | "<10B" | ">10B">("ALL");
  const [sortField, setSortField] = useState<SortField>("overall_score");
  const [sortAsc, setSortAsc] = useState(false);

  useEffect(() => {
    async function fetchLeaderboard() {
      try {
        const categoryParam = activeCategory === "ALL" ? undefined : activeCategory;
        const res = await api.getLeaderboard(categoryParam, sortField);
        if (res && res.benchmarks && res.benchmarks.length > 0) {
          setData(res.benchmarks);
        }
      } catch (err) {
        // Fallback to local default state
      }
    }
    fetchLeaderboard();
  }, [activeCategory, sortField]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  const filteredData = data.filter((item) => {
    if (activeCategory === "<10B") {
      return item.parameters.includes("7B") || item.parameters.includes("8B") || item.parameters.includes("3.8B");
    }
    if (activeCategory === ">10B") {
      return item.parameters.includes("70B") || item.parameters.includes("72B") || item.parameters.includes("123B") || item.parameters.includes("27B");
    }
    return true;
  });

  const sortedData = [...filteredData].sort((a, b) => {
    const valA = a[sortField];
    const valB = b[sortField];
    return sortAsc ? valA - valB : valB - valA;
  });

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
            <Link href="/community" className="hover:text-text-primary transition-colors">Community Models</Link>
            <Link href="/leaderboard" className="text-text-primary border-b-2 border-attestly-500 pb-1">Leaderboard</Link>
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

      {/* Hero Header */}
      <section className="pt-36 pb-16 px-6 border-b border-structural bg-surface-1">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-8 mb-10">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-surface-2 border border-structural text-xs font-display font-bold uppercase tracking-widest text-attestly-teal mb-4">
                <Trophy className="w-4 h-4" /> Open-Weight Model Leaderboard
              </div>
              <h1 className="text-4xl md:text-6xl font-display font-bold uppercase tracking-tight leading-none mb-4">
                Benchmark Comparison
              </h1>
              <p className="text-text-secondary text-lg max-w-2xl font-light">
                Empirical domain evaluation across base open-weight models. Select any model to fine-tune on your domain dataset.
              </p>
            </div>

            <div className="flex gap-2">
              {(["ALL", "<10B", ">10B"] as const).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-5 py-2.5 text-xs font-display font-bold uppercase tracking-wider border transition-colors ${
                    activeCategory === cat
                      ? "bg-text-primary text-background border-text-primary"
                      : "bg-background text-text-secondary border-structural hover:border-attestly-500 hover:text-text-primary"
                  }`}
                >
                  {cat === "ALL" ? "All Sizes" : cat}
                </button>
              ))}
            </div>
          </div>

          {/* Benchmark Badges Explanation */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 pt-8 border-t border-structural text-xs font-mono text-text-secondary">
            <div>
              <span className="text-text-primary font-bold block mb-1">MMLU</span>
              General Multi-Task Reasoning
            </div>
            <div>
              <span className="text-text-primary font-bold block mb-1">GSM8K</span>
              Grade School Math Logic
            </div>
            <div>
              <span className="text-text-primary font-bold block mb-1">HumanEval</span>
              Zero-Shot Code Generation
            </div>
            <div>
              <span className="text-attestly-teal font-bold block mb-1">LegalBench</span>
              Legal Contract Reasoning
            </div>
            <div>
              <span className="text-attestly-emerald font-bold block mb-1">BioMMLU</span>
              Clinical & Bio-Medical Tasks
            </div>
          </div>
        </div>
      </section>

      {/* Leaderboard Table Section */}
      <section className="py-16 px-6">
        <div className="max-w-7xl mx-auto overflow-x-auto">
          <div className="border border-structural bg-surface-1 min-w-[900px]">
            {/* Table Header */}
            <div className="grid grid-cols-12 bg-surface-2 border-b border-structural text-xs font-display font-bold uppercase tracking-wider text-text-secondary p-4 items-center">
              <div className="col-span-1 text-center font-mono">Rank</div>
              <div className="col-span-3">Model & Provider</div>
              <div
                onClick={() => handleSort("overall_score")}
                className="col-span-2 cursor-pointer flex items-center justify-end gap-1 hover:text-text-primary font-bold text-attestly-emerald"
              >
                Overall Score <ArrowUpDown className="w-3 h-3" />
              </div>
              <div
                onClick={() => handleSort("mmlu")}
                className="col-span-1 text-right cursor-pointer hover:text-text-primary flex items-center justify-end gap-1"
              >
                MMLU <ArrowUpDown className="w-3 h-3" />
              </div>
              <div
                onClick={() => handleSort("gsm8k")}
                className="col-span-1 text-right cursor-pointer hover:text-text-primary flex items-center justify-end gap-1"
              >
                GSM8K <ArrowUpDown className="w-3 h-3" />
              </div>
              <div
                onClick={() => handleSort("humaneval")}
                className="col-span-1 text-right cursor-pointer hover:text-text-primary flex items-center justify-end gap-1"
              >
                Code <ArrowUpDown className="w-3 h-3" />
              </div>
              <div
                onClick={() => handleSort("legalbench")}
                className="col-span-1 text-right cursor-pointer hover:text-text-primary flex items-center justify-end gap-1 text-attestly-teal"
              >
                Legal <ArrowUpDown className="w-3 h-3" />
              </div>
              <div className="col-span-2 text-center">Action</div>
            </div>

            {/* Rows */}
            {sortedData.map((item, idx) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: idx * 0.05 }}
                className="grid grid-cols-12 border-b border-structural p-4 items-center hover:bg-surface-2/60 transition-colors"
              >
                {/* Rank */}
                <div className="col-span-1 text-center font-mono font-bold text-lg text-text-muted">
                  #{idx + 1}
                </div>

                {/* Model Info */}
                <div className="col-span-3">
                  <div className="font-display font-bold uppercase tracking-tight text-base text-text-primary">
                    {item.model_name}
                  </div>
                  <div className="flex items-center gap-2 text-xs font-mono text-text-muted mt-0.5">
                    <span>{item.provider}</span>
                    <span>•</span>
                    <span className="text-attestly-teal">{item.parameters}</span>
                    <span>•</span>
                    <span>{item.context_window} Context</span>
                  </div>
                </div>

                {/* Overall Score Bar */}
                <div className="col-span-2 px-4">
                  <div className="flex items-center justify-between text-xs font-mono font-bold mb-1">
                    <span className="text-attestly-emerald-light">{item.overall_score.toFixed(1)}</span>
                    <span className="text-text-muted text-[10px]">/ 100</span>
                  </div>
                  <div className="w-full bg-background h-2 border border-structural overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-attestly-teal to-attestly-emerald h-full"
                      style={{ width: `${item.overall_score}%` }}
                    />
                  </div>
                </div>

                {/* MMLU */}
                <div className="col-span-1 text-right font-mono text-sm font-semibold">
                  {item.mmlu.toFixed(1)}
                </div>

                {/* GSM8K */}
                <div className="col-span-1 text-right font-mono text-sm font-semibold">
                  {item.gsm8k.toFixed(1)}
                </div>

                {/* HumanEval */}
                <div className="col-span-1 text-right font-mono text-sm font-semibold">
                  {item.humaneval.toFixed(1)}
                </div>

                {/* LegalBench */}
                <div className="col-span-1 text-right font-mono text-sm font-semibold text-attestly-teal">
                  {item.legalbench.toFixed(1)}
                </div>

                {/* Fine-Tune Action */}
                <div className="col-span-2 text-center pl-4">
                  <Link
                    href={`/dashboard/jobs?base_model=${encodeURIComponent(item.id)}`}
                    className="px-4 py-2 bg-text-primary text-background font-display font-bold uppercase tracking-widest text-[11px] inline-flex items-center gap-1.5 hover:bg-attestly-500 hover:text-white transition-colors"
                  >
                    Fine-Tune <Zap className="w-3 h-3" />
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-structural px-6 py-12 bg-surface-1">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <AttestlyLogo className="w-6 h-6 opacity-50" />
            <span className="font-display font-bold uppercase tracking-widest text-text-secondary">ATTESTLY</span>
          </div>
          <div className="flex items-center gap-8 text-sm font-display font-medium text-text-muted uppercase tracking-wider">
            <Link href="/" className="hover:text-text-primary transition-colors">Home</Link>
            <Link href="/community" className="hover:text-text-primary transition-colors">Community</Link>
            <Link href="/leaderboard" className="text-text-primary">Leaderboard</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

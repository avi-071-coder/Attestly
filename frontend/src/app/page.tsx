"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Cpu, Upload, Zap, Shield, Key, BarChart3, ArrowRight,
  Menu, X, ExternalLink, BookOpen, Code, Lock, FileText, CheckCircle2
} from "lucide-react";
import Link from "next/link";
import AttestlyLogo from "@/components/AttestlyLogo";
import ThemeToggle from "@/components/ThemeToggle";

const MODELS = [
  { name: "Llama 3.1", provider: "Meta", params: "8B–70B" },
  { name: "Mistral", provider: "Mistral AI", params: "7B–8x7B" },
  { name: "Qwen 2.5", provider: "Alibaba", params: "7B–72B" },
  { name: "Phi-3.5", provider: "Microsoft", params: "3.8B" },
];

const FEATURES = [
  { icon: Upload, title: "Upload Your Data", desc: "Drag & drop JSONL, CSV, or Parquet. Auto-validation, schema detection, preview." },
  { icon: Cpu, title: "Pick Any Open Model", desc: "Llama, Mistral, Qwen, Phi, Gemma — full registry of open-weight models." },
  { icon: Zap, title: "LoRA / QLoRA Training", desc: "4-bit quantized fine-tuning. Train on consumer GPUs. Production results." },
  { icon: Key, title: "Private API Endpoint", desc: "Your model, your endpoint, your API key. Tenant-isolated, rate-limited." },
  { icon: BarChart3, title: "Usage Metering", desc: "Per-token billing. Track requests, latency, costs in real-time." },
  { icon: Shield, title: "Security First", desc: "Encrypted storage, audit logs, GDPR-ready deletion, zero cross-tenant leakage." },
];

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeModelIdx, setActiveModelIdx] = useState(0);
  const [activeModal, setActiveModal] = useState<"docs" | "api" | "privacy" | null>(null);

  useEffect(() => {
    const interval = setInterval(() => setActiveModelIdx(i => (i + 1) % MODELS.length), 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen relative selection:bg-attestly-500/30">
      
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-structural">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group shrink-0">
            <AttestlyLogo size={36} className="w-9 h-9" />
            <span className="text-xl font-display font-bold tracking-tight text-text-primary">ATTESTLY</span>
          </Link>

          <div className="hidden md:flex items-center gap-8 text-sm font-display font-medium uppercase tracking-wider text-text-secondary">
            <a href="#features" className="hover:text-text-primary transition-colors">Platform</a>
            <button onClick={() => setActiveModal("docs")} className="hover:text-text-primary transition-colors">Docs</button>
            <button onClick={() => setActiveModal("api")} className="hover:text-text-primary transition-colors">API</button>
            <Link href="/community" className="hover:text-text-primary transition-colors text-attestly-teal">Community Models</Link>
            <Link href="/leaderboard" className="hover:text-text-primary transition-colors text-attestly-emerald">Leaderboard</Link>
          </div>

          <div className="hidden md:flex items-center gap-4">
            <ThemeToggle />
            <Link href="/login" className="px-4 py-2 text-sm font-display uppercase font-medium hover:text-attestly-500">
              Log In
            </Link>
            <Link href="/dashboard" className="px-5 py-2.5 bg-text-primary text-background font-display font-bold uppercase tracking-wider text-xs hover:bg-attestly-500 hover:text-white transition-colors">
              Fine-Tune Model
            </Link>
          </div>

          <button className="md:hidden text-text-primary" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }} className="md:hidden border-t border-structural bg-surface-1 overflow-hidden">
              <div className="px-6 py-6 flex flex-col gap-4">
                <a href="#features" className="text-lg font-display uppercase">Platform</a>
                <button onClick={() => { setMobileMenuOpen(false); setActiveModal("docs"); }} className="text-lg font-display uppercase text-left">Docs</button>
                <button onClick={() => { setMobileMenuOpen(false); setActiveModal("api"); }} className="text-lg font-display uppercase text-left">API</button>
                <Link href="/community" className="text-lg font-display uppercase text-attestly-teal">Community Models</Link>
                <Link href="/leaderboard" className="text-lg font-display uppercase text-attestly-emerald">Leaderboard</Link>
                <div className="pt-4 mt-2 border-t border-structural flex flex-col gap-3">
                  <Link href="/login" className="py-3 text-center border border-structural text-sm uppercase font-bold">Log In</Link>
                  <Link href="/dashboard" className="py-3 text-center bg-text-primary text-background text-sm uppercase font-bold">Fine-Tune Model</Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Hero Section */}
      <section className="pt-40 pb-20 md:pt-56 md:pb-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-12 gap-12 items-end">
            <div className="lg:col-span-8">
              <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}>
                <h1 className="text-5xl md:text-7xl lg:text-[5.5rem] font-display font-bold leading-[1.05] tracking-tight mb-8">
                  ATTESTLY <br/>
                  <span className="text-gradient-attestly">Intelligence.</span>
                </h1>
              </motion.div>
              
              <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
                className="text-xl md:text-2xl text-text-secondary max-w-2xl font-light leading-relaxed">
                Secure, tenant-isolated platform for fine-tuning and hosting open-weight LLMs. Bring your data. We handle the infrastructure.
              </motion.p>
            </div>
            
            <div className="lg:col-span-4 flex flex-col gap-4">
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8, delay: 0.2 }}>
                <Link href="/register"
                  className="w-full py-5 px-8 bg-text-primary text-background font-display font-bold text-lg flex items-center justify-between group hover:bg-attestly-500 hover:text-white transition-all">
                  ENTER PLATFORM
                  <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
                </Link>
              </motion.div>
              
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8, delay: 0.3 }}
                className="w-full py-5 px-8 border border-structural text-text-secondary font-display font-medium flex items-center justify-between">
                <span>SUPPORTED MODELS</span>
                <AnimatePresence mode="wait">
                  <motion.span key={activeModelIdx} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="text-text-primary font-mono">
                    {MODELS[activeModelIdx].name}
                  </motion.span>
                </AnimatePresence>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Terminal Section */}
      <section className="px-6 pb-32">
        <div className="max-w-7xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }}
            className="border border-structural bg-surface-1 flex flex-col md:flex-row">
            
            <div className="p-8 md:p-12 md:w-1/3 border-b md:border-b-0 md:border-r border-structural flex flex-col justify-center">
              <h3 className="font-display text-2xl font-bold mb-4 uppercase">Developer API</h3>
              <p className="text-text-secondary">Fully programatic control. Initiate fine-tuning jobs, upload datasets, and run inference entirely via REST.</p>
              <button onClick={() => setActiveModal("api")} className="mt-6 inline-flex items-center gap-2 text-xs font-display font-bold uppercase tracking-wider text-attestly-500 hover:underline">
                View API Documentation <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            <div className="p-8 md:p-12 md:w-2/3 bg-[#0a0f1c] font-mono text-sm leading-relaxed overflow-x-auto">
              <div className="text-text-muted mb-4">/* Trigger Fine-Tuning Job */</div>
              <div className="text-attestly-500">curl <span className="text-text-primary">-X POST http://localhost:8000/api/v1/jobs</span> \</div>
              <div className="text-text-secondary pl-4">-H <span className="text-text-primary">"Authorization: Bearer fai_token_..."</span> \</div>
              <div className="text-text-secondary pl-4">-d <span className="text-text-primary">'{`{`}</span></div>
              <div className="text-text-secondary pl-8"><span className="text-attestly-emerald">"base_model"</span>: <span className="text-text-primary">"meta-llama/Llama-3.1-8B"</span>,</div>
              <div className="text-text-secondary pl-8"><span className="text-attestly-emerald">"dataset_id"</span>: <span className="text-text-primary">"ds_attestly_01"</span>,</div>
              <div className="text-text-secondary pl-8"><span className="text-attestly-emerald">"lora_r"</span>: <span className="text-text-primary">16</span></div>
              <div className="text-text-primary pl-4">{`}'`}</div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="px-6 py-32 border-t border-structural bg-surface-1">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-8">
            <h2 className="text-4xl md:text-6xl font-display font-bold uppercase max-w-2xl leading-none">
              Industrial Grade Architecture
            </h2>
            <p className="text-text-secondary max-w-sm text-lg">
              Engineered for scale, security, and uncompromising privacy.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-[1px] bg-structural">
            {FEATURES.map((f, i) => (
              <motion.div key={f.title} initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className="bg-background p-10 group hover:bg-surface-2 transition-colors duration-500">
                <f.icon className="w-8 h-8 text-attestly-500 mb-8 group-hover:scale-110 transition-transform duration-500" />
                <h3 className="text-xl font-display font-bold mb-4 uppercase">{f.title}</h3>
                <p className="text-text-secondary leading-relaxed font-light">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-40 border-t border-structural">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-5xl md:text-7xl font-display font-bold uppercase mb-8">
            Deploy your <span className="text-attestly-500">Intelligence.</span>
          </h2>
          <Link href="/dashboard"
            className="inline-flex items-center gap-4 px-10 py-5 bg-text-primary text-background font-display font-bold text-xl uppercase hover:bg-attestly-500 hover:text-white transition-colors duration-300">
            Start Building <ArrowRight className="w-6 h-6" />
          </Link>
        </div>
      </section>

      {/* Interactive Documentation Modals */}
      <AnimatePresence>
        {activeModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-6" onClick={() => setActiveModal(null)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              onClick={e => e.stopPropagation()} className="bg-surface-1 border border-structural w-full max-w-3xl max-h-[85vh] overflow-y-auto p-8">
              
              <div className="flex items-center justify-between border-b border-structural pb-4 mb-6">
                <div className="flex items-center gap-3">
                  {activeModal === "docs" && <BookOpen className="w-6 h-6 text-attestly-500" />}
                  {activeModal === "api" && <Code className="w-6 h-6 text-attestly-teal" />}
                  {activeModal === "privacy" && <Lock className="w-6 h-6 text-attestly-emerald" />}
                  <h3 className="text-2xl font-display font-bold uppercase">
                    {activeModal === "docs" && "Platform Documentation"}
                    {activeModal === "api" && "REST API Specifications"}
                    {activeModal === "privacy" && "Privacy & Security Framework"}
                  </h3>
                </div>
                <button onClick={() => setActiveModal(null)}><X className="w-6 h-6 text-text-muted hover:text-text-primary" /></button>
              </div>

              {/* DOCS MODAL CONTENT */}
              {activeModal === "docs" && (
                <div className="space-y-6 text-sm text-text-secondary leading-relaxed">
                  <div>
                    <h4 className="text-base font-display font-bold uppercase text-text-primary mb-2">1. Uploading Datasets</h4>
                    <p>Format your training pair in standard <code className="bg-surface-2 px-2 py-0.5 font-mono text-attestly-500">JSONL</code> format. Supported fields: <code className="font-mono text-text-primary">prompt</code> and <code className="font-mono text-text-primary">completion</code>.</p>
                  </div>
                  <div>
                    <h4 className="text-base font-display font-bold uppercase text-text-primary mb-2">2. LoRA / QLoRA Fine-Tuning</h4>
                    <p>Choose any open-weight base model (Llama 3.1, Qwen 2.5, Mistral, Phi-3.5). Select LoRA rank (<code className="font-mono text-text-primary">r=16</code> recommended) and 4-bit quantization for high-efficiency training.</p>
                  </div>
                  <div>
                    <h4 className="text-base font-display font-bold uppercase text-text-primary mb-2">3. Deployment & Private Endpoints</h4>
                    <p>After fine-tuning completes, click <strong>Deploy</strong> to instantly get a dedicated inference endpoint isolated under your user token.</p>
                  </div>
                </div>
              )}

              {/* API MODAL CONTENT */}
              {activeModal === "api" && (
                <div className="space-y-6 text-sm text-text-secondary leading-relaxed">
                  <div>
                    <h4 className="text-base font-display font-bold uppercase text-text-primary mb-2">FastAPI Interactive Swagger Specs</h4>
                    <p>Access the live Swagger UI interactive documentation at:</p>
                    <a href="http://localhost:8000/docs" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 font-mono text-attestly-500 hover:underline mt-1">
                      http://localhost:8000/docs <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>

                  <div className="p-4 bg-background border border-structural font-mono text-xs space-y-2">
                    <div className="text-attestly-teal">POST /api/v1/auth/register</div>
                    <div className="text-attestly-teal">POST /api/v1/auth/login</div>
                    <div className="text-attestly-emerald">POST /api/v1/datasets/upload</div>
                    <div className="text-attestly-emerald">POST /api/v1/jobs/ (Create Fine-Tuning Job)</div>
                    <div className="text-amber-400">POST /api/v1/deployments/ (Deploy Endpoint)</div>
                    <div className="text-amber-400">POST /api/v1/deployments/{"{id}"}/inference</div>
                  </div>
                </div>
              )}

              {/* PRIVACY MODAL CONTENT */}
              {activeModal === "privacy" && (
                <div className="space-y-6 text-sm text-text-secondary leading-relaxed">
                  <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-display font-bold uppercase block text-emerald-400 mb-1">Tenant Isolation Guarantee</span>
                      Your raw uploaded dataset files and private fine-tuned adapters are strictly isolated per account. Cross-tenant model access or data sharing is impossible.
                    </div>
                  </div>

                  <div>
                    <h4 className="text-base font-display font-bold uppercase text-text-primary mb-2">1. Explicit Opt-In Model Sharing</h4>
                    <p>Publishing fine-tuned models to the Community Models gallery is 100% opt-in. Default status is private. Raw datasets are NEVER published or exposed.</p>
                  </div>

                  <div>
                    <h4 className="text-base font-display font-bold uppercase text-text-primary mb-2">2. GDPR One-Click Data Deletion</h4>
                    <p>Owners retain complete data control. You can delete datasets or un-publish models anytime, instantly revoking public inference access.</p>
                  </div>
                </div>
              )}

              <div className="mt-8 pt-4 border-t border-structural flex justify-end">
                <button onClick={() => setActiveModal(null)} className="px-6 py-2.5 bg-text-primary text-background font-display font-bold uppercase text-xs hover:bg-attestly-500 hover:text-white transition-colors">
                  Close Window
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="border-t border-structural px-6 py-12 bg-surface-1">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <AttestlyLogo size={24} className="w-6 h-6 opacity-60" />
            <span className="font-display font-bold uppercase tracking-widest text-text-secondary">ATTESTLY</span>
          </div>
          <div className="flex items-center gap-8 text-sm font-display font-medium text-text-muted uppercase tracking-wider">
            <button onClick={() => setActiveModal("docs")} className="hover:text-text-primary transition-colors">Docs</button>
            <button onClick={() => setActiveModal("api")} className="hover:text-text-primary transition-colors">API</button>
            <button onClick={() => setActiveModal("privacy")} className="hover:text-text-primary transition-colors">Privacy</button>
          </div>
        </div>
      </footer>
    </div>
  );
}

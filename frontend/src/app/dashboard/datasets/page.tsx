"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, Database, FileText, Trash2, AlertCircle, Check, X, Search } from "lucide-react";

interface Dataset {
  id: string; name: string; format: string; num_samples: number;
  file_size: number; is_validated: boolean; created_at: string;
}

const DEMO_DATASETS: Dataset[] = [
  { id: "1", name: "customer_support_v2", format: "jsonl", num_samples: 12500, file_size: 8_400_000, is_validated: true, created_at: "2026-07-28T10:30:00Z" },
  { id: "2", name: "code_instructions", format: "csv", num_samples: 45000, file_size: 32_000_000, is_validated: true, created_at: "2026-07-25T14:00:00Z" },
  { id: "3", name: "medical_qa_pairs", format: "jsonl", num_samples: 8200, file_size: 5_600_000, is_validated: false, created_at: "2026-07-30T09:15:00Z" },
];

function formatBytes(bytes: number) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / 1048576).toFixed(1) + " MB";
}

export default function DatasetsPage() {
  const [datasets, setDatasets] = useState<Dataset[]>(DEMO_DATASETS);
  const [showUpload, setShowUpload] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [search, setSearch] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploadName, setUploadName] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const filtered = datasets.filter(d => d.name.toLowerCase().includes(search.toLowerCase()));

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
      setUploadName(e.dataTransfer.files[0].name.replace(/\.\w+$/, ""));
      setShowUpload(true);
    }
  };

  const handleUpload = () => {
    if (!selectedFile || !uploadName) return;
    const ext = selectedFile.name.split(".").pop() || "jsonl";
    const newDs: Dataset = {
      id: String(Date.now()), name: uploadName, format: ext,
      num_samples: Math.floor(Math.random() * 50000), file_size: selectedFile.size,
      is_validated: true, created_at: new Date().toISOString(),
    };
    setDatasets(prev => [newDs, ...prev]);
    setShowUpload(false);
    setSelectedFile(null);
    setUploadName("");
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Datasets</h1>
          <p className="text-sm text-text-secondary mt-1">Upload and manage your training data</p>
        </div>
        <button onClick={() => setShowUpload(true)}
          className="px-6 py-3 bg-text-primary text-background text-sm font-display font-bold uppercase tracking-widest flex items-center gap-2 hover:bg-attestly-500 hover:text-white transition-colors">
          <Upload className="w-4 h-4" /> Upload Dataset
        </button>
      </div>

      {/* Upload Modal */}
      <AnimatePresence>
        {showUpload && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center px-6"
            onClick={() => setShowUpload(false)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              onClick={e => e.stopPropagation()} className="bg-surface-1 border border-structural p-8 w-full max-w-lg">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold">Upload Dataset</h2>
                <button onClick={() => setShowUpload(false)}><X className="w-5 h-5 text-text-muted" /></button>
              </div>
              <div className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer ${
                dragActive ? "border-forge-500 bg-forge-500/5" : "border-border-default hover:border-border-hover"}`}
                onDragOver={e => { e.preventDefault(); setDragActive(true); }}
                onDragLeave={() => setDragActive(false)}
                onDrop={handleDrop}
                onClick={() => fileRef.current?.click()}>
                <input ref={fileRef} type="file" className="hidden" accept=".jsonl,.csv,.parquet"
                  onChange={e => { if (e.target.files?.[0]) { setSelectedFile(e.target.files[0]); setUploadName(e.target.files[0].name.replace(/\.\w+$/, "")); }}} />
                <Upload className="w-8 h-8 text-text-muted mx-auto mb-3" />
                {selectedFile ? (
                  <div className="text-sm font-medium text-accent-cyan">{selectedFile.name} ({formatBytes(selectedFile.size)})</div>
                ) : (
                  <>
                    <p className="text-sm font-medium mb-1">Drop your file here or click to browse</p>
                    <p className="text-xs text-text-muted">Supports .jsonl, .csv, .parquet (max 500MB)</p>
                  </>
                )}
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium text-text-secondary mb-1.5">Dataset Name</label>
                <input value={uploadName} onChange={e => setUploadName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-surface-2 border border-border-default text-sm focus:outline-none focus:border-forge-500 transition-all"
                  placeholder="my_training_data" />
              </div>
              <button onClick={handleUpload} disabled={!selectedFile || !uploadName}
                className="w-full mt-6 py-4 bg-text-primary text-background font-display font-bold uppercase tracking-widest text-sm hover:bg-attestly-500 hover:text-white disabled:opacity-50 transition-colors">
                Upload & Validate
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search datasets..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface-2 border border-border-default text-sm focus:outline-none focus:border-forge-500 transition-all" />
      </div>

      {/* Dataset List */}
      <div className="space-y-3">
        {filtered.map((d, i) => (
          <motion.div key={d.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-surface-1 border border-structural p-6 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-accent-cyan/10 border border-accent-cyan/20 flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5 text-accent-cyan" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold truncate">{d.name}</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-surface-3 text-text-muted uppercase">{d.format}</span>
              </div>
              <div className="text-xs text-text-muted mt-0.5">
                {d.num_samples.toLocaleString()} samples · {formatBytes(d.file_size)}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {d.is_validated ? (
                <span className="flex items-center gap-1 text-xs text-accent-cyan"><Check className="w-3 h-3" /> Validated</span>
              ) : (
                <span className="flex items-center gap-1 text-xs text-accent-amber"><AlertCircle className="w-3 h-3" /> Issues</span>
              )}
              <button onClick={() => setDatasets(ds => ds.filter(x => x.id !== d.id))}
                className="p-2 rounded-lg hover:bg-accent-rose/10 text-text-muted hover:text-accent-rose transition-all">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-16 text-text-muted">
            <Database className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No datasets yet. Upload your first one!</p>
          </div>
        )}
      </div>
    </div>
  );
}

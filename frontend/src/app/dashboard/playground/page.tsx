"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Send, Bot, User, Sparkles, Settings2, Loader2 } from "lucide-react";

interface Message { role: "user" | "assistant"; content: string; timestamp: Date; tokens?: number; latency?: number; }

const MODELS = [
  { id: "support-bot-v2", name: "Customer Support Bot v2", model: "Llama 3.1 8B" },
  { id: "code-review", name: "Code Review Assistant", model: "Mistral 7B" },
];

export default function PlaygroundPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [model, setModel] = useState(MODELS[0].id);
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(512);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }); }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const userMsg: Message = { role: "user", content: input.trim(), timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    // Simulated response (replace with real API call)
    setTimeout(() => {
      const responses = [
        "Based on your fine-tuned model, I can help you with that. The key insight here is that the training data you provided has strong patterns around this topic area.",
        "I've analyzed your request using the fine-tuned adapter weights. Here's a structured response:\n\n1. **Primary analysis**: Your query maps well to the training distribution.\n2. **Confidence**: High (0.92)\n3. **Recommendation**: Consider adding more diverse examples in this category for the next training iteration.",
        "Great question! The LoRA adapter has learned specific patterns from your dataset that are relevant here. Let me break down the response:\n\n- The model identifies this as a classification task\n- Predicted category: Technical Support\n- Suggested resolution path: escalate to engineering team",
      ];
      const resp = responses[Math.floor(Math.random() * responses.length)];
      const latency = 200 + Math.floor(Math.random() * 800);
      const aiMsg: Message = { role: "assistant", content: resp, timestamp: new Date(),
        tokens: resp.split(" ").length, latency };
      setMessages(prev => [...prev, aiMsg]);
      setLoading(false);
    }, 1000 + Math.random() * 1500);
  };

  return (
    <div className="max-w-5xl mx-auto h-[calc(100vh-7rem)] flex gap-4">
      {/* Chat Area */}
      <div className="flex-1 flex flex-col bg-surface-1 border border-structural overflow-hidden">
        <div className="px-5 py-3 border-b border-border-default flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-attestly-500" />
            <span className="text-sm font-semibold">Model Playground</span>
          </div>
          <select value={model} onChange={e => setModel(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-surface-2 border border-border-default text-xs focus:outline-none">
            {MODELS.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-4">
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-text-muted">
              <Bot className="w-12 h-12 mb-3 opacity-20" />
              <p className="text-sm font-medium mb-1">Test your fine-tuned model</p>
              <p className="text-xs">Send a message to interact with your deployed model</p>
            </div>
          )}
          {messages.map((m, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className={`flex gap-3 ${m.role === "user" ? "justify-end" : ""}`}>
              {m.role === "assistant" && (
                <div className="w-8 h-8 rounded-lg bg-attestly-500/20 flex items-center justify-center shrink-0 mt-1">
                  <Bot className="w-4 h-4 text-attestly-500" />
                </div>
              )}
              <div className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                m.role === "user" ? "bg-attestly-500 text-white" : "bg-surface-3 text-text-primary"}`}>
                <div className="whitespace-pre-wrap">{m.content}</div>
                {m.role === "assistant" && m.tokens && (
                  <div className="mt-2 flex items-center gap-3 text-[10px] text-text-muted border-t border-border-default/30 pt-2">
                    <span>{m.tokens} tokens</span>
                    <span>{m.latency}ms</span>
                  </div>
                )}
              </div>
              {m.role === "user" && (
                <div className="w-8 h-8 rounded-lg bg-accent-cyan/20 flex items-center justify-center shrink-0 mt-1">
                  <User className="w-4 h-4 text-accent-cyan" />
                </div>
              )}
            </motion.div>
          ))}
          {loading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-lg bg-attestly-500/20 flex items-center justify-center shrink-0">
                <Loader2 className="w-4 h-4 text-attestly-500 animate-spin" />
              </div>
              <div className="bg-surface-3 rounded-2xl px-4 py-3">
                <div className="flex gap-1">
                  <div className="w-2 h-2 rounded-full bg-text-muted animate-bounce" style={{ animationDelay: "0s" }} />
                  <div className="w-2 h-2 rounded-full bg-text-muted animate-bounce" style={{ animationDelay: "0.15s" }} />
                  <div className="w-2 h-2 rounded-full bg-text-muted animate-bounce" style={{ animationDelay: "0.3s" }} />
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-border-default">
          <div className="flex gap-2">
            <input value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }}}
              placeholder="Send a message to your model..."
              className="flex-1 px-4 py-3 rounded-xl bg-surface-2 border border-border-default text-sm focus:outline-none focus:border-forge-500 transition-all" />
            <button onClick={handleSend} disabled={!input.trim() || loading}
              className="px-6 py-4 bg-text-primary text-background hover:bg-attestly-500 hover:text-white disabled:opacity-50 transition-colors">
              <Send className="w-4.5 h-4.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Settings Panel */}
      <div className="hidden lg:block w-64 bg-surface-1 border border-structural p-5 space-y-5">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Settings2 className="w-4 h-4" /> Parameters
        </div>
        <div>
          <label className="flex items-center justify-between text-xs text-text-secondary mb-1.5">
            <span>Temperature</span><span className="font-mono">{temperature}</span>
          </label>
          <input type="range" min="0" max="2" step="0.1" value={temperature}
            onChange={e => setTemperature(+e.target.value)}
            className="w-full accent-attestly-500 h-1" />
        </div>
        <div>
          <label className="flex items-center justify-between text-xs text-text-secondary mb-1.5">
            <span>Max Tokens</span><span className="font-mono">{maxTokens}</span>
          </label>
          <input type="range" min="64" max="4096" step="64" value={maxTokens}
            onChange={e => setMaxTokens(+e.target.value)}
            className="w-full accent-attestly-500 h-1" />
        </div>
        <div className="pt-3 border-t border-border-default">
          <div className="text-xs text-text-muted space-y-2">
            <div className="flex justify-between"><span>Model</span><span className="text-text-secondary">{MODELS.find(m => m.id === model)?.model}</span></div>
            <div className="flex justify-between"><span>Messages</span><span className="text-text-secondary">{messages.length}</span></div>
            <div className="flex justify-between"><span>Status</span>
              <span className="flex items-center gap-1 text-accent-cyan"><span className="w-1.5 h-1.5 rounded-full bg-accent-cyan" /> Online</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

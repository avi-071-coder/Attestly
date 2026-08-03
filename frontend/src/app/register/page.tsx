"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, Lock, User, ArrowRight, ArrowLeft, AlertCircle, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import AttestlyLogo from "@/components/AttestlyLogo";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    try {
      await api.register({ username: form.username, email: form.email, password: form.password });
      setStatus("success");
    } catch (err: any) {
      setErrorMsg(err.message || "Registration failed");
      setStatus("error");
    }
  };

  const handleGoogleRegister = async () => {
    setGoogleLoading(true);
    try {
      const dummyToken = "fai_google_auth_demo_token";
      api.setToken(dummyToken);
      localStorage.setItem(
        "forgeai_user",
        JSON.stringify({ id: "1", username: "Google User", email: "user@gmail.com" })
      );
      router.push("/dashboard");
    } catch (err) {
      router.push("/dashboard");
    } finally {
      setGoogleLoading(false);
    }
  };

  if (status === "success") {
    return (
      <div className="min-h-screen flex items-center justify-center px-6 bg-background selection:bg-attestly-500/30">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md text-center bg-surface-1 border border-structural p-10"
        >
          <div className="w-16 h-16 rounded-full bg-attestly-emerald/10 border border-attestly-emerald/20 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-8 h-8 text-attestly-emerald" />
          </div>
          <h2 className="text-3xl font-display font-bold uppercase mb-4">Registration Complete</h2>
          <p className="text-text-secondary mb-8 font-light leading-relaxed">
            Your account has been successfully created. You can now log in to the platform.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-3 px-8 py-4 bg-text-primary text-background font-display font-bold uppercase tracking-widest text-sm hover:bg-attestly-500 hover:text-white transition-colors"
          >
            Proceed to Log In <ArrowRight className="w-5 h-5" />
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12 bg-background selection:bg-attestly-500/30 relative">
      {/* Top Left Navigation Back to Home */}
      <div className="absolute top-8 left-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-display font-bold uppercase tracking-wider text-text-secondary hover:text-text-primary transition-colors border border-structural px-4 py-2 bg-surface-1"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md mt-10 md:mt-0">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-3 mb-6 group">
            <AttestlyLogo size={40} className="w-10 h-10" />
            <span className="text-2xl font-display font-bold uppercase tracking-tight group-hover:text-attestly-500 transition-colors">ATTESTLY</span>
          </Link>
          <h1 className="text-3xl font-display font-bold uppercase tracking-tight mb-2">Create Account</h1>
          <p className="text-text-secondary text-sm">Join the platform to start building.</p>
        </div>

        <div className="bg-surface-1 border border-structural p-8 md:p-10 space-y-6">
          {/* Continue with Google Button */}
          <button
            type="button"
            onClick={handleGoogleRegister}
            disabled={googleLoading}
            className="w-full py-3.5 px-4 bg-surface-2 border border-structural hover:border-text-primary text-text-primary font-display font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-3 transition-colors disabled:opacity-50"
          >
            <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            {googleLoading ? "Connecting Google..." : "Continue with Google"}
          </button>

          <div className="relative flex items-center justify-center">
            <div className="border-t border-structural w-full"></div>
            <span className="bg-surface-1 px-3 text-xs font-mono text-text-muted uppercase tracking-widest absolute">
              OR EMAIL
            </span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {status === "error" && (
              <div className="flex items-center gap-3 p-4 border border-accent-rose text-accent-rose text-sm font-medium">
                <AlertCircle className="w-5 h-5 shrink-0" />
                {errorMsg}
              </div>
            )}

            <div>
              <label className="block text-xs font-display font-bold uppercase text-text-secondary mb-2 tracking-wider">
                Username
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
                <input
                  type="text"
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                  required
                  className="w-full pl-12 pr-4 py-3.5 bg-background border border-structural text-sm focus:outline-none focus:border-attestly-500 font-mono transition-colors"
                  placeholder="johndoe"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-display font-bold uppercase text-text-secondary mb-2 tracking-wider">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                  className="w-full pl-12 pr-4 py-3.5 bg-background border border-structural text-sm focus:outline-none focus:border-attestly-500 font-mono transition-colors"
                  placeholder="name@company.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-display font-bold uppercase text-text-secondary mb-2 tracking-wider">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                  className="w-full pl-12 pr-4 py-3.5 bg-background border border-structural text-sm focus:outline-none focus:border-attestly-500 font-mono transition-colors"
                  placeholder="••••••••"
                  minLength={8}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={status === "loading"}
              className="w-full py-4 bg-text-primary text-background font-display font-bold uppercase tracking-widest text-sm hover:bg-attestly-500 hover:text-white transition-colors disabled:opacity-50 flex items-center justify-center gap-3"
            >
              {status === "loading" ? (
                <div className="w-5 h-5 border-2 border-background/30 border-t-background rounded-full animate-spin" />
              ) : (
                <>
                  Register <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-text-muted mt-8 font-display uppercase tracking-widest">
          Already have an account?{" "}
          <Link href="/login" className="text-text-primary hover:text-attestly-500 font-bold ml-2">
            Log In
          </Link>
        </p>
      </motion.div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { useAuthStore } from "@/store/auth-store";
import { Sparkles, Mail, Lock, ArrowRight, Brain, Search, Zap } from "lucide-react";
import { GitHubIcon as Github } from "@/components/icons/github-icon";
import api from "@/lib/api";

const highlights = [
  { icon: Brain, label: "Planner Agent", desc: "Breaks down complex tasks automatically" },
  { icon: Search, label: "RAG Agent", desc: "Searches your docs with precise citations" },
  { icon: Github, label: "GitHub Agent", desc: "Reviews PRs and analyzes repositories" },
  { icon: Zap, label: "Real-time Streaming", desc: "Token-by-token AI responses via SSE" },
];

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { login, isLoading } = useAuthStore();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      await login(email, password);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.response?.data?.detail || "Login failed. Please try again.");
    }
  };

  const handleGitHubLogin = async () => {
    try {
      const res = await api.get("/auth/github/authorize");
      window.location.href = res.data.authorization_url;
    } catch {
      setError("Failed to initiate GitHub login");
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel — branding + feature highlights */}
      <div className="hidden lg:flex lg:w-1/2 relative flex-col justify-between p-12 overflow-hidden"
        style={{ background: "linear-gradient(135deg, #0d0e1f 0%, #12131f 60%, #1a1040 100%)" }}>

        {/* Decorative blurs */}
        <div className="absolute top-[-80px] left-[-80px] w-[400px] h-[400px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(108,92,231,0.15) 0%, transparent 70%)" }} />
        <div className="absolute bottom-[-60px] right-[-60px] w-[300px] h-[300px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(165,108,240,0.1) 0%, transparent 70%)" }} />

        {/* Logo */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}
          className="flex items-center gap-3 relative z-10">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #6c5ce7, #a56cf0)" }}>
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold gradient-text">CodeMind</span>
        </motion.div>

        {/* Hero text */}
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}
          className="relative z-10">
          <h1 className="text-4xl font-bold leading-tight mb-4" style={{ color: "#e4e4ed" }}>
            Your AI-Powered<br />
            <span className="gradient-text">Engineering Copilot</span>
          </h1>
          <p className="text-lg mb-10" style={{ color: "#8b8ca7" }}>
            Coordinate specialized AI agents to solve complex engineering problems — all from one workspace.
          </p>

          <div className="space-y-4">
            {highlights.map((item, i) => (
              <motion.div key={item.label}
                initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.3 + i * 0.1 }}
                className="flex items-center gap-4 p-4 rounded-xl"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: "rgba(108,92,231,0.15)" }}>
                  <item.icon className="w-5 h-5" style={{ color: "#6c5ce7" }} />
                </div>
                <div>
                  <p className="text-sm font-semibold" style={{ color: "#e4e4ed" }}>{item.label}</p>
                  <p className="text-xs" style={{ color: "#6b6c85" }}>{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}
          className="text-xs relative z-10" style={{ color: "#6b6c85" }}>
          © 2025 CodeMind. Built with FastAPI, LangGraph & Gemini.
        </motion.p>
      </div>

      {/* Right panel — login form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-12 relative"
        style={{ background: "#0a0b14" }}>

        {/* Mobile logo */}
        <div className="absolute top-6 left-6 flex items-center gap-2 lg:hidden">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #6c5ce7, #a56cf0)" }}>
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold gradient-text">CodeMind</span>
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
          className="w-full max-w-md">

          <div className="mb-8">
            <h2 className="text-3xl font-bold mb-2">Welcome back</h2>
            <p style={{ color: "#8b8ca7" }}>Sign in to your CodeMind workspace</p>
          </div>

          <div className="card">
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="p-3 rounded-lg text-sm flex items-start gap-2"
                  style={{ background: "rgba(255,82,82,0.1)", border: "1px solid rgba(255,82,82,0.2)", color: "#ff5252" }}>
                  <span className="mt-0.5">⚠</span> {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: "#8b8ca7" }}>Email address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: "#6b6c85" }} />
                  <input
                    type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                    className="input pl-10" placeholder="you@example.com" required autoComplete="email"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-sm font-medium" style={{ color: "#8b8ca7" }}>Password</label>
                  <Link href="#" className="text-xs hover:underline" style={{ color: "#6c5ce7" }}>Forgot password?</Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: "#6b6c85" }} />
                  <input
                    type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                    className="input pl-10" placeholder="••••••••" required minLength={8} autoComplete="current-password"
                  />
                </div>
              </div>

              <button type="submit" disabled={isLoading}
                className="btn-glow w-full py-3 text-sm font-semibold disabled:opacity-60 disabled:cursor-not-allowed">
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <><span>Sign in</span> <ArrowRight className="w-4 h-4 ml-2" /></>
                )}
              </button>
            </form>

            <div className="relative my-5">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t" style={{ borderColor: "#1e2035" }} />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-3 text-sm" style={{ background: "#12131f", color: "#6b6c85" }}>or continue with</span>
              </div>
            </div>

            <button onClick={handleGitHubLogin}
              className="w-full flex items-center justify-center gap-3 py-3 rounded-lg text-sm font-medium transition-all"
              style={{ border: "1px solid #1e2035", color: "#e4e4ed" }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "#161728"; (e.currentTarget as HTMLElement).style.borderColor = "#2d2f4a"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.borderColor = "#1e2035"; }}>
              <Github className="w-5 h-5" />
              Continue with GitHub
            </button>

            <p className="text-center text-sm mt-5" style={{ color: "#8b8ca7" }}>
              Don&apos;t have an account?{" "}
              <Link href="/register" className="font-medium hover:underline" style={{ color: "#6c5ce7" }}>Create one free</Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

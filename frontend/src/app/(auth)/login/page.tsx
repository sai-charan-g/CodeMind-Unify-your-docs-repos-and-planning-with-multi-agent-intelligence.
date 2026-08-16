"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/store/auth-store";
import { Sparkles, Mail, Lock, ArrowRight } from "lucide-react";
import { GitHubIcon as Github } from "@/components/icons/github-icon";
import api from "@/lib/api";

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
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-[var(--accent)] opacity-[0.03] rounded-full blur-[100px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-purple-500 opacity-[0.03] rounded-full blur-[100px]" />
      </div>

      <div className="w-full max-w-md relative animate-fade-in">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-[var(--gradient-start)] to-[var(--gradient-end)] flex items-center justify-center animate-pulse-glow">
            <Sparkles className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-3xl font-bold gradient-text">Welcome back</h1>
          <p className="text-[var(--muted)] mt-2">Sign in to your CodeMind workspace</p>
        </div>

        {/* Form */}
        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-lg bg-[var(--error)] bg-opacity-10 border border-[var(--error)] border-opacity-20 text-[var(--error)] text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-2 text-[var(--muted)]">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-foreground)]" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input pl-10"
                  placeholder="you@example.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-[var(--muted)]">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-foreground)]" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input pl-10"
                  placeholder="••••••••"
                  required
                  minLength={8}
                />
              </div>
            </div>

            <button type="submit" disabled={isLoading} className="btn-glow w-full flex items-center justify-center gap-2 py-3">
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  Sign in <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[var(--border)]" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-[var(--card)] text-[var(--muted)]">or continue with</span>
            </div>
          </div>

          <button
            onClick={handleGitHubLogin}
            className="w-full flex items-center justify-center gap-3 py-3 rounded-lg border border-[var(--border)] hover:border-[var(--border-hover)] hover:bg-[var(--surface-1)] transition-all text-sm font-medium"
          >
            <Github className="w-5 h-5" />
            GitHub
          </button>

          <p className="text-center text-sm text-[var(--muted)] mt-6">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="text-[var(--accent)] hover:underline font-medium">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Sparkles, ArrowRight, Brain, Search, Bug, TestTube, FileText,
  Zap, Shield, BarChart3, MessageSquare,
} from "lucide-react";
import { GitHubIcon as Github } from "@/components/icons/github-icon";

const agents = [
  { icon: Brain, title: "Planner Agent", desc: "Decomposes complex requests into executable tasks", color: "#6c5ce7" },
  { icon: Search, title: "RAG Agent", desc: "Searches your docs with citations and context", color: "#00d2a0" },
  { icon: Github, title: "GitHub Agent", desc: "Analyzes repos, PRs, and code quality", color: "#f5a623" },
  { icon: Bug, title: "Debug Agent", desc: "Root cause analysis from logs and stack traces", color: "#ff5252" },
  { icon: TestTube, title: "Test Agent", desc: "Auto-generates unit, integration, and edge-case tests", color: "#29b6f6" },
  { icon: FileText, title: "Docs Agent", desc: "Creates READMEs, API docs, and release notes", color: "#ab47bc" },
];

const features = [
  { icon: Zap, title: "Real-time Streaming", desc: "Token-by-token AI responses via SSE" },
  { icon: Shield, title: "Enterprise Security", desc: "JWT auth, encrypted tokens, rate limiting" },
  { icon: BarChart3, title: "Analytics Dashboard", desc: "Track usage, tokens, and agent performance" },
  { icon: MessageSquare, title: "Conversation Memory", desc: "Full chat history with markdown rendering" },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen overflow-hidden">
      {/* Hero */}
      <header className="relative">
        <div className="absolute inset-0">
          <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-[var(--accent)] opacity-[0.04] rounded-full blur-[120px]" />
        </div>

        <nav className="relative z-10 flex items-center justify-between max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--gradient-start)] to-[var(--gradient-end)] flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold gradient-text">DevPilot AI</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors">
              Sign in
            </Link>
            <Link href="/register" className="btn-glow text-sm px-5 py-2.5">
              Get Started <ArrowRight className="inline w-4 h-4 ml-1" />
            </Link>
          </div>
        </nav>

        <div className="relative z-10 max-w-4xl mx-auto text-center px-6 pt-20 pb-32">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--surface-1)] border border-[var(--border)] text-sm text-[var(--muted)] mb-6">
              <Sparkles className="w-4 h-4 text-[var(--accent)]" />
              Multi-Agent AI Engineering Workspace
            </div>
            <h1 className="text-5xl md:text-7xl font-bold leading-tight mb-6">
              Your AI-Powered<br />
              <span className="gradient-text">Engineering Copilot</span>
            </h1>
            <p className="text-lg md:text-xl text-[var(--muted)] max-w-2xl mx-auto mb-10 leading-relaxed">
              Coordinate specialized AI agents to review code, search documentation,
              debug issues, generate tests, and create docs — all from one workspace.
            </p>
            <div className="flex items-center justify-center gap-4">
              <Link href="/register" className="btn-glow text-base px-8 py-3.5">
                Start Building <ArrowRight className="inline w-5 h-5 ml-2" />
              </Link>
              <Link
                href="#agents"
                className="px-8 py-3.5 rounded-lg border border-[var(--border)] hover:border-[var(--border-hover)] hover:bg-[var(--surface-1)] transition-all text-sm font-medium"
              >
                See Agents
              </Link>
            </div>
          </motion.div>
        </div>
      </header>

      {/* Agents Grid */}
      <section id="agents" className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Specialized AI Agents</h2>
          <p className="text-[var(--muted)] text-lg">Each agent is an expert in its domain, working together to solve complex problems.</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {agents.map((agent, i) => (
            <motion.div
              key={agent.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              viewport={{ once: true }}
              className="card group cursor-default"
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                style={{ background: `${agent.color}15` }}
              >
                <agent.icon className="w-6 h-6" style={{ color: agent.color }} />
              </div>
              <h3 className="text-lg font-semibold mb-2">{agent.title}</h3>
              <p className="text-sm text-[var(--muted)] leading-relaxed">{agent.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-6 py-20 border-t border-[var(--border)]">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feat, i) => (
            <motion.div
              key={feat.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <div className="w-12 h-12 rounded-xl bg-[var(--surface-1)] flex items-center justify-center mx-auto mb-4">
                <feat.icon className="w-6 h-6 text-[var(--accent)]" />
              </div>
              <h3 className="font-semibold mb-1">{feat.title}</h3>
              <p className="text-sm text-[var(--muted)]">{feat.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[var(--border)] py-8">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between text-sm text-[var(--muted)]">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[var(--accent)]" /> DevPilot AI
          </div>
          <p>Built with FastAPI, LangGraph, Next.js & Gemini</p>
        </div>
      </footer>
    </div>
  );
}

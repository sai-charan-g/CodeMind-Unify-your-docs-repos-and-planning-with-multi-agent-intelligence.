"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/store/auth-store";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { formatRelativeTime } from "@/lib/utils";
import {
  FolderOpen, MessageSquare, BookOpen, Zap,
  TrendingUp, Clock, ArrowUpRight,
} from "lucide-react";
import Link from "next/link";
import type { Conversation, Project, KnowledgeDocument } from "@/types";

export default function DashboardPage() {
  const { user } = useAuthStore();

  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ["projects"],
    queryFn: () => api.get("/projects/").then((r) => r.data),
  });

  const { data: conversations = [] } = useQuery<Conversation[]>({
    queryKey: ["conversations"],
    queryFn: () => api.get("/chat/conversations").then((r) => r.data),
  });

  const { data: documents = [] } = useQuery<KnowledgeDocument[]>({
    queryKey: ["documents"],
    queryFn: () => api.get("/knowledge/documents").then((r) => r.data),
  });

  const stats = [
    { label: "Projects", value: projects.length, icon: FolderOpen, color: "#6c5ce7", href: "/projects" },
    { label: "Conversations", value: conversations.length, icon: MessageSquare, color: "#00d2a0", href: "/chat" },
    { label: "Documents", value: documents.length, icon: BookOpen, color: "#f5a623", href: "/knowledge" },
    { label: "AI Requests", value: conversations.length * 2, icon: Zap, color: "#29b6f6", href: "/chat" },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Greeting */}
      <div>
        <h1 className="text-3xl font-bold">
          Welcome back, <span className="gradient-text">{user?.full_name?.split(" ")[0] || "Developer"}</span>
        </h1>
        <p className="text-[var(--muted)] mt-1">Here&apos;s what&apos;s happening in your workspace.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Link key={stat.label} href={stat.href} className="card group relative overflow-hidden">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${stat.color}15` }}>
                <stat.icon className="w-5 h-5" style={{ color: stat.color }} />
              </div>
              <ArrowUpRight className="w-4 h-4 text-[var(--muted)] opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <p className="text-2xl font-bold">{stat.value}</p>
            <p className="text-sm text-[var(--muted)]">{stat.label}</p>
          </Link>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Conversations */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Recent Conversations</h2>
            <Link href="/chat" className="text-sm text-[var(--accent)] hover:underline">View all</Link>
          </div>
          {conversations.length === 0 ? (
            <p className="text-sm text-[var(--muted)] py-8 text-center">No conversations yet. Start chatting with AI!</p>
          ) : (
            <div className="space-y-3">
              {conversations.slice(0, 5).map((conv) => (
                <Link key={conv.id} href={`/chat/${conv.id}`}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-[var(--surface-1)] transition-colors"
                >
                  <MessageSquare className="w-4 h-4 text-[var(--accent)] flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{conv.title}</p>
                    <p className="text-xs text-[var(--muted)]">{formatRelativeTime(conv.updated_at)}</p>
                  </div>
                  {conv.agent_type && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--surface-1)] text-[var(--muted)]">
                      {conv.agent_type}
                    </span>
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Recent Documents */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Knowledge Base</h2>
            <Link href="/knowledge" className="text-sm text-[var(--accent)] hover:underline">View all</Link>
          </div>
          {documents.length === 0 ? (
            <p className="text-sm text-[var(--muted)] py-8 text-center">No documents uploaded. Add files to your knowledge base!</p>
          ) : (
            <div className="space-y-3">
              {documents.slice(0, 5).map((doc) => (
                <div key={doc.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-[var(--surface-1)] transition-colors">
                  <BookOpen className="w-4 h-4 text-[var(--warning)] flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{doc.filename}</p>
                    <p className="text-xs text-[var(--muted)]">{doc.chunk_count} chunks · {formatRelativeTime(doc.created_at)}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    doc.status === "ready" ? "bg-green-500/10 text-green-400" :
                    doc.status === "error" ? "bg-red-500/10 text-red-400" :
                    "bg-yellow-500/10 text-yellow-400"
                  }`}>
                    {doc.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "New Chat", href: "/chat", icon: MessageSquare, color: "#6c5ce7" },
            { label: "Upload Docs", href: "/knowledge", icon: BookOpen, color: "#00d2a0" },
            { label: "New Project", href: "/projects", icon: FolderOpen, color: "#f5a623" },
            { label: "GitHub Repos", href: "/github", icon: TrendingUp, color: "#29b6f6" },
          ].map((action) => (
            <Link key={action.label} href={action.href}
              className="flex items-center gap-3 p-4 rounded-xl bg-[var(--surface-1)] hover:bg-[var(--surface-2)] border border-[var(--border)] hover:border-[var(--border-hover)] transition-all"
            >
              <action.icon className="w-5 h-5" style={{ color: action.color }} />
              <span className="text-sm font-medium">{action.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

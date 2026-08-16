"use client";

import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { useAuthStore } from "@/store/auth-store";
import { GitBranch, Star, GitFork, ExternalLink, AlertCircle } from "lucide-react";
import { GitHubIcon as Github } from "@/components/icons/github-icon";
import Link from "next/link";

export default function GitHubPage() {
  const { user } = useAuthStore();
  const isConnected = !!user?.github_username;

  const { data: repos = [], isLoading, error } = useQuery<any[]>({
    queryKey: ["github-repos"],
    queryFn: () => api.get("/github/repos").then((r) => r.data),
    enabled: isConnected,
  });

  if (!isConnected) {
    return (
      <div className="space-y-6 animate-fade-in">
        <h1 className="text-3xl font-bold">GitHub Integration</h1>
        <div className="card flex flex-col items-center py-16">
          <div className="w-16 h-16 rounded-2xl bg-[var(--surface-1)] flex items-center justify-center mb-6">
            <Github className="w-8 h-8 text-[var(--muted)]" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Connect your GitHub</h2>
          <p className="text-[var(--muted)] mb-6 max-w-md text-center">
            Link your GitHub account to analyze repositories, review pull requests, and get AI-powered code insights.
          </p>
          <button onClick={async () => {
            const res = await api.get("/auth/github/authorize");
            window.location.href = res.data.authorization_url;
          }} className="btn-glow flex items-center gap-2">
            <Github className="w-5 h-5" /> Connect GitHub
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">GitHub Repositories</h1>
          <p className="text-[var(--muted)] mt-1">Connected as <span className="text-[var(--accent)]">@{user?.github_username}</span></p>
        </div>
      </div>

      {isLoading ? (
        <div className="grid md:grid-cols-2 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="card animate-pulse">
              <div className="h-5 bg-[var(--surface-1)] rounded w-1/2 mb-3" />
              <div className="h-3 bg-[var(--surface-1)] rounded w-3/4 mb-4" />
              <div className="flex gap-4">
                <div className="h-3 bg-[var(--surface-1)] rounded w-16" />
                <div className="h-3 bg-[var(--surface-1)] rounded w-16" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {repos.map((repo: any) => (
            <div key={repo.id} className="card group">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold text-[var(--accent)] group-hover:underline">{repo.name}</h3>
                <a href={repo.html_url} target="_blank" rel="noopener noreferrer"
                  className="text-[var(--muted)] hover:text-[var(--foreground)] transition-colors">
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
              {repo.description && (
                <p className="text-sm text-[var(--muted)] mb-3 line-clamp-2">{repo.description}</p>
              )}
              <div className="flex items-center gap-4 text-xs text-[var(--muted)]">
                {repo.language && (
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-[var(--accent)]" />
                    {repo.language}
                  </span>
                )}
                <span className="flex items-center gap-1"><Star className="w-3.5 h-3.5" /> {repo.stargazers_count}</span>
                <span className="flex items-center gap-1"><GitFork className="w-3.5 h-3.5" /> {repo.forks_count}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

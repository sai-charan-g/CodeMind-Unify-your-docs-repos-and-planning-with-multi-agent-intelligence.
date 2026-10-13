"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { useAuthStore } from "@/store/auth-store";
import { useRouter } from "next/navigation";
import {
  GitBranch, Star, GitFork, ExternalLink, GitPullRequest,
  CheckCircle2, XCircle, Clock, ChevronRight, X, Sparkles,
  Loader2, FileCode, ArrowRight
} from "lucide-react";
import { GitHubIcon as Github } from "@/components/icons/github-icon";
import { formatRelativeTime } from "@/lib/utils";

interface PR {
  id: number;
  number: number;
  title: number;
  state: string;
  html_url: string;
  created_at: string;
  user: {
    login: string;
    avatar_url: string;
  };
  head: {
    ref: string;
  };
  base: {
    ref: string;
  };
  merged_at?: string | null;
}

export default function GitHubPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const isConnected = !!user?.github_username;

  const [selectedRepo, setSelectedRepo] = useState<{ owner: string; name: string } | null>(null);

  const { data: repos = [], isLoading: reposLoading } = useQuery<any[]>({
    queryKey: ["github-repos"],
    queryFn: () => api.get("/github/repos").then((r) => r.data),
    enabled: isConnected,
  });

  const { data: pullRequests = [], isLoading: prsLoading } = useQuery<PR[]>({
    queryKey: ["github-prs", selectedRepo?.owner, selectedRepo?.name],
    queryFn: () =>
      api
        .get(`/github/repos/${selectedRepo?.owner}/${selectedRepo?.name}/pulls?state=all`)
        .then((r) => r.data),
    enabled: !!selectedRepo,
  });

  const handleReviewPR = (pr: PR) => {
    if (!selectedRepo) return;
    const promptText = `Please review Pull Request #${pr.number} ("${pr.title}") in ${selectedRepo.owner}/${selectedRepo.name}. Fetch the modified files and analyze the code for security vulnerabilities, logic bugs, edge cases, and architectural best practices.`;
    router.push(`/chat?prompt=${encodeURIComponent(promptText)}&agent=github`);
  };

  if (!isConnected) {
    return (
      <div className="space-y-6 animate-fade-in">
        <h1 className="text-3xl font-bold">GitHub Integration</h1>
        <div className="card flex flex-col items-center py-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-[var(--surface-1)] border border-[var(--border)] flex items-center justify-center mb-6">
            <Github className="w-8 h-8 text-[var(--muted)]" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Connect your GitHub</h2>
          <p className="text-[var(--muted)] mb-6 max-w-md">
            Link your GitHub account to analyze repositories, inspect pull requests, and trigger AI-powered automated code reviews.
          </p>
          <button
            onClick={async () => {
              const res = await api.get("/auth/github/authorize");
              window.location.href = res.data.authorization_url;
            }}
            className="btn-glow flex items-center gap-2"
          >
            <Github className="w-5 h-5" /> Connect GitHub Account
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
          <p className="text-[var(--muted)] mt-1">
            Connected as <span className="text-[var(--accent)] font-semibold">@{user?.github_username}</span>
          </p>
        </div>
      </div>

      {reposLoading ? (
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
          {repos.map((repo: any) => {
            const isOwner = repo.owner?.login || user?.github_username;
            return (
              <div
                key={repo.id}
                className="card group hover:border-[var(--accent)]/50 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-lg text-white group-hover:text-[var(--accent)] transition-colors">
                      {repo.name}
                    </h3>
                    <div className="flex items-center gap-2">
                      <a
                        href={repo.html_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[var(--muted)] hover:text-white p-1 rounded hover:bg-[var(--surface-1)] transition-colors"
                        title="Open on GitHub"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                  {repo.description && (
                    <p className="text-sm text-[var(--muted)] mb-4 line-clamp-2">{repo.description}</p>
                  )}
                </div>

                <div className="pt-3 border-t border-[var(--border)] flex items-center justify-between mt-3">
                  <div className="flex items-center gap-4 text-xs text-[var(--muted)]">
                    {repo.language && (
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-[var(--accent)]" />
                        {repo.language}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Star className="w-3.5 h-3.5" /> {repo.stargazers_count}
                    </span>
                    <span className="flex items-center gap-1">
                      <GitFork className="w-3.5 h-3.5" /> {repo.forks_count}
                    </span>
                  </div>

                  <button
                    onClick={() =>
                      setSelectedRepo({
                        owner: repo.owner?.login || user?.github_username,
                        name: repo.name,
                      })
                    }
                    className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-[var(--surface-1)] hover:bg-[var(--accent)] hover:text-white border border-[var(--border)] transition-all"
                  >
                    <GitPullRequest className="w-3.5 h-3.5 text-[var(--accent)] group-hover:text-white" />
                    <span>Pull Requests</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pull Requests Modal/Drawer */}
      {selectedRepo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-3xl card bg-[#10111d] border border-[var(--border)] shadow-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-[var(--border)] mb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[var(--accent)]/10 flex items-center justify-center text-[var(--accent)]">
                  <GitPullRequest className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    {selectedRepo.owner}/{selectedRepo.name}
                  </h3>
                  <p className="text-xs text-[var(--muted)]">Pull Requests and Automated Code Reviews</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedRepo(null)}
                className="text-[var(--muted)] hover:text-white p-1 rounded-lg hover:bg-[var(--surface-1)] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 pr-1 space-y-3">
              {prsLoading ? (
                <div className="py-12 flex flex-col items-center justify-center text-[var(--muted)]">
                  <Loader2 className="w-6 h-6 animate-spin mb-2 text-[var(--accent)]" />
                  <p className="text-sm">Fetching pull requests...</p>
                </div>
              ) : pullRequests.length === 0 ? (
                <div className="py-12 text-center text-[var(--muted)]">
                  <GitPullRequest className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p className="text-sm font-medium">No pull requests found for this repository.</p>
                </div>
              ) : (
                pullRequests.map((pr: any) => {
                  const isOpen = pr.state === "open";
                  const isMerged = !!pr.merged_at;

                  return (
                    <div
                      key={pr.id}
                      className="p-4 rounded-xl bg-[var(--surface-1)] border border-[var(--border)] hover:border-[var(--border-hover)] transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-mono font-bold text-[var(--accent)]">#{pr.number}</span>
                          <h4 className="font-semibold text-white text-sm hover:text-[var(--accent)] transition-colors">
                            {pr.title}
                          </h4>
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-1 ${
                              isMerged
                                ? "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                                : isOpen
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                : "bg-red-500/10 text-red-400 border border-red-500/20"
                            }`}
                          >
                            {isMerged ? "Merged" : isOpen ? "Open" : "Closed"}
                          </span>
                        </div>

                        <div className="flex items-center gap-3 text-xs text-[var(--muted)] flex-wrap">
                          <span>by {pr.user?.login}</span>
                          <span>&bull;</span>
                          <span>opened {formatRelativeTime(pr.created_at)}</span>
                          <span>&bull;</span>
                          <span className="font-mono bg-[var(--surface-2)] px-1.5 py-0.5 rounded text-[11px]">
                            {pr.head?.ref} &rarr; {pr.base?.ref}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5 flex-shrink-0">
                        <a
                          href={pr.html_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 rounded-lg border border-[var(--border)] hover:bg-[var(--surface-2)] text-xs text-[var(--muted)] hover:text-white transition-colors flex items-center gap-1"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>View Diff</span>
                        </a>

                        <button
                          onClick={() => handleReviewPR(pr)}
                          className="btn-glow px-3.5 py-1.5 text-xs font-semibold flex items-center gap-1.5"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                          <span>Review with AI</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

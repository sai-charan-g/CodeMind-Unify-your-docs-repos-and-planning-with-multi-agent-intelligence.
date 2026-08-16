"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { formatRelativeTime } from "@/lib/utils";
import { FolderOpen, Plus, Trash2, Edit2, X } from "lucide-react";
import { GitHubIcon as Github } from "@/components/icons/github-icon";
import type { Project } from "@/types";

export default function ProjectsPage() {
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [repoUrl, setRepoUrl] = useState("");

  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ["projects"],
    queryFn: () => api.get("/projects/").then((r) => r.data),
  });

  const createMutation = useMutation({
    mutationFn: () => api.post("/projects/", { name, description: description || null, github_repo_url: repoUrl || null }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      setShowCreate(false);
      setName(""); setDescription(""); setRepoUrl("");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/projects/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["projects"] }),
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Projects</h1>
          <p className="text-[var(--muted)] mt-1">Organize your work into projects</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-glow flex items-center gap-2">
          <Plus className="w-4 h-4" /> New Project
        </button>
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="card border-[var(--accent)] border-opacity-30 animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Create Project</h3>
            <button onClick={() => setShowCreate(false)} className="text-[var(--muted)] hover:text-[var(--foreground)]"><X className="w-5 h-5" /></button>
          </div>
          <div className="space-y-3">
            <input value={name} onChange={(e) => setName(e.target.value)} className="input" placeholder="Project name" />
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="input min-h-[80px] resize-none" placeholder="Description (optional)" />
            <input value={repoUrl} onChange={(e) => setRepoUrl(e.target.value)} className="input" placeholder="GitHub repo URL (optional)" />
            <button onClick={() => createMutation.mutate()} disabled={!name.trim()} className="btn-glow w-full py-2.5">
              Create Project
            </button>
          </div>
        </div>
      )}

      {/* Projects Grid */}
      {projects.length === 0 ? (
        <div className="card text-center py-16">
          <FolderOpen className="w-12 h-12 mx-auto mb-4 text-[var(--muted)]" />
          <h3 className="font-semibold mb-1">No projects yet</h3>
          <p className="text-sm text-[var(--muted)]">Create your first project to get started</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => (
            <div key={project.id} className="card group">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-[var(--accent)] bg-opacity-10 flex items-center justify-center">
                  <FolderOpen className="w-5 h-5 text-[var(--accent)]" />
                </div>
                <button onClick={() => deleteMutation.mutate(project.id)}
                  className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-[var(--surface-1)] text-[var(--muted)] hover:text-[var(--error)] transition-all">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <h3 className="font-semibold mb-1">{project.name}</h3>
              {project.description && <p className="text-sm text-[var(--muted)] mb-3 line-clamp-2">{project.description}</p>}
              {project.github_repo_url && (
                <div className="flex items-center gap-1.5 text-xs text-[var(--muted)]">
                  <Github className="w-3.5 h-3.5" /> {project.github_repo_url.split("/").slice(-1)}
                </div>
              )}
              <p className="text-xs text-[var(--muted-foreground)] mt-3">{formatRelativeTime(project.created_at)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

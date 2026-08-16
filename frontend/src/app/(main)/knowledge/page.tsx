"use client";

import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { formatRelativeTime } from "@/lib/utils";
import { Upload, FileText, Trash2, Search, Loader2, CheckCircle, XCircle, Clock } from "lucide-react";
import type { KnowledgeDocument } from "@/types";

const statusConfig: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  ready: { icon: CheckCircle, color: "#00d2a0", label: "Ready" },
  processing: { icon: Loader2, color: "#f5a623", label: "Processing" },
  pending: { icon: Clock, color: "#f5a623", label: "Pending" },
  error: { icon: XCircle, color: "#ff5252", label: "Error" },
};

export default function KnowledgePage() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const { data: documents = [], isLoading } = useQuery<KnowledgeDocument[]>({
    queryKey: ["documents"],
    queryFn: () => api.get("/knowledge/documents").then((r) => r.data),
    refetchInterval: 5000,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/knowledge/documents/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["documents"] }),
  });

  const handleUpload = async (files: FileList | null) => {
    if (!files) return;
    setUploading(true);
    for (const file of Array.from(files)) {
      const formData = new FormData();
      formData.append("file", file);
      try {
        await api.post("/knowledge/documents/upload", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } catch (err) {
        console.error("Upload failed:", err);
      }
    }
    setUploading(false);
    queryClient.invalidateQueries({ queryKey: ["documents"] });
  };

  const filtered = documents.filter((d) =>
    d.filename.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Knowledge Base</h1>
          <p className="text-[var(--muted)] mt-1">Upload documents for RAG-powered search</p>
        </div>
        <button onClick={() => fileInputRef.current?.click()} className="btn-glow flex items-center gap-2" disabled={uploading}>
          {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
          Upload Files
        </button>
        <input ref={fileInputRef} type="file" multiple accept=".pdf,.md,.txt,.docx" className="hidden"
          onChange={(e) => handleUpload(e.target.files)} />
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-foreground)]" />
        <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
          className="input pl-10" placeholder="Search documents..." />
      </div>

      {/* Upload Zone */}
      <div
        className="border-2 border-dashed border-[var(--border)] hover:border-[var(--accent)] rounded-xl p-8 text-center transition-colors cursor-pointer"
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); handleUpload(e.dataTransfer.files); }}
      >
        <Upload className="w-8 h-8 mx-auto mb-3 text-[var(--muted)]" />
        <p className="text-sm text-[var(--muted)]">Drag & drop files here, or click to browse</p>
        <p className="text-xs text-[var(--muted-foreground)] mt-1">Supports PDF, Markdown, TXT, DOCX</p>
      </div>

      {/* Documents List */}
      <div className="space-y-3">
        {filtered.length === 0 && !isLoading && (
          <p className="text-center text-[var(--muted)] py-12">No documents found. Upload your first document!</p>
        )}
        {filtered.map((doc) => {
          const status = statusConfig[doc.status] || statusConfig.pending;
          return (
            <div key={doc.id} className="card flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-[var(--surface-1)] flex items-center justify-center flex-shrink-0">
                <FileText className="w-5 h-5 text-[var(--accent)]" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium truncate">{doc.filename}</p>
                <p className="text-xs text-[var(--muted)]">
                  {doc.chunk_count} chunks · {formatRelativeTime(doc.created_at)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full" style={{ background: `${status.color}15`, color: status.color }}>
                  <status.icon className={`w-3.5 h-3.5 ${doc.status === "processing" ? "animate-spin" : ""}`} />
                  {status.label}
                </span>
                <button onClick={() => deleteMutation.mutate(doc.id)}
                  className="p-2 rounded-lg hover:bg-[var(--surface-1)] text-[var(--muted)] hover:text-[var(--error)] transition-all">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

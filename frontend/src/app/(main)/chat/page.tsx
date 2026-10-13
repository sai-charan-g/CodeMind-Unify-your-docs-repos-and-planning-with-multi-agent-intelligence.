"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import api, { API_BASE } from "@/lib/api";
import { formatRelativeTime } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Plus, Send, MessageSquare, Sparkles, Brain, Search,
  Loader2, Trash2,
} from "lucide-react";
import { GitHubIcon as Github } from "@/components/icons/github-icon";
import type { Conversation } from "@/types";

const agentIcons: Record<string, React.ElementType> = {
  planner: Brain,
  rag: Search,
  github: Github,
  general: Sparkles,
};

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

function ChatContent() {
  const queryClient = useQueryClient();
  const [selectedConv, setSelectedConv] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const [currentAgent, setCurrentAgent] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const searchParams = useSearchParams();

  useEffect(() => {
    const promptParam = searchParams.get("prompt");
    if (promptParam) {
      setInput(promptParam);
    }
  }, [searchParams]);

  const { data: conversations = [] } = useQuery<Conversation[]>({
    queryKey: ["conversations"],
    queryFn: () => api.get("/chat/conversations").then((r) => r.data),
  });

  // Load messages when conversation is selected
  useEffect(() => {
    if (selectedConv) {
      api.get(`/chat/conversations/${selectedConv}`).then((res) => {
        setMessages(
          res.data.messages.map((m: any) => ({
            id: m.id,
            role: m.role,
            content: m.content,
          }))
        );
      });
    }
  }, [selectedConv]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingContent]);

  const createConversation = useMutation({
    mutationFn: () =>
      api.post("/chat/conversations", { title: "New Conversation" }).then((r) => r.data),
    onSuccess: (data: Conversation) => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      setSelectedConv(data.id);
      setMessages([]);
    },
  });

  const deleteConversation = useMutation({
    mutationFn: (id: string) => api.delete(`/chat/conversations/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      setSelectedConv(null);
      setMessages([]);
    },
  });

  const handleSend = async () => {
    if (!input.trim() || isStreaming) return;

    let convId = selectedConv;
    if (!convId) {
      const newConv = await createConversation.mutateAsync();
      convId = newConv.id;
    }

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
    };
    setMessages((prev) => [...prev, userMsg]);
    const currentInput = input.trim();
    setInput("");
    setIsStreaming(true);
    setStreamingContent("");
    setCurrentAgent("");

    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch(
        `${API_BASE}/chat/conversations/${convId}/messages`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ content: currentInput }),
        }
      );

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const text = decoder.decode(value, { stream: true });
          const lines = text.split("\n");

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              try {
                const data = JSON.parse(line.slice(6));
                if (data.content) {
                  accumulated += data.content;
                  setStreamingContent(accumulated);
                }
              } catch {}
            } else if (line.startsWith("event: metadata")) {
              // Next data line will have metadata
            } else if (line.startsWith("event: done")) {
              // Stream complete
            }
          }
        }
      }

      // Finalize message
      if (accumulated) {
        setMessages((prev) => [
          ...prev,
          { id: Date.now().toString(), role: "assistant", content: accumulated },
        ]);
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { id: Date.now().toString(), role: "assistant", content: "⚠️ Failed to get response. Please try again." },
      ]);
    }

    setIsStreaming(false);
    setStreamingContent("");
    queryClient.invalidateQueries({ queryKey: ["conversations"] });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex h-[calc(100vh-48px)] -m-6 lg:-m-8">
      {/* Conversation Sidebar */}
      <div className="w-72 border-r border-[var(--border)] flex flex-col bg-[var(--card)]">
        <div className="p-4 border-b border-[var(--border)]">
          <button
            onClick={() => createConversation.mutate()}
            className="btn-glow w-full flex items-center justify-center gap-2 py-2.5 text-sm"
          >
            <Plus className="w-4 h-4" /> New Chat
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {conversations.map((conv) => (
            <div
              key={conv.id}
              className={`group flex items-center gap-2 px-3 py-2.5 rounded-lg cursor-pointer transition-all ${
                selectedConv === conv.id
                  ? "bg-[var(--accent)] bg-opacity-15 text-[var(--accent)]"
                  : "hover:bg-[var(--surface-1)] text-[var(--muted)]"
              }`}
              onClick={() => setSelectedConv(conv.id)}
            >
              <MessageSquare className="w-4 h-4 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-sm truncate">{conv.title}</p>
                <p className="text-xs opacity-60">{formatRelativeTime(conv.updated_at)}</p>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); deleteConversation.mutate(conv.id); }}
                className="opacity-0 group-hover:opacity-100 p-1 hover:text-[var(--error)] transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {!selectedConv && messages.length === 0 ? (
          /* Empty State */
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center animate-fade-in">
              <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-[var(--gradient-start)] to-[var(--gradient-end)] flex items-center justify-center animate-float">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold mb-2">CodeMind Workspace</h2>
              <p className="text-[var(--muted)] mb-8 max-w-md">
                Ask me to review code, search documentation, analyze PRs, plan tasks, or anything engineering-related.
              </p>
              <div className="grid grid-cols-2 gap-3 max-w-lg mx-auto">
                {[
                  "Review my latest pull request",
                  "Search docs for authentication patterns",
                  "Help me debug this error",
                  "Plan a new microservice architecture",
                ].map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => { setInput(suggestion); }}
                    className="p-3 rounded-xl bg-[var(--surface-1)] border border-[var(--border)] hover:border-[var(--border-hover)] text-sm text-left text-[var(--muted)] hover:text-[var(--foreground)] transition-all"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* Messages */
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 animate-fade-in ${msg.role === "user" ? "justify-end" : ""}`}
              >
                {msg.role === "assistant" && (
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--gradient-start)] to-[var(--gradient-end)] flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                )}
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-3 ${
                    msg.role === "user"
                      ? "bg-[var(--accent)] text-white rounded-br-md"
                      : "bg-[var(--surface-1)] border border-[var(--border)] rounded-bl-md"
                  }`}
                >
                  {msg.role === "assistant" ? (
                    <div className="markdown-content text-sm">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {msg.content}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  )}
                </div>
              </div>
            ))}

            {/* Streaming message */}
            {isStreaming && (
              <div className="flex gap-3 animate-fade-in">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--gradient-start)] to-[var(--gradient-end)] flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-4 h-4 text-white animate-pulse" />
                </div>
                <div className="max-w-[75%] rounded-2xl rounded-bl-md px-4 py-3 bg-[var(--surface-1)] border border-[var(--border)]">
                  {streamingContent ? (
                    <div className="markdown-content text-sm">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {streamingContent}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-sm text-[var(--muted)]">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Thinking...
                    </div>
                  )}
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}

        {/* Input Area */}
        <div className="border-t border-[var(--border)] p-4 bg-[var(--card)]">
          <div className="flex items-end gap-3 max-w-4xl mx-auto">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask CodeMind anything..."
              rows={1}
              className="input flex-1 resize-none min-h-[44px] max-h-[200px] py-3"
              style={{ height: "auto" }}
              disabled={isStreaming}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isStreaming}
              className="btn-glow p-3 flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isStreaming ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={<div className="p-8 text-[var(--muted)]">Loading chat workspace...</div>}>
      <ChatContent />
    </Suspense>
  );
}

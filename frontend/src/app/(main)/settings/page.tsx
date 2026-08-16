"use client";

import { useAuthStore } from "@/store/auth-store";
import { User, Mail, Shield, Key } from "lucide-react";
import { GitHubIcon as Github } from "@/components/icons/github-icon";

export default function SettingsPage() {
  const { user } = useAuthStore();

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-[var(--muted)] mt-1">Manage your account and preferences</p>
      </div>

      {/* Profile */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <User className="w-5 h-5 text-[var(--accent)]" /> Profile
        </h2>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[var(--accent)] to-purple-400 flex items-center justify-center text-2xl font-bold text-white">
              {user?.full_name?.charAt(0).toUpperCase() || "?"}
            </div>
            <div>
              <p className="text-lg font-semibold">{user?.full_name}</p>
              <p className="text-sm text-[var(--muted)]">{user?.role}</p>
            </div>
          </div>
          <div className="grid gap-3">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-[var(--surface-1)]">
              <Mail className="w-4 h-4 text-[var(--muted)]" />
              <span className="text-sm">{user?.email}</span>
            </div>
            {user?.github_username && (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-[var(--surface-1)]">
                <Github className="w-4 h-4 text-[var(--muted)]" />
                <span className="text-sm">@{user.github_username}</span>
                <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-green-500/10 text-green-400">Connected</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Security */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Shield className="w-5 h-5 text-[var(--accent)]" /> Security
        </h2>
        <div className="space-y-3">
          <button className="w-full flex items-center gap-3 p-3 rounded-lg bg-[var(--surface-1)] hover:bg-[var(--surface-2)] transition-colors text-sm text-left">
            <Key className="w-4 h-4 text-[var(--muted)]" />
            <div>
              <p className="font-medium">Change Password</p>
              <p className="text-xs text-[var(--muted)]">Update your account password</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}

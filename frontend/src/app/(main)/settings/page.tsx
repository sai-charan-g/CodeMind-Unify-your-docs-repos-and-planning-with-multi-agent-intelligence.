"use client";

import { useState } from "react";
import { useAuthStore } from "@/store/auth-store";
import { User, Mail, Shield, Key, X, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { GitHubIcon as Github } from "@/components/icons/github-icon";
import api from "@/lib/api";

export default function SettingsPage() {
  const { user } = useAuthStore();
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("New password and confirm password do not match.");
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post("/auth/change-password", {
        current_password: currentPassword,
        new_password: newPassword,
      });
      setSuccess("Your password was updated successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => {
        setShowPasswordModal(false);
        setSuccess(null);
      }, 1500);
    } catch (err: any) {
      const msg = err.response?.data?.detail || "Failed to update password. Please check your current password.";
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

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
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[var(--accent)] to-purple-400 flex items-center justify-center text-2xl font-bold text-white shadow-lg shadow-[var(--accent)]/20">
              {user?.full_name?.charAt(0).toUpperCase() || "?"}
            </div>
            <div>
              <p className="text-lg font-semibold">{user?.full_name}</p>
              <p className="text-sm text-[var(--muted)] capitalize">{user?.role || "Developer"}</p>
            </div>
          </div>
          <div className="grid gap-3">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-[var(--surface-1)] border border-[var(--border)]">
              <Mail className="w-4 h-4 text-[var(--muted)]" />
              <span className="text-sm">{user?.email}</span>
            </div>
            {user?.github_username ? (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-[var(--surface-1)] border border-[var(--border)]">
                <Github className="w-4 h-4 text-[var(--muted)]" />
                <span className="text-sm">@{user.github_username}</span>
                <span className="ml-auto text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">Connected</span>
              </div>
            ) : (
              <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--surface-1)] border border-[var(--border)]">
                <div className="flex items-center gap-3">
                  <Github className="w-4 h-4 text-[var(--muted)]" />
                  <span className="text-sm text-[var(--muted)]">GitHub Account</span>
                </div>
                <button
                  onClick={async () => {
                    const res = await api.get("/auth/github/authorize");
                    window.location.href = res.data.authorization_url;
                  }}
                  className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-[var(--accent)] text-white hover:opacity-90 transition-opacity"
                >
                  Connect
                </button>
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
          <button
            onClick={() => {
              setError(null);
              setSuccess(null);
              setShowPasswordModal(true);
            }}
            className="w-full flex items-center justify-between p-3.5 rounded-lg bg-[var(--surface-1)] hover:bg-[var(--surface-2)] border border-[var(--border)] hover:border-[var(--border-hover)] transition-all text-sm text-left group"
          >
            <div className="flex items-center gap-3">
              <Key className="w-4 h-4 text-[var(--accent)]" />
              <div>
                <p className="font-medium group-hover:text-white transition-colors">Change Password</p>
                <p className="text-xs text-[var(--muted)]">Update your account login password</p>
              </div>
            </div>
            <span className="text-xs text-[var(--accent)] font-medium">Update &rarr;</span>
          </button>
        </div>
      </div>

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md card bg-[#12131f] border border-[var(--border)] shadow-2xl relative">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <Key className="w-5 h-5 text-[var(--accent)]" />
                <h3 className="text-lg font-bold">Change Password</h3>
              </div>
              <button
                onClick={() => setShowPasswordModal(false)}
                className="text-[var(--muted)] hover:text-white p-1 rounded-lg hover:bg-[var(--surface-1)] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {error && (
              <div className="p-3 mb-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="p-3 mb-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm flex items-center gap-2">
                <CheckCircle className="w-4 h-4 flex-shrink-0" />
                <span>{success}</span>
              </div>
            )}

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[var(--muted)] mb-1.5">Current Password</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="input w-full"
                  placeholder="••••••••"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--muted)] mb-1.5">New Password (min 8 chars)</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="input w-full"
                  placeholder="••••••••"
                  required
                  minLength={8}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--muted)] mb-1.5">Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="input w-full"
                  placeholder="••••••••"
                  required
                  minLength={8}
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--border)]">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="px-4 py-2 text-sm rounded-lg hover:bg-[var(--surface-1)] text-[var(--muted)] hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-glow flex items-center gap-2 px-5 py-2 text-sm font-semibold disabled:opacity-50"
                >
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  Save Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

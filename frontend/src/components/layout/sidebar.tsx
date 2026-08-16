"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuthStore } from "@/store/auth-store";
import { useUIStore } from "@/store/ui-store";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  MessageSquare,
  BookOpen,
  FolderOpen,
  Settings,
  LogOut,
  ChevronLeft,
  Sparkles,
} from "lucide-react";
import { GitHubIcon as Github } from "@/components/icons/github-icon";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/chat", label: "AI Workspace", icon: MessageSquare },
  { href: "/knowledge", label: "Knowledge Base", icon: BookOpen },
  { href: "/github", label: "GitHub", icon: Github },
  { href: "/projects", label: "Projects", icon: FolderOpen },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const { sidebarOpen, toggleSidebar } = useUIStore();

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen flex flex-col transition-all duration-300 glass",
        sidebarOpen ? "w-[280px]" : "w-[72px]"
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-6 border-b border-[var(--border)]">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[var(--gradient-start)] to-[var(--gradient-end)] flex items-center justify-center flex-shrink-0">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        {sidebarOpen && (
          <span className="text-lg font-bold gradient-text animate-fade-in">
            CodeMind
          </span>
        )}
        <button
          onClick={toggleSidebar}
          className={cn(
            "ml-auto p-1.5 rounded-lg hover:bg-[var(--surface-1)] transition-all",
            !sidebarOpen && "ml-0 mt-2"
          )}
        >
          <ChevronLeft
            className={cn(
              "w-4 h-4 text-[var(--muted)] transition-transform",
              !sidebarOpen && "rotate-180"
            )}
          />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group",
                isActive
                  ? "bg-[var(--accent)] bg-opacity-15 text-[var(--accent)]"
                  : "text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-1)]"
              )}
            >
              <item.icon
                className={cn(
                  "w-5 h-5 flex-shrink-0",
                  isActive ? "text-[var(--accent)]" : "text-[var(--muted)] group-hover:text-[var(--foreground)]"
                )}
              />
              {sidebarOpen && (
                <span className="text-sm font-medium animate-fade-in">
                  {item.label}
                </span>
              )}
              {isActive && sidebarOpen && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[var(--accent)]" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* User Section */}
      <div className="border-t border-[var(--border)] p-3">
        {sidebarOpen && user && (
          <div className="flex items-center gap-3 px-3 py-2 mb-2 animate-fade-in">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--accent)] to-purple-400 flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
              {user.full_name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium truncate">{user.full_name}</p>
              <p className="text-xs text-[var(--muted)] truncate">{user.email}</p>
            </div>
          </div>
        )}
        <button
          onClick={logout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg w-full text-[var(--muted)] hover:text-[var(--error)] hover:bg-[var(--surface-1)] transition-all"
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {sidebarOpen && <span className="text-sm font-medium">Logout</span>}
        </button>
      </div>
    </aside>
  );
}

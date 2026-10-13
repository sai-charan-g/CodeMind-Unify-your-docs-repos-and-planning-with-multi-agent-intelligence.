"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth-store";
import { useUIStore } from "@/store/ui-store";
import { Sidebar } from "@/components/layout/sidebar";
import { cn } from "@/lib/utils";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, fetchUser } = useAuthStore();
  const { sidebarOpen } = useUIStore();
  const router = useRouter();

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
    fetchUser();
  }, [isAuthenticated, router, fetchUser]);

  if (!mounted || !isAuthenticated) return null;

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main
        className={cn(
          "flex-1 transition-all duration-300",
          sidebarOpen ? "ml-[280px]" : "ml-[72px]"
        )}
      >
        <div className="p-6 lg:p-8 max-w-7xl mx-auto">{children}</div>
      </main>
    </div>
  );
}

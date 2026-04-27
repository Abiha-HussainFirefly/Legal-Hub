"use client";

import LawyerTopbar from "@/app/components/lawyer/lawyer-topbar";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type ActiveTab = "discussions" | "cases" | "topics" | "saved" | "profile";

interface WorkspaceUser {
  id?: string;
  name?: string | null;
  displayName?: string | null;
  email?: string | null;
  avatarUrl?: string | null;
  roles?: string[];
}

export default function LawyerShell({
  activeTab,
  children,
}: {
  activeTab: ActiveTab;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [user, setUser] = useState<WorkspaceUser | null>(null);

  useEffect(() => {
    let mounted = true;

    fetch("/api/auth/me", { cache: "no-store" })
      .then(async (response) => {
        if (!mounted) return;
        if (!response.ok) {
          setUser(null);
          return;
        }
        const data = await response.json();
        if (mounted) setUser(data.user ?? null);
      })
      .catch(() => {
        if (mounted) setUser(null);
      });

    return () => {
      mounted = false;
    };
  }, [router]);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/lawyerlogin");
  }

  return (
    <div className="legal-workspace-shell">
      <LawyerTopbar activeTab={activeTab} user={user} onLogout={handleLogout} />
      {children}
    </div>
  );
}

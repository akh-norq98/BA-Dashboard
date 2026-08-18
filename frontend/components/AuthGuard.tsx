"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "../services/api";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const token = window.localStorage.getItem("access_token");
    if (!token) { router.replace("/login"); return; }
    apiFetch("/auth/me").then(response => { if (response.ok) setReady(true); else router.replace("/login"); }).catch(() => router.replace("/login"));
  }, [router]);
  if (!ready) return <div className="flex min-h-screen items-center justify-center bg-[#f5f7fb] text-sm text-slate-500">Loading Delivery Hub…</div>;
  return <>{children}</>;
}

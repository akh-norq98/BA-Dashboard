"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { API_BASE_URL } from "../../services/api";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError("");
    const endpoint = mode === "login" ? "/auth/login" : "/auth/register";
    const payload = mode === "login" ? { email: form.email, password: form.password } : form;
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || "Unable to authenticate");
      window.localStorage.setItem("access_token", data.access_token);
      window.localStorage.setItem("deliveryhub_user", JSON.stringify(data.user));
      document.cookie = "deliveryhub_session=true; path=/; max-age=28800; SameSite=Lax";
      router.replace("/");
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Unable to authenticate"); }
    finally { setBusy(false); }
  }

  return <main className="flex min-h-screen items-center justify-center bg-[#f5f7fb] px-5"><div className="login-card"><div className="mb-7 flex items-center gap-3"><span className="brand-mark">DH</span><div><p className="text-xs font-semibold tracking-[0.16em] text-indigo-600">DELIVERY HUB</p><h1 className="text-xl font-semibold text-slate-900">Welcome back</h1></div></div><p className="mb-5 text-sm text-slate-500">Sign in to your delivery workspace.</p>{error && <p className="notice mb-4">{error}</p>}<form onSubmit={submit} className="space-y-4">{mode === "register" && <label>Your name<input required value={form.name} onChange={event => setForm({ ...form, name: event.target.value })} placeholder="Your name" /></label>}<label>Email<input required type="email" value={form.email} onChange={event => setForm({ ...form, email: event.target.value })} placeholder="you@company.com" /></label><label>Password<input required minLength={8} type="password" value={form.password} onChange={event => setForm({ ...form, password: event.target.value })} placeholder="Minimum 8 characters" /></label>{mode === "register" && <p className="text-xs text-slate-500">Accounts are reviewed and assigned to an organization by an administrator.</p>}<button disabled={busy} className="w-full">{busy ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}</button></form><button className="login-switch" onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); }}>{mode === "login" ? "Need an account? Create one" : "Already have an account? Sign in"}</button></div></main>;
}

"use client";

import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "../services/api";

type ModuleId = "dashboard" | "meetings" | "my-work" | "client-view" | "executive" | "master" | "qa" | "admin" | "action-items" | "development" | "requirements";
type User = { name?: string; role?: string };

const modules: { id: ModuleId; label: string; icon: string; permission: string; roles?: string[] }[] = [
  { id: "dashboard", label: "Dashboard", icon: "⌂", permission: "Dashboards" },
  { id: "meetings", label: "Meetings", icon: "◷", permission: "Meetings" },
  { id: "action-items", label: "Action Items", icon: "✓", permission: "Action Items" },
  { id: "my-work", label: "My Work", icon: "↗", permission: "Action Items" },
  { id: "development", label: "Development", icon: "◇", permission: "Modules" },
  { id: "requirements", label: "Requirements", icon: "▤", permission: "Modules" },
  { id: "client-view", label: "Client View", icon: "◎", permission: "Dashboards", roles: ["viewer", "client"] },
  { id: "executive", label: "Executive View", icon: "◆", permission: "Dashboards", roles: ["admin", "manager"] },
  { id: "master", label: "Master Control", icon: "◈", permission: "Dashboards", roles: ["admin", "manager"] },
  { id: "qa", label: "QA Dashboard", icon: "⚑", permission: "Dashboards", roles: ["admin", "manager", "editor"] },
  { id: "admin", label: "Roles & Permissions", icon: "⚙", permission: "Users", roles: ["admin"] },
];

export default function Sidebar({ active, onSelect }: { active: ModuleId; onSelect: (module: ModuleId) => void }) {
  const [open, setOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState<User>({});
  const [permissions, setPermissions] = useState<Record<string, Record<string, boolean>> | null>(null);

  useEffect(() => {
    try { setUser(JSON.parse(window.localStorage.getItem("deliveryhub_user") || "{}")); } catch { setUser({}); }
    apiFetch("/auth/me/permissions").then(response => response.ok ? response.json() : null).then(value => setPermissions(value?.permissions || null)).catch(() => undefined);
  }, []);

  const visibleModules = useMemo(() => modules.filter(item => {
    if (item.roles && !item.roles.includes(user.role || "")) return false;
    if (!permissions) return false;
    return permissions[item.permission]?.view === true;
  }), [permissions, user.role]);

  const select = (module: ModuleId) => { onSelect(module); setMobileOpen(false); };
  const logout = () => {
    window.localStorage.removeItem("access_token");
    window.localStorage.removeItem("deliveryhub_user");
    document.cookie = "deliveryhub_session=; path=/; max-age=0; SameSite=Lax";
    window.location.href = "/login";
  };
  return <>
    <button type="button" className="sidebar-mobile-toggle" onClick={() => setMobileOpen(true)} aria-label="Open navigation">☰</button>
    {mobileOpen && <button type="button" className="sidebar-overlay" onClick={() => setMobileOpen(false)} aria-label="Close navigation" />}
    <aside className={`app-sidebar ${open ? "sidebar-open" : "sidebar-collapsed"} ${mobileOpen ? "sidebar-mobile-open" : ""}`}>
      <div className="sidebar-brand"><span className="brand-mark">DH</span>{open && <div><p className="sidebar-brand-title">Delivery Hub</p><p className="sidebar-brand-subtitle">Delivery workspace</p></div>}<button type="button" className="sidebar-collapse" onClick={() => setOpen(value => !value)} aria-label={open ? "Collapse navigation" : "Expand navigation"}>{open ? "‹" : "›"}</button></div>
      <nav className="sidebar-nav" aria-label="Modules">{visibleModules.map(item => <button type="button" key={item.id} title={!open ? item.label : undefined} className={`sidebar-item ${active === item.id ? "sidebar-item-active" : ""}`} onClick={() => select(item.id)}><span className="sidebar-icon">{item.icon}</span>{open && <span>{item.label}</span>}</button>)}</nav>
      <div className="sidebar-user"><span className="sidebar-avatar">{(user.name || "U").charAt(0).toUpperCase()}</span>{open && <div className="min-w-0"><p className="sidebar-user-name">{user.name || "User"}</p><p className="sidebar-user-role">{user.role || "Workspace member"}</p></div>}<button type="button" className="sidebar-logout" onClick={logout} title="Log out" aria-label="Log out">↪</button></div>
    </aside>
  </>;
}

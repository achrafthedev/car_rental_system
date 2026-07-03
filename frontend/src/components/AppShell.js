"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { pb } from "@/lib/pocketbase";
import { classNames } from "@/lib/utils";

const CUSTOMER_LINKS = [
  { href: "/", label: "Browse", icon: "🚗" },
  { href: "/catalog", label: "Catalog", icon: "🔍" },
  { href: "/customer", label: "My Key", icon: "🔑" },
];

const ADMIN_LINKS = [
  { href: "/admin", label: "Dashboard", icon: "📊" },
  { href: "/admin/fleet", label: "Fleet", icon: "🚙" },
  { href: "/admin/customers", label: "Customers", icon: "👤" },
  { href: "/admin/billing", label: "Billing", icon: "💳" },
  { href: "/admin/inspect", label: "Inspect", icon: "🛠️" },
];

export default function AppShell({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState(null);
  const isAdminSection = pathname?.startsWith("/admin");

  useEffect(() => {
    setUser(pb().authStore.record);
    return pb().authStore.onChange(() => setUser(pb().authStore.record));
  }, []);

  const isStaff = user && (user.role === "admin" || user.role === "operator");
  const links = isAdminSection ? ADMIN_LINKS : CUSTOMER_LINKS;

  function handleLogout() {
    pb().authStore.clear();
    router.push("/");
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:w-60 md:flex-col md:fixed md:inset-y-0 border-r border-border bg-black/20 backdrop-blur-glass p-4 gap-6">
        <div className="flex items-center gap-2 px-2 py-3">
          <span className="text-2xl">🏎️</span>
          <span className="font-bold text-lg tracking-tight">Autodrive</span>
        </div>

        <nav className="flex flex-col gap-1">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={classNames(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
                pathname === link.href
                  ? "bg-primary/15 text-primary"
                  : "text-text-secondary hover:bg-white/5 hover:text-text-primary"
              )}
            >
              <span>{link.icon}</span>
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="mt-auto flex flex-col gap-2">
          {isStaff && (
            <Link
              href={isAdminSection ? "/" : "/admin"}
              className="btn-secondary text-xs justify-center"
            >
              {isAdminSection ? "Customer View" : "Admin View"}
            </Link>
          )}
          <ProfileBadge user={user} onLogout={handleLogout} />
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 md:ml-60 pb-20 md:pb-0">
        <div className="p-4 md:p-8">{children}</div>
      </main>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t border-border bg-black/60 backdrop-blur-glass flex justify-around py-2">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={classNames(
              "flex flex-col items-center gap-0.5 px-3 py-1 text-[11px] font-medium",
              pathname === link.href ? "text-primary" : "text-text-secondary"
            )}
          >
            <span className="text-lg">{link.icon}</span>
            {link.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}

function ProfileBadge({ user, onLogout }) {
  if (!user) {
    return (
      <Link href="/customer" className="glass-panel px-3 py-2 text-xs text-text-secondary">
        Not signed in
      </Link>
    );
  }
  return (
    <div className="glass-panel px-3 py-2 flex items-center justify-between gap-2">
      <div className="min-w-0">
        <p className="text-sm font-medium truncate">{user.name || user.email}</p>
        <p className="badge bg-primary/15 text-primary">{user.role}</p>
      </div>
      <button onClick={onLogout} className="text-xs text-text-secondary hover:text-danger">
        Exit
      </button>
    </div>
  );
}

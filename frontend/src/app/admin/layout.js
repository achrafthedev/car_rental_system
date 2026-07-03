"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { pb } from "@/lib/pocketbase";
import AuthGate from "@/components/AuthGate";

export default function AdminLayout({ children }) {
  const router = useRouter();
  const [user, setUser] = useState(undefined);

  useEffect(() => {
    setUser(pb().authStore.record);
    return pb().authStore.onChange(() => setUser(pb().authStore.record));
  }, []);

  useEffect(() => {
    if (user && user.role === "customer") {
      router.replace("/customer");
    }
  }, [user, router]);

  if (user === undefined) return null;

  if (!user) {
    return (
      <div className="max-w-sm mx-auto glass-card p-6">
        <h1 className="text-xl font-bold mb-4">Staff sign in</h1>
        <AuthGate onAuthenticated={setUser} />
      </div>
    );
  }

  if (user.role === "customer") return null;

  return children;
}

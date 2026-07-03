"use client";

import { useState } from "react";
import { pb } from "@/lib/pocketbase";

export default function AuthGate({ onAuthenticated }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (mode === "register") {
        await pb().collection("users").create({
          email: form.email,
          password: form.password,
          passwordConfirm: form.password,
          name: form.name,
          role: "customer",
        });
      }
      const authData = await pb()
        .collection("users")
        .authWithPassword(form.email, form.password);
      onAuthenticated?.(authData.record);
    } catch (err) {
      setError(err?.data?.message || err.message || "Authentication failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-3">
      <div className="flex gap-2 text-sm mb-1">
        <button
          type="button"
          className={mode === "login" ? "text-primary font-semibold" : "text-text-secondary"}
          onClick={() => setMode("login")}
        >
          Sign in
        </button>
        <span className="text-text-secondary">/</span>
        <button
          type="button"
          className={mode === "register" ? "text-primary font-semibold" : "text-text-secondary"}
          onClick={() => setMode("register")}
        >
          Create account
        </button>
      </div>

      {mode === "register" && (
        <div>
          <label className="label">Full name</label>
          <input
            className="input"
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </div>
      )}
      <div>
        <label className="label">Email</label>
        <input
          type="email"
          className="input"
          required
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
      </div>
      <div>
        <label className="label">Password</label>
        <input
          type="password"
          className="input"
          required
          minLength={8}
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />
      </div>

      {error && <p className="text-xs text-danger">{error}</p>}

      <button type="submit" disabled={loading} className="btn-primary w-full mt-1">
        {loading ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}
      </button>
    </form>
  );
}

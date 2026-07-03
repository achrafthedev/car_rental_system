"use client";

import { useEffect, useState } from "react";
import { pb, fileUrl } from "@/lib/pocketbase";
import { formatDate } from "@/lib/utils";

export default function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  async function load() {
    setLoading(true);
    try {
      const records = await pb().collection("customers").getFullList({ sort: "-created" });
      setCustomers(records);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function setKyc(customer, verified) {
    const updated = await pb().collection("customers").update(customer.id, { kyc_verified: verified });
    setCustomers((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
  }

  async function setBlacklist(customer, blacklisted) {
    const updated = await pb()
      .collection("customers")
      .update(customer.id, { status: blacklisted ? "blacklisted" : "active" });
    setCustomers((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
  }

  const filtered = customers.filter((c) =>
    `${c.first_name} ${c.last_name} ${c.email}`.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">Customer Directory</h1>
        <p className="text-text-secondary text-sm">{customers.length} registered customers</p>
      </div>

      <input
        className="input max-w-sm"
        placeholder="Search by name or email…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((c) => (
          <div key={c.id} className="glass-card p-4 flex flex-col gap-3">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold">{c.first_name} {c.last_name}</p>
                <p className="text-xs text-text-secondary">{c.email}</p>
                <p className="text-xs text-text-secondary">{c.phone}</p>
              </div>
              <span className={`badge ${c.status === "blacklisted" ? "bg-danger/15 text-danger" : "bg-primary/15 text-primary"}`}>
                {c.status}
              </span>
            </div>

            <div className="flex gap-2 text-xs text-text-secondary">
              <span>License #{c.license_number}</span>
              <span>· Exp {formatDate(c.license_expiry)}</span>
            </div>

            {(c.license_photo || c.selfie_photo) && (
              <div className="flex gap-2">
                {c.license_photo && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={fileUrl(c, c.license_photo, "100x100")} alt="License" className="h-14 w-14 rounded-lg object-cover border border-white/10" />
                )}
                {c.selfie_photo && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={fileUrl(c, c.selfie_photo, "100x100")} alt="Selfie" className="h-14 w-14 rounded-lg object-cover border border-white/10" />
                )}
              </div>
            )}

            <div className="flex items-center justify-between pt-2 border-t border-white/5">
              <label className="flex items-center gap-2 text-xs text-text-secondary">
                <input
                  type="checkbox"
                  checked={c.kyc_verified}
                  onChange={(e) => setKyc(c, e.target.checked)}
                  className="accent-primary"
                />
                KYC Verified
              </label>
              <button
                className={`text-xs ${c.status === "blacklisted" ? "text-primary" : "text-danger"}`}
                onClick={() => setBlacklist(c, c.status !== "blacklisted")}
              >
                {c.status === "blacklisted" ? "Remove blacklist" : "Blacklist"}
              </button>
            </div>
          </div>
        ))}
      </div>

      {!loading && filtered.length === 0 && (
        <p className="text-sm text-text-secondary text-center py-8">No customers found.</p>
      )}
    </div>
  );
}

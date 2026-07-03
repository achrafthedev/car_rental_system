"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { pb } from "@/lib/pocketbase";
import { formatCurrency } from "@/lib/utils";
import SearchWidget from "@/components/SearchWidget";
import VehicleCard from "@/components/VehicleCard";

function defaultDates() {
  const pickup = new Date(Date.now() + 24 * 3600 * 1000);
  const ret = new Date(Date.now() + 3 * 24 * 3600 * 1000);
  const fmt = (d) => d.toISOString().slice(0, 16);
  return { location: "", pickup: fmt(pickup), ret: fmt(ret) };
}

export default function LandingPage() {
  const router = useRouter();
  const [search, setSearch] = useState(defaultDates());
  const [featured, setFeatured] = useState([]);

  useEffect(() => {
    pb()
      .collection("vehicles")
      .getList(1, 3, { filter: 'status = "available"', sort: "-daily_rate" })
      .then((res) => setFeatured(res.items))
      .catch(() => setFeatured([]));
  }, []);

  function goToCatalog() {
    const params = new URLSearchParams(search).toString();
    router.push(`/catalog?${params}`);
  }

  return (
    <div className="flex flex-col gap-10">
      <section className="text-center py-10 md:py-16">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
          Drive on <span className="text-primary">your</span> terms.
        </h1>
        <p className="text-text-secondary mt-3 max-w-xl mx-auto">
          Autodrive is a local-first car rental platform — book, unlock, and return your
          vehicle without ever visiting a counter.
        </p>
      </section>

      <SearchWidget value={search} onChange={setSearch} onSubmit={goToCatalog} />

      {featured.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-semibold">Featured vehicles</h2>
            <button onClick={goToCatalog} className="text-sm text-primary hover:underline">
              View full catalog →
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {featured.map((vehicle) => (
              <VehicleCard
                key={vehicle.id}
                vehicle={vehicle}
                onBook={goToCatalog}
              />
            ))}
          </div>
        </section>
      )}

      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { title: "Verify in seconds", body: "Snap your license and a selfie — our OCR does the rest." },
          { title: "Book securely", body: "A refundable deposit and e-signature lock in your rental." },
          { title: "Unlock with your phone", body: "Skip the counter. Lock and unlock your car from My Key." },
        ].map((f) => (
          <div key={f.title} className="glass-card p-5">
            <p className="font-semibold mb-1">{f.title}</p>
            <p className="text-sm text-text-secondary">{f.body}</p>
          </div>
        ))}
      </section>
    </div>
  );
}

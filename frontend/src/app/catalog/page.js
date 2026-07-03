"use client";

import { useEffect, useMemo, useState } from "react";
import { pb } from "@/lib/pocketbase";
import { estimateTotal } from "@/lib/utils";
import SearchWidget from "@/components/SearchWidget";
import FilterBar from "@/components/FilterBar";
import VehicleCard from "@/components/VehicleCard";
import BookingFlow from "@/components/BookingFlow";
import Modal from "@/components/Modal";

function defaultDates() {
  const pickup = new Date(Date.now() + 24 * 3600 * 1000);
  const ret = new Date(Date.now() + 3 * 24 * 3600 * 1000);
  const fmt = (d) => d.toISOString().slice(0, 16);
  return { location: "", pickup: fmt(pickup), ret: fmt(ret) };
}

export default function CatalogPage() {
  const [search, setSearch] = useState(defaultDates());
  const [filters, setFilters] = useState({ gearbox: "", fuel_type: "", maxPrice: 500 });
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bookingVehicle, setBookingVehicle] = useState(null);
  const [confirmed, setConfirmed] = useState(null);

  async function loadVehicles() {
    setLoading(true);
    try {
      const records = await pb().collection("vehicles").getFullList({ sort: "make" });
      setVehicles(records);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadVehicles();
  }, []);

  const filtered = useMemo(() => {
    return vehicles.filter((v) => {
      if (filters.gearbox && v.gearbox !== filters.gearbox) return false;
      if (filters.fuel_type && v.fuel_type !== filters.fuel_type) return false;
      if (v.daily_rate > filters.maxPrice) return false;
      if (search.location && v.location !== search.location) return false;
      return true;
    });
  }, [vehicles, filters, search.location]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">Vehicle Catalog</h1>
        <p className="text-text-secondary text-sm">
          {filtered.length} vehicle(s) available for your dates
        </p>
      </div>

      <SearchWidget value={search} onChange={setSearch} onSubmit={loadVehicles} />
      <FilterBar filters={filters} onChange={setFilters} />

      {loading ? (
        <p className="text-text-secondary text-sm">Loading fleet…</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((vehicle) => (
            <VehicleCard
              key={vehicle.id}
              vehicle={vehicle}
              estimate={estimateTotal(vehicle.daily_rate, search.pickup, search.ret)}
              onBook={setBookingVehicle}
            />
          ))}
          {filtered.length === 0 && (
            <p className="text-text-secondary text-sm col-span-full">
              No vehicles match your filters.
            </p>
          )}
        </div>
      )}

      {bookingVehicle && (
        <BookingFlow
          vehicle={bookingVehicle}
          pickup={search.pickup}
          ret={search.ret}
          total={estimateTotal(bookingVehicle.daily_rate, search.pickup, search.ret)}
          onClose={() => setBookingVehicle(null)}
          onBooked={(booking) => {
            setBookingVehicle(null);
            setConfirmed(booking);
            loadVehicles();
          }}
        />
      )}

      <Modal open={!!confirmed} onClose={() => setConfirmed(null)} title="Booking Confirmed 🎉">
        <p className="text-sm text-text-secondary">
          Your reservation is confirmed. Manage your digital key from the{" "}
          <span className="text-primary">My Key</span> tab once your rental begins.
        </p>
        <button className="btn-primary w-full mt-4" onClick={() => setConfirmed(null)}>
          Done
        </button>
      </Modal>
    </div>
  );
}

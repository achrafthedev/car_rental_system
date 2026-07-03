"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { pb } from "@/lib/pocketbase";
import { formatCurrency } from "@/lib/utils";
import StatCard from "@/components/StatCard";
import GanttCalendar from "@/components/GanttCalendar";
import BookingActionModal from "@/components/BookingActionModal";

const FleetMap = dynamic(() => import("@/components/FleetMap"), { ssr: false });

export default function AdminDashboard() {
  const [vehicles, setVehicles] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const [vehicleList, bookingList] = await Promise.all([
        pb().collection("vehicles").getFullList({ sort: "make" }),
        pb().collection("bookings").getFullList({
          sort: "-pickup_datetime",
          expand: "vehicle,customer",
          filter: 'status != "cancelled"',
        }),
      ]);
      setVehicles(vehicleList);
      setBookings(bookingList);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const activeRentals = bookings.filter((b) => b.status === "active");
  const utilization = vehicles.length
    ? Math.round((activeRentals.length / vehicles.length) * 100)
    : 0;
  const pendingMaintenance = vehicles.filter((v) => v.status === "maintenance").length;
  const todayRevenue = bookings
    .filter((b) => {
      const created = new Date(b.created);
      const now = new Date();
      return (
        created.getDate() === now.getDate() &&
        created.getMonth() === now.getMonth() &&
        created.getFullYear() === now.getFullYear()
      );
    })
    .reduce((sum, b) => sum + (b.total_price || 0), 0);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">Operations Dashboard</h1>
        <p className="text-text-secondary text-sm">Fleet-wide overview and booking timeline</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Today's Revenue" value={formatCurrency(todayRevenue)} accent="#10b981" />
        <StatCard label="Fleet Utilization" value={`${utilization}%`} />
        <StatCard label="Active Rentals" value={activeRentals.length} />
        <StatCard
          label="Pending Maintenance"
          value={pendingMaintenance}
          accent={pendingMaintenance > 0 ? "#f59e0b" : undefined}
        />
      </div>

      {loading ? (
        <p className="text-text-secondary text-sm">Loading dashboard…</p>
      ) : (
        <>
          <GanttCalendar
            vehicles={vehicles}
            bookings={bookings}
            onSelectBooking={setSelectedBooking}
          />
          <FleetMap vehicles={vehicles} />
        </>
      )}

      {selectedBooking && (
        <BookingActionModal
          booking={selectedBooking}
          onClose={() => setSelectedBooking(null)}
          onUpdated={() => {
            setSelectedBooking(null);
            load();
          }}
        />
      )}
    </div>
  );
}

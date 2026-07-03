"use client";

import { useState } from "react";
import Modal from "@/components/Modal";
import { pb } from "@/lib/pocketbase";
import { formatCurrency, formatDateTime } from "@/lib/utils";

export default function BookingActionModal({ booking, onClose, onUpdated }) {
  const [pickupMileage, setPickupMileage] = useState(booking.pickup_mileage || 0);
  const [pickupFuel, setPickupFuel] = useState(booking.pickup_fuel_level ?? 100);
  const [returnMileage, setReturnMileage] = useState(booking.return_mileage || 0);
  const [returnFuel, setReturnFuel] = useState(booking.return_fuel_level ?? 100);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const customer = booking.expand?.customer;
  const vehicle = booking.expand?.vehicle;

  async function save(patch) {
    setSaving(true);
    setError("");
    try {
      const updated = await pb().collection("bookings").update(booking.id, patch);
      onUpdated?.(updated);
    } catch (err) {
      setError(err?.data?.message || err.message || "Update failed.");
    } finally {
      setSaving(false);
    }
  }

  async function cancelBooking() {
    if (!confirm("Cancel this booking?")) return;
    await save({ status: "cancelled" });
  }

  return (
    <Modal open onClose={onClose} title="Booking Details" wide>
      <div className="grid grid-cols-2 gap-4 text-sm mb-4">
        <div>
          <p className="label">Customer</p>
          <p>{customer ? `${customer.first_name} ${customer.last_name}` : "—"}</p>
          <p className="text-text-secondary text-xs">{customer?.email}</p>
        </div>
        <div>
          <p className="label">Vehicle</p>
          <p>
            {vehicle?.make} {vehicle?.model}
          </p>
          <p className="text-text-secondary text-xs">{vehicle?.plate_number}</p>
        </div>
        <div>
          <p className="label">Pickup</p>
          <p>{formatDateTime(booking.pickup_datetime)}</p>
        </div>
        <div>
          <p className="label">Return</p>
          <p>{formatDateTime(booking.return_datetime)}</p>
        </div>
        <div>
          <p className="label">Total price</p>
          <p className="text-primary font-semibold">{formatCurrency(booking.total_price)}</p>
        </div>
        <div>
          <p className="label">Status</p>
          <span className="badge bg-white/10">{booking.status}</span>
        </div>
      </div>

      {error && <p className="text-xs text-danger mb-2">{error}</p>}

      {booking.status === "confirmed" && (
        <div className="glass-panel p-4 flex flex-col gap-3">
          <p className="font-medium text-sm">Start Rental</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Pickup mileage</label>
              <input
                type="number"
                className="input"
                value={pickupMileage}
                onChange={(e) => setPickupMileage(Number(e.target.value))}
              />
            </div>
            <div>
              <label className="label">Fuel level (%)</label>
              <input
                type="number"
                className="input"
                min={0}
                max={100}
                value={pickupFuel}
                onChange={(e) => setPickupFuel(Number(e.target.value))}
              />
            </div>
          </div>
          <button
            className="btn-primary"
            disabled={saving}
            onClick={() =>
              save({
                status: "active",
                pickup_mileage: pickupMileage,
                pickup_fuel_level: pickupFuel,
              })
            }
          >
            Start Rental
          </button>
        </div>
      )}

      {booking.status === "active" && (
        <div className="glass-panel p-4 flex flex-col gap-3">
          <p className="font-medium text-sm">Process Return</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Return mileage</label>
              <input
                type="number"
                className="input"
                value={returnMileage}
                onChange={(e) => setReturnMileage(Number(e.target.value))}
              />
            </div>
            <div>
              <label className="label">Fuel level (%)</label>
              <input
                type="number"
                className="input"
                min={0}
                max={100}
                value={returnFuel}
                onChange={(e) => setReturnFuel(Number(e.target.value))}
              />
            </div>
          </div>
          <button
            className="btn-primary"
            disabled={saving}
            onClick={() =>
              save({
                status: "completed",
                return_mileage: returnMileage,
                return_fuel_level: returnFuel,
              })
            }
          >
            Process Return
          </button>
        </div>
      )}

      {(booking.status === "confirmed" || booking.status === "draft") && (
        <button className="btn-danger w-full mt-3" disabled={saving} onClick={cancelBooking}>
          Cancel Booking
        </button>
      )}
    </Modal>
  );
}

"use client";

import { useState } from "react";
import Modal from "@/components/Modal";
import { pb } from "@/lib/pocketbase";
import { formatCurrency, formatDateTime, toDateInputValue } from "@/lib/utils";

export default function BookingActionModal({ booking, vehicles = [], onClose, onUpdated }) {
  const [pickupMileage, setPickupMileage] = useState(booking.pickup_mileage || 0);
  const [pickupFuel, setPickupFuel] = useState(booking.pickup_fuel_level ?? 100);
  const [returnMileage, setReturnMileage] = useState(booking.return_mileage || 0);
  const [returnFuel, setReturnFuel] = useState(booking.return_fuel_level ?? 100);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [editing, setEditing] = useState(false);
  const [editVehicle, setEditVehicle] = useState(booking.vehicle);
  const [editPickup, setEditPickup] = useState(toDateInputValue(booking.pickup_datetime));
  const [editReturn, setEditReturn] = useState(toDateInputValue(booking.return_datetime));

  const customer = booking.expand?.customer;
  const vehicle = booking.expand?.vehicle;
  const canEdit = booking.status !== "completed" && booking.status !== "cancelled";

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

  async function saveEdits() {
    await save({
      vehicle: editVehicle,
      pickup_datetime: editPickup,
      return_datetime: editReturn,
    });
    setEditing(false);
  }

  return (
    <Modal open onClose={onClose} title="Booking Details" wide>
      {!editing ? (
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
          <div className="flex items-start justify-between">
            <div>
              <p className="label">Status</p>
              <span className="badge bg-white/10">{booking.status}</span>
            </div>
            {canEdit && (
              <button className="text-xs text-primary hover:underline" onClick={() => setEditing(true)}>
                Edit Booking
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="glass-panel p-4 flex flex-col gap-3 mb-4">
          <p className="font-medium text-sm">Edit Booking</p>
          <div>
            <label className="label">Vehicle</label>
            <select className="input" value={editVehicle} onChange={(e) => setEditVehicle(e.target.value)}>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>{v.make} {v.model} · {v.plate_number}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Pickup</label>
              <input
                type="datetime-local"
                className="input"
                value={editPickup}
                onChange={(e) => setEditPickup(e.target.value)}
              />
            </div>
            <div>
              <label className="label">Return</label>
              <input
                type="datetime-local"
                className="input"
                value={editReturn}
                onChange={(e) => setEditReturn(e.target.value)}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button className="btn-secondary flex-1" onClick={() => setEditing(false)} disabled={saving}>
              Cancel
            </button>
            <button className="btn-primary flex-1" onClick={saveEdits} disabled={saving}>
              {saving ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </div>
      )}

      {error && <p className="text-xs text-danger mb-2">{error}</p>}

      {!editing && booking.status === "confirmed" && (
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

      {!editing && booking.status === "active" && (
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

      {!editing && (booking.status === "confirmed" || booking.status === "draft") && (
        <button className="btn-danger w-full mt-3" disabled={saving} onClick={cancelBooking}>
          Cancel Booking
        </button>
      )}
    </Modal>
  );
}

"use client";

import { useEffect, useState } from "react";
import { pb } from "@/lib/pocketbase";
import { formatDateTime } from "@/lib/utils";
import AuthGate from "@/components/AuthGate";

function playClick(freq) {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.25);
  } catch (_) {
    /* audio not available */
  }
}

export default function CustomerKeyPage() {
  const [user, setUser] = useState(null);
  const [booking, setBooking] = useState(null);
  const [vehicle, setVehicle] = useState(null);
  const [connecting, setConnecting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setUser(pb().authStore.record);
    const unsub = pb().authStore.onChange(() => setUser(pb().authStore.record));
    return unsub;
  }, []);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    loadActiveRental();
  }, [user]);

  async function loadActiveRental() {
    setLoading(true);
    try {
      const customer = await pb()
        .collection("customers")
        .getFirstListItem(`user = "${user.id}"`)
        .catch(() => null);

      if (!customer) {
        setBooking(null);
        return;
      }

      const activeBooking = await pb()
        .collection("bookings")
        .getFirstListItem(`customer = "${customer.id}" && status = "active"`, {
          expand: "vehicle",
        })
        .catch(() => null);

      setBooking(activeBooking);
      setVehicle(activeBooking?.expand?.vehicle || null);
    } finally {
      setLoading(false);
    }
  }

  async function toggleLock(locked) {
    if (!vehicle) return;
    setConnecting(true);
    setTimeout(async () => {
      const telemetry = { ...(vehicle.telemetry || {}), locked };
      const updated = await pb().collection("vehicles").update(vehicle.id, { telemetry });
      setVehicle(updated);
      setConnecting(false);
      playClick(locked ? 440 : 660);
    }, 1400);
  }

  if (!user) {
    return (
      <div className="max-w-sm mx-auto glass-card p-6">
        <h1 className="text-xl font-bold mb-4">Sign in to manage your key</h1>
        <AuthGate onAuthenticated={setUser} />
      </div>
    );
  }

  if (loading) {
    return <p className="text-text-secondary text-sm">Loading your rental…</p>;
  }

  if (!booking || !vehicle) {
    return (
      <div className="glass-card p-8 text-center max-w-md mx-auto">
        <p className="text-4xl mb-3">🔑</p>
        <h1 className="text-lg font-semibold mb-1">No active rental</h1>
        <p className="text-text-secondary text-sm">
          Once your booking is marked active by our team, your digital key controls will appear
          here.
        </p>
      </div>
    );
  }

  const telemetry = vehicle.telemetry || {};
  const locked = telemetry.locked !== false;

  return (
    <div className="max-w-md mx-auto flex flex-col gap-5">
      <div className="text-center">
        <h1 className="text-xl font-bold">
          {vehicle.make} {vehicle.model}
        </h1>
        <p className="text-text-secondary text-sm">{vehicle.plate_number}</p>
      </div>

      <div className="glass-card p-6 flex flex-col items-center gap-4">
        <div
          className={`h-32 w-32 rounded-full flex items-center justify-center text-6xl transition ${
            connecting ? "animate-pulse" : ""
          }`}
          style={{
            background: locked ? "rgba(239,68,68,0.12)" : "rgba(16,185,129,0.12)",
            border: `2px solid ${locked ? "var(--danger)" : "var(--primary)"}`,
          }}
        >
          {connecting ? "📡" : locked ? "🔒" : "🔓"}
        </div>
        <p className="font-semibold">
          {connecting ? "Connecting to vehicle…" : locked ? "Vehicle Locked" : "Vehicle Unlocked"}
        </p>

        <div className="grid grid-cols-2 gap-3 w-full text-center">
          <div className="glass-panel p-3">
            <p className="label">Fuel</p>
            <p className="text-lg font-bold">{telemetry.fuel_level ?? 100}%</p>
          </div>
          <div className="glass-panel p-3">
            <p className="label">Battery</p>
            <p className="text-lg font-bold">{telemetry.battery_status ?? 100}%</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 w-full">
          <button
            className="btn-primary"
            disabled={connecting || !locked}
            onClick={() => toggleLock(false)}
          >
            Unlock Vehicle
          </button>
          <button
            className="btn-danger"
            disabled={connecting || locked}
            onClick={() => toggleLock(true)}
          >
            Lock Vehicle
          </button>
        </div>
      </div>

      <div className="glass-card p-4 text-sm text-text-secondary">
        <p>
          Rental active until{" "}
          <span className="text-text-primary font-medium">
            {formatDateTime(booking.return_datetime)}
          </span>
        </p>
      </div>
    </div>
  );
}

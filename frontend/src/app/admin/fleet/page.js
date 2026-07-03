"use client";

import { useEffect, useState } from "react";
import { pb } from "@/lib/pocketbase";
import { formatCurrency, statusColor } from "@/lib/utils";
import VehicleFormModal from "@/components/VehicleFormModal";

export default function FleetPage() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const records = await pb().collection("vehicles").getFullList({ sort: "make" });
      setVehicles(records);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function remove(vehicle) {
    if (!confirm(`Delete ${vehicle.make} ${vehicle.model} (${vehicle.plate_number})?`)) return;
    await pb().collection("vehicles").delete(vehicle.id);
    load();
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Fleet Management</h1>
          <p className="text-text-secondary text-sm">{vehicles.length} vehicles registered</p>
        </div>
        <button className="btn-primary" onClick={() => { setEditing(null); setShowForm(true); }}>
          + Add Vehicle
        </button>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="scroll-x">
          <table className="w-full text-sm min-w-[800px]">
            <thead>
              <tr className="text-left text-text-secondary border-b border-border">
                <th className="p-3">Vehicle</th>
                <th className="p-3">Plate</th>
                <th className="p-3">Specs</th>
                <th className="p-3">Rate</th>
                <th className="p-3">Mileage</th>
                <th className="p-3">Status</th>
                <th className="p-3">Location</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {vehicles.map((v) => (
                <tr key={v.id} className="border-b border-white/5 hover:bg-white/5">
                  <td className="p-3 font-medium">{v.make} {v.model} <span className="text-text-secondary">'{String(v.year).slice(-2)}</span></td>
                  <td className="p-3">{v.plate_number}</td>
                  <td className="p-3 text-text-secondary">{v.gearbox} · {v.fuel_type}</td>
                  <td className="p-3">{formatCurrency(v.daily_rate)}/day</td>
                  <td className="p-3">{v.mileage?.toLocaleString()} mi</td>
                  <td className="p-3">
                    <span className="badge" style={{ background: `${statusColor(v.status)}22`, color: statusColor(v.status) }}>
                      {v.status}
                    </span>
                  </td>
                  <td className="p-3 text-text-secondary">{v.location}</td>
                  <td className="p-3 text-right whitespace-nowrap">
                    <button className="text-primary text-xs mr-3" onClick={() => { setEditing(v); setShowForm(true); }}>Edit</button>
                    <button className="text-danger text-xs" onClick={() => remove(v)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!loading && vehicles.length === 0 && (
            <p className="text-center text-sm text-text-secondary py-8">No vehicles yet. Add your first one.</p>
          )}
        </div>
      </div>

      {showForm && (
        <VehicleFormModal
          vehicle={editing}
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); load(); }}
        />
      )}
    </div>
  );
}

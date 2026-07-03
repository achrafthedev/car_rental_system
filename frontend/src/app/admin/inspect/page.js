"use client";

import { useEffect, useState } from "react";
import { pb } from "@/lib/pocketbase";
import CarWireframe from "@/components/CarWireframe";
import DamageFormModal from "@/components/DamageFormModal";
import DamageDetailModal from "@/components/DamageDetailModal";

export default function InspectPage() {
  const [vehicles, setVehicles] = useState([]);
  const [vehicleId, setVehicleId] = useState("");
  const [damages, setDamages] = useState([]);
  const [tapPoint, setTapPoint] = useState(null);
  const [selectedDamage, setSelectedDamage] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    pb().collection("vehicles").getFullList({ sort: "make" }).then((records) => {
      setVehicles(records);
      if (records.length) setVehicleId(records[0].id);
      setLoading(false);
    });
  }, []);

  async function loadDamages(id) {
    if (!id) return;
    const records = await pb().collection("damages").getFullList({
      filter: `vehicle = "${id}"`,
      sort: "-created",
    });
    setDamages(records);
  }

  useEffect(() => {
    loadDamages(vehicleId);
  }, [vehicleId]);

  const vehicle = vehicles.find((v) => v.id === vehicleId);
  const openIssues = damages.filter((d) => !d.resolved);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">Smart Inspection Terminal</h1>
        <p className="text-text-secondary text-sm">Tap the diagram to log a new damage point.</p>
      </div>

      <div className="glass-card p-4 flex flex-wrap items-center gap-3">
        <label className="label !mb-0">Vehicle</label>
        <select className="input max-w-xs" value={vehicleId} onChange={(e) => setVehicleId(e.target.value)}>
          {vehicles.map((v) => (
            <option key={v.id} value={v.id}>{v.make} {v.model} · {v.plate_number}</option>
          ))}
        </select>
        {vehicle && (
          <span className="badge bg-white/10 ml-auto">{openIssues.length} open issue(s)</span>
        )}
      </div>

      {!loading && vehicle && (
        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
          <div className="glass-card p-6">
            <CarWireframe
              damages={damages}
              onTap={(x, y) => setTapPoint({ x, y })}
              onSelectDamage={setSelectedDamage}
            />
            <p className="text-xs text-text-secondary text-center mt-3">
              Top-down view · glowing dots mark reported damage
            </p>
          </div>

          <div className="glass-card p-4">
            <h2 className="text-lg font-semibold mb-3">Damage Log</h2>
            <div className="flex flex-col gap-2 max-h-[420px] overflow-y-auto">
              {damages.map((d) => (
                <button
                  key={d.id}
                  onClick={() => setSelectedDamage(d)}
                  className="text-left glass-panel p-3 flex items-center justify-between hover:bg-white/10"
                >
                  <div>
                    <p className="text-sm font-medium capitalize">{d.part.replaceAll("_", " ")}</p>
                    <p className="text-xs text-text-secondary line-clamp-1">{d.description}</p>
                  </div>
                  <span className={`badge ${d.resolved ? "bg-primary/15 text-primary" : "bg-danger/15 text-danger"}`}>
                    {d.resolved ? "resolved" : d.severity}
                  </span>
                </button>
              ))}
              {damages.length === 0 && (
                <p className="text-sm text-text-secondary text-center py-6">No damage reported for this vehicle.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {tapPoint && (
        <DamageFormModal
          vehicleId={vehicleId}
          x={tapPoint.x}
          y={tapPoint.y}
          onClose={() => setTapPoint(null)}
          onSaved={() => { setTapPoint(null); loadDamages(vehicleId); }}
        />
      )}

      {selectedDamage && (
        <DamageDetailModal
          damage={selectedDamage}
          onClose={() => setSelectedDamage(null)}
          onUpdated={() => { setSelectedDamage(null); loadDamages(vehicleId); }}
        />
      )}
    </div>
  );
}

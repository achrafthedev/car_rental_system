"use client";

import { useState } from "react";
import Modal from "@/components/Modal";
import { pb } from "@/lib/pocketbase";

const BLANK = {
  plate_number: "",
  make: "",
  model: "",
  year: new Date().getFullYear(),
  color: "",
  vin: "",
  fuel_type: "petrol",
  gearbox: "automatic",
  daily_rate: 50,
  mileage: 0,
  status: "available",
  location: "Downtown Depot",
};

export default function VehicleFormModal({ vehicle, onClose, onSaved }) {
  const [form, setForm] = useState(vehicle ? { ...BLANK, ...vehicle } : BLANK);
  const [images, setImages] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function save() {
    setSaving(true);
    setError("");
    try {
      const payload = { ...form };
      if (images) payload.images = Array.from(images);

      const saved = vehicle
        ? await pb().collection("vehicles").update(vehicle.id, payload)
        : await pb().collection("vehicles").create(payload);
      onSaved?.(saved);
    } catch (err) {
      setError(err?.data?.message || err.message || "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open onClose={onClose} title={vehicle ? "Edit Vehicle" : "Add Vehicle"} wide>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Plate number">
          <input className="input" value={form.plate_number} onChange={(e) => set("plate_number", e.target.value)} />
        </Field>
        <Field label="VIN">
          <input className="input" value={form.vin} onChange={(e) => set("vin", e.target.value)} />
        </Field>
        <Field label="Make">
          <input className="input" value={form.make} onChange={(e) => set("make", e.target.value)} />
        </Field>
        <Field label="Model">
          <input className="input" value={form.model} onChange={(e) => set("model", e.target.value)} />
        </Field>
        <Field label="Year">
          <input type="number" className="input" value={form.year} onChange={(e) => set("year", Number(e.target.value))} />
        </Field>
        <Field label="Color">
          <input className="input" value={form.color} onChange={(e) => set("color", e.target.value)} />
        </Field>
        <Field label="Fuel type">
          <select className="input" value={form.fuel_type} onChange={(e) => set("fuel_type", e.target.value)}>
            {["petrol", "diesel", "electric", "hybrid"].map((v) => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>
        </Field>
        <Field label="Gearbox">
          <select className="input" value={form.gearbox} onChange={(e) => set("gearbox", e.target.value)}>
            {["manual", "automatic"].map((v) => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>
        </Field>
        <Field label="Daily rate ($)">
          <input type="number" className="input" value={form.daily_rate} onChange={(e) => set("daily_rate", Number(e.target.value))} />
        </Field>
        <Field label="Mileage">
          <input type="number" className="input" value={form.mileage} onChange={(e) => set("mileage", Number(e.target.value))} />
        </Field>
        <Field label="Status">
          <select className="input" value={form.status} onChange={(e) => set("status", e.target.value)}>
            {["available", "rented", "maintenance", "out_of_service"].map((v) => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>
        </Field>
        <Field label="Location">
          <input className="input" value={form.location} onChange={(e) => set("location", e.target.value)} />
        </Field>
        <div className="col-span-2">
          <Field label="Images">
            <input type="file" multiple accept="image/*" className="input" onChange={(e) => setImages(e.target.files)} />
          </Field>
        </div>
      </div>

      {error && <p className="text-xs text-danger mt-3">{error}</p>}

      <button className="btn-primary w-full mt-4" disabled={saving} onClick={save}>
        {saving ? "Saving…" : vehicle ? "Save Changes" : "Add Vehicle"}
      </button>
    </Modal>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="label">{label}</label>
      {children}
    </div>
  );
}

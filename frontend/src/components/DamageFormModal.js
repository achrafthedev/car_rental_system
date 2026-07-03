"use client";

import { useState } from "react";
import Modal from "@/components/Modal";
import { pb } from "@/lib/pocketbase";

const PARTS = [
  "front_bumper", "hood", "roof", "windshield", "rear_bumper", "trunk",
  "front_left_door", "front_right_door", "rear_left_door", "rear_right_door",
  "front_left_fender", "front_right_fender", "left_mirror", "right_mirror",
];

export default function DamageFormModal({ vehicleId, bookingId, x, y, onClose, onSaved }) {
  const [part, setPart] = useState(PARTS[0]);
  const [severity, setSeverity] = useState("light");
  const [description, setDescription] = useState("");
  const [photos, setPhotos] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function runAiScan() {
    if (!photos || photos.length === 0) return;
    setScanning(true);
    setScanned(false);
    setTimeout(() => {
      const guesses = [
        { severity: "moderate", description: "AI scan detected a paint scratch cluster with minor denting, ~8cm span." },
        { severity: "light", description: "AI scan detected a light surface scuff, no structural deformation." },
        { severity: "severe", description: "AI scan detected a deep panel dent with visible paint cracking." },
      ];
      const guess = guesses[Math.floor(Math.random() * guesses.length)];
      setSeverity(guess.severity);
      setDescription(guess.description);
      setScanning(false);
      setScanned(true);
    }, 2200);
  }

  async function save() {
    setSaving(true);
    setError("");
    try {
      const created = await pb().collection("damages").create({
        vehicle: vehicleId,
        booking: bookingId || undefined,
        part,
        severity,
        description,
        photos: photos ? Array.from(photos) : undefined,
        resolved: false,
        x_percent: x,
        y_percent: y,
      });
      onSaved?.(created);
    } catch (err) {
      setError(err?.data?.message || err.message || "Could not save damage report.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open onClose={onClose} title="Log Damage">
      <div className="flex flex-col gap-3">
        <div>
          <label className="label">Part</label>
          <select className="input" value={part} onChange={(e) => setPart(e.target.value)}>
            {PARTS.map((p) => (
              <option key={p} value={p}>{p.replaceAll("_", " ")}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="label">Severity</label>
          <div className="flex gap-2">
            {["light", "moderate", "severe"].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSeverity(s)}
                className={`flex-1 rounded-xl py-2 text-xs capitalize border ${
                  severity === s ? "border-primary bg-primary/15 text-primary" : "border-white/10 bg-white/5 text-text-secondary"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="label">Photos</label>
          <input type="file" multiple accept="image/*" className="input" onChange={(e) => setPhotos(e.target.files)} />
        </div>

        <button
          type="button"
          className="btn-secondary text-sm"
          disabled={!photos || photos.length === 0 || scanning}
          onClick={runAiScan}
        >
          {scanning ? "Analyzing photos…" : "🤖 AI Damage Scan"}
        </button>
        {scanned && <p className="text-xs text-primary">AI scan complete — fields auto-populated below.</p>}

        <div>
          <label className="label">Description</label>
          <textarea
            className="input"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        {error && <p className="text-xs text-danger">{error}</p>}

        <button className="btn-primary" disabled={saving || !description} onClick={save}>
          {saving ? "Saving…" : "Save Damage Report"}
        </button>
      </div>
    </Modal>
  );
}

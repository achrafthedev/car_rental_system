"use client";

import { useState } from "react";
import Modal from "@/components/Modal";
import { pb, fileUrl } from "@/lib/pocketbase";
import { formatDate } from "@/lib/utils";

export default function DamageDetailModal({ damage, onClose, onUpdated }) {
  const [saving, setSaving] = useState(false);

  async function toggleResolved() {
    setSaving(true);
    try {
      const updated = await pb().collection("damages").update(damage.id, { resolved: !damage.resolved });
      onUpdated?.(updated);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open onClose={onClose} title={damage.part.replaceAll("_", " ")}>
      <div className="flex flex-col gap-3 text-sm">
        <div className="flex items-center gap-2">
          <span className="badge bg-white/10 capitalize">{damage.severity}</span>
          <span className={`badge ${damage.resolved ? "bg-primary/15 text-primary" : "bg-danger/15 text-danger"}`}>
            {damage.resolved ? "Resolved" : "Open"}
          </span>
          <span className="text-text-secondary text-xs ml-auto">{formatDate(damage.created)}</span>
        </div>
        <p className="text-text-secondary">{damage.description}</p>

        {damage.photos?.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            {damage.photos.map((photo) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={photo} src={fileUrl(damage, photo, "200x200")} alt="Damage" className="h-20 w-20 rounded-lg object-cover border border-white/10" />
            ))}
          </div>
        )}

        <button className="btn-secondary" disabled={saving} onClick={toggleResolved}>
          {saving ? "Updating…" : damage.resolved ? "Reopen Issue" : "Mark Resolved"}
        </button>
      </div>
    </Modal>
  );
}

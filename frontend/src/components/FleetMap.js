"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const carIcon = new L.DivIcon({
  html: '<div style="font-size:22px;line-height:1;filter:drop-shadow(0 0 4px rgba(16,185,129,.8))">🚗</div>',
  className: "",
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

const DEFAULT_CENTER = [40.7128, -74.006];

export default function FleetMap({ vehicles }) {
  const [positions, setPositions] = useState({});

  useEffect(() => {
    const seeded = {};
    vehicles.forEach((v, i) => {
      const t = v.telemetry || {};
      seeded[v.id] = {
        lat: t.lat ?? DEFAULT_CENTER[0] + (Math.random() - 0.5) * 0.08,
        lng: t.lng ?? DEFAULT_CENTER[1] + (Math.random() - 0.5) * 0.08,
      };
    });
    setPositions(seeded);

    // Simulate GPS drift for rented vehicles to demonstrate live tracking.
    const interval = setInterval(() => {
      setPositions((prev) => {
        const next = { ...prev };
        vehicles.forEach((v) => {
          if (v.status !== "rented" || !next[v.id]) return;
          next[v.id] = {
            lat: next[v.id].lat + (Math.random() - 0.5) * 0.002,
            lng: next[v.id].lng + (Math.random() - 0.5) * 0.002,
          };
        });
        return next;
      });
    }, 4000);

    return () => clearInterval(interval);
  }, [vehicles]);

  return (
    <div className="glass-card p-4">
      <h2 className="text-lg font-semibold mb-3">Live Fleet Map</h2>
      <div className="rounded-xl overflow-hidden" style={{ height: 360 }}>
        <MapContainer center={DEFAULT_CENTER} zoom={12} style={{ height: "100%", width: "100%" }}>
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="&copy; OpenStreetMap contributors"
          />
          {vehicles.map((v) => {
            const pos = positions[v.id];
            if (!pos) return null;
            return (
              <Marker key={v.id} position={[pos.lat, pos.lng]} icon={carIcon}>
                <Popup>
                  <strong>
                    {v.make} {v.model}
                  </strong>
                  <br />
                  {v.plate_number} · {v.status}
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>
    </div>
  );
}

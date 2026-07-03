"use client";

import { useMemo, useState } from "react";
import { statusColor } from "@/lib/utils";

const DAY_MS = 24 * 60 * 60 * 1000;

function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export default function GanttCalendar({ vehicles, bookings, onSelectBooking }) {
  const [mode, setMode] = useState("week");
  const [anchor, setAnchor] = useState(startOfDay(new Date()));

  const days = mode === "week" ? 7 : 30;
  const dayWidth = mode === "week" ? 120 : 44;

  const rangeStart = useMemo(() => {
    const d = new Date(anchor);
    if (mode === "week") d.setDate(d.getDate() - d.getDay());
    else d.setDate(1);
    return startOfDay(d);
  }, [anchor, mode]);

  const dayList = useMemo(
    () => Array.from({ length: days }, (_, i) => new Date(rangeStart.getTime() + i * DAY_MS)),
    [rangeStart, days]
  );

  const rangeEnd = new Date(rangeStart.getTime() + days * DAY_MS);

  function navigate(dir) {
    const d = new Date(anchor);
    d.setDate(d.getDate() + dir * (mode === "week" ? 7 : 30));
    setAnchor(d);
  }

  return (
    <div className="glass-card p-4">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h2 className="text-lg font-semibold">Booking Timeline</h2>
        <div className="flex items-center gap-2">
          <button className="btn-secondary px-2 py-1 text-xs" onClick={() => navigate(-1)}>
            ← Prev
          </button>
          <button className="btn-secondary px-2 py-1 text-xs" onClick={() => setAnchor(startOfDay(new Date()))}>
            Today
          </button>
          <button className="btn-secondary px-2 py-1 text-xs" onClick={() => navigate(1)}>
            Next →
          </button>
          <div className="flex ml-2 rounded-lg overflow-hidden border border-white/10">
            {["week", "month"].map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`px-3 py-1 text-xs capitalize ${
                  mode === m ? "bg-primary text-black" : "bg-white/5 text-text-secondary"
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="scroll-x">
        <div style={{ minWidth: 160 + dayWidth * days }}>
          {/* header */}
          <div className="flex border-b border-border pb-2 mb-2 sticky top-0">
            <div className="w-40 shrink-0 text-xs text-text-secondary font-medium">Vehicle</div>
            {dayList.map((d) => (
              <div
                key={d.toISOString()}
                style={{ width: dayWidth }}
                className="shrink-0 text-center text-[11px] text-text-secondary"
              >
                {d.toLocaleDateString("en-US", { weekday: "short", day: "numeric" })}
              </div>
            ))}
          </div>

          {/* rows */}
          {vehicles.map((vehicle) => (
            <div key={vehicle.id} className="flex items-center border-b border-white/5 py-2">
              <div className="w-40 shrink-0 pr-2">
                <p className="text-sm font-medium truncate">
                  {vehicle.make} {vehicle.model}
                </p>
                <p className="text-[11px] text-text-secondary">{vehicle.plate_number}</p>
              </div>
              <div className="relative flex-1" style={{ height: 32, width: dayWidth * days }}>
                {bookings
                  .filter((b) => b.vehicle === vehicle.id)
                  .map((booking) => {
                    const start = new Date(booking.pickup_datetime);
                    const end = new Date(booking.return_datetime);
                    if (end <= rangeStart || start >= rangeEnd) return null;

                    const clampedStart = Math.max(start.getTime(), rangeStart.getTime());
                    const clampedEnd = Math.min(end.getTime(), rangeEnd.getTime());
                    const left = ((clampedStart - rangeStart.getTime()) / DAY_MS) * dayWidth;
                    const width = Math.max(
                      ((clampedEnd - clampedStart) / DAY_MS) * dayWidth,
                      12
                    );

                    return (
                      <button
                        key={booking.id}
                        onClick={() => onSelectBooking(booking)}
                        title={`${booking.expand?.customer?.first_name || ""} ${
                          booking.expand?.customer?.last_name || ""
                        }`}
                        className="absolute top-1 h-6 rounded-md px-2 text-[11px] font-medium text-black flex items-center truncate shadow-sm hover:brightness-110 transition"
                        style={{
                          left,
                          width,
                          background: statusColor(booking.status),
                        }}
                      >
                        {booking.expand?.customer?.first_name || "Booking"}
                      </button>
                    );
                  })}
              </div>
            </div>
          ))}

          {vehicles.length === 0 && (
            <p className="text-sm text-text-secondary py-6 text-center">No vehicles in fleet yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}

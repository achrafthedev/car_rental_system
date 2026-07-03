"use client";

const SEVERITY_COLOR = {
  light: "#f59e0b",
  moderate: "#f97316",
  severe: "#ef4444",
};

export default function CarWireframe({ damages, onTap, onSelectDamage, highlighted = [] }) {
  function handleClick(e) {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    onTap?.(Math.min(99, Math.max(1, x)), Math.min(99, Math.max(1, y)));
  }

  return (
    <div
      className="relative w-full max-w-xs mx-auto aspect-[1/2] rounded-2xl bg-white/5 border border-white/10 cursor-crosshair select-none"
      onClick={handleClick}
    >
      <svg viewBox="0 0 200 400" className="absolute inset-0 w-full h-full pointer-events-none">
        <rect x="35" y="20" width="130" height="360" rx="45" fill="none" stroke="#9ca3af" strokeWidth="2.5" />
        <rect x="55" y="55" width="90" height="60" rx="10" fill="none" stroke="#6b7280" strokeWidth="1.5" />
        <rect x="55" y="285" width="90" height="60" rx="10" fill="none" stroke="#6b7280" strokeWidth="1.5" />
        <line x1="100" y1="120" x2="100" y2="280" stroke="#374151" strokeWidth="1" strokeDasharray="4 4" />
        <rect x="20" y="70" width="18" height="55" rx="6" fill="#374151" />
        <rect x="162" y="70" width="18" height="55" rx="6" fill="#374151" />
        <rect x="20" y="275" width="18" height="55" rx="6" fill="#374151" />
        <rect x="162" y="275" width="18" height="55" rx="6" fill="#374151" />
        <circle cx="100" cy="200" r="10" fill="none" stroke="#4b5563" strokeWidth="1.5" />
      </svg>

      {damages.map((d) => (
        <button
          key={d.id}
          onClick={(e) => {
            e.stopPropagation();
            onSelectDamage?.(d);
          }}
          className="absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-white/40 animate-pulse"
          style={{
            left: `${d.x_percent}%`,
            top: `${d.y_percent}%`,
            background: SEVERITY_COLOR[d.severity] || "#ef4444",
            boxShadow: `0 0 12px 2px ${SEVERITY_COLOR[d.severity] || "#ef4444"}`,
          }}
          title={d.part}
        />
      ))}

      {highlighted.map((pt, i) => (
        <div
          key={i}
          className="absolute h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-primary/70 bg-primary/20"
          style={{ left: `${pt.x}%`, top: `${pt.y}%` }}
        />
      ))}
    </div>
  );
}

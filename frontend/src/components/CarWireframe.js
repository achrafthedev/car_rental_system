"use client";

const SEVERITY_COLOR = {
  light: "#f59e0b",
  moderate: "#f97316",
  severe: "#ef4444",
};

const VIEWS = {
  top: {
    viewBox: "0 0 200 400",
    aspect: "aspect-[1/2]",
    render: () => (
      <>
        <rect x="35" y="20" width="130" height="360" rx="45" fill="none" stroke="#9ca3af" strokeWidth="2.5" />
        <rect x="55" y="55" width="90" height="60" rx="10" fill="none" stroke="#6b7280" strokeWidth="1.5" />
        <rect x="55" y="285" width="90" height="60" rx="10" fill="none" stroke="#6b7280" strokeWidth="1.5" />
        <line x1="100" y1="120" x2="100" y2="280" stroke="#374151" strokeWidth="1" strokeDasharray="4 4" />
        <rect x="20" y="70" width="18" height="55" rx="6" fill="#374151" />
        <rect x="162" y="70" width="18" height="55" rx="6" fill="#374151" />
        <rect x="20" y="275" width="18" height="55" rx="6" fill="#374151" />
        <rect x="162" y="275" width="18" height="55" rx="6" fill="#374151" />
        <circle cx="100" cy="200" r="10" fill="none" stroke="#4b5563" strokeWidth="1.5" />
      </>
    ),
  },
  side: {
    viewBox: "0 0 400 200",
    aspect: "aspect-[2/1]",
    render: () => (
      <>
        <line x1="10" y1="175" x2="390" y2="175" stroke="#374151" strokeWidth="1" strokeDasharray="4 4" />
        <path
          d="M45 150 L45 110 Q45 95 65 90 L120 65 Q140 45 175 45 L255 45 Q285 45 300 70 L340 90 Q365 95 365 115 L365 150 Z"
          fill="none"
          stroke="#9ca3af"
          strokeWidth="2.5"
        />
        <line x1="185" y1="65" x2="185" y2="90" stroke="#6b7280" strokeWidth="1.5" />
        <path d="M125 65 L175 47" fill="none" stroke="#6b7280" strokeWidth="1.5" />
        <path d="M195 47 L255 65" fill="none" stroke="#6b7280" strokeWidth="1.5" />
        <circle cx="110" cy="152" r="26" fill="none" stroke="#4b5563" strokeWidth="2.5" />
        <circle cx="300" cy="152" r="26" fill="none" stroke="#4b5563" strokeWidth="2.5" />
        <rect x="52" y="128" width="18" height="10" rx="3" fill="#374151" />
        <rect x="330" y="128" width="18" height="10" rx="3" fill="#374151" />
      </>
    ),
  },
  front: {
    viewBox: "0 0 300 220",
    aspect: "aspect-[3/2]",
    render: () => (
      <>
        <rect x="35" y="60" width="230" height="120" rx="26" fill="none" stroke="#9ca3af" strokeWidth="2.5" />
        <rect x="70" y="25" width="160" height="45" rx="14" fill="none" stroke="#6b7280" strokeWidth="1.5" />
        <line x1="150" y1="70" x2="150" y2="180" stroke="#374151" strokeWidth="1" strokeDasharray="4 4" />
        <rect x="45" y="95" width="30" height="16" rx="5" fill="#374151" />
        <rect x="225" y="95" width="30" height="16" rx="5" fill="#374151" />
        <rect x="60" y="170" width="180" height="16" rx="6" fill="none" stroke="#6b7280" strokeWidth="1.5" />
        <line x1="10" y1="195" x2="290" y2="195" stroke="#374151" strokeWidth="1" strokeDasharray="4 4" />
      </>
    ),
  },
  back: {
    viewBox: "0 0 300 220",
    aspect: "aspect-[3/2]",
    render: () => (
      <>
        <rect x="35" y="60" width="230" height="120" rx="26" fill="none" stroke="#9ca3af" strokeWidth="2.5" />
        <rect x="70" y="25" width="160" height="45" rx="14" fill="none" stroke="#6b7280" strokeWidth="1.5" />
        <line x1="150" y1="70" x2="150" y2="180" stroke="#374151" strokeWidth="1" strokeDasharray="4 4" />
        <rect x="45" y="95" width="26" height="20" rx="5" fill="none" stroke="#ef4444" strokeWidth="1.5" />
        <rect x="229" y="95" width="26" height="20" rx="5" fill="none" stroke="#ef4444" strokeWidth="1.5" />
        <rect x="60" y="170" width="180" height="16" rx="6" fill="none" stroke="#6b7280" strokeWidth="1.5" />
        <line x1="10" y1="195" x2="290" y2="195" stroke="#374151" strokeWidth="1" strokeDasharray="4 4" />
      </>
    ),
  },
};

export default function CarWireframe({ view = "top", damages, onTap, onSelectDamage, highlighted = [] }) {
  const config = VIEWS[view] || VIEWS.top;
  const visibleDamages = damages.filter((d) => (d.view || "top") === view);

  function handleClick(e) {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    onTap?.(Math.min(99, Math.max(1, x)), Math.min(99, Math.max(1, y)));
  }

  return (
    <div
      className={`relative w-full max-w-sm mx-auto ${config.aspect} rounded-2xl bg-white/5 border border-white/10 cursor-crosshair select-none`}
      onClick={handleClick}
    >
      <svg viewBox={config.viewBox} className="absolute inset-0 w-full h-full pointer-events-none">
        {config.render()}
      </svg>

      {visibleDamages.map((d) => (
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

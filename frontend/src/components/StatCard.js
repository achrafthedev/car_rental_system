export default function StatCard({ label, value, hint, accent }) {
  return (
    <div className="glass-card p-4">
      <p className="label">{label}</p>
      <p
        className="text-2xl font-bold mt-1"
        style={accent ? { color: accent } : undefined}
      >
        {value}
      </p>
      {hint && <p className="text-xs text-text-secondary mt-1">{hint}</p>}
    </div>
  );
}

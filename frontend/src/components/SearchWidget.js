"use client";

export default function SearchWidget({ value, onChange, onSubmit }) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit?.();
      }}
      className="glass-card p-4 grid grid-cols-1 md:grid-cols-5 gap-3 items-end"
    >
      <div className="md:col-span-2">
        <label className="label">Pickup location</label>
        <select
          className="input"
          value={value.location}
          onChange={(e) => onChange({ ...value, location: e.target.value })}
        >
          <option value="">Any location</option>
          <option>Downtown Depot</option>
          <option>Airport Terminal</option>
          <option>Uptown Garage</option>
          <option>Harbor Point</option>
        </select>
      </div>
      <div>
        <label className="label">Pickup</label>
        <input
          type="datetime-local"
          className="input"
          value={value.pickup}
          onChange={(e) => onChange({ ...value, pickup: e.target.value })}
          required
        />
      </div>
      <div>
        <label className="label">Return</label>
        <input
          type="datetime-local"
          className="input"
          value={value.ret}
          onChange={(e) => onChange({ ...value, ret: e.target.value })}
          required
        />
      </div>
      <button type="submit" className="btn-primary w-full">
        Search Fleet
      </button>
    </form>
  );
}

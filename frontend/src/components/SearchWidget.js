"use client";

const LOCATIONS = ["Downtown Depot", "Airport Terminal", "Uptown Garage", "Harbor Point"];

export default function SearchWidget({ value, onChange, onSubmit }) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit?.();
      }}
      className="glass-card p-4 grid grid-cols-1 md:grid-cols-6 gap-3 items-end"
    >
      <div>
        <label className="label">Pickup location</label>
        <select
          className="input"
          value={value.location}
          onChange={(e) => onChange({ ...value, location: e.target.value })}
        >
          <option value="">Any location</option>
          {LOCATIONS.map((loc) => (
            <option key={loc}>{loc}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="label">Dropoff location</label>
        <select
          className="input"
          value={value.dropoffLocation ?? value.location}
          onChange={(e) => onChange({ ...value, dropoffLocation: e.target.value })}
        >
          <option value="">Same as pickup</option>
          {LOCATIONS.map((loc) => (
            <option key={loc}>{loc}</option>
          ))}
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
      <button type="submit" className="btn-primary w-full md:col-span-2">
        Search Fleet
      </button>
    </form>
  );
}

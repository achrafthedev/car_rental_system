"use client";

export default function FilterBar({ filters, onChange }) {
  return (
    <div className="glass-card p-4 flex flex-wrap gap-4 items-end">
      <div>
        <label className="label">Gearbox</label>
        <select
          className="input"
          value={filters.gearbox}
          onChange={(e) => onChange({ ...filters, gearbox: e.target.value })}
        >
          <option value="">Any</option>
          <option value="automatic">Automatic</option>
          <option value="manual">Manual</option>
        </select>
      </div>
      <div>
        <label className="label">Fuel type</label>
        <select
          className="input"
          value={filters.fuel_type}
          onChange={(e) => onChange({ ...filters, fuel_type: e.target.value })}
        >
          <option value="">Any</option>
          <option value="electric">Electric</option>
          <option value="hybrid">Hybrid</option>
          <option value="petrol">Petrol</option>
          <option value="diesel">Diesel</option>
        </select>
      </div>
      <div className="flex-1 min-w-[180px]">
        <label className="label">
          Max daily price: <span className="text-primary">${filters.maxPrice}</span>
        </label>
        <input
          type="range"
          min={20}
          max={500}
          step={10}
          value={filters.maxPrice}
          onChange={(e) => onChange({ ...filters, maxPrice: Number(e.target.value) })}
          className="w-full accent-primary"
        />
      </div>
    </div>
  );
}

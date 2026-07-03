import { fileUrl } from "@/lib/pocketbase";
import { formatCurrency } from "@/lib/utils";

export default function VehicleCard({ vehicle, estimate, onBook }) {
  const cover = vehicle.images?.[0]
    ? fileUrl(vehicle, vehicle.images[0], "400x300")
    : null;

  return (
    <div className="glass-card overflow-hidden flex flex-col">
      <div className="h-40 bg-white/5 flex items-center justify-center overflow-hidden">
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={cover} alt={`${vehicle.make} ${vehicle.model}`} className="w-full h-full object-cover" />
        ) : (
          <span className="text-5xl opacity-30">🚘</span>
        )}
      </div>
      <div className="p-4 flex flex-col gap-2 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-semibold leading-tight">
              {vehicle.make} {vehicle.model}
            </p>
            <p className="text-xs text-text-secondary">{vehicle.year} · {vehicle.color || "—"}</p>
          </div>
          <span className="badge bg-primary/15 text-primary">{vehicle.status}</span>
        </div>

        <div className="flex flex-wrap gap-2 text-xs text-text-secondary">
          <span className="badge bg-white/5">{vehicle.gearbox}</span>
          <span className="badge bg-white/5">{vehicle.fuel_type}</span>
          <span className="badge bg-white/5">{vehicle.mileage?.toLocaleString()} mi</span>
        </div>

        <div className="mt-auto pt-3 flex items-end justify-between">
          <div>
            <p className="text-lg font-bold">{formatCurrency(vehicle.daily_rate)}<span className="text-xs font-normal text-text-secondary">/day</span></p>
            {estimate ? (
              <p className="text-xs text-primary">Est. total {formatCurrency(estimate)}</p>
            ) : null}
          </div>
          <button
            className="btn-primary text-sm"
            disabled={vehicle.status !== "available"}
            onClick={() => onBook(vehicle)}
          >
            Book Now
          </button>
        </div>
      </div>
    </div>
  );
}

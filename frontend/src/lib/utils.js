export function formatCurrency(amount) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount || 0);
}

export function formatDate(value, opts) {
  if (!value) return "";
  return new Date(value).toLocaleDateString("en-US", opts);
}

export function formatDateTime(value) {
  if (!value) return "";
  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function toDateInputValue(value) {
  if (!value) return "";
  const d = new Date(value);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

export function rentalDays(pickup, ret) {
  if (!pickup || !ret) return 0;
  const ms = new Date(ret).getTime() - new Date(pickup).getTime();
  return Math.max(1, Math.ceil(ms / (1000 * 60 * 60 * 24)));
}

export function estimateTotal(dailyRate, pickup, ret) {
  return Math.round(dailyRate * rentalDays(pickup, ret) * 100) / 100;
}

export const STATUS_COLORS = {
  available: "#10b981",
  rented: "#3b82f6",
  maintenance: "#f59e0b",
  out_of_service: "#ef4444",
  draft: "#9ca3af",
  confirmed: "#3b82f6",
  active: "#10b981",
  completed: "#6b7280",
  cancelled: "#ef4444",
  active_kyc: "#10b981",
};

export function statusColor(status) {
  return STATUS_COLORS[status] || "#9ca3af";
}

export function classNames(...values) {
  return values.filter(Boolean).join(" ");
}

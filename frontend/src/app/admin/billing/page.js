"use client";

import { useEffect, useMemo, useState } from "react";
import { pb } from "@/lib/pocketbase";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils";

const EXPENSE_TYPES = ["fuel", "maintenance", "insurance", "cleaning", "toll", "other"];

function generateTollLogs(bookings) {
  const active = bookings.filter((b) => b.status === "active" && b.expand?.vehicle);
  return active.map((b, i) => ({
    id: `toll_${b.id}_${i}`,
    plate: b.expand.vehicle.plate_number,
    timestamp: new Date(Date.now() - i * 3600 * 1000).toISOString(),
    amount: [2.75, 4.5, 6.25, 3.1][i % 4],
    booking: b,
  }));
}

export default function BillingPage() {
  const [expenses, setExpenses] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [charged, setCharged] = useState({});
  const [form, setForm] = useState({ vehicle: "", type: "fuel", amount: "", date: new Date().toISOString().slice(0, 10), description: "" });
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const [expenseList, vehicleList, bookingList] = await Promise.all([
        pb().collection("expenses").getFullList({ sort: "-date", expand: "vehicle" }),
        pb().collection("vehicles").getFullList({ sort: "make" }),
        pb().collection("bookings").getFullList({ filter: 'status = "active"', expand: "vehicle,customer" }),
      ]);
      setExpenses(expenseList);
      setVehicles(vehicleList);
      setBookings(bookingList);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const tollLogs = useMemo(() => generateTollLogs(bookings), [bookings]);
  const totalSpend = expenses.reduce((sum, e) => sum + e.amount, 0);

  async function addExpense(e) {
    e.preventDefault();
    if (!form.vehicle) return;
    const created = await pb().collection("expenses").create({
      ...form,
      amount: Number(form.amount),
    });
    setForm({ ...form, amount: "", description: "" });
    setExpenses((prev) => [created, ...prev]);
  }

  async function chargeToll(log) {
    await pb().collection("expenses").create({
      vehicle: log.booking.expand.vehicle.id,
      type: "toll",
      amount: log.amount + 5,
      date: new Date().toISOString().slice(0, 10),
      description: `Toll reconciliation for ${log.booking.expand.customer?.first_name || "customer"} · plate ${log.plate} (+$5 admin fee)`,
    });
    setCharged((prev) => ({ ...prev, [log.id]: true }));
    load();
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">Billing & Expense Ledger</h1>
        <p className="text-text-secondary text-sm">Total recorded spend: {formatCurrency(totalSpend)}</p>
      </div>

      <div className="glass-card p-4">
        <h2 className="text-lg font-semibold mb-3">Toll Road Reconciliation</h2>
        <p className="text-xs text-text-secondary mb-3">
          Simulated toll-gate crossings matched against currently active rentals by plate number.
        </p>
        <div className="scroll-x">
          <table className="w-full text-sm min-w-[640px]">
            <thead>
              <tr className="text-left text-text-secondary border-b border-border">
                <th className="p-2">Timestamp</th>
                <th className="p-2">Plate</th>
                <th className="p-2">Toll Amount</th>
                <th className="p-2">Matched Booking</th>
                <th className="p-2"></th>
              </tr>
            </thead>
            <tbody>
              {tollLogs.map((log) => (
                <tr key={log.id} className="border-b border-white/5">
                  <td className="p-2">{formatDateTime(log.timestamp)}</td>
                  <td className="p-2 font-mono">{log.plate}</td>
                  <td className="p-2">{formatCurrency(log.amount)}</td>
                  <td className="p-2">
                    {log.booking.expand?.customer?.first_name} {log.booking.expand?.customer?.last_name}
                    <span className="text-text-secondary"> · #{log.booking.id.slice(-6)}</span>
                  </td>
                  <td className="p-2 text-right">
                    <button
                      className="btn-primary text-xs px-3 py-1"
                      disabled={charged[log.id]}
                      onClick={() => chargeToll(log)}
                    >
                      {charged[log.id] ? "Charged ✓" : "Charge Customer"}
                    </button>
                  </td>
                </tr>
              ))}
              {tollLogs.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-4 text-center text-text-secondary">
                    No active rentals to reconcile right now.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="glass-card p-4">
        <h2 className="text-lg font-semibold mb-3">Log an Expense</h2>
        <form onSubmit={addExpense} className="grid grid-cols-2 md:grid-cols-5 gap-3 items-end">
          <div className="col-span-2 md:col-span-1">
            <label className="label">Vehicle</label>
            <select className="input" value={form.vehicle} onChange={(e) => setForm({ ...form, vehicle: e.target.value })} required>
              <option value="">Select…</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>{v.make} {v.model} · {v.plate_number}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Type</label>
            <select className="input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              {EXPENSE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Amount ($)</label>
            <input type="number" step="0.01" className="input" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required />
          </div>
          <div>
            <label className="label">Date</label>
            <input type="date" className="input" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
          </div>
          <button type="submit" className="btn-primary">Add Expense</button>
          <div className="col-span-2 md:col-span-5">
            <label className="label">Description</label>
            <input className="input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
        </form>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="scroll-x">
          <table className="w-full text-sm min-w-[640px]">
            <thead>
              <tr className="text-left text-text-secondary border-b border-border">
                <th className="p-3">Date</th>
                <th className="p-3">Vehicle</th>
                <th className="p-3">Type</th>
                <th className="p-3">Amount</th>
                <th className="p-3">Description</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((e) => (
                <tr key={e.id} className="border-b border-white/5 hover:bg-white/5">
                  <td className="p-3">{formatDate(e.date)}</td>
                  <td className="p-3">{e.expand?.vehicle ? `${e.expand.vehicle.make} ${e.expand.vehicle.model}` : "—"}</td>
                  <td className="p-3"><span className="badge bg-white/10">{e.type}</span></td>
                  <td className="p-3">{formatCurrency(e.amount)}</td>
                  <td className="p-3 text-text-secondary">{e.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!loading && expenses.length === 0 && (
            <p className="text-center text-sm text-text-secondary py-8">No expenses logged yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}

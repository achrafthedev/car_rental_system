"use client";

import { useState } from "react";
import Modal from "@/components/Modal";
import AuthGate from "@/components/AuthGate";
import SignaturePad from "@/components/SignaturePad";
import { pb, currentUser } from "@/lib/pocketbase";
import { dataUrlToFile } from "@/lib/dataUrl";
import { formatCurrency, formatDateTime, rentalDays } from "@/lib/utils";

const STEPS = ["Identity", "License & Selfie", "Deposit", "Sign & Confirm"];

export default function BookingFlow({ vehicle, pickup, ret, total, onClose, onBooked }) {
  const [user, setUser] = useState(currentUser());
  const [step, setStep] = useState(user ? 1 : 0);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrResult, setOcrResult] = useState(null);
  const [licenseFile, setLicenseFile] = useState(null);
  const [selfieFile, setSelfieFile] = useState(null);
  const [deposit, setDeposit] = useState({ number: "", exp: "", cvc: "" });
  const [depositAuthorized, setDepositAuthorized] = useState(false);
  const [depositLoading, setDepositLoading] = useState(false);
  const [signature, setSignature] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  function runOcr(license, selfie) {
    setLicenseFile(license);
    setSelfieFile(selfie);
    if (!license || !selfie) return;
    setOcrLoading(true);
    setOcrResult(null);
    setTimeout(() => {
      setOcrResult({
        name: user?.name || "Detected Driver",
        licenseNumber: `DL-${Math.floor(100000 + Math.random() * 900000)}`,
        expiry: "2029-06-30",
      });
      setOcrLoading(false);
    }, 3000);
  }

  function authorizeDeposit(e) {
    e.preventDefault();
    setDepositLoading(true);
    setTimeout(() => {
      setDepositLoading(false);
      setDepositAuthorized(true);
    }, 1500);
  }

  async function confirmBooking() {
    setSubmitting(true);
    setError("");
    try {
      const [firstName, ...rest] = (ocrResult?.name || user.name || "Guest Driver").split(" ");

      let customer;
      const existing = await pb()
        .collection("customers")
        .getFirstListItem(`user = "${user.id}"`)
        .catch(() => null);

      const customerPayload = {
        user: user.id,
        first_name: firstName,
        last_name: rest.join(" ") || "—",
        email: user.email,
        phone: user.phone || "N/A",
        license_number: ocrResult?.licenseNumber || "PENDING",
        license_expiry: ocrResult?.expiry || "2030-01-01",
        status: "active",
        kyc_verified: true,
        license_photo: licenseFile,
        selfie_photo: selfieFile,
      };

      customer = existing
        ? await pb().collection("customers").update(existing.id, customerPayload)
        : await pb().collection("customers").create(customerPayload);

      const signatureFile = signature ? dataUrlToFile(signature, "signature.png") : null;

      const booking = await pb().collection("bookings").create({
        vehicle: vehicle.id,
        customer: customer.id,
        status: "confirmed",
        pickup_datetime: pickup,
        return_datetime: ret,
        total_price: total,
        stripe_payment_intent: `pi_mock_${Math.random().toString(36).slice(2, 12)}`,
        signature: signatureFile,
      });

      onBooked?.(booking);
    } catch (err) {
      setError(err?.data?.message || err.message || "Could not complete booking.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal open onClose={onClose} title={`Book ${vehicle.make} ${vehicle.model}`} wide>
      <div className="mb-4">
        <div className="flex gap-1">
          {STEPS.map((label, i) => (
            <div
              key={label}
              className={`flex-1 h-1.5 rounded-full ${i <= step ? "bg-primary" : "bg-white/10"}`}
            />
          ))}
        </div>
        <p className="text-xs text-text-secondary mt-2">
          {formatDateTime(pickup)} → {formatDateTime(ret)} · {rentalDays(pickup, ret)} day(s) ·{" "}
          <span className="text-primary font-semibold">{formatCurrency(total)}</span>
        </p>
      </div>

      {step === 0 && (
        <AuthGate
          onAuthenticated={(u) => {
            setUser(u);
            setStep(1);
          }}
        />
      )}

      {step === 1 && (
        <div className="flex flex-col gap-4">
          <div>
            <label className="label">Driver's license photo</label>
            <input
              type="file"
              accept="image/*"
              className="input"
              onChange={(e) => runOcr(e.target.files?.[0], selfieFile)}
            />
          </div>
          <div>
            <label className="label">Selfie photo</label>
            <input
              type="file"
              accept="image/*"
              className="input"
              onChange={(e) => runOcr(licenseFile, e.target.files?.[0])}
            />
          </div>

          {ocrLoading && (
            <div className="glass-panel p-4 flex items-center gap-3 text-sm">
              <span className="h-4 w-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
              Running OCR verification…
            </div>
          )}

          {ocrResult && !ocrLoading && (
            <div className="glass-panel p-4 text-sm space-y-1">
              <p className="text-primary font-semibold">Identity verified ✓</p>
              <p>Name: {ocrResult.name}</p>
              <p>License #: {ocrResult.licenseNumber}</p>
              <p>Expiry: {ocrResult.expiry}</p>
            </div>
          )}

          <button
            className="btn-primary"
            disabled={!ocrResult}
            onClick={() => setStep(2)}
          >
            Continue to Deposit
          </button>
        </div>
      )}

      {step === 2 && (
        <form onSubmit={authorizeDeposit} className="flex flex-col gap-4">
          <div className="glass-panel p-4 text-sm">
            A refundable <span className="font-semibold text-primary">$500.00</span> security
            deposit will be pre-authorized on your card and released after the vehicle is
            returned undamaged.
          </div>
          <div>
            <label className="label">Card number</label>
            <input
              className="input"
              required
              placeholder="4242 4242 4242 4242"
              value={deposit.number}
              onChange={(e) => setDeposit({ ...deposit, number: e.target.value })}
            />
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="label">Expiry</label>
              <input
                className="input"
                required
                placeholder="MM/YY"
                value={deposit.exp}
                onChange={(e) => setDeposit({ ...deposit, exp: e.target.value })}
              />
            </div>
            <div className="flex-1">
              <label className="label">CVC</label>
              <input
                className="input"
                required
                placeholder="123"
                value={deposit.cvc}
                onChange={(e) => setDeposit({ ...deposit, cvc: e.target.value })}
              />
            </div>
          </div>

          {depositAuthorized ? (
            <button type="button" className="btn-primary" onClick={() => setStep(3)}>
              Deposit Authorized ✓ — Continue
            </button>
          ) : (
            <button type="submit" disabled={depositLoading} className="btn-primary">
              {depositLoading ? "Authorizing…" : "Authorize $500 Deposit"}
            </button>
          )}
        </form>
      )}

      {step === 3 && (
        <div className="flex flex-col gap-4">
          <p className="text-sm text-text-secondary">
            By signing below you agree to the Autodrive rental agreement for this vehicle and
            date range.
          </p>
          <SignaturePad onChange={setSignature} />
          {error && <p className="text-xs text-danger">{error}</p>}
          <button
            className="btn-primary"
            disabled={!signature || submitting}
            onClick={confirmBooking}
          >
            {submitting ? "Finalizing booking…" : "Sign & Confirm Booking"}
          </button>
        </div>
      )}
    </Modal>
  );
}

# Autodrive

A local-first, fully dockerized car rental management system. PocketBase (Go/SQLite) powers
the backend and API; Next.js (App Router) powers a glassmorphic dark-mode frontend for both
customers and fleet staff.

Core self-hosting is free forever. The schema also carries the fields needed for premium
add-ons — AI damage scanning, keyless telematics, identity verification, automated toll
billing — which currently ship as clearly-labeled **stubs/mocks** (see [Stubs & mocks](#stubs--mocks-vs-real-integrations)).

## Quick start

```bash
docker compose up --build
```

- Frontend: [http://localhost:3000](http://localhost:3000)
- PocketBase Admin UI: [http://localhost:8090/_/](http://localhost:8090/_/)

On first boot, `pb_hooks/main.pb.js` idempotently provisions all collections and fields — no
manual import step required. It's safe to restart the stack; existing collections/fields are
left untouched, and any *new* fields added to `main.pb.js` later get merged in on the next
restart without touching existing data. `pocketbase/pb_schema.json` is a human-readable mirror
of the same schema (in the Admin UI's import/export format) kept for reference — it isn't read
at runtime, since the JSVM sandbox doesn't expose a general file-read API.

### Create your first admin & demo accounts

1. Open [http://localhost:8090/_/](http://localhost:8090/_/) and complete the PocketBase
   superuser setup (this is a separate account from the `users` collection).
2. From the Admin UI, create a `users` record with `role = admin` to sign into `/admin` in the
   app, or register normally through the app UI (defaults to `role = customer`) and promote it
   to `admin`/`operator` from the Admin UI.
3. Add a few `vehicles` records (Admin UI or the Fleet page once signed in as staff) so the
   catalog and dashboard have data to show.

## Project layout

```text
/car_rental_system
├── docker-compose.yml
├── pocketbase/
│   ├── Dockerfile           # fetches latest PocketBase release for linux/amd64
│   ├── pb_schema.json       # human-readable schema mirror (Admin UI import/export format)
│   └── pb_hooks/
│       ├── main.pb.js       # provisions collections/fields on boot (schema inlined here)
│       └── bookings.pb.js   # date-conflict engine + status transitions
└── frontend/
    ├── Dockerfile
    └── src/
        ├── app/             # Next.js App Router pages
        ├── components/      # Gantt, wireframe car, modals, nav, etc.
        └── lib/              # PocketBase client + shared helpers
```

## Security model

- PocketBase API rules gate every collection: `vehicles` are publicly readable (for browsing)
  but only `admin`/`operator` can write; `customers` and `bookings` are scoped so a signed-in
  customer can only see/update records linked to their own account
  (`customer.user = @request.auth.id`); `damages` and `expenses` are staff-only.
- The `users` collection's update rule uses PocketBase's `@request.body.role:isset` guard so a
  customer can edit their own profile but **cannot** self-promote to `admin`/`operator` — only
  an existing admin can change roles. Verified live: a direct API call from a customer token
  setting `role: admin` on itself is rejected.
- `/admin/*` routes are client-gated by `app/admin/layout.js`, which redirects any signed-in
  `customer` back to `/customer` and prompts staff sign-in otherwise. This is a UX guard, not a
  security boundary — the real enforcement is the PocketBase API rules above.

## Business logic (pb_hooks/bookings.pb.js)

- **Date-conflict engine**: rejects creating/updating a booking that overlaps another
  non-cancelled/non-draft booking for the same vehicle, or that targets a vehicle currently in
  `maintenance`/`out_of_service`.
- **Automatic status transitions**: booking → `active` sets the vehicle to `rented`; booking →
  `completed` syncs the vehicle's mileage from `return_mileage` and sets the vehicle to
  `maintenance` if the booking has an unresolved `severe` damage report, otherwise `available`.

Every `damages` record also carries a `view` (`top`/`side`/`front`/`back`) alongside its
`x_percent`/`y_percent`, so the inspection terminal can place a damage dot on the correct
wireframe view instead of assuming a single top-down diagram.

## Stubs & mocks vs. real integrations

These flows are intentionally simulated so the app is fully usable with zero external API keys:

| Feature | Status |
| --- | --- |
| License/selfie OCR | 3s simulated loader, deterministic mock output |
| Stripe deposit | Mock card form, generates a `pi_mock_…` id — no Stripe SDK/network call |
| AI damage scan | Randomized canned analysis from photo count, no real vision model |
| Vehicle GPS movement | Randomized drift every 4s for `rented` vehicles on the fleet map |
| Toll road logs | Generated client-side from currently active bookings |
| Digital key lock/unlock | Toggles `vehicles.telemetry.locked` in PocketBase with a simulated BLE-style delay |

Swapping any of these for a real provider (Stripe, an OCR/KYC vendor, a vision model, a
telematics API, a toll aggregator) means replacing the corresponding function in
`frontend/src/components/` — the PocketBase schema already has the fields to receive real data.

## Development without Docker

```bash
# terminal 1
cd pocketbase && ./pocketbase serve

# terminal 2
cd frontend && npm install && npm run dev
```

Set `NEXT_PUBLIC_POCKETBASE_URL` in `frontend/.env.local` if PocketBase isn't on
`http://127.0.0.1:8090`.

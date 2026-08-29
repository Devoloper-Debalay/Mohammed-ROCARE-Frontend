# ROCARE Frontend

A multi-portal React + Vite + Tailwind frontend for the ROCARE backend
(RO/AC/geyser sales and service platform), built as **four isolated portals**:

- `/` — public landing page with portal picker
- `/customer/*` — customer portal (OTP login/signup, catalog, cart, orders, addresses)
- `/vendor/*` — vendor/technician portal (password login, leads, wallet, profile)
- `/staff/*` — admin & super-admin portal (shared login, role-based nav — an ADMIN
  can never see or reach the super-admin routes, and vice versa)

Each portal stores its own auth token under a separate `localStorage` key and
uses its own axios instance, so a customer session can never leak into the
vendor or staff portal (or vice versa).

## Getting started

```bash
npm install
cp .env.example .env   # point VITE_API_BASE_URL at your backend
npm run dev
```

## What's fully wired to the backend

- Customer: auth (OTP), catalog browse + add to cart, cart quantity edit,
  addresses (CRUD), order list
- Vendor: auth (signup + OTP + password login), dashboard, leads list + accept,
  wallet balance/history/recharge, profile/KYC edit
- Admin: auth, dashboard report, pending vendor verification (approve/reject)
- Super-admin: auth (same login, routed by role), branches + admins overview

## What's scaffolded but not yet built (clearly marked "coming online" in the UI)

- Customer: service requests, complaints, notifications
- Vendor: products/parts purchase, offers, complaints, notifications
- Admin: full vendor directory, lead pipeline management, orders, catalog
  management, complaints
- Super-admin: branch/admin/user CRUD, audit logs, settings

These all have working navigation entries already — the next build pass wires
each one to its existing backend endpoint following the same pattern used
throughout this codebase.

## Design system

- Palette: marine ink, filtered-water white, deep teal (customer), technician
  orange (vendor), slate (admin), mineral gold (super-admin)
- Type: Space Grotesk (display), Inter (body), IBM Plex Mono (order IDs, codes)
- Signature component: `StageRing` / `StageBar` (`src/components/ui/StageRing.tsx`)
  — a segmented ring/bar that mirrors the real 4-stage service pipeline
  (Requested → Assigned → In progress → Completed), reused across the landing
  page, auth screens, and dashboards.

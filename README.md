# 🪔 Rasoi — Smart Restaurant System

Built for **VibeAthon 6.0 (2K26)** — Smart Restaurant Management System challenge.

Rasoi digitises a neighbourhood Indian restaurant end-to-end: customers see a
**live menu**, order from their table in two taps, get **bell notifications at
every cooking step**, and book tables without a phone call — while the staff
runs everything from one compact dashboard.

## User stories completed

| Level | Story | What's in the app |
|---|---|---|
| 🥉 Bronze | US-1 UX | Warm Indian-art UI (₹, veg/non-veg marks, paisley motifs), responsive, empty/loading states |
| 🥈 Silver | US-2 Auth | Email + password with **OTP verification** (demo inbox), **Google OAuth** (demo mode), role-based access (customer / manager) |
| 🥈 Silver | US-3 Digital ops | Digital menu with **live availability**, smart ordering from table, live order tracking, table reservations with slot availability, billing with GST |
| 🥇 Gold | US-4 Dashboard | Manager sidebar dashboard: Orders queue, Menu CRUD, Tables, Bookings flow, Inventory, Staff, Customers, Sales & analytics |
| 💎 Platinum | US-5 Intelligence | Personalised "Picked for you", stock alerts with **days-left prediction** + 1-tap restock, demand chart (busy hours), live wait-time estimate, smart notifications at every step |

## Demo logins

- **Manager:** `manager@rasoi.in` / `rasoi123`
- **Customer:** `priya@example.com` / `priya123`
- Or sign up fresh — the OTP appears in the demo inbox box.

## Tech stack

Next.js (App Router) • React 19 • TypeScript • Tailwind CSS v4 • PostgreSQL + Drizzle ORM • node:crypto (scrypt) sessions

## Run locally

```bash
npm install
npx drizzle-kit push     # create tables
npx tsx src/db/seed.ts   # seed demo restaurant data
npm run dev
```

## AI usage

UI copywriting guidance and code scaffolding assistance via an AI coding
assistant. No external AI APIs are called at runtime.

# Trivilla — Smart Restaurant Management System

Trivilla is a full-stack restaurant platform built for **VibeAthon 6.0 (2K26)**. It brings a neighbourhood Indian restaurant online end-to-end — customers browse a live menu and order from their table, the kitchen gets instant updates, and the manager runs the whole restaurant from a single dashboard.

**Live demo:** [trivilla.vercel.app](https://trivilla.vercel.app)

The app is modeled around a real restaurant on Laxmi Road, Pune, with a 28-dish menu across 9 categories, 12 tables in 4 zones, and a staff of 6.

## Table of Contents

- [About](#about)
- [What Makes It Different](#what-makes-it-different)
- [Who Uses It](#who-uses-it)
- [Smart Features](#smart-features)
- [Tech Stack](#tech-stack)
- [How the Data Fits Together](#how-the-data-fits-together)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Try It Out](#try-it-out)
- [Project Structure](#project-structure)
- [How It Works, Step by Step](#how-it-works-step-by-step)

## About

Trivilla isn't just an ordering app — it's meant to work like a small restaurant's entire operating system. It connects three kinds of people on one platform: the customer sitting at a table, the chef in the kitchen, and the manager running the business. Every screen is built around something that actually happens in a real restaurant, from opening the menu to closing out last week's sales report.

## What Makes It Different

Most restaurant apps stop at showing a menu and taking an order. Trivilla goes further by adding a layer of smart automation on top of the usual features:

- Live kitchen updates instead of a static "your order is being prepared" message
- Built-in recommendation and prediction logic instead of no personalization at all
- Inventory that warns you before it runs out, instead of manual stock-checking
- An interactive table layout instead of a plain reservation list
- Pricing that adjusts for happy hours and peak times
- A staffing suggestion for tomorrow, based on how busy today actually was

All of this runs directly inside the app — no external AI service is called while the app is running.

## Who Uses It

### Customers
Customers can browse the menu with photos, spice levels, and prep times; filter for veg or non-veg; and place orders with custom notes like "less spicy" or "no onion." Once an order is placed, it can be tracked live as it moves from placed to cooking to ready to served, with an estimated "ready by" time. Tables can also be booked up to two weeks in advance, and the app picks the best available table automatically based on party size. At the end, customers get an itemized bill with tax, and can pay by UPI, card, or cash. None of this requires creating an account — guest ordering is supported too.

### Managers
Managers land on a dashboard showing today's revenue, order count, staff on duty, and how many tables are occupied. From there they can manage the menu, tables, inventory, and staff roster, and confirm or adjust reservations. The more useful part is the built-in alerts: a heads-up when an ingredient is about to run out, a note when a regular customer hasn't ordered in a while, and a recommendation for how many staff to schedule tomorrow based on past patterns. Revenue charts, best-selling dishes, and busy-hour trends are all part of the same dashboard.

### Kitchen Staff
The kitchen view is intentionally simple: a live queue of incoming orders, sorted by time, with quantities and any special requests attached. Chefs move each order forward — placed, then cooking, then ready — with a single click, and the customer is notified automatically at each step.

## Smart Features

Trivilla includes 10 built-in "smart" features. All of them run on the restaurant's own data (past orders, current inventory, staffing history) rather than calling an external AI service:

1. **Dish recommendations** — suggests dishes based on what similar customers have ordered before
2. **Chef's specials** — highlights dishes made from the freshest inventory and current favorites
3. **Wait-time estimate** — predicts how long an order will take based on kitchen load and chefs on duty
4. **Ready-time prediction** — gives each order a specific "ready by" time
5. **Smart table assignment** — picks the best table for a booking based on party size and availability
6. **Combo pairings** — suggests dishes often ordered together with what's already in the cart
7. **Dynamic pricing** — applies happy-hour discounts and peak-hour pricing automatically
8. **Restock prediction** — estimates when an inventory item will run out and how much to reorder
9. **Churn detection** — flags customers who haven't ordered in a while, with a suggested follow-up
10. **Staff planning** — recommends how many chefs and waiters to schedule for the next day

## Tech Stack

| Layer | Tools Used |
|-------|-----------|
| Frontend & Backend | Next.js, React, TypeScript, Tailwind CSS |
| Database | SQLite, hosted on Turso, managed with Drizzle ORM |
| Authentication | Email/password with OTP verification, plus Google sign-in |
| Charts & Analytics | Recharts and Chart.js |
| Hosting | Vercel (app) and Turso (database) |

## How the Data Fits Together

Underneath the interface, Trivilla keeps track of everything a restaurant needs: user accounts and sessions, the menu, tables, orders and their line items, reservations, inventory, and staff. Orders move through a simple pipeline — **placed → cooking → ready → served → completed** (or cancelled at any point) — and reservations follow a similar path from **requested** to **confirmed**, **seated**, and **completed**. Tables themselves are always in one of four states: free, occupied, reserved, or being cleaned.

## Database at a Glance

Everything is organized into 11 tables, grouped around what they represent:

| Group | Tables | What's Stored |
|-------|--------|----------------|
| Accounts | users, sessions, otp_codes, notifications | Logins, active sessions, email verification, in-app alerts |
| Menu & Orders | menu_items, orders, order_items | Dishes on offer and every order placed against them |
| Tables & Bookings | tables, reservations | The floor plan and upcoming reservations |
| Operations | inventory, staff | Stock levels and the staff roster |

## Security & Access

Trivilla supports both traditional email/password signup (with passwords hashed using scrypt) and one-click Google sign-in, with a 6-digit OTP sent by email to verify new accounts. Every user has one of three roles — customer, manager, or chef — and each API route checks that role before allowing access, so a customer account can never reach manager-only data like inventory or staff records.

## Look & Feel

The interface uses Manrope and Fraunces as its two typefaces, Lucide icons throughout, and a hand-built SVG floor plan for the table layout instead of a generic grid — small details that make the app feel closer to a real restaurant's branding than a bare-bones admin tool.

## Getting Started

**Prerequisites:** Node.js 18+ and a package manager (npm, yarn, or pnpm).

```bash
# Clone and install
git clone https://github.com/being-souL1230/Trivilla
cd trivilla
npm install

# Set up the database
npx drizzle-kit push
npx tsx src/db/seed.ts

# Run it locally
npm run dev
```

The app runs at `http://localhost:3000`. Seeding fills the database with demo data — 28 dishes, 12 tables, 6 staff members, 18 past orders, 4 reservations, and 12 inventory items — so the app looks fully alive right away.

A few other useful commands are listed below:

| Command | What It Does |
|---------|--------------|
| `npm run build` | Build the app for production |
| `npm start` | Run the production build |
| `npm run lint` | Check code style |
| `npm run typecheck` | Check for TypeScript errors |
| `npx drizzle-kit studio` | Open a visual database browser |
| `npx tsx src/db/seed.ts` | Reset and re-seed demo data |

## Environment Variables

Create a `.env` file in the project root with:

| Variable | Purpose | Required |
|----------|---------|----------|
| `DATABASE_URL` | Turso database URL | Yes |
| `TURSO_AUTH_TOKEN` | Turso authentication token | Yes |
| `RESEND_API_KEY` | Sends OTP verification emails | Yes |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Enables Google sign-in | Only for Google login |
| `NEXT_PUBLIC_APP_URL` | The app's public URL | Yes |

## Try It Out

| Role | Email | Password | What You'll See |
|------|-------|----------|------------------|
| Manager | manager@trivilla.in | trivilla123 | Full dashboard, analytics, menu, inventory, staff |
| Chef | chef@trivilla.in | chef123 | Kitchen order queue and status controls |
| Customer | priya@example.com | priya123 | Veg-only preference, order history |
| Customer | rahul@example.com | rahul123 | Non-veg and takeaway orders |

You can also skip signing in entirely — ordering and table booking both work as a guest.

## Project Structure

```
trivilla/
├── src/
│   ├── app/               # Pages: menu, booking, orders, kitchen, admin dashboard, plus API routes
│   ├── components/        # Reusable UI: menu cards, cart, floor plan, bill, login modal
│   ├── db/                # Database schema, connection, and seed data
│   ├── lib/               # Core logic: the smart-feature engine, auth, pricing, email, analytics
│   └── store.tsx          # Shared app state (auth, cart, notifications, live updates)
├── drizzle.config.json    # Database ORM configuration
├── package.json
└── .env                   # Local environment variables (not committed)
```

## How It Works, Step by Step

**Customer:** opens the menu → sees personalized recommendations → adds items to cart with notes → sees combo suggestions → places the order → gets live updates as it cooks → receives an itemized bill.

**Manager:** logs in → reviews today's KPIs, active orders, and low-stock alerts → manages the menu and floor plan → checks restock and staffing recommendations → reviews revenue and busy-hour charts.

**Kitchen:** logs in → sees the live order queue with special notes → advances each order from placed to cooking to ready → the customer is notified automatically.

---

Built with heart for VibeAthon 6.0 (2K26). Every recommendation and prediction in Trivilla runs on the restaurant's own data — no external AI calls at runtime.
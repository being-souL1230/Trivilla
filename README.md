# Trivilla: Smart Restaurant Management System

A full-stack, AI-powered restaurant management platform built for **VibeAthon 6.0 (2K26)**. Trivilla digitises a neighbourhood Indian restaurant end-to-end: customers see a live menu, order from their table, get real-time cooking updates, and book tables without a phone call. Staff runs the entire operation from one compact dashboard.

**Live:** [trivilla.vercel.app](https://trivilla.vercel.app)

## Table of Contents

- [About](#about)
- [What Makes Trivilla Different](#what-makes-trivilla-different)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Database Schema](#database-schema)
- [AI Engine](#ai-engine)
- [API Routes](#api-routes)
- [Demo Credentials](#demo-credentials)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Environment Variables](#environment-variables)

## About

Trivilla is not just another ordering app. It is a complete restaurant operating system that connects customers, kitchen staff, and managers on a single platform. Every feature is designed around real restaurant workflows: from the moment a customer opens the menu to the moment the manager reviews last week's sales.

The restaurant is set in **Laxmi Road, Pune**. The app serves a full Indian menu with 28+ dishes across 9 categories, 12 tables across 4 zones, and a staff of 6 members.

## What Makes Trivilla Different

| Feature | Typical Restaurant Apps | Trivilla |
|---------|------------------------|----------|
| Ordering | Basic menu display | Live availability, veg/non-veg filtering, spice levels, prep time estimates, per-item notes |
| Kitchen Updates | None or basic status | Real-time SSE-powered status flow (placed > cooking > ready > served) with bell notifications |
| AI Features | None or external API calls | 10 built-in AI engines running pure data-driven logic with zero external API calls at runtime |
| Inventory | Manual tracking | Predictive restock alerts with days-until-stockout calculation and 1-tap reorder |
| Table Management | Simple reservation | Interactive SVG floor plan, zone-based layout, AI smart table assignment |
| Pricing | Fixed prices | Dynamic pricing with happy hour discounts and peak hour surcharges (display-only overlay) |
| Customer Intelligence | None | Churn detection, repeat customer tracking, collaborative filtering recommendations |
| Staff Management | Basic roster | AI-powered shift optimizer based on historical order volume and day-of-week patterns |
| Bill Generation | Basic total | GST computation, multiple payment modes (UPI/Card/Cash), itemized invoices |
| Dashboard | Minimal stats | Full analytics with weekly revenue charts, top sellers, busy hour heatmaps, live badge counts |

## Features

### Customer Features

| Feature | Description |
|---------|-------------|
| Digital Menu | Browse 28+ dishes across 9 categories with images, spice levels (0-3), prep time, veg/non-veg labels, and live availability |
| Smart Ordering | Add items to cart with quantity and custom notes (e.g., "less spicy", "no onion"), place orders in two taps |
| AI Recommendations | Personalized "Picked for You" section powered by collaborative filtering based on order history |
| Chef's Specials | AI-curated daily specials based on freshest inventory items and popular picks |
| Combo Pairings | "Frequently Ordered Together" suggestions when items are added to cart |
| Dynamic Pricing | Happy hour discounts (3-5 PM, 10-11 PM) and peak hour pricing displayed alongside each dish |
| Table Booking | Reserve tables up to 14 days in advance with date, time slot, and guest count selection |
| Smart Table Assignment | AI selects the best available table based on party size, zone preference, and current availability |
| Order Tracking | Live order status with notifications at every step (placed, cooking, ready, served) |
| Wait Time Estimation | AI-predicted wait time based on kitchen load, chefs on duty, and time of day |
| Ready Time Prediction | Exact "Ready by X:XX PM" estimate for each order |
| Bill Invoice | Itemized bill with GST, payment mode selection, and digital receipt |
| Bill Splitting | Split bills across multiple payment modes |
| Notifications | In-app bell notifications for order updates, welcome messages, and promotions |
| Guest Ordering | Place orders without creating an account (auto-created guest profile) |

### Manager (Admin) Features

| Feature | Description |
|---------|-------------|
| Dashboard Overview | KPI cards showing today's revenue, order count, staff on duty, tables occupied, repeat customer % |
| Order Queue | Live view of all orders with status filtering, pagination, and one-click status advancement |
| Menu CRUD | Create, edit, delete menu items with image selection, category assignment, spice/prep time configuration |
| Table Management | Interactive SVG floor plan showing all 12 tables across 4 zones with real-time status color coding |
| Reservation Management | View, confirm, seat, complete, or cancel reservations; assign alternate tables when needed |
| Inventory Management | Track 12+ inventory items with category, unit, quantity, min threshold, avg daily usage, cost, and supplier |
| Restock Alerts | AI-predicted stock-out dates with recommended reorder quantities and urgency levels (critical/warning/normal) |
| Staff Scheduling | View staff roster with duty, shift, on-duty status, and join date |
| AI Staff Optimizer | Tomorrow's staffing recommendation based on historical order patterns and day-of-week analysis |
| Churn Detection | Identifies inactive customers (20+ days no order) with risk levels and retention suggestions |
| Revenue Analytics | Weekly revenue bar chart, top selling items, busy hour heatmap, and day-over-day comparison |
| Customer Database | Full customer list with order count and total spend |
| Bills & Invoices | View all completed orders with full payment details |
| Live Badge Stats | SSE-powered real-time counts for active orders, low stock items, and pending reservations |

### Kitchen (Chef) Features

| Feature | Description |
|---------|-------------|
| Kitchen Display System | Live order queue sorted by time, showing items, quantities, and special notes |
| Status Management | Advance orders through the pipeline (placed > cooking > ready) with one click |
| Order Notes | See customer special requests (e.g., "less spicy", "extra butter naan") |
| Wait Time Visibility | View estimated prep time and queue depth |

### Authentication & Security

| Feature | Description |
|---------|-------------|
| Email + Password | Traditional signup with password hashing (scrypt via node:crypto) |
| OTP Verification | 6-digit email OTP for signup verification (powered by Resend) |
| Google OAuth | One-click Google sign-in with CSRF state validation |
| Role-Based Access | Three roles: customer, manager (admin), chef (kitchen staff) |
| Session Management | Secure httpOnly cookie-based sessions with 7-day expiry |
| Protected Routes | API-level auth guards (requireUser, requireManager, requireChef, requireStaff) |

## Tech Stack

### Core

| Technology | Version | Purpose |
|-----------|---------|---------|
| Next.js | 16.2.6 | React framework with App Router, SSR, API routes, and Server Components |
| React | 19.2.6 | UI library |
| TypeScript | 5.9.3 | Type-safe development |
| Tailwind CSS | 4.1.17 | Utility-first CSS styling |

### Database & ORM

| Technology | Purpose |
|-----------|---------|
| SQLite (Turso/LibSQL) | Edge-hosted database via `@libsql/client` |
| Drizzle ORM | Type-safe SQL query builder and schema management |
| Drizzle Kit | Database migrations and schema push tool |

### Authentication & Email

| Technology | Purpose |
|-----------|---------|
| node:crypto (scrypt) | Secure password hashing with salt |
| Resend | Transactional email delivery for OTP verification |

### Charts & Visualisation

| Technology | Purpose |
|-----------|---------|
| Recharts | React charting library for revenue and analytics dashboards |
| Chart.js + react-chartjs-2 | Additional chart rendering for data visualisation |

### UI & Icons

| Technology | Purpose |
|-----------|---------|
| Lucide React | Icon library with 100+ icons |
| Custom SVG Floor Plan | Hand-crafted interactive restaurant layout |
| Google Fonts (Manrope + Fraunces) | Display and body typography |

### Hosting

| Service | Purpose |
|---------|---------|
| Vercel | Frontend and API deployment |
| Turso | Serverless SQLite database hosting |

## Database Schema

The database contains **11 tables** covering all aspects of restaurant operations:

| Table | Columns | Purpose |
|-------|---------|---------|
| `users` | id, name, email, password, phone, role, isGoogle, vegOnly, createdAt | User accounts with role-based access |
| `sessions` | id, token, userId, expiresAt, createdAt | Secure session management |
| `otp_codes` | id, email, code, meta, used, createdAt | OTP verification for email signup |
| `notifications` | id, userId, title, body, read, createdAt | In-app notification system |
| `menu_items` | id, name, description, category, price, veg, available, popular, spice, prepTime, image, createdAt | Restaurant menu with 28+ dishes |
| `tables` | id, tableNo, seats, zone, status | 12 tables across 4 zones |
| `orders` | id, code, userId, customerName, type, tableId, paymentMode, note, subtotal, tax, total, status, createdAt, updatedAt | Customer orders with full lifecycle |
| `order_items` | id, orderId, menuItemId, name, price, qty | Individual line items within orders |
| `reservations` | id, userId, customerName, phone, date, slot, guests, tableId, requestedTableId, note, status, createdAt | Table reservations with slot management |
| `inventory` | id, name, category, unit, qty, minQty, avgDailyUse, costPerUnit, supplier, lastRestocked | Kitchen inventory tracking |
| `staff` | id, name, duty, phone, shift, onDuty, joinedOn | Staff roster and shift management |

### Order Status Flow

```
placed > cooking > ready > served > completed
                                    |
                               cancelled
```

### Reservation Status Flow

```
requested > alternate_offered > confirmed > seated > completed
     |                                              |
     +----------------------------------------------+
                      cancelled
```

### Table Status Options

| Status | Description |
|--------|-------------|
| free | Available for seating |
| occupied | Currently in use by diners |
| reserved | Held for an upcoming reservation |
| cleaning | Being cleaned and reset |

## AI Engine

Trivilla includes **10 AI-powered features** running entirely on data-driven logic. No external AI APIs are called at runtime.

| # | Feature | Description | Data Sources |
|---|---------|-------------|-------------|
| 1 | Dish Recommender | Collaborative filtering: finds users with similar taste and suggests dishes they loved | Order history, user preferences, menu popularity |
| 2 | Specials Engine | Promotes dishes based on freshest inventory and popular picks as "Chef's Specials" | Inventory levels, menu popularity, keyword matching |
| 3 | Smart Wait Time | Dynamic kitchen wait estimation based on load, chefs, and time of day | Active orders, staff schedule, prep times, peak hours |
| 4 | Ready Time Prediction | Per-order "Ready by X:XX PM" with queue position and chef factor | Order items, prep times, queue depth, chef count |
| 5 | Smart Table Assignment | Scores tables by seat fit, zone preference, availability, and load distribution | Table statuses, reservation data, party size |
| 6 | Combo Pairings | "Frequently ordered together" based on historical co-occurrence in orders | Past orders, menu item associations |
| 7 | Dynamic Pricing | Happy hour discounts and peak surcharges as display-only overlays | Time of day, item category |
| 8 | Auto Reorder Predictor | Predicts stock-out dates and recommends restock quantities | Inventory qty, avg daily use, min thresholds |
| 9 | Churn Detector | Identifies inactive customers with risk levels and retention suggestions | Order timestamps, customer activity patterns |
| 10 | Staff Optimizer | Recommends optimal chef and waiter count for tomorrow | Historical order volume by day of week, weekend patterns |

## API Routes

### Authentication

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/auth/me` | Get current session user | Optional |
| POST | `/api/auth/register` | Send OTP email for signup | None |
| POST | `/api/auth/verify` | Verify OTP and create account | None |
| POST | `/api/auth/resend-otp` | Resend signup OTP | None |
| POST | `/api/auth/login` | Email + password login | None |
| POST | `/api/auth/logout` | Destroy session | None |
| GET | `/api/auth/google/authorize` | Redirect to Google OAuth consent | None |
| GET | `/api/auth/google/callback` | Handle Google OAuth callback | None (CSRF validated) |

### Data (CRUD)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/data/menu` | List all menu items | None |
| POST | `/api/data/menu` | Create a menu item | Manager |
| GET | `/api/data/tables` | List all tables | None |
| POST | `/api/data/tables` | Create a table | Manager |
| GET | `/api/data/orders` | List orders (own/all based on role) | User |
| POST | `/api/data/orders` | Place a new order | Optional (guest or user) |
| GET | `/api/data/reservations` | List reservations (own/all based on role) | User |
| POST | `/api/data/reservations` | Book a reservation | Optional (guest or user) |
| GET | `/api/data/inventory` | List inventory items | Manager |
| POST | `/api/data/inventory` | Create an inventory item | Manager |
| GET | `/api/data/staff` | List staff members | Manager |
| POST | `/api/data/staff` | Add a staff member | Manager |
| GET | `/api/data/customers` | List customers with order stats | Manager |
| GET | `/api/data/bills` | List completed orders/invoices | User |
| GET | `/api/data/notifications` | List user notifications | Optional |

### Data (Update/Delete)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| PATCH | `/api/data/[resource]/[id]` | Update menu, tables, orders, reservations, inventory, staff, or notifications | Varies |
| DELETE | `/api/data/[resource]/[id]` | Delete menu, tables, inventory, or staff items | Manager |

### AI Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/ai/recommendations` | Get personalised dish recommendations | Optional |
| GET | `/api/ai/specials` | Get AI-curated daily specials | None |
| GET | `/api/ai/wait-time` | Get predicted kitchen wait times | None |
| GET | `/api/ai/ready-time/[orderId]` | Get estimated ready time for an order | None |
| GET | `/api/ai/smart-table?guests=N&zone=Z` | Get AI best table suggestion | None |
| POST | `/api/ai/pairings` | Get combo dish pairings for cart items | None |
| GET | `/api/ai/churn` | Get at-risk customer alerts | Manager |
| GET | `/api/ai/staff-optimizer` | Get tomorrow's staffing recommendation | Manager |

### System

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/stats` | Public kitchen pulse or full manager analytics | None / Manager |
| GET | `/api/stats/events` | SSE stream of live badge stats (every 3s) | Manager |
| GET | `/api/health` | Database health check | None |

## Demo Credentials

### Manager (Admin Dashboard)

| Field | Value |
|-------|-------|
| Email | `manager@trivilla.in` |
| Password | `trivilla123` |
| Role | Manager |
| Access | Full dashboard, analytics, menu CRUD, inventory, staff, orders, reservations |

### Chef (Kitchen Display)

| Field | Value |
|-------|-------|
| Email | `chef@trivilla.in` |
| Password | `chef123` |
| Role | Chef |
| Access | Kitchen display system, order status updates |

### Customer Accounts

| Name | Email | Password | Notes |
|------|-------|----------|-------|
| Priya Sharma | `priya@example.com` | `priya123` | Veg-only preference, multiple past orders |
| Rahul Verma | `rahul@example.com` | `rahul123` | Non-veg orders, takeaway orders |
| Sneha Kulkarni | `sneha@example.com` | `sneha123` | Mixed orders, dine-in and takeaway |

### Guest Mode

You can also place orders and book tables without signing in. The system auto-creates a guest account.

## Getting Started

### Prerequisites

- Node.js 18+ installed
- npm, yarn, or pnpm package manager

### Installation

```bash
# Clone the repository
git clone https://github.com/being-souL1230/Trivilla
cd trivilla

# Install dependencies
npm install
```

### Database Setup

```bash
# Create database tables
npx drizzle-kit push

# Seed with demo restaurant data (28 dishes, 12 tables, 6 staff, 18 orders, 4 reservations, 12 inventory items)
npx tsx src/db/seed.ts
```

### Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:3000`.

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Run TypeScript type checking |
| `npx drizzle-kit push` | Push schema changes to database |
| `npx drizzle-kit studio` | Open Drizzle Studio (database GUI) |
| `npx tsx src/db/seed.ts` | Reset and re-seed demo data |

## Project Structure

```
trivilla/
├── src/
│   ├── app/                        # Next.js App Router pages
│   │   ├── layout.tsx              # Root layout with fonts and providers
│   │   ├── page.tsx                # Landing page (hero, specials, booking CTA)
│   │   ├── menu/page.tsx           # Customer menu browsing
│   │   ├── book/page.tsx           # Table reservation booking
│   │   ├── orders/page.tsx         # Customer order tracking
│   │   ├── chef/page.tsx           # Kitchen display system
│   │   ├── admin/                  # Manager dashboard
│   │   │   ├── page.tsx            # Dashboard overview (KPIs, charts, AI insights)
│   │   │   ├── menu/page.tsx       # Menu item management
│   │   │   ├── orders/page.tsx     # Order queue management
│   │   │   ├── tables/page.tsx     # Interactive floor plan
│   │   │   ├── reservations/page.tsx # Reservation management
│   │   │   ├── inventory/page.tsx  # Inventory tracking
│   │   │   ├── staff/page.tsx      # Staff roster
│   │   │   ├── customers/page.tsx  # Customer database
│   │   │   ├── feedback/page.tsx   # Customer feedback
│   │   │   └── analytics/page.tsx  # Revenue and sales analytics
│   │   └── api/                    # API routes (16 route files)
│   │       ├── auth/               # Authentication endpoints
│   │       ├── data/               # CRUD data endpoints
│   │       ├── ai/                 # AI engine endpoints (8 routes)
│   │       ├── stats/              # Analytics and live stats
│   │       └── health/             # Health check
│   ├── components/                 # React components
│   │   ├── Header.tsx              # Navigation with role-based links
│   │   ├── DishCard.tsx            # Menu item card with add-to-cart
│   │   ├── CartDrawer.tsx          # Slide-out cart with quantity controls
│   │   ├── FloorPlan.tsx           # Interactive SVG restaurant layout
│   │   ├── BillInvoice.tsx         # Bill generation and display
│   │   ├── AuthModal.tsx           # Login/signup modal with OTP flow
│   │   ├── Chrome.tsx              # App shell (header + toast host)
│   │   ├── ui.tsx                  # Shared UI primitives (Button, Icon, Modal, etc.)
│   │   └── admin/                  # Admin-specific components
│   ├── db/                         # Database layer
│   │   ├── schema.ts               # Drizzle schema (11 tables)
│   │   ├── index.ts                # Database connection
│   │   ├── seed.ts                 # Demo data seeder
│   │   └── add-extras.ts           # Menu extras utility
│   ├── lib/                        # Business logic and utilities
│   │   ├── ai.ts                   # AI engine (10 features)
│   │   ├── auth.ts                 # Session management and auth guards
│   │   ├── google.ts               # Google OAuth integration
│   │   ├── hash.ts                 # Password hashing (scrypt)
│   │   ├── pricing.ts              # Dynamic pricing (client-safe)
│   │   ├── resend.ts               # Email delivery via Resend
│   │   ├── stats.ts                # Analytics computation
│   │   └── utils.ts                # Types, constants, helpers, image URLs
│   └── store.tsx                   # Client state (auth, cart, toasts, fetch, SSE)
├── scripts/
│   └── set-wal.mjs                 # SQLite WAL mode configuration
├── drizzle.config.json             # Drizzle ORM configuration
├── next.config.ts                  # Next.js configuration
├── tailwind.config.ts              # Tailwind CSS configuration
├── tsconfig.json                   # TypeScript configuration
├── package.json                    # Dependencies and scripts
└── .env                            # Environment variables (not committed)
```

## Environment Variables

Create a `.env` file in the project root with the following variables:

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | Turso/LibSQL database URL | Yes |
| `TURSO_AUTH_TOKEN` | Turso authentication token | Yes |
| `RESEND_API_KEY` | Resend API key for sending OTP emails | Yes |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | For Google sign-in |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret | For Google sign-in |
| `NEXT_PUBLIC_APP_URL` | Public app URL (e.g., `https://trivilla.vercel.app`) | Yes |

## How It Works

### Customer Flow

1. Customer opens the app and browses the live menu with real-time availability
2. AI recommends personalised dishes based on order history and taste profile
3. Customer adds items to cart with optional notes (e.g., "extra spicy", "no onions")
4. AI suggests combo pairings ("People also ordered...")
5. Customer places order (with or without account) and selects payment mode
6. Kitchen receives the order instantly on their display system
7. Customer gets real-time notifications as the order progresses through cooking stages
8. AI provides "Ready by X:XX PM" prediction
9. Bill is generated with GST breakdown

### Manager Flow

1. Manager logs in and sees the dashboard with live KPIs
2. Reviews active orders, low stock alerts, and pending reservations
3. Manages menu (add/edit/delete dishes with images and categories)
4. Views interactive floor plan to monitor table status
5. Reviews AI-generated restock predictions and staff recommendations
6. Analyzes revenue charts, top sellers, and busy hours
7. Monitors churned customers and takes retention actions

### Kitchen Flow

1. Chef logs in and sees the live order queue
2. Orders appear in real-time with item details and special notes
3. Chef advances order status: placed > cooking > ready
4. Customer gets notified at each stage

## Built With Heart

Trivilla was built for VibeAthon 6.0 (2K26). The AI engine runs entirely on data-driven logic with no external AI API calls. All recommendations, predictions, and insights are computed from the restaurant's own data.

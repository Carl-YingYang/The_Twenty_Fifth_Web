# The Twenty-Fifth 🌊

A production-quality **Resort Reservation Management System (RRMS)** for a luxury beachfront villa in Botolan, Zambales, Philippines.

Built with Next.js 16, TypeScript, Tailwind CSS 4, shadcn/ui, Prisma, and Framer Motion.

---

## ✨ Features

### Public Website
- **Hero slideshow** with LQIP blur-up progressive image loading
- **Availability search** — check-in/check-out date picker → booking flow
- **Villa & rooms** listing with detailed room pages
- **Amenities** page grouped by category
- **Gallery** with masonry layout + lightbox
- **About** page with villa story
- **FAQs** accordion
- **Contact** form with social links
- **3-step booking flow** (Dates → Details → Confirm) with reference number
- **Find My Booking** lookup by reference + email
- **AI Concierge chatbot** (Groq-powered)
- Light/dark mode toggle

### Admin System
- Secure login (token-based auth)
- **Dashboard** with stat cards, occupancy chart, recent bookings
- **Bookings** management with status workflow (Pending → Confirmed → Checked-in → Checked-out)
- **Calendar** — room × day grid with color-coded statuses (showcase feature)
- **Rooms** CRUD with image management
- **Guests** directory with reservation history
- **Amenities** management
- **Gallery** management
- **Reports** with charts (monthly bar, revenue line, status donut)
- **Settings** (General / Operations / Finance)

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 4 |
| UI Components | shadcn/ui (New York) + Lucide icons |
| Database | Prisma ORM + SQLite |
| State | Zustand (client) + TanStack Query (server) |
| Forms | React Hook Form + Zod |
| Animation | Framer Motion |
| Charts | Recharts |
| Toasts | Sonner |
| AI | Groq (llama-3.3-70b) for concierge chatbot |

---

## 🚀 Run Locally on Your Laptop

### Prerequisites

Install these on your machine:

1. **Node.js 18+** (v20+ recommended)
   - Download from https://nodejs.org/
   - Verify: `node --version`

2. **Bun** (package manager — faster than npm)
   - Install: `curl -fsSL https://bun.sh/install | bash`
   - Verify: `bun --version`
   - Or use npm/yarn if you prefer (see alternatives below)

### Setup Steps

```bash
# 1. Clone the repo
git clone https://github.com/Carl-YingYang/The_Twenty_Fifth_Web.git
cd The_Twenty_Fifth_Web

# 2. Install dependencies
bun install
# (or: npm install)

# 3. Set up environment variables
cp .env.example .env
# Edit .env and add your Groq API key from https://console.groq.com/keys
# (The chatbot won't work without it, but the rest of the site will.)

# 4. Set up the database
bun run db:generate   # Generate Prisma client
bun run db:push       # Create SQLite DB + tables
# (or: npx prisma generate && npx prisma db push)

# 5. Seed the database with sample data
bun run db:seed
# (or: npx prisma db seed — see package.json "prisma.seed" config)

# 6. Start the dev server
bun run dev
# (or: npm run dev)
```

Open **http://localhost:3000** in your browser. 🎉

### Admin Access

Once the site is running, go to the footer → click **Admin Login**, or navigate to the admin login view:

- **Email:** `admin@verdararesort.com`
- **Password:** `verdara2025`

> ⚠️ Change these credentials before deploying to production.

---

## 📜 Available Scripts

| Command | Description |
|---------|-------------|
| `bun run dev` | Start dev server on http://localhost:3000 |
| `bun run build` | Production build |
| `bun run start` | Run production server (after build) |
| `bun run lint` | Run ESLint |
| `bun run db:push` | Push Prisma schema to database |
| `bun run db:generate` | Regenerate Prisma client |
| `bun run db:seed` | Seed database with sample data |
| `bun run db:reset` | Reset database (⚠️ deletes all data) |

---

## 📁 Project Structure

```
├── prisma/
│   ├── schema.prisma        # 12 database models
│   └── seed.ts              # Sample data seeding
├── src/
│   ├── app/
│   │   ├── api/             # API route handlers
│   │   ├── page.tsx         # Single SPA route (view router)
│   │   └── layout.tsx       # Root layout (fonts, providers)
│   ├── components/
│   │   ├── ui/              # shadcn/ui primitives
│   │   ├── public/          # Public website components
│   │   └── admin/           # Admin dashboard components
│   ├── lib/                 # Utils, db client, auth, api-client
│   ├── store/               # Zustand stores (view, auth, booking)
│   ├── hooks/               # Custom React hooks
│   └── types/               # TypeScript type definitions
├── public/                  # Static assets (hero images, logo)
└── .env.example             # Template for environment variables
```

---

## 🗄 Database

Uses **SQLite** (file-based, no server needed). The database file is created at `db/custom.db` after running `bun run db:push`.

**Models:** User, RoomType, Room, RoomImage, Amenity, RoomAmenity, Guest, Reservation, ReservationRoom, Gallery, Setting, Notification, AuditLog.

To reset the database: `bun run db:reset` then `bun run db:push` then `bun run db:seed`.

---

## 🔐 Environment Variables

Copy `.env.example` to `.env` and fill in:

```env
DATABASE_URL="file:./db/custom.db"
GROQ_API_KEY="gsk_your_key_here"    # Get from https://console.groq.com/keys
GROQ_MODEL="llama-3.3-70b-versatile"
```

> Never commit `.env` — it's in `.gitignore` for a reason.

---

## 🏝 About The Twenty-Fifth

A private beachfront villa in Botolan, Zambales, Philippines — 4 bedrooms, 21 beds, 5.5 baths, sleeps up to 25 guests. Infinity pool, fully equipped kitchen, direct beach access.

- 📞 +63 969 601 4369
- 📧 @thetwentyfifthzambales (Instagram)
- 🌐 facebook.com/the25thinzambales

---

## 📄 License

Private project. All rights reserved.

# LandCheck

Nigeria's AI-powered land title verification and secure property purchase platform. Buyers submit property details and documents; the system cross-references government registries, runs AI forensic analysis, computes a trust score, and provides a detailed fraud risk report — all before any money changes hands.

---

## Features

- **Land Verification** — Submit parcel number, owner name, and location. The system checks against a scraped government land registry and returns a VERIFIED / CAUTION / HIGH_RISK verdict with a 0–100 trust score.
- **AI Document Analysis** — Upload C of O, Deed of Assignment, Survey Plans, or Power of Attorney. Claude (or AI LandCheck + Claude hybrid) performs OCR forensics and authenticity scoring.
- **Trust Score Engine** — Weighted scoring system with registry match, document authenticity, suspicion signals, and score ceilings (e.g. NOT_FOUND parcels are capped at 40).
- **Secure Escrow Payments** — Funds are held in escrow (via Squad) once a purchase is initiated. Released only when the buyer confirms completion.
- **In-app Wallet** — Top up via Squad payment gateway; withdraw to a bank account; escrow holds and releases tracked per transaction.
- **Purchase Pipeline** — Full buyer–seller flow: offer → seller accept/decline → document upload → AI review → escrow → completion, with real-time messaging.
- **Notifications** — Real-time in-app notifications for offers, escrow events, and messages.
- **Admin Panel** — Manage AI provider keys, switch between Claude / Gemini / AI LandCheck providers, view platform configuration.
- **Google OAuth** — Sign in with Google in addition to email/password.
- **Fully Responsive UI** — Mobile-first layout with slide-in sidebar, hamburger nav, and collapsing grids.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, Vite, React Router v6, Apollo Client |
| Backend | Node.js, Express 5, TypeScript, Apollo Server (GraphQL) |
| Database | PostgreSQL, Prisma ORM |
| AI | Anthropic Claude (claude-opus-4-6), Google Gemini, AI LandCheck (hybrid OCR + Claude) |
| Payments | Squad (SquadCo) — sandbox and production |
| Auth | JWT (Passport), Google OAuth 2.0 |
| Styling | Inline CSS-in-JS with CSS custom properties (no framework) |

---

## Project Structure

```
land-verify/
├── client/                   # React frontend (Vite)
│   └── src/
│       ├── api/              # REST + GraphQL API calls
│       ├── components/
│       │   ├── icons/        # SVG icon system
│       │   ├── layout/       # AppShell, AuthShell, MarketingNav, MarketingFooter
│       │   └── ui/           # Button, Input, StatCard, TrustGauge, Pill, etc.
│       ├── contexts/         # AuthContext
│       ├── hooks/            # useIsMobile
│       ├── pages/
│       │   ├── app/          # Dashboard, Verify, Report, Wallet, Escrow, Purchases, etc.
│       │   ├── auth/         # Login, Signup, ForgotPassword, VerifyCode
│       │   └── marketing/    # HomePage, AboutPage, ContactPage
│       ├── styles/           # tokens.css (design tokens + responsive utilities)
│       └── types/            # Shared TypeScript types
│
└── server/                   # Express + GraphQL backend
    ├── prisma/
    │   ├── schema.prisma     # Database models
    │   ├── seed.ts           # Initial seed data
    │   └── demo-seed.ts      # Hackathon demo data (3 verification outcomes)
    └── src/
        ├── ai/               # AI provider abstraction
        │   ├── providers/    # claude.ts, gemini.ts, ailandcheck.ts
        │   ├── types.ts      # AIProvider interface
        │   └── utils.ts      # Trust score computation, score ceilings
        ├── graphql/          # Apollo schema and resolvers
        ├── modules/          # Feature modules (auth, verification, wallet, purchases, etc.)
        ├── middleware/        # JWT auth, rate limiting
        ├── payments/         # Squad payment integration
        ├── scraper/          # Land registry web scraper (Puppeteer)
        └── storage/          # File upload handling (Multer)
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL (local instance or cloud)
- Anthropic API key (for Claude)
- Squad account (sandbox keys for payments)
- Google OAuth credentials (optional)

### 1. Install dependencies

```bash
npm run install:all
```

### 2. Configure environment variables

Copy and edit the server `.env`:

```bash
cp server/.env.example server/.env   # or create manually
```

```env
# Server
PORT=3000
NODE_ENV=development
CLIENT_URL=http://localhost:5173

# Database
DATABASE_URL=postgresql://user@localhost:5432/land-verify

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d

# Google OAuth (optional)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3000/api/v1/auth/google/callback

# Squad (sandbox)
SQUAD_PUBLIC_KEY=sandbox_pk_...
SQUAD_SECRET_KEY=sandbox_sk_...
SQUAD_BASE_URL=https://sandbox-api-d.squadco.com

# AI fallback keys (primary keys stored in AdminConfig DB table)
CLAUDE_API_KEY=sk-ant-...
GEMINI_API_KEY=...
```

### 3. Set up the database

```bash
# Apply schema and generate Prisma client
cd server
npx prisma migrate dev
npx prisma generate
```

### 4. Seed demo data (optional)

Populates the database with three realistic verification outcomes (VERIFIED, CAUTION, HIGH_RISK) and a purchase in escrow — useful for demos:

```bash
cd server
npx tsx prisma/demo-seed.ts
```

Demo credentials after seeding:

| Role | Email | Password |
|---|---|---|
| Buyer | john.doe@landcheck.demo | Demo1234! |
| Seller | amara.okafor@landcheck.demo | Demo1234! |

### 5. Run locally

```bash
# From the root — runs server, Prisma Studio, and client together
npm run dev
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:3000
- GraphQL Playground: http://localhost:3000/graphql
- Prisma Studio: http://localhost:5555

---

## AI Providers

The active AI provider is stored in the `AdminConfig` database table (key: `active_ai_provider`). Switch it from the Admin Panel without redeploying.

| Provider | Value | Description |
|---|---|---|
| Claude | `claude` | Direct Anthropic Claude for document analysis and registry cross-referencing |
| Gemini | `gemini` | Google Gemini as the AI backbone |
| AI LandCheck + Claude | `ailandcheck` | Hybrid: AI LandCheck (OCR + forensics) extracts document fields, Claude makes the final fraud verdict |

The AI LandCheck service runs at `https://ailandcheck-production.up.railway.app`. It is a FastAPI service (Python) using RapidOCR and rule-based forensic tools. Its output is embedded into Claude's context for the final decision.

---

## Trust Score

| Score | Status | Meaning |
|---|---|---|
| 75–100 | VERIFIED | Registry match, clean documents. Safe to proceed. |
| 40–74 | CAUTION | Some discrepancies or prior encumbrances. Further due diligence recommended. |
| 0–39 | HIGH_RISK | Registry miss or suspicious document signals. Do not proceed. |

Score ceilings applied automatically:
- Parcel **NOT_FOUND** in registry → score capped at **40**
- Any document flagged **suspicious** → score capped at **55**
- Ceilings stack (NOT_FOUND + suspicious → capped at **35**)

---

## Key Scripts

```bash
# Root
npm run dev            # Run everything (server + client + Prisma Studio)
npm run build          # Build server and client for production
npm run db:migrate     # Run pending Prisma migrations
npm run db:studio      # Open Prisma Studio

# Server (from /server)
npm run dev            # tsx watch
npm run test           # Jest tests
npx prisma studio      # Database GUI

# Client (from /client)
npm run dev            # Vite dev server
npm run build          # Production build
npm run typecheck      # TypeScript check only
```

---

## Database Models

| Model | Purpose |
|---|---|
| `User` | Accounts (email/password or Google OAuth) |
| `Wallet` | Per-user balance |
| `WalletTransaction` | Immutable ledger entries (top-up, escrow hold/release, admin credit/debit) |
| `Land` | Government registry records (scraped or seeded) |
| `LandVerification` | Verification request with trust score, match report, and registry status |
| `Document` | Uploaded files with AI analysis results and authenticity score |
| `TrustScoreEvent` | Audit trail of every trust score change |
| `LandPurchase` | Buyer–seller transaction through the full pipeline |
| `Message` | In-app chat per purchase |
| `Notification` | In-app notifications |
| `Payment` | Squad payment records linked to verifications |
| `ScamReport` | Crowd-sourced fraud reports |
| `AdminConfig` | Key-value store for runtime configuration (AI keys, active provider) |

# LandVerify API

AI-powered Nigerian land verification and fraud prevention platform. Verifies property ownership documents, scores trust with Claude and Gemini, processes payments through Squad's escrow system, and exposes both a REST API and a real-time GraphQL API.

---

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Requirements](#requirements)
- [Installation](#installation)
- [Configuration](#configuration)
- [Database Setup](#database-setup)
- [Running the Server](#running-the-server)
- [Running Tests](#running-tests)
- [REST API Reference](#rest-api-reference)
- [GraphQL API Reference](#graphql-api-reference)
- [Payment Flow](#payment-flow)
- [AI Provider System](#ai-provider-system)
- [Storage Adapters](#storage-adapters)
- [Admin Configuration](#admin-configuration)
- [Project Structure](#project-structure)

---

## Overview

LandVerify solves land fraud in Nigeria by:

1. Accepting land documents (Certificate of Occupancy, Survey Plans, Deeds, Power of Attorney)
2. Running AI analysis (Claude or Gemini) to authenticate documents and compute a **trust score** (0–100)
3. Classifying the verification as `VERIFIED`, `CAUTION`, or `HIGH_RISK`
4. Routing payments through Squad's escrow system — funds are held for `CAUTION` cases and only released once verification passes; `HIGH_RISK` transactions are blocked entirely
5. Maintaining a community scam report registry tied to parcel numbers

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         LandVerify API                          │
│                                                                 │
│   REST  /api/v1/*           GraphQL  /graphql                   │
│   ─────────────────         ──────────────────────────────────  │
│   auth          ──────┐     Queries:  verification(s), reports  │
│   verifications ──────┤     Mutations: createReport             │
│   documents     ──────┤     Subscriptions: verificationUpdated  │
│   payments      ──────┤              (WebSocket)                │
│   reports       ──────┤                                         │
│   admin         ──────┘                                         │
│                        │                                        │
│              ┌─────────▼──────────┐                             │
│              │   Service Layer     │                            │
│              └──────────┬─────────┘                             │
│          ┌──────────────┼──────────────┐                        │
│          ▼              ▼              ▼                        │
│       Prisma          Squad           AI Providers              │
│     (PostgreSQL)    (Payments)     Claude / Gemini              │
└─────────────────────────────────────────────────────────────────┘
```

**Trust Score Classification:**

| Score | Status | Payment Outcome |
|---|---|---|
| 75–100 | `VERIFIED` | Direct charge via Squad |
| 40–74 | `CAUTION` | Funds held in Squad escrow |
| 0–39 | `HIGH_RISK` | Payment blocked entirely |

---

## Requirements

| Requirement | Version |
|---|---|
| Node.js | 20+ |
| PostgreSQL | 14+ |
| npm | 10+ |

**External services:**

| Service | Purpose | Sandbox |
|---|---|---|
| [Squad](https://squadco.com) | Payment processing & escrow | `https://sandbox-api-d.squadco.com` |
| [Anthropic Claude](https://anthropic.com) | AI document analysis | API key required |
| [Google Gemini](https://ai.google.dev) | AI document analysis | API key required |
| [Google OAuth](https://console.cloud.google.com) | Social login | Client ID + Secret required |

> Claude and Gemini API keys can be stored in the database via the Admin Config API instead of environment variables. Environment variables serve as fallback.

---

## Installation

```bash
# Clone the repository
git clone <repository-url>
cd land-verify/server

# Install dependencies
npm install

# Generate Prisma client
npm run db:generate
```

---

## Configuration

Copy the example environment file and fill in your values:

```bash
cp .env.example .env
```

**`.env` reference:**

```env
# ─── Server ───────────────────────────────────────────────────────
PORT=3000
NODE_ENV=development

# URL of the frontend — used for CORS and OAuth redirect
CLIENT_URL=http://localhost:5173

# ─── Database ─────────────────────────────────────────────────────
DATABASE_URL=postgresql://user:password@localhost:5432/landverify

# ─── Authentication ───────────────────────────────────────────────
JWT_SECRET=your-long-random-secret-at-least-32-chars
JWT_EXPIRES_IN=7d

# ─── Google OAuth (optional) ──────────────────────────────────────
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3000/api/v1/auth/google/callback

# ─── Squad Payments ───────────────────────────────────────────────
# Use sandbox URL for development, live URL for production
SQUAD_BASE_URL=https://sandbox-api-d.squadco.com
SQUAD_API_KEY=your-squad-api-key

# ─── AI Providers (optional — can be set via Admin Config API) ────
CLAUDE_API_KEY=your-claude-api-key
GEMINI_API_KEY=your-gemini-api-key
```

**Required variables:**

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `JWT_SECRET` | Yes | Secret for signing JWTs (min 32 chars) |
| `PORT` | No | Server port (default: `3000`) |
| `CLIENT_URL` | No | Frontend URL for CORS (default: `http://localhost:5173`) |
| `GOOGLE_CLIENT_ID` | OAuth only | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | OAuth only | Google OAuth client secret |
| `GOOGLE_CALLBACK_URL` | OAuth only | Must match Google Console redirect URI |
| `SQUAD_API_KEY` | Payments only | Squad API key |
| `SQUAD_BASE_URL` | Payments only | Squad API base URL |
| `CLAUDE_API_KEY` | AI fallback | Claude API key (can use Admin Config instead) |
| `GEMINI_API_KEY` | AI fallback | Gemini API key (can use Admin Config instead) |

---

## Database Setup

```bash
# Create and apply migrations
npm run db:migrate

# Seed the database with initial admin config
npx prisma db seed

# (Optional) Open Prisma Studio to browse data
npm run db:studio
```

The seed script creates the default `AdminConfig` rows for AI provider keys. You can update them later via the [Admin Config API](#admin-configuration).

**Database models at a glance:**

| Model | Purpose |
|---|---|
| `User` | Accounts with Local or Google OAuth auth |
| `LandVerification` | Core verification record with trust score |
| `Document` | Uploaded files with AI analysis results |
| `TrustScoreEvent` | Immutable audit log of every score change |
| `Payment` | Squad payment records with escrow state |
| `ScamReport` | Community-submitted fraud reports |
| `AdminConfig` | Key-value store for runtime configuration |

---

## Running the Server

```bash
# Development (hot reload)
npm run dev

# Production (compile first, then run)
npm run build
npm start
```

**Expected output:**

```
Server running on http://localhost:3000
GraphQL:        http://localhost:3000/graphql
Subscriptions:  ws://localhost:3000/graphql
```

**Health check:**

```bash
curl http://localhost:3000/health
# {"success":true,"message":"LandVerify API is running"}
```

---

## Running Tests

Tests run against a real PostgreSQL database. Make sure the database is running and `DATABASE_URL` is set.

```bash
# Run all tests (single-threaded, required for DB isolation)
npm test

# Watch mode
npm run test:watch
```

**Current test coverage:**

| Suite | Tests |
|---|---|
| App (health) | 1 |
| Auth module | 6 |
| AI provider system | 8 |
| Storage adapters | 5 |
| Verification module | 5 |
| Reports + Admin modules | 8 |
| GraphQL API | 8 |
| **Total** | **41** |

Tests use a separate `.env.test` file if present, falling back to `.env`. They create and clean up their own data — no fixtures needed.

---

## REST API Reference

Base URL: `http://localhost:3000/api/v1`

> Every endpoint is prefixed with `/api/v1`. For example, login is `POST http://localhost:3000/api/v1/auth/login` — not `/auth/login`.

All authenticated endpoints require:
```
Authorization: Bearer <jwt_token>
```

---

### Authentication

#### Register

```
POST /auth/register
```

```json
{
  "email": "user@example.com",
  "password": "securepassword"
}
```

**Response `201`:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "role": "USER"
  }
}
```

---

#### Login

```
POST /auth/login
```

```json
{
  "email": "user@example.com",
  "password": "securepassword"
}
```

**Response `200`:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "role": "USER"
  }
}
```

> Rate limited: 10 requests per 15 minutes per IP.

---

#### Google OAuth

```
GET /auth/google
```

Redirects to Google consent screen. On success, redirects to:
```
<CLIENT_URL>/#token=<jwt_token>
```

Token is passed in the URL fragment (never in query params) to prevent server-side logging.

---

#### Logout

```
POST /auth/logout
```
`Authorization: Bearer <token>` required.

---

### Verifications

#### Create Verification

```
POST /verifications
Authorization: Bearer <token>
```

```json
{
  "parcelNumber": "LAG/IKJ/001/2024",
  "location": "15 Marina Street, Lagos Island, Lagos",
  "ownerName": "Adebayo Okonkwo"
}
```

**Response `201`:**
```json
{
  "success": true,
  "verification": {
    "id": "uuid",
    "parcelNumber": "LAG/IKJ/001/2024",
    "location": "15 Marina Street, Lagos Island, Lagos",
    "ownerName": "Adebayo Okonkwo",
    "status": "PENDING",
    "trustScore": null,
    "createdAt": "2024-01-15T10:00:00.000Z",
    "updatedAt": "2024-01-15T10:00:00.000Z"
  }
}
```

---

#### List Verifications

```
GET /verifications
Authorization: Bearer <token>
```

Returns all verifications belonging to the authenticated user. Admins receive all verifications.

---

#### Get Verification

```
GET /verifications/:id
Authorization: Bearer <token>
```

Returns the verification with its documents, payment, and score history. Returns `404` if the ID doesn't belong to the calling user.

---

#### Update Verification

```
PATCH /verifications/:id
Authorization: Bearer <token>
```

```json
{
  "parcelNumber": "LAG/IKJ/001/2025",
  "location": "Updated address",
  "ownerName": "Updated name"
}
```

Only `parcelNumber`, `location`, and `ownerName` are accepted. All other fields are ignored.

---

### Documents

#### Upload Document

```
POST /documents/upload
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

| Field | Type | Required | Description |
|---|---|---|---|
| `file` | File | Yes | PDF, JPEG, or PNG. Max 10 MB. |
| `verificationId` | string | Yes | ID of the parent verification |
| `type` | string | Yes | `C_OF_O`, `DEED`, `SURVEY_PLAN`, or `POWER_OF_ATTORNEY` |

**Response `201`:**
```json
{
  "success": true,
  "document": {
    "id": "uuid",
    "verificationId": "uuid",
    "type": "C_OF_O",
    "filePath": "/uploads/uuid-filename.pdf",
    "analysisResult": {
      "authenticityScore": 87,
      "signals": { "stampPresent": true, "signaturePresent": true },
      "summary": "Document appears authentic..."
    },
    "authenticityScore": 87,
    "uploadedAt": "2024-01-15T10:00:00.000Z"
  }
}
```

AI analysis runs synchronously on upload. The verification's trust score is recomputed after each document is added.

---

#### Get Document

```
GET /documents/:id
Authorization: Bearer <token>
```

---

#### Delete Document

```
DELETE /documents/:id
Authorization: Bearer <token>
```

Deletes the database record and the stored file. Ownership is verified — you cannot delete another user's documents.

---

### Payments

#### Initiate Payment

```
POST /payments/initiate
Authorization: Bearer <token>
```

```json
{
  "verificationId": "uuid",
  "amount": 50000,
  "customerEmail": "user@example.com",
  "callbackUrl": "https://yourfrontend.com/payment/callback"
}
```

The response depends on the verification's trust status:

**`VERIFIED` — direct charge:**
```json
{
  "status": "PENDING",
  "checkoutUrl": "https://checkout.squadco.com/...",
  "payment": { "id": "uuid", "status": "PENDING", ... }
}
```

**`CAUTION` — escrow hold:**
```json
{
  "status": "HELD",
  "virtualAccount": {
    "virtualAccountNumber": "0123456789",
    "bankName": "GTBank",
    "reference": "SQ-REF-001"
  },
  "payment": { "id": "uuid", "status": "HELD", ... }
}
```

**`HIGH_RISK` — blocked:**
```json
{
  "status": "BLOCKED",
  "message": "Payment blocked due to high fraud risk",
  "payment": { "id": "uuid", "status": "BLOCKED", ... }
}
```

---

#### Get Payment Status

```
GET /payments/:verificationId
Authorization: Bearer <token>
```

---

#### Squad Webhook

```
POST /payments/webhook
```

Receives Squad payment events. Signature is verified against `X-Squad-Encrypted-Body` header using HMAC-SHA512. On `charge.success`, escrowed payments for verified properties are released atomically.

> This endpoint receives a raw body — do not send JSON-encoded requests to it manually.

---

### Reports

#### Create Scam Report

```
POST /reports
```

Anonymous submission is allowed — no authentication required.

```json
{
  "parcelNumber": "LAG/IKJ/999/2024",
  "description": "This property has a duplicated title deed. Seller is showing forged documents.",
  "evidenceUrls": [
    "https://example.com/evidence1.jpg",
    "https://example.com/evidence2.pdf"
  ]
}
```

**Response `201`:**
```json
{
  "success": true,
  "report": {
    "id": "uuid",
    "parcelNumber": "LAG/IKJ/999/2024",
    "description": "This property has a duplicated title deed...",
    "evidenceUrls": ["https://example.com/evidence1.jpg"],
    "createdAt": "2024-01-15T10:00:00.000Z"
  }
}
```

---

#### List All Reports

```
GET /reports
Authorization: Bearer <token>    (ADMIN role required)
```

---

### Admin

#### Get Config

```
GET /admin/config
Authorization: Bearer <token>    (ADMIN role required)
```

**Response:**
```json
{
  "success": true,
  "config": [
    { "key": "claude_api_key", "value": "sk-ant-...a1b2" },
    { "key": "gemini_api_key", "value": "AIzaS...[REDACTED]" },
    { "key": "squad_api_key",  "value": "sk-squ...[REDACTED]" }
  ]
}
```

API keys are masked in responses. Short values (≤10 chars) return `[REDACTED]`.

---

#### Update Config

```
PATCH /admin/config
Authorization: Bearer <token>    (ADMIN role required)
```

```json
{
  "updates": [
    { "key": "claude_api_key", "value": "sk-ant-api03-..." },
    { "key": "gemini_api_key", "value": "AIzaSy..." }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "updated": 2
}
```

Keys are upserted — existing rows are updated, new rows are created. All keys are strings.

---

## GraphQL API Reference

Endpoint: `http://localhost:3000/graphql`

Subscriptions: `ws://localhost:3000/graphql`

Authentication uses the same JWT tokens as the REST API, passed as an HTTP header:
```
Authorization: Bearer <token>
```

For WebSocket subscriptions, pass the token in `connectionParams`:
```json
{ "authorization": "Bearer <token>" }
```

---

### Schema

```graphql
scalar JSON

type Verification {
  id: ID!
  parcelNumber: String!
  location: String!
  ownerName: String!
  status: String!       # PENDING | VERIFIED | CAUTION | HIGH_RISK
  trustScore: Int
  createdAt: String!
  updatedAt: String!
}

type Document {
  id: ID!
  verificationId: ID!
  filename: String!
  mimeType: String!
  storagePath: String!
  aiAnalysis: JSON
  createdAt: String!
}

type Payment {
  id: ID!
  verificationId: ID!
  amount: Float!
  status: String!       # PENDING | HELD | RELEASED | BLOCKED
  squadReference: String
  createdAt: String!
}

type Report {
  id: ID!
  parcelNumber: String!
  description: String!
  evidenceUrls: [String!]!
  createdAt: String!
}

type Query {
  verification(id: ID!): Verification
  verifications: [Verification!]!
  reports: [Report!]!
}

type Mutation {
  createReport(
    parcelNumber: String!
    description: String!
    evidenceUrls: [String!]
  ): Report!
}

type Subscription {
  verificationUpdated(id: ID!): Verification!
}
```

---

### Queries

#### Get Single Verification

```graphql
query GetVerification($id: ID!) {
  verification(id: $id) {
    id
    parcelNumber
    status
    trustScore
    updatedAt
  }
}
```

Returns `Not authorized` if the verification belongs to another user (admins can query all).

---

#### List Verifications

```graphql
query {
  verifications {
    id
    parcelNumber
    location
    status
    trustScore
    createdAt
  }
}
```

Returns the calling user's verifications. Admins receive all verifications.

---

#### List Reports (admin only)

```graphql
query {
  reports {
    id
    parcelNumber
    description
    evidenceUrls
    createdAt
  }
}
```

---

### Mutations

#### Create Scam Report

```graphql
mutation ReportScam($parcelNumber: String!, $description: String!, $evidenceUrls: [String!]) {
  createReport(
    parcelNumber: $parcelNumber
    description: $description
    evidenceUrls: $evidenceUrls
  ) {
    id
    createdAt
  }
}
```

Anonymous — no authentication required.

---

### Subscriptions

#### Watch Verification Updates

```graphql
subscription WatchVerification($id: ID!) {
  verificationUpdated(id: $id) {
    id
    status
    trustScore
    updatedAt
  }
}
```

Fires whenever the verification with the given `id` is updated (e.g. after a document upload triggers a re-score). Authentication required.

**Example using `graphql-ws` client:**

```typescript
import { createClient } from 'graphql-ws';

const client = createClient({
  url: 'ws://localhost:3000/graphql',
  connectionParams: {
    authorization: `Bearer ${token}`,
  },
});

const unsubscribe = client.subscribe(
  {
    query: `subscription { verificationUpdated(id: "${verificationId}") { status trustScore } }`,
  },
  {
    next: (data) => console.log('Update:', data),
    error: (err) => console.error(err),
    complete: () => console.log('Done'),
  },
);
```

---

## Payment Flow

```
User uploads documents
        │
        ▼
AI analyses documents → trust score computed
        │
        ▼
User calls POST /payments/initiate
        │
   ┌────┴────────────────────────────┐
   │                                 │
VERIFIED                         CAUTION
(score ≥ 75)                  (score 40–74)
   │                                 │
   ▼                                 ▼
Squad direct charge          Virtual account created
Checkout URL returned        Funds held in escrow
   │                                 │
   │                          Document verified
   │                          by admin / re-score
   │                                 │
   │                                 ▼
   │                       Webhook: charge.success
   │                                 │
   └──────────────────────┬──────────┘
                          │
                          ▼
                   Payment RELEASED
                   (atomic — prevents double-release)


HIGH_RISK (score < 40)
   │
   ▼
Payment BLOCKED — no Squad interaction
```

Escrow release is atomic: `updateMany({ where: { id, status: 'HELD' } })` — if the payment is already released (duplicate webhook), `count` is `0` and Squad's release call is skipped.

---

## AI Provider System

LandVerify supports two AI providers. The active provider and its API key are read from the `AdminConfig` database table at runtime — no server restart required.

| Config Key | Description |
|---|---|
| `claude_api_key` | Anthropic Claude API key |
| `gemini_api_key` | Google Gemini API key |
| `ai_provider` | `claude` or `gemini` (controls which is used) |

**Document types and AI handling:**

| File Type | Claude | Gemini |
|---|---|---|
| PDF | Native `document` block | Base64 inline data |
| JPEG / PNG | Base64 image block | Base64 inline data |

Each document is analysed for:
- Authenticity score (0–100)
- Presence of official stamps and signatures
- Document-type-specific signals (e.g. survey coordinates for Survey Plans)
- Summary and risk flags

The verification's overall trust score is recomputed as a weighted average of all document authenticity scores. Score history is preserved in `TrustScoreEvent`.

---

## Storage Adapters

File storage is pluggable. The active adapter is selected at startup:

| Adapter | Environment | Config |
|---|---|---|
| **Local disk** | Development | Files written to `./uploads/` |
| **Cloudflare R2** | Production option | Set `STORAGE_ADAPTER=r2` + R2 credentials |
| **Supabase Storage** | Production option | Set `STORAGE_ADAPTER=supabase` + Supabase credentials |

Uploaded files are served statically at `/uploads/<filename>` when using the local adapter.

All adapters implement the same interface:
```typescript
interface StorageAdapter {
  save(filename: string, buffer: Buffer, mimeType: string): Promise<string>;
  delete(filename: string): Promise<void>;
}
```

---

## Admin Configuration

The `AdminConfig` table is a key-value store for runtime configuration. Keys are set via the [Admin Config API](#admin-configuration).

**Reserved keys:**

| Key | Description |
|---|---|
| `claude_api_key` | Claude (Anthropic) API key |
| `gemini_api_key` | Gemini (Google) API key |
| `squad_api_key` | Squad payment API key |
| `ai_provider` | Active AI provider: `claude` or `gemini` |

Masked keys (`claude_api_key`, `gemini_api_key`, `squad_api_key`) are redacted in GET responses — only the first 6 and last 4 characters are shown.

---

## Project Structure

```
src/
├── server.ts                   # HTTP + WebSocket server entry point
├── app.ts                      # Express app — middleware and route mounting
│
├── ai/
│   ├── index.ts                # Active provider selector (reads AdminConfig)
│   ├── types.ts                # Shared AI types
│   ├── utils.ts                # scoreToStatus, computeTrustScore, JSON parsing
│   └── providers/
│       ├── claude.ts           # Anthropic Claude provider
│       └── gemini.ts           # Google Gemini provider
│
├── graphql/
│   ├── index.ts                # setupGraphQL — Apollo Server + graphql-ws wiring
│   ├── schema.ts               # GraphQL SDL (type definitions)
│   ├── resolvers.ts            # Query / Mutation / Subscription resolvers
│   ├── context.ts              # JWT context factory (HTTP + WebSocket)
│   └── pubsub.ts               # PubSub instance + publishVerificationUpdate
│
├── lib/
│   ├── prisma.ts               # Singleton Prisma client
│   ├── passport.ts             # Local, JWT, Google OAuth2 strategies
│   └── rate-limiters.ts        # express-rate-limit instances
│
├── middleware/
│   ├── auth.middleware.ts      # requireAuth — Passport JWT guard
│   ├── admin.middleware.ts     # requireAdmin — role check
│   └── error.middleware.ts     # Global error handler + createError helper
│
├── modules/
│   ├── auth/                   # Register, login, Google OAuth, logout
│   ├── verification/           # CRUD for land verifications + score triggers
│   ├── documents/              # File upload, AI analysis, delete
│   ├── payments/               # Squad initiate, status, webhook handler
│   ├── reports/                # Scam report creation + admin listing
│   └── admin/                  # AdminConfig read + update
│
├── payments/
│   └── squad.ts                # Squad API client (charge, virtual account, escrow)
│
└── storage/
    ├── index.ts                # Adapter selector
    ├── types.ts                # StorageAdapter interface
    └── adapters/
        ├── local.ts            # Local disk (dev default)
        ├── cloudflare.ts       # Cloudflare R2 stub
        └── supabase.ts         # Supabase Storage stub

prisma/
├── schema.prisma               # Database schema + enums
└── seed.ts                     # Seeds default AdminConfig rows
```

---

## Scripts Reference

| Script | Command | Description |
|---|---|---|
| Dev server | `npm run dev` | Start with hot reload via `tsx watch` |
| Build | `npm run build` | Compile TypeScript to `dist/` |
| Production | `npm start` | Run compiled server from `dist/` |
| Tests | `npm test` | Run all 41 tests against real PostgreSQL |
| Test watch | `npm run test:watch` | Re-run tests on file change |
| DB migrate | `npm run db:migrate` | Apply pending Prisma migrations |
| DB generate | `npm run db:generate` | Regenerate Prisma client after schema changes |
| DB seed | `npx prisma db seed` | Seed default config rows |
| DB studio | `npm run db:studio` | Open Prisma Studio at `http://localhost:5555` |

---

## Error Responses

All error responses follow this shape:

```json
{
  "success": false,
  "message": "Human-readable error description"
}
```

| Status | Meaning |
|---|---|
| `400` | Bad request — missing or invalid fields |
| `401` | Unauthenticated — missing or invalid JWT |
| `403` | Forbidden — authenticated but insufficient role |
| `404` | Resource not found (or belongs to another user) |
| `429` | Rate limit exceeded |
| `500` | Internal server error |

# LandVerify Backend — Design Spec
**Date:** 2026-05-12
**Scope:** Express + TypeScript backend server (MVP / Hackathon build)

---

## 1. Technology Stack

| Concern | Choice |
|---|---|
| Runtime | Node.js + TypeScript |
| HTTP Framework | Express |
| ORM | Prisma |
| Database | PostgreSQL |
| Authentication | Passport.js (Local + Google OAuth2) + JWT |
| Password Hashing | Argon2 (`argon2` package) |
| API Surfaces | REST (`/api/v1`) + GraphQL (`/graphql`) |
| GraphQL Server | Apollo Server (Express middleware) |
| Real-time | `graphql-ws` WebSocket subscriptions |
| AI Providers | Claude (`@anthropic-ai/sdk`) + Gemini (`@google/generative-ai`) |
| Payments | Squad API (`squadco.com`) |
| File Storage | Local disk (default), Cloudflare R2 adapter, Supabase Storage adapter |
| File Upload | Multer |
| Security | Helmet, CORS, express-rate-limit, JWT middleware |

---

## 2. Architecture

**Option B — Feature-Based Modules** is used throughout. Each domain is a self-contained folder. Shared infrastructure lives in dedicated top-level folders.

### Directory Structure

```
src/
  modules/
    auth/
      auth.routes.ts
      auth.controller.ts
      auth.service.ts
    verification/
      verification.routes.ts
      verification.controller.ts
      verification.service.ts
    documents/
      documents.routes.ts
      documents.controller.ts
      documents.service.ts
    payments/
      payments.routes.ts
      payments.controller.ts
      payments.service.ts
    reports/
      reports.routes.ts
      reports.controller.ts
      reports.service.ts
    admin/
      admin.routes.ts
      admin.controller.ts
      admin.service.ts
  graphql/
    schema/
      verification.typedefs.ts
      dashboard.typedefs.ts
    resolvers/
      verification.resolvers.ts
      dashboard.resolvers.ts
    subscriptions/
      trustScore.subscription.ts
  ai/
    providers/
      claude.ts
      gemini.ts
    index.ts          # Provider factory
    types.ts          # AIProvider interface + result types
  storage/
    adapters/
      local.ts
      cloudflare.ts   # Stubbed — ready to implement
      supabase.ts     # Stubbed — ready to implement
    index.ts          # Adapter factory
    types.ts          # StorageAdapter interface
  payments/
    squad.ts          # Squad API client wrapper
  lib/
    prisma.ts         # Prisma client singleton
    passport.ts       # Local + Google OAuth2 + JWT strategies
    pubsub.ts         # GraphQL PubSub instance
  middleware/
    auth.middleware.ts     # requireAuth (JWT)
    admin.middleware.ts    # requireAdmin (role check)
    error.middleware.ts    # Global error handler
  app.ts              # Express app setup, routes, Apollo middleware
  server.ts           # HTTP + WebSocket server entry point
prisma/
  schema.prisma
.env                  # Not committed
.env.example          # Committed with placeholders
```

---

## 3. Data Models

### User
```
id            String   @id @default(uuid())
email         String   @unique
passwordHash  String?  // nullable for OAuth-only users
googleId      String?  @unique
role          Role     @default(USER)  // USER | ADMIN
createdAt     DateTime @default(now())
updatedAt     DateTime @updatedAt
```

### LandVerification
```
id            String             @id @default(uuid())
userId        String
parcelNumber  String
location      String
ownerName     String
status        VerificationStatus @default(PENDING)  // PENDING | VERIFIED | CAUTION | HIGH_RISK
trustScore    Int?               // 0–100
createdAt     DateTime           @default(now())
updatedAt     DateTime           @updatedAt
```

### Document
```
id                String       @id @default(uuid())
verificationId    String
type              DocumentType // C_OF_O | DEED | SURVEY_PLAN | POWER_OF_ATTORNEY
filePath          String
analysisResult    Json?        // AI analysis output
authenticityScore Int?         // 0–100
uploadedAt        DateTime     @default(now())
```

### TrustScoreEvent
```
id              String   @id @default(uuid())
verificationId  String
previousScore   Int?
newScore        Int
reason          String
triggeredBy     String   // "AI" | "ADMIN" | "WEBHOOK"
createdAt       DateTime @default(now())
```

### Payment
```
id                      String        @id @default(uuid())
verificationId          String        @unique
userId                  String
amount                  Float
currency                String        @default("NGN")
status                  PaymentStatus // PENDING | HELD | RELEASED | BLOCKED
squadReference          String?
squadVirtualAccountId   String?
metadata                Json?
createdAt               DateTime      @default(now())
updatedAt               DateTime      @updatedAt
```

### ScamReport
```
id            String   @id @default(uuid())
userId        String?  // nullable — anonymous reports allowed
parcelNumber  String
description   String
evidenceUrls  Json     @default("[]")
createdAt     DateTime @default(now())
```

### AdminConfig
```
id    String @id @default(uuid())
key   String @unique
value String
```

Stores runtime config keys:
- `active_ai_provider` — `"claude"` or `"gemini"`
- `claude_api_key` — Claude API key
- `gemini_api_key` — Gemini API key
- `squad_api_key` — Squad API key
- `active_storage_adapter` — `"local"`, `"cloudflare"`, or `"supabase"`

---

## 4. Authentication

### Local (Email/Password)
- `POST /api/v1/auth/register` — hash password with **Argon2**, store user, return JWT
- `POST /api/v1/auth/login` — verify password with Argon2 `verify()`, return JWT
- Passport Local strategy calls `argon2.verify(storedHash, plainPassword)`

### Google OAuth2
- `GET /api/v1/auth/google` — redirect to Google consent screen
- `GET /api/v1/auth/google/callback` — OAuth callback; find or create user (set `googleId`, no `passwordHash`); issue JWT; redirect to client with token in query param
- Passport Google strategy: `passport-google-oauth20`

### JWT
- All protected routes use `requireAuth` middleware (Passport JWT strategy, Bearer token)
- Token payload: `{ sub: userId, role, iat, exp }`
- Expiry: 7 days (configurable via `JWT_EXPIRES_IN` env var)

### Password Hashing
- Library: `argon2` (Argon2id variant)
- Register: `argon2.hash(plainPassword)` → store hash
- Login: `argon2.verify(storedHash, plainPassword)` → boolean
- Passport does **not** hash passwords automatically; all hashing is explicit in `auth.service.ts`

---

## 5. REST API Endpoints

All REST routes prefixed `/api/v1`.

### Auth
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/auth/register` | Public | Email/password signup, returns JWT |
| POST | `/auth/login` | Public | Returns JWT |
| GET | `/auth/google` | Public | Initiate Google OAuth |
| GET | `/auth/google/callback` | Public | OAuth callback, issues JWT |
| POST | `/auth/logout` | JWT | Invalidate session (client discards token) |

### Land Verifications
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/verifications` | JWT | Create new verification request |
| GET | `/verifications` | JWT | List caller's verifications |
| GET | `/verifications/:id` | JWT | Get single verification with documents |
| PATCH | `/verifications/:id` | JWT | Update verification details |

### Documents
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/documents/upload` | JWT | Multipart upload; triggers AI analysis; updates trust score |
| GET | `/documents/:id` | JWT | Get document + analysis result |
| DELETE | `/documents/:id` | JWT | Delete document and file |

### Payments
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/payments/initiate` | JWT | Create Squad payment based on trust score |
| POST | `/payments/webhook` | Public* | Squad webhook receiver |
| GET | `/payments/:verificationId` | JWT | Get payment status |

*Webhook is public but validated via Squad signature header.

### Scam Reports
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/reports` | Optional JWT | Submit scam report (anonymous allowed) |
| GET | `/reports` | Admin | List all reports |

### Admin
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/admin/config` | Admin | Get current AI provider, storage adapter, keys (masked) |
| PATCH | `/admin/config` | Admin | Update active provider/adapter, set API keys |

---

## 6. GraphQL API

Mounted at `/graphql`. Apollo Server as Express middleware.
Real-time subscriptions via `graphql-ws` over WebSocket.

### Queries
```graphql
verification(id: ID!): Verification
verifications: [Verification!]!
trustScore(verificationId: ID!): TrustScoreResult
dashboard: DashboardStats   # USER role: returns caller's own stats only; ADMIN role: returns global stats
```

### Mutations
```graphql
runTrustAnalysis(verificationId: ID!): TrustScoreResult
updateTrustScore(verificationId: ID!, score: Int!, reason: String!): TrustScoreResult  # Admin only — enforced in resolver via JWT context role check
```

### Subscriptions
```graphql
trustScoreUpdated(verificationId: ID!): TrustScoreEvent
```
Published via PubSub whenever `runTrustAnalysis` completes or admin overrides a score. Clients subscribed to a specific `verificationId` receive the updated score in real time.

### Key Types
```graphql
type Verification {
  id: ID!
  parcelNumber: String!
  location: String!
  ownerName: String!
  status: VerificationStatus!
  trustScore: Int
  documents: [Document!]!
  payment: Payment
  scoreHistory: [TrustScoreEvent!]!
}

type TrustScoreResult {
  verificationId: ID!
  score: Int!
  status: VerificationStatus!
  reason: String!
  triggeredBy: String!
}

type DashboardStats {
  totalVerifications: Int!
  verified: Int!
  caution: Int!
  highRisk: Int!
  pending: Int!
  totalEscrowed: Float!
  recentVerifications: [Verification!]!
}
```

---

## 7. AI Provider System

### Interface (`src/ai/types.ts`)
```typescript
interface AIProvider {
  analyzeDocument(filePath: string, documentType: string): Promise<DocumentAnalysisResult>
  computeTrustScore(verificationId: string, signals: TrustSignals): Promise<TrustScoreResult>
}

interface DocumentAnalysisResult {
  authenticityScore: number   // 0–100
  findings: string[]
  isSuspicious: boolean
  rawResponse: string
}

interface TrustSignals {
  documents: DocumentAnalysisResult[]
  parcelNumber: string
  ownerName: string
  location: string
}
```

### Providers
- `src/ai/providers/claude.ts` — uses `@anthropic-ai/sdk`; sends document as base64 content + structured prompt; implements `AIProvider`
- `src/ai/providers/gemini.ts` — uses `@google/generative-ai`; same interface

### Factory (`src/ai/index.ts`)
Reads `active_ai_provider` and matching API key from `AdminConfig` table at call time (not at startup), so switching providers takes effect immediately after admin config change. No server restart needed.

---

## 8. Storage Adapter System

### Interface (`src/storage/types.ts`)
```typescript
interface StorageAdapter {
  save(file: Express.Multer.File): Promise<string>  // returns stored path/URL
  delete(path: string): Promise<void>
  getUrl(path: string): string
}
```

### Adapters
- `src/storage/adapters/local.ts` — saves to `uploads/` directory; served via Express static middleware at `/uploads`
- `src/storage/adapters/cloudflare.ts` — Cloudflare R2 via AWS S3-compatible SDK; **stubbed with TODO comments**
- `src/storage/adapters/supabase.ts` — Supabase Storage SDK; **stubbed with TODO comments**

### Factory (`src/storage/index.ts`)
Reads `active_storage_adapter` from `AdminConfig` at call time.

---

## 9. Squad Payment Flow

API key stored in `AdminConfig` with key `squad_api_key`. Default value: `PLACEHOLDER`.

```
Trust Score → VERIFIED   → POST /payments/initiate → Squad standard charge link
Trust Score → CAUTION    → Squad creates virtual account → funds held in escrow
Trust Score → HIGH_RISK  → payment blocked, no Squad API call made
```

### Squad Client (`src/payments/squad.ts`)
Wraps these Squad API calls:
- `createVirtualAccount(verificationId, amount)` — escrow account for CAUTION results
- `initiateCharge(verificationId, amount, metadata)` — direct charge for VERIFIED
- `releaseEscrow(virtualAccountId)` — called when webhook confirms verification cleared
- `verifyWebhookSignature(payload, signature)` — validates Squad webhook authenticity

### Webhook Flow
1. Squad sends `POST /api/v1/payments/webhook`
2. Server verifies signature
3. If `charge.success` event + associated verification is now `VERIFIED` → call `releaseEscrow()`
4. Update `Payment.status` to `RELEASED`
5. Publish `trustScoreUpdated` subscription event

---

## 10. Security

| Concern | Implementation |
|---|---|
| HTTP headers | Helmet |
| CORS | `cors` package, environment-based origin whitelist |
| Rate limiting | `express-rate-limit` on `/auth/*` routes (15 req/15min) |
| Auth | Passport JWT on all protected routes |
| Role guard | `requireAdmin` middleware on REST admin routes; resolver-level role check from JWT context for admin GraphQL mutations |
| File upload | Multer: PDF/JPEG/PNG only, 10MB max size |
| Webhook auth | Squad signature header verification before processing |
| Password hashing | Argon2id via `argon2` package |
| Error responses | Consistent shape: `{ success: boolean, message: string, error?: string }` |
| Secrets | All in `.env`; `.env.example` committed with placeholders |

---

## 11. Environment Variables (`.env.example`)

```env
# Server
PORT=3000
NODE_ENV=development
CLIENT_URL=http://localhost:5173

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/landverify

# JWT
JWT_SECRET=PLACEHOLDER
JWT_EXPIRES_IN=7d

# Google OAuth
GOOGLE_CLIENT_ID=PLACEHOLDER
GOOGLE_CLIENT_SECRET=PLACEHOLDER
GOOGLE_CALLBACK_URL=http://localhost:3000/api/v1/auth/google/callback

# Squad
SQUAD_API_KEY=PLACEHOLDER
SQUAD_BASE_URL=https://sandbox-api-d.squadco.com

# AI (fallback env vars — primary keys stored in AdminConfig DB table)
CLAUDE_API_KEY=PLACEHOLDER
GEMINI_API_KEY=PLACEHOLDER
```

---

## 12. Key Dependencies

```json
{
  "dependencies": {
    "express": "^4",
    "prisma": "^5",
    "@prisma/client": "^5",
    "passport": "^0.7",
    "passport-local": "^1",
    "passport-jwt": "^4",
    "passport-google-oauth20": "^2",
    "argon2": "^0.31",
    "jsonwebtoken": "^9",
    "@apollo/server": "^4",
    "graphql": "^16",
    "graphql-ws": "^5",
    "ws": "^8",
    "@anthropic-ai/sdk": "^0.24",
    "@google/generative-ai": "^0.15",
    "multer": "^1",
    "helmet": "^7",
    "cors": "^2",
    "express-rate-limit": "^7",
    "dotenv": "^16",
    "axios": "^1"
  },
  "devDependencies": {
    "typescript": "^5",
    "@types/express": "^4",
    "@types/passport": "^1",
    "@types/passport-local": "^1",
    "@types/passport-jwt": "^4",
    "@types/passport-google-oauth20": "^2",
    "@types/jsonwebtoken": "^9",
    "@types/multer": "^1",
    "@types/cors": "^2",
    "@types/ws": "^8",
    "ts-node-dev": "^2",
    "tsx": "^4"
  }
}
```

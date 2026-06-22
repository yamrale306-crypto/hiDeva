# hiDeva — AI Call Assistant for India

hiDeva is an AI-powered call screening and management assistant designed for the Indian market. It answers missed calls, screens unknown callers, blocks spam, summarises conversations, and learns your preferences over time — with first-class support for 7 Indian languages.

---

## Features

- **AI Call Screening** — Deva AI answers and screens calls on your behalf
- **Spam Detection & Blocking** — Auto-blocks promotional and scam calls
- **Call Summaries** — AI-generated transcripts, summaries and action items
- **Smart Rules Engine** — Custom if/then rules (e.g. "Family → always ring")
- **Priority Contacts** — High / Medium / Low priority tiers
- **Indian Language Support** — English, Hindi, Marathi, Gujarati, Kannada, Tamil, Telugu
- **Business Mode** — Appointment booking, FAQ answering, lead capture, order taking
- **Missed Call Handling** — Notes and follow-up actions for every missed call

---

## Project Structure

```
hideva/
├── artifacts/
│   ├── mobile/          # Expo (React Native) mobile app
│   └── api-server/      # Express 5 REST API server
├── lib/
│   ├── db/              # Drizzle ORM + PostgreSQL schema
│   ├── api-spec/        # OpenAPI 3 specification
│   ├── api-zod/         # Auto-generated Zod validation schemas
│   └── api-client-react/# Auto-generated React Query hooks
├── scripts/             # Shared utility scripts
├── docs/                # Project documentation
├── pnpm-workspace.yaml  # pnpm workspace config
├── tsconfig.json        # Root TypeScript solution config
└── .env.example         # Environment variable template
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Mobile | Expo 54 · React Native 0.81 · Expo Router 6 |
| Backend | Node.js 24 · Express 5 · TypeScript 5.9 |
| Database | PostgreSQL · Drizzle ORM · drizzle-zod |
| Validation | Zod v4 |
| API Contract | OpenAPI 3 · Orval (codegen) |
| State | React Query v5 · AsyncStorage |
| Build | esbuild · Metro |
| Package Manager | pnpm 10 (workspaces) |

---

## Prerequisites

- **Node.js** ≥ 20 (v24 recommended)
- **pnpm** ≥ 10 — install with `npm install -g pnpm`
- **PostgreSQL** ≥ 14 — local or hosted (e.g. Neon, Supabase, Railway)
- **Expo CLI** — install with `pnpm add -g expo-cli`
- **Expo Go** app on your phone (for mobile testing)

---

## Environment Variables

Create a `.env` file in the project root (copy from `.env.example`):

```env
# Required — PostgreSQL connection string
DATABASE_URL=postgresql://user:password@localhost:5432/hideva

# Optional — API server port (default: 8080)
PORT=8080

# Optional — log level: trace | debug | info | warn | error
LOG_LEVEL=info

# Optional — set to production for prod builds
NODE_ENV=development
```

See `.env.example` for the full list.

---

## Installation

```bash
# 1. Clone the repository
git clone https://github.com/your-org/hideva.git
cd hideva

# 2. Install dependencies
pnpm install

# 3. Copy and fill in environment variables
cp .env.example .env
# Edit .env with your DATABASE_URL and connector keys
```

## Running Locally

### Web frontend

```bash
pnpm run web:dev
```

### Mobile shell

```bash
cd apps/mobile
pnpm install
pnpm run dev
```

### Docker

```bash
pnpm run docker:up
```

## Build

```bash
pnpm run typecheck
pnpm run web:build
```


# 4. Push the database schema
pnpm --filter @workspace/db run push
```

---

## Running Locally

### API Server

```bash
pnpm --filter @workspace/api-server run dev
# Server starts on http://localhost:8080
# Health check: http://localhost:8080/api/healthz
```

### Mobile App

```bash
pnpm --filter @workspace/mobile run dev:local
# Opens Expo DevTools — scan QR with Expo Go on your phone
# Or press 'w' for web preview, 'a' for Android emulator
```

### Both together

```bash
# Terminal 1
pnpm --filter @workspace/api-server run dev

# Terminal 2
pnpm --filter @workspace/mobile run dev:local
```

---

## Build

```bash
# Typecheck all packages
pnpm run typecheck

# Build the API server (outputs to artifacts/api-server/dist/)
pnpm --filter @workspace/api-server run build

# Build the mobile app for web (outputs to artifacts/mobile/dist/)
pnpm --filter @workspace/mobile run build

# Regenerate API hooks + Zod schemas from OpenAPI spec
pnpm --filter @workspace/api-spec run codegen
```

---

## Deployment

### API Server

The API server is a standard Node.js/Express app and can be deployed to:

- **Railway / Render / Fly.io** — connect repo, set `DATABASE_URL`, deploy
- **AWS EC2 / DigitalOcean** — `pnpm build && node dist/index.mjs`
- **Docker** — see `docs/MIGRATION_GUIDE.md` for a sample Dockerfile

### Mobile App

```bash
# Build for iOS / Android via EAS Build
npx eas build --platform all

# Build for web
pnpm --filter @workspace/mobile run build
# Deploy dist/ to Vercel, Netlify, or any static host
```

---

## Documentation

| File | Description |
|---|---|
| `docs/API_DOCUMENTATION.md` | All API endpoints, request/response formats |
| `docs/DATABASE_SCHEMA.md` | Database tables, fields, and relationships |
| `docs/PROJECT_STRUCTURE.md` | Full folder and file tree |
| `docs/MIGRATION_GUIDE.md` | Step-by-step migration to any environment |

---

## License

MIT

# hiDeva — Project Structure

## Repository Layout

```
hideva/
│
├── README.md                        # Project overview & quick start
├── .env.example                     # Environment variables template
├── .gitignore
├── package.json                     # Root workspace scripts & dev tooling
├── pnpm-workspace.yaml              # pnpm workspace config, catalog pins, overrides
├── pnpm-lock.yaml                   # Locked dependency versions
├── tsconfig.json                    # Root TypeScript solution config (libs only)
├── tsconfig.base.json               # Shared strict TypeScript defaults
│
├── docs/                            # Project documentation
│   ├── API_DOCUMENTATION.md         # API endpoints, request/response formats
│   ├── DATABASE_SCHEMA.md           # DB tables, fields, relationships
│   ├── PROJECT_STRUCTURE.md         # This file
│   └── MIGRATION_GUIDE.md           # Step-by-step migration guide
│
├── artifacts/                       # Deployable applications
│   │
│   ├── mobile/                      # Expo / React Native mobile app
│   │   ├── app.json                 # Expo app configuration
│   │   ├── package.json             # Mobile app dependencies
│   │   ├── tsconfig.json            # TypeScript config (extends base)
│   │   ├── babel.config.js          # Babel config for Expo
│   │   │
│   │   ├── app/                     # Expo Router file-based routes
│   │   │   ├── _layout.tsx          # Root layout (fonts, providers)
│   │   │   ├── (tabs)/              # Tab navigator group
│   │   │   │   ├── _layout.tsx      # Tab bar config (4 tabs)
│   │   │   │   ├── index.tsx        # Home / Dashboard screen
│   │   │   │   ├── calls.tsx        # Call history screen
│   │   │   │   ├── rules.tsx        # Rules engine screen
│   │   │   │   └── settings.tsx     # Settings screen
│   │   │   └── calls/
│   │   │       └── [id].tsx         # Call detail screen (transcript, summary)
│   │   │
│   │   ├── components/              # Reusable UI components
│   │   │   ├── CallCard.tsx         # Call history list item
│   │   │   ├── RuleCard.tsx         # Rule list item with toggle
│   │   │   ├── StatCard.tsx         # Dashboard stat card
│   │   │   └── ErrorBoundary.tsx    # React error boundary
│   │   │
│   │   ├── context/
│   │   │   └── AppContext.tsx       # Global state (calls, rules, settings)
│   │   │
│   │   ├── constants/
│   │   │   └── colors.ts            # Brand color tokens (light + dark)
│   │   │
│   │   ├── hooks/
│   │   │   └── useColors.ts         # Color scheme hook
│   │   │
│   │   ├── assets/
│   │   │   └── images/
│   │   │       ├── icon.png         # App icon (saffron orange)
│   │   │       └── splash.png       # Splash screen image
│   │   │
│   │   └── scripts/
│   │       └── build.js             # EAS web build script
│   │
│   └── api-server/                  # Express 5 REST API server
│       ├── package.json             # Server dependencies
│       ├── tsconfig.json
│       ├── build.mjs                # esbuild bundler script
│       │
│       └── src/
│           ├── index.ts             # Server entry point (port binding)
│           ├── app.ts               # Express app setup (CORS, logger, routes)
│           │
│           ├── routes/
│           │   ├── index.ts         # Route aggregator
│           │   └── health.ts        # GET /api/healthz
│           │
│           └── lib/
│               └── logger.ts        # Pino logger singleton
│
├── lib/                             # Shared libraries (TypeScript composite)
│   │
│   ├── db/                          # Database layer
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── drizzle.config.ts        # Drizzle Kit config (DATABASE_URL)
│   │   └── src/
│   │       ├── index.ts             # DB client export
│   │       └── schema/
│   │           └── index.ts         # Schema barrel (export all tables here)
│   │
│   ├── api-spec/                    # OpenAPI specification (source of truth)
│   │   ├── package.json
│   │   ├── orval.config.ts          # Orval code generation config
│   │   └── src/
│   │       └── openapi.yaml         # OpenAPI 3.0 spec file
│   │
│   ├── api-zod/                     # Generated Zod schemas (do not edit)
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── src/
│   │       └── *.ts                 # Auto-generated from openapi.yaml
│   │
│   └── api-client-react/            # Generated React Query hooks (do not edit)
│       ├── package.json
│       ├── tsconfig.json
│       └── src/
│           └── *.ts                 # Auto-generated from openapi.yaml
│
└── scripts/                         # Shared utility scripts
    ├── package.json
    └── src/
        └── *.ts                     # Utility scripts
```

---

## Key Files Explained

| File | Purpose |
|---|---|
| `pnpm-workspace.yaml` | Defines workspace packages and version catalog |
| `tsconfig.base.json` | Strict TypeScript defaults all packages can extend |
| `lib/api-spec/src/openapi.yaml` | **Source of truth** for all API contracts |
| `lib/db/src/schema/index.ts` | **Source of truth** for database schema |
| `artifacts/mobile/context/AppContext.tsx` | Global app state — calls, rules, settings |
| `artifacts/mobile/constants/colors.ts` | Brand colour tokens |
| `artifacts/api-server/src/app.ts` | Express app setup and middleware |

---

## Data Flow

```
User action (mobile)
    │
    ▼
React Query hook (@workspace/api-client-react)
    │
    ▼
REST API (artifacts/api-server /api/*)
    │
    ▼
Zod validation (@workspace/api-zod)
    │
    ▼
Business logic + Drizzle ORM (@workspace/db)
    │
    ▼
PostgreSQL database
```

---

## Generated Code (Do Not Edit Manually)

The following files are auto-generated by Orval from `lib/api-spec/src/openapi.yaml`. Edit the spec, then run codegen:

```bash
pnpm --filter @workspace/api-spec run codegen
```

- `lib/api-zod/src/*.ts` — Zod request/response schemas
- `lib/api-client-react/src/*.ts` — React Query hooks

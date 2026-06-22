# hiDeva — Migration Guide

This guide explains exactly how to move the hiDeva project from Replit (or any environment) to a new development environment, CI system, or production platform.

---

## Migration Checklist

- [ ] **1. Export source code** — clone or download the repository
- [ ] **2. Install correct Node.js version** — v24 recommended, v20 minimum
- [ ] **3. Install pnpm** — v10 recommended
- [ ] **4. Fix pnpm-workspace.yaml** — remove linux-only esbuild overrides
- [ ] **5. Fix mobile dev script** — remove Replit-specific env vars
- [ ] **6. Set environment variables** — copy `.env.example` → `.env`
- [ ] **7. Provision PostgreSQL** — local or hosted
- [ ] **8. Install dependencies** — `pnpm install`
- [ ] **9. Push database schema** — `pnpm --filter @workspace/db run push`
- [ ] **10. Run the API server** — verify health endpoint
- [ ] **11. Run the mobile app** — scan QR code with Expo Go
- [ ] **12. Remove Replit configs** — `.replit-artifact/` and related files

---

## Step 1 — Get the Source Code

### Option A: Download ZIP from Replit
1. Open the Replit project
2. Click the three-dot menu → **Download as ZIP**
3. Extract to your machine

### Option B: Clone via Git
```bash
git clone https://github.com/your-org/hideva.git
cd hideva
```

---

## Step 2 — Install Node.js

Use **Node.js 24** (the version used in development).

```bash
# Using nvm (recommended)
nvm install 24
nvm use 24

# Or download from https://nodejs.org
```

Verify:
```bash
node --version   # v24.x.x
```

---

## Step 3 — Install pnpm

```bash
npm install -g pnpm@10
pnpm --version   # 10.x.x
```

---

## Step 4 — Fix pnpm-workspace.yaml (IMPORTANT)

The `pnpm-workspace.yaml` contains esbuild platform overrides that were set to reduce install size on Replit's Linux x64 environment. These **will break** on macOS and Windows.

**Before (Replit-optimised):**
```yaml
overrides:
  "esbuild>@esbuild/darwin-arm64": "-"
  "esbuild>@esbuild/darwin-x64": "-"
  "esbuild>@esbuild/win32-x64": "-"
  # ... many more platform exclusions
```

**After (cross-platform fix):**

Remove all `esbuild>@esbuild/*`, `lightningcss>*`, `rollup>@rollup/*`, and `@expo/ngrok-bin>*` override entries from `pnpm-workspace.yaml`. Keep the `@esbuild-kit/esm-loader` and `esbuild: "0.27.3"` version pin.

Also remove the `minimumReleaseAge` and `minimumReleaseAgeExclude` blocks (these are Replit security policies and are optional elsewhere).

**Minimal portable pnpm-workspace.yaml:**
```yaml
packages:
  - artifacts/*
  - lib/*
  - scripts

catalog:
  '@tanstack/react-query': ^5.90.21
  '@types/node': ^25.3.3
  '@types/react': ^19.2.0
  '@types/react-dom': ^19.2.0
  drizzle-orm: ^0.45.2
  react: 19.1.0
  react-dom: 19.1.0
  tsx: ^4.21.0
  vite: ^7.3.2
  zod: ^3.25.76

autoInstallPeers: false

overrides:
  "@esbuild-kit/esm-loader": "npm:tsx@^4.21.0"
  esbuild: "0.27.3"
```

---

## Step 5 — Fix the Mobile Dev Script

The `artifacts/mobile/package.json` dev script contains Replit-specific environment variables. A local script is already provided as `dev:local`. No changes are needed — just use the right script:

```bash
# On Replit (uses Replit tunnel/proxy):
pnpm --filter @workspace/mobile run dev

# Everywhere else (standard Expo):
pnpm --filter @workspace/mobile run dev:local
```

The `dev:local` script is:
```json
"dev:local": "expo start"
```

For Android emulator:
```bash
pnpm --filter @workspace/mobile run dev:local -- --android
```

For iOS simulator (macOS only):
```bash
pnpm --filter @workspace/mobile run dev:local -- --ios
```

---

## Step 6 — Set Environment Variables

```bash
cp .env.example .env
```

Edit `.env` and fill in:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/hideva
PORT=8080
NODE_ENV=development
SESSION_SECRET=<run: openssl rand -base64 32>
EXPO_PUBLIC_API_URL=http://localhost:8080
```

---

## Step 7 — Provision PostgreSQL

### Local (Recommended for Development)

**macOS:**
```bash
brew install postgresql@16
brew services start postgresql@16
createdb hideva
```

**Windows:**
- Download and install from https://www.postgresql.org/download/windows/
- Use pgAdmin to create a database named `hideva`

**Linux (Ubuntu/Debian):**
```bash
sudo apt install postgresql postgresql-contrib
sudo -u postgres createdb hideva
```

### Hosted (Recommended for Production)

| Provider | Free Tier | Notes |
|---|---|---|
| [Neon](https://neon.tech) | Yes | Serverless PostgreSQL, generous free tier |
| [Supabase](https://supabase.com) | Yes | PostgreSQL + extras |
| [Railway](https://railway.app) | Yes | Simple deploys |
| [PlanetScale](https://planetscale.com) | No (MySQL) | Not compatible |

---

## Step 8 — Install Dependencies

```bash
pnpm install
```

If you get platform-related esbuild errors, you forgot Step 4. Alternatively:

```bash
pnpm install --ignore-scripts
```

---

## Step 9 — Push Database Schema

```bash
pnpm --filter @workspace/db run push
```

This uses Drizzle Kit to push the schema in `lib/db/src/schema/` to your `DATABASE_URL`.

---

## Step 10 — Run the API Server

```bash
pnpm --filter @workspace/api-server run dev
```

Verify it works:
```bash
curl http://localhost:8080/api/healthz
# → {"status":"ok"}
```

---

## Step 11 — Run the Mobile App

```bash
pnpm --filter @workspace/mobile run dev:local
```

- **Phone** — Scan the QR code in your terminal with the **Expo Go** app
- **Browser** — Press `w` in the terminal for a web preview
- **Android Emulator** — Press `a` (requires Android Studio)
- **iOS Simulator** — Press `i` (macOS + Xcode required)

---

## Step 12 — Remove Replit-Specific Files

These files are only needed on Replit and can be deleted safely in other environments:

```
artifacts/mobile/.replit-artifact/      # Replit routing config
artifacts/api-server/.replit-artifact/  # Replit routing config
replit.md                               # Replit-specific notes
```

The `.replit` file at the root can also be deleted if present.

---

## IDE Setup

### VS Code / Cursor

Recommended extensions (add to `.vscode/extensions.json`):
```json
{
  "recommendations": [
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint",
    "ms-vscode.vscode-typescript-next",
    "Expo.vscode-expo-tools",
    "drizzle-team.drizzle-vscode"
  ]
}
```

### Firebase Studio (IDX)

1. Open the project folder in Firebase Studio
2. Install Node.js 24 via the Nix config: add `pkgs.nodejs_24` and `pkgs.nodePackages.pnpm`
3. Follow Steps 6–11 above

---

## Deployment

### API Server — Docker

```dockerfile
FROM node:24-alpine
RUN npm install -g pnpm

WORKDIR /app
COPY pnpm-workspace.yaml ./
COPY package.json ./
COPY pnpm-lock.yaml ./
COPY lib/ ./lib/
COPY artifacts/api-server/ ./artifacts/api-server/

RUN pnpm install --frozen-lockfile --filter @workspace/api-server...
RUN pnpm --filter @workspace/api-server run build

EXPOSE 8080
ENV NODE_ENV=production
CMD ["node", "--enable-source-maps", "./artifacts/api-server/dist/index.mjs"]
```

Build and run:
```bash
docker build -t hideva-api .
docker run -e DATABASE_URL=... -e PORT=8080 -p 8080:8080 hideva-api
```

### API Server — Railway / Render / Fly.io

1. Connect your GitHub repo
2. Set build command: `pnpm --filter @workspace/api-server run build`
3. Set start command: `node artifacts/api-server/dist/index.mjs`
4. Add environment variables: `DATABASE_URL`, `PORT`, `NODE_ENV=production`

### Mobile App — EAS Build (iOS + Android)

```bash
# Install EAS CLI
npm install -g eas-cli

# Configure (first time only)
eas build:configure

# Build for both platforms
eas build --platform all

# Submit to stores
eas submit --platform all
```

### Mobile App — Web (Vercel / Netlify)

```bash
pnpm --filter @workspace/mobile run build
# Outputs to artifacts/mobile/dist/

# Deploy dist/ to Vercel:
npx vercel artifacts/mobile/dist
```

---

## Common Issues

| Problem | Solution |
|---|---|
| `esbuild` platform error on macOS | Remove platform overrides from `pnpm-workspace.yaml` (Step 4) |
| `Cannot find module @workspace/db` | Run `pnpm run typecheck:libs` to build lib declarations |
| Mobile app can't reach API | Set `EXPO_PUBLIC_API_URL=http://localhost:8080` in `.env` |
| Database connection refused | Check `DATABASE_URL` in `.env` and that PostgreSQL is running |
| `pnpm install` fails with lockfile error | Run `pnpm install --no-frozen-lockfile` once to regenerate |
| Expo QR code not working | Ensure your phone and computer are on the same WiFi network |
| `SESSION_SECRET` not set | Generate with `openssl rand -base64 32` and add to `.env` |

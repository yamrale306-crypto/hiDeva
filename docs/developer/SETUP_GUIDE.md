# hiDeva Setup Guide

## Local development

1. Install dependencies

```bash
pnpm install
```

2. Copy environment variables

```bash
cp .env.example .env
```

3. Run web frontend

```bash
pnpm run web:dev
```

4. Run mobile shell

```bash
cd apps/mobile
pnpm install
pnpm run dev
```

5. Run Docker

```bash
pnpm run docker:up
```

## Supabase

- Create a project in Supabase.
- Use `supabase/schema.sql` to create the application schema.
- Set `SUPABASE_URL` and `SUPABASE_ANON_KEY` in `.env`.
- Optionally configure authentication providers for email, Google, and GitHub.

## Android APK

```bash
cd apps/mobile
pnpm install
npx cap sync android
pnpm run android
```

## Notes

- Web app runs at `http://localhost:4173`
- Docker web service is exposed on port `4173`
- The mobile app is built using Expo and Capacitor for Android APK support.

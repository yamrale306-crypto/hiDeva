# Supabase Setup Guide

## Create the project

1. Visit https://app.supabase.com and create a new project.
2. Note the `SUPABASE_URL` and `SUPABASE_ANON_KEY`.

## Database schema

1. Open the SQL editor in Supabase.
2. Copy and paste the contents of `supabase/schema.sql`.
3. Run the script.

## Authentication

1. Enable `Email` login in the Authentication settings.
2. Enable `Google` and `GitHub` providers.
3. Set redirect URLs for your app domain and local development.

## Storage

- Create a storage bucket for attachments and documents.
- Mark files as public or use signed URLs.

## Realtime

- Ensure `Realtime` is enabled for the public schema.
- Use `supabase/realtime` or `supabase-js` to subscribe to changes in `notes`, `tasks`, and `connectors`.

## Environment variables

Update `.env` with:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
```

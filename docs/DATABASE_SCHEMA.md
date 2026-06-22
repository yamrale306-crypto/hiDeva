# hiDeva — Database Schema

## Overview

hiDeva uses **PostgreSQL** as the primary database, managed via **Drizzle ORM** with **drizzle-zod** for automatic Zod schema generation.

- ORM: Drizzle ORM (`drizzle-orm`)
- Driver: `node-postgres` (`pg`)
- Schema location: `lib/db/src/schema/`
- Migration config: `lib/db/drizzle.config.ts`
- Push command: `pnpm --filter @workspace/db run push`

---

## Current State

The database library is scaffolded and connected. The schema is ready to be populated as backend features are built.

---

## Planned Schema (Roadmap)

The following tables will be added as the backend API is developed.

---

### `users`

Stores registered user accounts.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `uuid` | PK, default gen | Unique user identifier |
| `phone_number` | `varchar(20)` | UNIQUE, NOT NULL | User's phone number (E.164 format) |
| `name` | `varchar(100)` | | Display name |
| `email` | `varchar(255)` | UNIQUE | Optional email |
| `ai_voice` | `varchar(10)` | default `female` | Preferred AI voice: `female` / `male` |
| `language` | `varchar(20)` | default `english` | Preferred language |
| `business_mode` | `boolean` | default `false` | Business mode enabled |
| `greeting` | `text` | | Custom AI greeting text |
| `plan` | `varchar(20)` | default `free` | Subscription plan: `free` / `pro` / `business` |
| `created_at` | `timestamptz` | default `now()` | Account creation timestamp |
| `updated_at` | `timestamptz` | | Last update timestamp |

---

### `calls`

Stores a record of every call handled, screened, blocked, or missed.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `uuid` | PK, default gen | Unique call record identifier |
| `user_id` | `uuid` | FK → `users.id`, NOT NULL | Owner of this call record |
| `caller_name` | `varchar(100)` | | Resolved name or "Unknown" |
| `caller_number` | `varchar(20)` | NOT NULL | Caller's phone number |
| `timestamp` | `timestamptz` | NOT NULL | When the call occurred |
| `duration_seconds` | `integer` | default `0` | Duration of AI-handled portion |
| `status` | `varchar(20)` | NOT NULL | `handled` / `spam` / `important` / `screened` / `missed` |
| `transcript` | `text` | | Full AI call transcript |
| `summary` | `text` | | AI-generated call summary |
| `action_items` | `text[]` | | AI-generated follow-up actions |
| `is_known` | `boolean` | default `false` | Whether caller was in contacts |
| `call_purpose` | `varchar(100)` | | Detected call purpose |
| `created_at` | `timestamptz` | default `now()` | Record creation timestamp |

**Indexes:**
- `(user_id, timestamp DESC)` — for call history queries
- `(user_id, status)` — for filtered list views

---

### `rules`

Stores custom call handling rules per user.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `uuid` | PK, default gen | Unique rule identifier |
| `user_id` | `uuid` | FK → `users.id`, NOT NULL | Owner of this rule |
| `name` | `varchar(100)` | NOT NULL | Human-readable rule name |
| `condition` | `text` | NOT NULL | Natural language condition |
| `action` | `text` | NOT NULL | What to do when condition matches |
| `priority` | `varchar(10)` | NOT NULL | `high` / `medium` / `low` |
| `enabled` | `boolean` | default `true` | Whether the rule is active |
| `icon` | `varchar(30)` | default `zap` | Icon name (Feather icon set) |
| `sort_order` | `integer` | default `0` | Display order |
| `created_at` | `timestamptz` | default `now()` | Rule creation timestamp |

---

### `contacts`

Stores the user's contact list with hiDeva priority labels.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `uuid` | PK, default gen | Unique contact identifier |
| `user_id` | `uuid` | FK → `users.id`, NOT NULL | Owner of this contact |
| `name` | `varchar(100)` | NOT NULL | Contact display name |
| `phone_number` | `varchar(20)` | NOT NULL | Contact phone number |
| `label` | `varchar(50)` | | e.g. Family, Work, Emergency |
| `priority` | `varchar(10)` | default `medium` | `high` / `medium` / `low` |
| `always_ring` | `boolean` | default `false` | Always ring through regardless of rules |
| `created_at` | `timestamptz` | default `now()` | Contact import timestamp |

**Indexes:**
- `(user_id, phone_number)` — UNIQUE — for fast lookup during incoming calls

---

## Relationships

```
users (1) ──< calls (many)
users (1) ──< rules (many)
users (1) ──< contacts (many)
```

---

## Drizzle ORM — Adding a Table

1. Create a file in `lib/db/src/schema/` e.g. `calls.ts`:

```typescript
import { pgTable, uuid, text, varchar, boolean, timestamptz, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const callsTable = pgTable("calls", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(),
  callerName: varchar("caller_name", { length: 100 }),
  callerNumber: varchar("caller_number", { length: 20 }).notNull(),
  // ... other columns
});

export const insertCallSchema = createInsertSchema(callsTable).omit({ id: true });
export type InsertCall = z.infer<typeof insertCallSchema>;
export type Call = typeof callsTable.$inferSelect;
```

2. Export it from `lib/db/src/schema/index.ts`:

```typescript
export * from "./calls";
```

3. Push the schema to the database:

```bash
pnpm --filter @workspace/db run push
```

---

## Migrations

```bash
# Push schema changes to the database (development only)
pnpm --filter @workspace/db run push

# For production, generate and run SQL migrations:
pnpm --filter @workspace/db run generate  # generates SQL in lib/db/drizzle/
pnpm --filter @workspace/db run migrate   # applies migrations to DATABASE_URL
```

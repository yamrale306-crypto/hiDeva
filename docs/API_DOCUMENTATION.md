# hiDeva — API Documentation

## Overview

The hiDeva REST API is built with **Express 5** and **TypeScript**. All routes are prefixed with `/api`. Request and response bodies are JSON. Input validation is handled by **Zod** schemas auto-generated from the OpenAPI specification.

---

## Base URL

| Environment | URL |
|---|---|
| Local development | `http://localhost:8080/api` |
| Production | `https://api.yourdomain.com/api` |

---

## Authentication

> The current MVP does not yet implement authentication. The `SESSION_SECRET` environment variable is provisioned for future JWT/session-based auth. The roadmap includes Google Login and Phone Login via Firebase Auth.

Future auth flow (planned):
1. Client exchanges a Firebase ID token for a session cookie via `POST /api/auth/session`
2. All protected routes require a valid session cookie
3. Sessions are verified server-side using `SESSION_SECRET`

---

## Endpoints

### Health Check

#### `GET /api/healthz`

Returns the server health status. Use this to verify the API is reachable.

**Request**

No parameters required.

```http
GET /api/healthz HTTP/1.1
Host: localhost:8080
```

**Response — 200 OK**

```json
{
  "status": "ok"
}
```

**Response Schema (Zod)**

```typescript
const HealthCheckResponse = z.object({
  status: z.literal("ok")
});
```

**cURL Example**

```bash
curl http://localhost:8080/api/healthz
```

---

## Planned Endpoints (Roadmap)

These endpoints are defined in the product roadmap and will be added in upcoming sprints.

### Calls

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/calls` | List all call records for the authenticated user |
| `GET` | `/api/calls/:id` | Get a single call record with transcript and summary |
| `PATCH` | `/api/calls/:id` | Update a call record (e.g. mark as important) |
| `DELETE` | `/api/calls/:id` | Delete a call record |

**Example Response — `GET /api/calls/:id`**

```json
{
  "id": "call_abc123",
  "callerName": "Rahul Sharma",
  "callerNumber": "+91 98765 43210",
  "timestamp": 1718800000000,
  "duration": 45,
  "status": "handled",
  "transcript": "Caller: Hello, is Deva available?\nDeva AI: May I know the purpose?",
  "summary": "Rahul called about the project proposal.",
  "actionItems": ["Call back Rahul about project proposal"],
  "isKnown": true,
  "callPurpose": "Project discussion"
}
```

### Rules

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/rules` | List all screening rules |
| `POST` | `/api/rules` | Create a new rule |
| `PATCH` | `/api/rules/:id` | Update a rule (toggle enabled, edit condition/action) |
| `DELETE` | `/api/rules/:id` | Delete a rule |

**Example Request — `POST /api/rules`**

```json
{
  "name": "Family Always Rings",
  "condition": "Contact tagged as Family",
  "action": "Always connect directly",
  "priority": "high",
  "enabled": true,
  "icon": "heart"
}
```

### Settings

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/settings` | Get user settings |
| `PATCH` | `/api/settings` | Update user settings |

**Example Request — `PATCH /api/settings`**

```json
{
  "language": "marathi",
  "aiVoice": "female",
  "autoHandleDelivery": true,
  "autoHandleSpam": true,
  "screenUnknown": true,
  "businessMode": false
}
```

### Users

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/auth/register` | Create a new user account |
| `POST` | `/api/auth/login` | Login and receive session token |
| `POST` | `/api/auth/logout` | Invalidate session |
| `GET` | `/api/users/me` | Get authenticated user profile |
| `PATCH` | `/api/users/me` | Update user profile |

---

## Call Status Values

| Value | Description |
|---|---|
| `handled` | AI answered and handled the call |
| `spam` | Detected as spam and blocked |
| `important` | Flagged as important by user or AI |
| `screened` | AI screened the caller and took a message |
| `missed` | Call was missed with no AI handling |

## Priority Values

| Value | Description |
|---|---|
| `high` | Always connect — family, emergency contacts |
| `medium` | Screen first — friends, known contacts |
| `low` | Block or minimise — sales, unknown promotions |

---

## Error Responses

All errors follow a consistent format:

```json
{
  "error": "Validation failed",
  "details": [
    {
      "field": "language",
      "message": "Invalid enum value. Expected 'english' | 'hindi' | ..."
    }
  ]
}
```

| HTTP Status | Meaning |
|---|---|
| `400` | Bad Request — validation error |
| `401` | Unauthorized — missing or invalid session |
| `403` | Forbidden — insufficient permissions |
| `404` | Not Found |
| `500` | Internal Server Error |

---

## OpenAPI Specification

The full OpenAPI 3 spec is located at:

```
lib/api-spec/src/openapi.yaml
```

To regenerate client hooks and Zod schemas after editing the spec:

```bash
pnpm --filter @workspace/api-spec run codegen
```

Generated outputs:
- `lib/api-zod/src/` — Zod validation schemas
- `lib/api-client-react/src/` — React Query hooks

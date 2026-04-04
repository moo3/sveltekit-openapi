# Examples

Four example SvelteKit API projects that demonstrate what `@sveltekit-openapi/core` can detect and document.

## Running

From the repo root:

```bash
npm run build

# Generate spec for any example
node dist/cli.js generate -c examples/bare-minimum/sveltekit-openapi.config.ts

# Or serve with interactive viewer
node dist/cli.js serve -c examples/zod-heavy/sveltekit-openapi.config.ts --theme swagger
```

## Projects

### bare-minimum

**Tests:** Tier 1 auto-detection and Tier 3 fallback.

No Zod schemas, no auth middleware — just plain `+server.ts` handlers. Demonstrates:

- Query param detection from `searchParams.get()`
- Request body field extraction from `await event.request.json()` destructuring
- Status code detection (200, 201, 400)
- Tier 3 fallback when body isn't destructured (typed as `object`)

### zod-heavy

**Tests:** Tier 2 Zod schema extraction.

Full Zod schemas with `.openapi()` metadata in `src/lib/schemas/`. Demonstrates:

- Nested object schemas (shipping address inside order)
- Array types (`z.array(z.string())`)
- Enum values (`z.enum(['USD', 'EUR', 'GBP'])`)
- Validation constraints (`min`, `max`, `minLength`, `maxLength`)
- `.openapi({ example, description })` metadata extraction
- `.openapi('ComponentName')` for named schema components
- Both `.parse()` and `.safeParse()` detection
- `nullable`, `optional`, `default` modifiers

### auth-patterns

**Tests:** Authentication and authorization detection.

Mixed auth patterns across endpoints. Demonstrates:

- Public endpoints (no auth) — `GET /api/public/feed`
- Basic auth — `requireAuth(event)` on `GET/PATCH/DELETE /api/me`
- Single role — `requireRole(event, 'admin')` on admin endpoints
- Multi-role — `requireRole(event, 'admin', 'moderator')` on moderator endpoints
- Role escalation within a route (GET needs moderator, DELETE needs admin)

### complex-routing

**Tests:** SvelteKit filesystem routing edge cases.

Deeply nested routes with advanced routing features. Demonstrates:

- Route groups stripped from output — `(public)` and `(app)` removed
- Multi-level path params — `{workspaceId}`, `{projectId}`, `{taskId}`
- Three levels deep — `/workspaces/{wId}/projects/{pId}/tasks/{tId}`
- Rest params — `[...query]` catch-all route
- Optional params — `[[slug]]`
- API versioning — `v1` and `v2` routes coexisting
- Correct tag generation across nested paths

# @sveltekit-openapi — Package Roadmap

The `@sveltekit-openapi` scope is designed as a family of packages that work together but can be adopted independently. Each package solves one concern.

```
@sveltekit-openapi/core       ← shipped (v0.1.0)
@sveltekit-openapi/ui         ← next priority
@sveltekit-openapi/client     ← high value
@sveltekit-openapi/mock       ← nice to have
@sveltekit-openapi/validator   ← nice to have
```

---

## @sveltekit-openapi/core (shipped)

**What:** Reads `+server.ts` files via AST analysis, generates OpenAPI 3.1 JSON/YAML.

**Delivery:** CLI, Vite plugin, programmatic API.

**Status:** v0.1.0 published on npm.

---

## @sveltekit-openapi/ui

**What:** A Svelte component that renders interactive API documentation inside your SvelteKit app. Drop it into a route like `/docs` and it serves your API reference as part of your app — not a separate server.

**Why separate from core:**
- Adds a Svelte runtime dependency (core is framework-agnostic)
- Not everyone wants docs embedded in their app
- Can be versioned independently as viewer libraries update

### Technical Design

**Entry point:** A Svelte component + a SvelteKit route helper.

```svelte
<!-- src/routes/docs/+page.svelte -->
<script>
  import { ApiReference } from '@sveltekit-openapi/ui';
  import spec from '../../openapi.json';
</script>

<ApiReference {spec} theme="swagger" />
```

**Or a one-liner route setup:**

```ts
// src/routes/docs/+page.server.ts
import { createDocsPage } from '@sveltekit-openapi/ui/server';
export const load = createDocsPage({ specPath: 'openapi.json' });
```

**Features:**
- Three theme options: swagger, scalar, redoc (same as core's viewer, but as Svelte components)
- SSR-compatible — renders a loading shell server-side, hydrates on client
- Reads spec from: static JSON import, URL endpoint, or inline object
- Optional sidebar navigation generated from tags
- Search across endpoints (client-side filtering)
- "Try it" panel that makes real requests against your running app (same origin)
- Dark mode support via CSS custom properties
- Responsive layout

**Implementation approach:**
- Wrap the CDN-based viewers (Scalar, Swagger UI, Redoc) in Svelte `<svelte:head>` + `onMount` patterns
- Alternatively, build a native Svelte renderer for full control (bigger effort, better DX)
- Start with the wrapper approach, consider native later based on demand

**Dependencies:**
- `@sveltekit-openapi/core` as peer dependency (for types only)
- `svelte` as peer dependency
- No runtime dependencies beyond the CDN scripts (or bundled viewer if going native)

**Package structure:**
```
src/
├── lib/
│   ├── ApiReference.svelte      # Main component
│   ├── themes/
│   │   ├── SwaggerTheme.svelte
│   │   ├── ScalarTheme.svelte
│   │   └── RedocTheme.svelte
│   └── server/
│       └── index.ts             # createDocsPage() helper
├── index.ts                     # Exports component
└── server.ts                    # Exports server helpers
```

---

## @sveltekit-openapi/client

**What:** Generates a fully typed API client from your OpenAPI spec. One command gives you type-safe `fetch` calls with autocomplete on routes, params, bodies, and responses.

**Why separate from core:**
- Different dependency tree (openapi-typescript, openapi-fetch)
- Some users only want docs, not a client
- Client generation is a build step, not a runtime concern

### Technical Design

**CLI usage:**

```bash
# Generate types + client from spec
npx @sveltekit-openapi/client generate

# Or pipe directly from core (no intermediate file)
npx @sveltekit-openapi/client generate --from-routes src/routes
```

**Output:**

```
src/lib/api/
├── types.ts    # Generated from openapi-typescript
└── client.ts   # Pre-configured openapi-fetch client
```

**Generated client usage in SvelteKit:**

```ts
// src/routes/dashboard/+page.server.ts
import { api } from '$lib/api/client';

export async function load() {
  const { data } = await api.GET('/api/v1/courses', {
    params: { query: { page: '1', limit: '10' } },
  });
  // data is fully typed as the 200 response schema
  return { courses: data };
}
```

**Features:**
- Wraps `openapi-typescript` for type generation
- Wraps `openapi-fetch` for the runtime client (zero overhead — just `fetch`)
- Auto-configures base URL from SvelteKit's `$app/environment`
- Generates both server-side and client-side clients
- Server client automatically forwards cookies/auth headers from `event`
- Watch mode: regenerates types when spec changes
- Vite plugin integration: regenerates on `+server.ts` changes (chains with core)

**Server-side client with auth forwarding:**

```ts
// Generated: src/lib/api/client.ts
import createClient from 'openapi-fetch';
import type { paths } from './types';

// For use in +page.server.ts / +server.ts (forwards request context)
export function createServerClient(fetch: typeof globalThis.fetch) {
  return createClient<paths>({ baseUrl: '', fetch });
}

// For use in client-side code
export const api = createClient<paths>({ baseUrl: '' });
```

```ts
// Usage in +page.server.ts — SvelteKit's fetch handles cookies automatically
export async function load({ fetch }) {
  const api = createServerClient(fetch);
  const { data } = await api.GET('/api/v1/me');
  return { user: data };
}
```

**Implementation approach:**
- Shell out to `openapi-typescript` for type generation (don't reinvent)
- Generate a thin wrapper file that imports `openapi-fetch` and configures it
- CLI reads the same config as core (`sveltekit-openapi.config.ts`)
- Add `client` section to config:

```ts
export default {
  // ... core config
  client: {
    output: 'src/lib/api',     // where to write generated files
    serverClient: true,         // generate server-side client helper
    baseUrl: '',                // default base URL (empty = same origin)
  },
};
```

**Dependencies:**
- `openapi-typescript` (dev/build time — generates types)
- `openapi-fetch` (runtime peer dependency — users install it)
- `@sveltekit-openapi/core` as peer dependency (for config types)

**Package structure:**
```
src/
├── index.ts          # Exports generate function
├── cli.ts            # CLI: generate, watch
├── generator.ts      # Runs openapi-typescript + writes client wrapper
├── templates/
│   ├── client.ts.hbs       # Client template
│   └── server-client.ts.hbs # Server client template
└── vite.ts           # Vite plugin (chains after core)
```

---

## @sveltekit-openapi/mock

**What:** Auto-generates mock API handlers from your OpenAPI spec for testing. Works with Vitest and Playwright.

**Why separate:**
- Testing-only concern
- Adds MSW (Mock Service Worker) as a dependency
- Not needed in production

### Technical Design

**Usage in tests:**

```ts
// tests/setup.ts
import { createMockServer } from '@sveltekit-openapi/mock';
import spec from '../openapi.json';

const server = createMockServer(spec);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

**What it generates:**
- MSW handlers for every endpoint in the spec
- Response bodies generated from schema (using `json-schema-faker` or similar)
- Correct status codes, content types, headers
- Respects `example` values from Zod `.openapi()` metadata
- Configurable: override specific handlers, set error responses

**Features:**
- Auto-generates realistic mock data from JSON Schema (faker-based)
- Uses `example` values from spec when available (your Zod `.openapi({ example })` metadata)
- Override specific endpoints for test scenarios:

```ts
server.override('GET /api/v1/courses', {
  status: 500,
  body: { message: 'Database error' },
});
```

- Validation mode: rejects requests that don't match the spec's request schema
- Latency simulation: configurable delays for testing loading states
- Playwright integration: intercept network requests in E2E tests

**Dependencies:**
- `msw` as peer dependency
- `json-schema-faker` for generating mock data
- `@sveltekit-openapi/core` as peer dependency (for types)

**Package structure:**
```
src/
├── index.ts              # Exports createMockServer
├── handler-generator.ts  # Spec → MSW handler array
├── data-generator.ts     # JSON Schema → fake data
└── overrides.ts          # Override API for test customization
```

---

## @sveltekit-openapi/validator

**What:** Runtime middleware that validates incoming requests and outgoing responses against your OpenAPI spec. Catches mismatches between your code and your docs.

**Why separate:**
- Runtime dependency (the others are dev/build tools)
- Adds overhead — only enable in dev/staging, not production
- Different security/performance considerations

### Technical Design

**Usage as SvelteKit hook:**

```ts
// src/hooks.server.ts
import { createValidator } from '@sveltekit-openapi/validator';
import spec from '../openapi.json';

const validate = createValidator(spec, {
  validateRequests: true,
  validateResponses: true, // only in dev
  onError: 'warn', // 'warn' | 'throw' | 'log'
});

export const handle = validate;
```

**What it validates:**

Request validation:
- Path parameters match expected types
- Query parameters match schema (type, enum, required)
- Request body matches JSON Schema (from Zod-extracted components)
- Required headers present
- Content-Type is correct

Response validation (dev only):
- Response body matches documented schema
- Status code is one of the documented codes
- Content-Type header matches spec
- Catches undocumented endpoints (routes you forgot to add to the spec)

**Features:**
- Plugs into SvelteKit's `handle` hook — zero changes to route handlers
- Request validation returns 400 with detailed error messages
- Response validation logs warnings (doesn't break responses)
- Configurable strictness per endpoint or globally
- Performance: compiles JSON Schema validators at startup, not per-request
- Dev-only mode: auto-disables in production via `$app/environment`

**Error response format:**

```json
{
  "error": "Validation failed",
  "details": [
    {
      "path": "/body/email",
      "message": "must match format \"email\"",
      "expected": "string (email)",
      "received": "not-an-email"
    }
  ]
}
```

**Dependencies:**
- `ajv` for JSON Schema validation (fast, compiled validators)
- `@sveltekit-openapi/core` as peer dependency (for types)

**Package structure:**
```
src/
├── index.ts              # Exports createValidator
├── request-validator.ts  # Validates incoming requests
├── response-validator.ts # Validates outgoing responses
├── schema-compiler.ts    # Compiles JSON Schema → Ajv validators
└── hooks.ts              # SvelteKit handle hook integration
```

---

## Package Dependency Graph

```
@sveltekit-openapi/core          (standalone — no peer deps)
        │
        ├── @sveltekit-openapi/ui        (peers: core, svelte)
        ├── @sveltekit-openapi/client    (peers: core, openapi-fetch)
        ├── @sveltekit-openapi/mock      (peers: core, msw)
        └── @sveltekit-openapi/validator (peers: core, ajv)
```

All packages are optional. Users can adopt any combination:
- **Docs only:** `core`
- **Docs + embedded viewer:** `core` + `ui`
- **Docs + typed client:** `core` + `client`
- **Full stack:** `core` + `ui` + `client` + `validator`
- **Testing:** `core` + `mock`

---

## Suggested Build Order

1. **`@sveltekit-openapi/ui`** — Highest demand. People want to serve docs from their app. Low effort (wrapper around existing CDN viewers). Completes the "generate + view" story.

2. **`@sveltekit-openapi/client`** — Highest value. Closes the full loop: write routes → generate spec → generate typed client → use in load functions. This is the killer feature for SvelteKit DX.

3. **`@sveltekit-openapi/mock`** — Natural follow-up to client. Once you have a spec, auto-mocking for tests is a small step. Especially valuable for frontend teams working against backend APIs.

4. **`@sveltekit-openapi/validator`** — Last priority. Useful but niche. Most teams validate with Zod in their handlers already. This catches spec-code drift, which matters more in larger teams.

---

## Monorepo Consideration

When building package #2, convert the repo to a monorepo:

```
sveltekit-openapi/
├── packages/
│   ├── core/          # current code moves here
│   ├── ui/
│   ├── client/
│   ├── mock/
│   └── validator/
├── examples/          # stays at root
├── package.json       # workspace root
└── turbo.json         # or nx.json for task orchestration
```

Tools: pnpm workspaces + turborepo (or npm workspaces + nx). Turborepo is simpler for this scale.

Each package gets its own `package.json`, `tsup.config.ts`, and test suite. Shared config (tsconfig, vitest) lives at root. CI builds all packages, publishes only those with version bumps.

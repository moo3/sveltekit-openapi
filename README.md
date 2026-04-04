# @sveltekit-openapi/core

Auto-generate OpenAPI 3.1 documentation from your SvelteKit API routes. No decorators, no wrappers, no new APIs to learn — just point it at your existing code.

```bash
npx @sveltekit-openapi/core generate
```

## Why?

SvelteKit [deliberately chose](https://github.com/sveltejs/kit/issues/12645) not to enforce typed API responses. That's fine — but it means there's no built-in way to generate API docs.

This tool fills that gap by reading your existing `+server.ts` files with AST analysis and producing an OpenAPI 3.1 spec. It works with what you already have:

- **Got Zod schemas?** Full docs with validation rules, examples, and enums.
- **Just TypeScript?** Route paths, methods, params, status codes, and auth — all auto-detected.
- **No types at all?** Endpoints still documented, just marked as `object`.

## Install

```bash
npm install -D @sveltekit-openapi/core
```

## Quick Start

### CLI

```bash
# Generate from default location (src/routes)
npx sveltekit-openapi generate

# With options
npx sveltekit-openapi generate \
  --routes-dir src/routes \
  --schema-files "src/lib/schemas/*.ts" \
  --output openapi.json \
  --title "My API" \
  --api-version "1.0.0"

# Preview discovered routes without generating
npx sveltekit-openapi preview
```

### Vite Plugin

```ts
// vite.config.ts
import { sveltekit } from '@sveltejs/kit/vite';
import { sveltekitOpenApi } from '@sveltekit-openapi/core/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [
    sveltekit(),
    sveltekitOpenApi({
      output: 'static/openapi.json',
      schemaFiles: ['src/lib/schemas/*.ts'],
      info: {
        title: 'My API',
        version: '1.0.0',
      },
    }),
  ],
});
```

The Vite plugin:
- Generates on dev server start
- Watches `+server.ts` and schema files for changes
- Serves the spec at `/_openapi/spec.json` during development

### Programmatic

```ts
import { generate } from '@sveltekit-openapi/core';

const result = await generate({
  routesDir: 'src/routes',
  schemaFiles: ['src/lib/schemas/*.ts'],
  output: 'openapi.json',
});

console.log(`Generated ${result.endpointCount} endpoints from ${result.routeCount} routes`);
```

## How It Works

The tool uses a tiered inference model — it documents what it *can* infer and clearly marks what it can't.

### Tier 1 — Automatic (zero effort)

Everything below is detected automatically from your `+server.ts` files:

| What | How it's detected |
|------|-------------------|
| Route paths | Filesystem conventions (`src/routes/api/v1/users/+server.ts` &rarr; `/api/v1/users`) |
| HTTP methods | Named exports (`export const GET`, `export const POST`, etc.) |
| Path params | Directory names (`[id]` &rarr; `{id}`) |
| Query params | `event.url.searchParams.get('name')` calls |
| Request body fields | `const { a, b } = await event.request.json()` destructuring |
| Status codes | `json(data, { status: 201 })` calls |
| Auth requirements | `requireAuth(event)` / `requireRole(event, 'admin')` patterns |
| Tags | Auto-generated from route path segments |
| Operation IDs | Auto-generated from method + route (`getCoursesModules`) |

### Tier 2 — Full Docs (you provide Zod schemas)

When you have Zod schemas, the tool extracts full type information:

```ts
// src/lib/schemas/auth.ts
export const registerSchema = z.object({
  email: z.string().email().openapi({ example: 'jane@example.com' }),
  password: z.string().min(8).max(128),
  firstName: z.string().min(1).max(255),
}).openapi('RegisterRequest');
```

This produces a fully documented JSON Schema component with types, formats, validation constraints, examples, required fields, and enums.

Supported Zod methods: `string`, `number`, `boolean`, `object`, `array`, `enum`, `literal`, `int`, `email`, `url`, `uuid`, `datetime`, `min`, `max`, `length`, `optional`, `nullable`, `default`, `describe`, `openapi`.

### Tier 3 — Fallback

Endpoints without type information are still documented — request/response bodies are typed as `object`. You get the route, method, params, and status codes regardless.

## Configuration

Create `sveltekit-openapi.config.ts` (or `.js`, `.mjs`) in your project root:

```ts
import type { SvelteKitOpenAPIConfig } from '@sveltekit-openapi/core';

export default {
  routesDir: 'src/routes',
  output: 'openapi.json',
  format: 'json', // or 'yaml'

  info: {
    title: 'My API',
    version: '1.0.0',
    description: 'My SvelteKit API',
  },

  servers: [
    { url: 'https://api.example.com', description: 'Production' },
    { url: 'http://localhost:5173', description: 'Development' },
  ],

  // Glob patterns for Zod schema files
  schemaFiles: ['src/lib/schemas/**/*.ts'],

  // Auth detection
  auth: {
    // Function names that indicate authentication
    patterns: ['requireAuth', 'requireRole'],
    // Custom security scheme (default: Bearer JWT)
    securityScheme: {
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
    },
  },

  // Tag generation
  tags: {
    segmentIndex: 0, // Which path segment after /api/vN/ to use for tags
  },

  // Glob patterns to exclude
  exclude: ['**/internal/**'],
} satisfies SvelteKitOpenAPIConfig;
```

CLI flags override config file values.

## Output Example

Running against a real SvelteKit project with 23 routes produces:

```json
{
  "openapi": "3.1.0",
  "info": { "title": "My API", "version": "1.0.0" },
  "paths": {
    "/api/v1/auth/login": {
      "post": {
        "operationId": "postAuthLogin",
        "tags": ["auth"],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "email": { "type": "string" },
                  "password": { "type": "string" }
                }
              }
            }
          }
        },
        "responses": {
          "200": { "description": "Success" },
          "400": {
            "description": "Bad Request",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": { "message": { "type": "string" } },
                  "required": ["message"]
                }
              }
            }
          },
          "401": { "description": "Unauthorized" }
        }
      }
    },
    "/api/v1/admin/users": {
      "get": {
        "operationId": "getAdminUsers",
        "tags": ["admin"],
        "parameters": [
          { "name": "search", "in": "query", "required": false, "schema": { "type": "string" } },
          { "name": "role", "in": "query", "required": false, "schema": { "type": "string" } }
        ],
        "responses": { "200": { "description": "Success" } },
        "security": [{ "bearerAuth": [] }],
        "summary": "Requires role: admin"
      }
    }
  },
  "components": {
    "schemas": {
      "RegisterRequest": {
        "type": "object",
        "properties": {
          "email": { "type": "string", "format": "email", "example": "jane@example.com" },
          "password": { "type": "string", "minLength": 8, "maxLength": 128 },
          "firstName": { "type": "string", "minLength": 1, "maxLength": 255 }
        },
        "required": ["email", "password", "firstName"]
      }
    },
    "securitySchemes": {
      "bearerAuth": { "type": "http", "scheme": "bearer", "bearerFormat": "JWT" }
    }
  },
  "tags": [
    { "name": "admin" },
    { "name": "auth" },
    { "name": "courses" },
    { "name": "enrollments" }
  ]
}
```

## What This Tool Does NOT Do

- **It does not wrap your handlers.** Your code stays exactly the same.
- **It does not require Zod.** Zod makes the output better, but it's optional.
- **It does not execute your code.** Everything is static analysis via the TypeScript AST.
- **It does not generate client code.** Use the OpenAPI spec with any code generator you like.

## CLI Reference

```
Usage: sveltekit-openapi [command] [options]

Commands:
  generate [options]    Generate OpenAPI documentation (default)
  preview [options]     Preview discovered routes without generating

Generate options:
  -c, --config <path>          Path to config file
  -o, --output <path>          Output file path (default: "openapi.json")
  -f, --format <format>        Output format: json or yaml (default: "json")
  -r, --routes-dir <path>      Routes directory (default: "src/routes")
  -s, --schema-files <globs>   Glob patterns for schema files
  --title <title>              API title
  --api-version <version>      API version
```

## License

MIT

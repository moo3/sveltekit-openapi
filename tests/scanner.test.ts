import { describe, it, expect } from 'vitest';
import { toOpenAPIPath, scanRoutes } from '../src/core/scanner.js';
import path from 'path';

describe('toOpenAPIPath', () => {
  const routesDir = '/app/src/routes';

  it('converts basic route', () => {
    const result = toOpenAPIPath('/app/src/routes/api/health/+server.ts', routesDir);
    expect(result.routePath).toBe('/api/health');
    expect(result.pathParams).toEqual([]);
  });

  it('converts path with params', () => {
    const result = toOpenAPIPath('/app/src/routes/api/users/[id]/+server.ts', routesDir);
    expect(result.routePath).toBe('/api/users/{id}');
    expect(result.pathParams).toEqual(['id']);
  });

  it('converts nested params', () => {
    const result = toOpenAPIPath('/app/src/routes/api/v1/courses/[courseId]/modules/[moduleId]/+server.ts', routesDir);
    expect(result.routePath).toBe('/api/v1/courses/{courseId}/modules/{moduleId}');
    expect(result.pathParams).toEqual(['courseId', 'moduleId']);
  });

  it('strips route groups', () => {
    const result = toOpenAPIPath('/app/src/routes/(app)/api/users/+server.ts', routesDir);
    expect(result.routePath).toBe('/api/users');
  });

  it('handles optional params', () => {
    const result = toOpenAPIPath('/app/src/routes/api/items/[[slug]]/+server.ts', routesDir);
    expect(result.routePath).toBe('/api/items/{slug}');
    expect(result.pathParams).toEqual(['slug']);
  });
});

describe('scanRoutes', () => {
  const fixturesDir = path.resolve(__dirname, 'fixtures');

  it('discovers all fixture routes', async () => {
    const routes = await scanRoutes({ routesDir: fixturesDir });

    expect(routes.length).toBeGreaterThanOrEqual(5);

    const paths = routes.map((r) => r.routePath);
    expect(paths).toContain('/basic-get');
    expect(paths).toContain('/auth-post');
    expect(paths).toContain('/query-params');
    expect(paths).toContain('/multi-method');
  });

  it('detects path params from [id] directory', async () => {
    const routes = await scanRoutes({ routesDir: fixturesDir });
    const paramRoute = routes.find((r) => r.routePath.includes('{id}'));

    expect(paramRoute).toBeDefined();
    expect(paramRoute!.pathParams).toContain('id');
  });
});

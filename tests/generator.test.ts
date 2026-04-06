import { describe, it, expect } from 'vitest';
import { generateOpenAPIDocument } from '../src/core/generator.js';
import type { RouteInfo, SchemaComponent } from '../src/types.js';

function makeRoute(overrides: Partial<RouteInfo> & { routePath: string }): RouteInfo {
  return {
    filePath: '/fake/+server.ts',
    methods: [],
    ...overrides,
  };
}

describe('generateOpenAPIDocument', () => {
  it('produces valid OpenAPI 3.1.0 structure', () => {
    const doc = generateOpenAPIDocument([], [], {});
    expect(doc.openapi).toBe('3.1.0');
    expect(doc.info.title).toBe('SvelteKit API');
    expect(doc.info.version).toBe('1.0.0');
    expect(doc.paths).toEqual({});
  });

  it('uses config info fields', () => {
    const doc = generateOpenAPIDocument([], [], {
      info: { title: 'Test API', version: '2.0.0', description: 'Desc' },
    });
    expect(doc.info.title).toBe('Test API');
    expect(doc.info.version).toBe('2.0.0');
    expect(doc.info.description).toBe('Desc');
  });

  it('includes servers when configured', () => {
    const doc = generateOpenAPIDocument([], [], {
      servers: [{ url: 'https://api.test.com', description: 'Prod' }],
    });
    expect(doc.servers).toHaveLength(1);
    expect(doc.servers![0].url).toBe('https://api.test.com');
  });

  it('has empty servers when not configured', () => {
    const doc = generateOpenAPIDocument([], [], {});
    expect(doc.servers).toEqual([]);
  });
});

describe('operationId generation', () => {
  it('generates camelCase from route path', () => {
    const routes: RouteInfo[] = [makeRoute({
      routePath: '/api/v1/courses',
      methods: [{
        method: 'get', params: [], responses: [{ statusCode: 200, description: 'OK' }],
        security: [], tier: 1,
      }],
    })];

    const doc = generateOpenAPIDocument(routes, [], {});
    expect(doc.paths['/api/v1/courses']?.get?.operationId).toBe('getCourses');
  });

  it('strips param-only segments', () => {
    const routes: RouteInfo[] = [makeRoute({
      routePath: '/api/v1/users/{userId}/posts',
      methods: [{
        method: 'get', params: [], responses: [{ statusCode: 200, description: 'OK' }],
        security: [], tier: 1,
      }],
    })];

    const doc = generateOpenAPIDocument(routes, [], {});
    expect(doc.paths['/api/v1/users/{userId}/posts']?.get?.operationId).toBe('getUsersPosts');
  });

  it('handles kebab-case segments', () => {
    const routes: RouteInfo[] = [makeRoute({
      routePath: '/api/v1/audit-logs',
      methods: [{
        method: 'get', params: [], responses: [{ statusCode: 200, description: 'OK' }],
        security: [], tier: 1,
      }],
    })];

    const doc = generateOpenAPIDocument(routes, [], {});
    expect(doc.paths['/api/v1/audit-logs']?.get?.operationId).toBe('getAuditLogs');
  });
});

describe('tag generation', () => {
  it('extracts tag from first segment after /api/vN/', () => {
    const routes: RouteInfo[] = [makeRoute({
      routePath: '/api/v1/courses/{id}',
      methods: [{
        method: 'get', params: [], responses: [{ statusCode: 200, description: 'OK' }],
        security: [], tier: 1,
      }],
    })];

    const doc = generateOpenAPIDocument(routes, [], {});
    expect(doc.paths['/api/v1/courses/{id}']?.get?.tags).toEqual(['courses']);
  });

  it('collects unique tags sorted alphabetically', () => {
    const routes: RouteInfo[] = [
      makeRoute({
        routePath: '/api/v1/users',
        methods: [{ method: 'get', params: [], responses: [{ statusCode: 200, description: 'OK' }], security: [], tier: 1 }],
      }),
      makeRoute({
        routePath: '/api/v1/admin/stats',
        methods: [{ method: 'get', params: [], responses: [{ statusCode: 200, description: 'OK' }], security: [], tier: 1 }],
      }),
      makeRoute({
        routePath: '/api/v1/users/{id}',
        methods: [{ method: 'get', params: [], responses: [{ statusCode: 200, description: 'OK' }], security: [], tier: 1 }],
      }),
    ];

    const doc = generateOpenAPIDocument(routes, [], {});
    expect(doc.tags?.map(t => t.name)).toEqual(['admin', 'users']);
  });

  it('respects custom segmentIndex', () => {
    const routes: RouteInfo[] = [makeRoute({
      routePath: '/api/v1/admin/users',
      methods: [{ method: 'get', params: [], responses: [{ statusCode: 200, description: 'OK' }], security: [], tier: 1 }],
    })];

    const doc = generateOpenAPIDocument(routes, [], { tags: { segmentIndex: 1 } });
    expect(doc.paths['/api/v1/admin/users']?.get?.tags).toEqual(['users']);
  });
});

describe('security schemes', () => {
  it('adds bearerAuth when any route has security', () => {
    const routes: RouteInfo[] = [makeRoute({
      routePath: '/api/v1/me',
      methods: [{
        method: 'get', params: [],
        responses: [{ statusCode: 200, description: 'OK' }],
        security: [{ type: 'auth' }], tier: 1,
      }],
    })];

    const doc = generateOpenAPIDocument(routes, [], {});
    expect(doc.components?.securitySchemes?.bearerAuth).toBeDefined();
    expect(doc.components?.securitySchemes?.bearerAuth?.type).toBe('http');
  });

  it('has no securitySchemes when no routes require auth', () => {
    const routes: RouteInfo[] = [makeRoute({
      routePath: '/api/health',
      methods: [{
        method: 'get', params: [],
        responses: [{ statusCode: 200, description: 'OK' }],
        security: [], tier: 1,
      }],
    })];

    const doc = generateOpenAPIDocument(routes, [], {});
    expect(doc.components?.securitySchemes).toEqual({});
  });

  it('adds role info to summary', () => {
    const routes: RouteInfo[] = [makeRoute({
      routePath: '/api/v1/admin',
      methods: [{
        method: 'get', params: [],
        responses: [{ statusCode: 200, description: 'OK' }],
        security: [{ type: 'role', roles: ['admin', 'superadmin'] }], tier: 1,
      }],
    })];

    const doc = generateOpenAPIDocument(routes, [], {});
    expect(doc.paths['/api/v1/admin']?.get?.summary).toBe('Requires role: admin | superadmin');
  });
});

describe('schema components', () => {
  it('includes schema components in output', () => {
    const schemas: SchemaComponent[] = [
      { name: 'User', schema: { type: 'object', properties: { id: { type: 'string' } } } },
    ];

    const doc = generateOpenAPIDocument([], schemas, {});
    expect(doc.components?.schemas?.User).toBeDefined();
    expect((doc.components?.schemas?.User as any).properties.id.type).toBe('string');
  });

  it('uses $ref for request body schema refs', () => {
    const routes: RouteInfo[] = [makeRoute({
      routePath: '/api/users',
      methods: [{
        method: 'post', params: [],
        requestBody: { required: true, fields: [], schemaRef: 'CreateUser' },
        responses: [{ statusCode: 201, description: 'Created' }],
        security: [], tier: 2,
      }],
    })];

    const doc = generateOpenAPIDocument(routes, [], {});
    const rb = doc.paths['/api/users']?.post?.requestBody as any;
    expect(rb.content['application/json'].schema.$ref).toBe('#/components/schemas/CreateUser');
  });
});

describe('parameters', () => {
  it('renders path params as required', () => {
    const routes: RouteInfo[] = [makeRoute({
      routePath: '/api/users/{id}',
      methods: [{
        method: 'get',
        params: [{ name: 'id', in: 'path', required: true, type: 'string' }],
        responses: [{ statusCode: 200, description: 'OK' }],
        security: [], tier: 1,
      }],
    })];

    const doc = generateOpenAPIDocument(routes, [], {});
    const params = doc.paths['/api/users/{id}']?.get?.parameters;
    expect(params).toHaveLength(1);
    expect(params![0].required).toBe(true);
    expect(params![0].in).toBe('path');
  });

  it('renders query params as optional', () => {
    const routes: RouteInfo[] = [makeRoute({
      routePath: '/api/users',
      methods: [{
        method: 'get',
        params: [{ name: 'search', in: 'query', required: false, type: 'string' }],
        responses: [{ statusCode: 200, description: 'OK' }],
        security: [], tier: 1,
      }],
    })];

    const doc = generateOpenAPIDocument(routes, [], {});
    const params = doc.paths['/api/users']?.get?.parameters;
    expect(params![0].required).toBe(false);
    expect(params![0].in).toBe('query');
  });
});

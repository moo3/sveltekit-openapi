import { describe, it, expect } from 'vitest';
import { toOpenAPIPath } from '../src/core/scanner.js';

describe('toOpenAPIPath edge cases', () => {
  const dir = '/app/src/routes';

  it('handles rest params [...query]', () => {
    const result = toOpenAPIPath('/app/src/routes/api/search/[...query]/+server.ts', dir);
    expect(result.routePath).toBe('/api/search/{...query}');
    expect(result.pathParams).toContain('...query');
  });

  it('handles root +server.ts', () => {
    const result = toOpenAPIPath('/app/src/routes/+server.ts', dir);
    expect(result.routePath).toBe('/');
    expect(result.pathParams).toEqual([]);
  });

  it('handles multiple route groups', () => {
    const result = toOpenAPIPath('/app/src/routes/(marketing)/(public)/about/+server.ts', dir);
    expect(result.routePath).toBe('/about');
  });

  it('handles route group at end of path', () => {
    const result = toOpenAPIPath('/app/src/routes/api/(internal)/+server.ts', dir);
    expect(result.routePath).toBe('/api');
  });

  it('handles dashes and dots in route segments', () => {
    const result = toOpenAPIPath('/app/src/routes/api/user-profiles/v2.1/+server.ts', dir);
    expect(result.routePath).toBe('/api/user-profiles/v2.1');
  });

  it('handles deeply nested params (3 levels)', () => {
    const result = toOpenAPIPath('/app/src/routes/api/[a]/[b]/[c]/+server.ts', dir);
    expect(result.routePath).toBe('/api/{a}/{b}/{c}');
    expect(result.pathParams).toEqual(['a', 'b', 'c']);
  });

  it('handles mixed params and static segments', () => {
    const result = toOpenAPIPath('/app/src/routes/api/orgs/[orgId]/teams/[teamId]/members/+server.ts', dir);
    expect(result.routePath).toBe('/api/orgs/{orgId}/teams/{teamId}/members');
    expect(result.pathParams).toEqual(['orgId', 'teamId']);
  });
});

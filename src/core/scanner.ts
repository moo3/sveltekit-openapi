import fg from 'fast-glob';
import path from 'path';
import type { ScannedRoute, SvelteKitOpenAPIConfig } from '../types.js';

/**
 * Convert a SvelteKit filesystem route path to an OpenAPI path.
 *
 * Examples:
 *   src/routes/api/v1/courses/[courseId]/modules/+server.ts
 *   → /api/v1/courses/{courseId}/modules
 */
export function toOpenAPIPath(filePath: string, routesDir: string): { routePath: string; pathParams: string[] } {
  let rel = path.relative(routesDir, filePath);

  // Strip +server.ts suffix
  rel = rel.replace(/\/?\+server\.ts$/, '');

  // Strip route groups: (groupName)/
  rel = rel.replace(/\([^)]+\)\//g, '');
  // Also handle trailing group without slash
  rel = rel.replace(/\([^)]+\)$/, '');

  // Find path parameters
  const pathParams: string[] = [];

  // Convert [[optional]] params → {optional}
  rel = rel.replace(/\[\[([^\]]+)\]\]/g, (_match, param) => {
    pathParams.push(param);
    return `{${param}}`;
  });

  // Convert [param] → {param}
  rel = rel.replace(/\[([^\]]+)\]/g, (_match, param) => {
    pathParams.push(param);
    return `{${param}}`;
  });

  // Handle rest params [...rest] → already converted above
  // Normalize to forward slashes and ensure leading slash
  const routePath = '/' + rel.split(path.sep).join('/');

  return { routePath: routePath === '/' ? '/' : routePath.replace(/\/$/, ''), pathParams };
}

/**
 * Scan the filesystem for +server.ts files and return route info.
 */
export async function scanRoutes(config: SvelteKitOpenAPIConfig): Promise<ScannedRoute[]> {
  const routesDir = config.routesDir || 'src/routes';
  const include = config.include || ['**/+server.ts'];
  const exclude = config.exclude || [];

  const files = await fg(include, {
    cwd: routesDir,
    absolute: true,
    ignore: exclude,
  });

  const routes: ScannedRoute[] = files
    .sort()
    .map((filePath) => {
      const { routePath, pathParams } = toOpenAPIPath(filePath, path.resolve(routesDir));
      return { filePath, routePath, pathParams };
    });

  return routes;
}

import type { OpenAPIV3_1 } from '../openapi-types.js';
import type { RouteInfo, MethodInfo, SchemaComponent, SvelteKitOpenAPIConfig } from '../types.js';

/**
 * Generate an OpenAPI 3.1 document from parsed route info.
 */
export function generateOpenAPIDocument(
  routes: RouteInfo[],
  schemaComponents: SchemaComponent[],
  config: SvelteKitOpenAPIConfig,
): OpenAPIV3_1.Document {
  const hasAuth = routes.some((r) => r.methods.some((m) => m.security.length > 0));
  const tags = collectTags(routes, config);

  const doc: OpenAPIV3_1.Document = {
    openapi: '3.1.0',
    info: {
      title: config.info?.title || 'SvelteKit API',
      version: config.info?.version || '1.0.0',
      ...(config.info?.description ? { description: config.info.description } : {}),
    },
    paths: {},
    tags: tags.map((t) => ({ name: t })),
  };

  if (config.servers && config.servers.length > 0) {
    doc.servers = config.servers;
  }

  // Build paths
  for (const route of routes) {
    const pathItem: OpenAPIV3_1.PathItemObject = {};

    for (const method of route.methods) {
      const operation = buildOperation(route, method, config);
      pathItem[method.method] = operation;
    }

    doc.paths[route.routePath] = pathItem;
  }

  // Build components
  const components: OpenAPIV3_1.ComponentsObject = {};

  if (schemaComponents.length > 0) {
    components.schemas = {};
    for (const comp of schemaComponents) {
      components.schemas[comp.name] = comp.schema as OpenAPIV3_1.SchemaObject;
    }
  }

  if (hasAuth) {
    components.securitySchemes = {
      bearerAuth: config.auth?.securityScheme || {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    };
  }

  if (Object.keys(components).length > 0) {
    doc.components = components;
  }

  return doc;
}

function buildOperation(
  route: RouteInfo,
  method: MethodInfo,
  config: SvelteKitOpenAPIConfig,
): OpenAPIV3_1.OperationObject {
  const operation: OpenAPIV3_1.OperationObject = {
    operationId: generateOperationId(method.method, route.routePath),
    responses: {},
  };

  // Tags
  const tag = extractTag(route.routePath, config);
  if (tag) {
    operation.tags = [tag];
  }

  // Parameters
  if (method.params.length > 0) {
    operation.parameters = method.params.map((p) => ({
      name: p.name,
      in: p.in,
      required: p.required,
      schema: { type: p.type } as OpenAPIV3_1.SchemaObject,
      ...(p.description ? { description: p.description } : {}),
    }));
  }

  // Request body
  if (method.requestBody) {
    const rb = method.requestBody;
    let schema: OpenAPIV3_1.SchemaObject | OpenAPIV3_1.ReferenceObject;

    if (rb.schemaRef) {
      schema = { $ref: `#/components/schemas/${rb.schemaRef}` };
    } else if (rb.fields.length > 0) {
      const properties: Record<string, OpenAPIV3_1.SchemaObject> = {};
      for (const field of rb.fields) {
        properties[field.name] = { type: field.type };
      }
      schema = {
        type: 'object',
        properties,
      };
    } else {
      schema = { type: 'object' };
    }

    operation.requestBody = {
      required: rb.required,
      content: {
        'application/json': { schema },
      },
    };
  }

  // Responses
  for (const resp of method.responses) {
    const responseObj: OpenAPIV3_1.ResponseObject = {
      description: resp.description,
    };

    if (resp.schemaRef) {
      responseObj.content = {
        'application/json': {
          schema: { $ref: `#/components/schemas/${resp.schemaRef}` },
        },
      };
    } else if (resp.schema) {
      responseObj.content = {
        'application/json': {
          schema: resp.schema as OpenAPIV3_1.SchemaObject,
        },
      };
    }

    operation.responses[String(resp.statusCode)] = responseObj;
  }

  // Security
  if (method.security.length > 0) {
    operation.security = [{ bearerAuth: [] }];

    // Add role info to summary if roles are specified
    const roleInfo = method.security.find((s) => s.type === 'role');
    if (roleInfo?.roles && roleInfo.roles.length > 0) {
      operation.summary = `Requires role: ${roleInfo.roles.join(' | ')}`;
    }
  }

  return operation;
}

/**
 * Generate an operationId from method + route path.
 * Example: GET /api/v1/courses/{courseId}/modules → getCoursesModules
 */
function generateOperationId(method: string, routePath: string): string {
  const segments = routePath
    .replace(/^\/api\/v\d+\//, '') // strip /api/vN/ prefix
    .split('/')
    .filter(Boolean)
    .filter((s) => !s.startsWith('{')) // drop param-only segments
    .map((s) => {
      // Convert kebab-case and dot-separated to camelCase
      return s
        .replace(/[^a-zA-Z0-9]+(.)/g, (_m, c) => c.toUpperCase())
        .replace(/^./, (c) => c.toUpperCase())
        .replace(/[^a-zA-Z0-9]/g, '');
    });

  return method + segments.join('');
}

/**
 * Extract a tag from the route path.
 * Uses the first meaningful segment after /api/vN/.
 */
function extractTag(routePath: string, config: SvelteKitOpenAPIConfig): string | undefined {
  const stripped = routePath.replace(/^\/api\/v\d+\//, '');
  const segments = stripped.split('/').filter(Boolean).filter((s) => !s.startsWith('{'));

  const idx = config.tags?.segmentIndex ?? 0;
  return segments[idx] || undefined;
}

/**
 * Collect all unique tags across routes.
 */
function collectTags(routes: RouteInfo[], config: SvelteKitOpenAPIConfig): string[] {
  const tags = new Set<string>();

  for (const route of routes) {
    const tag = extractTag(route.routePath, config);
    if (tag) tags.add(tag);
  }

  return Array.from(tags).sort();
}

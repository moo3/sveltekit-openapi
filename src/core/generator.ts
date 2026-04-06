import type {
  OpenAPIObject,
  PathItemObject,
  OperationObject,
  ParameterObject,
  RequestBodyObject,
  ResponseObject,
  SchemaObject,
  SchemaObjectType,
  ReferenceObject,
  SecuritySchemeObject,
} from 'openapi3-ts/oas31';
import { OpenApiBuilder } from 'openapi3-ts/oas31';
import type { RouteInfo, MethodInfo, SchemaComponent, SvelteKitOpenAPIConfig } from '../types.js';

/**
 * Generate an OpenAPI 3.1 document from parsed route info.
 */
export function generateOpenAPIDocument(
  routes: RouteInfo[],
  schemaComponents: SchemaComponent[],
  config: SvelteKitOpenAPIConfig,
): OpenAPIObject {
  const hasAuth = routes.some((r) => r.methods.some((m) => m.security.length > 0));
  const tags = collectTags(routes, config);

  const builder = OpenApiBuilder.create()
    .addTitle(config.info?.title || 'SvelteKit API')
    .addVersion(config.info?.version || '1.0.0');

  if (config.info?.description) {
    builder.addDescription(config.info.description);
  }

  if (config.servers && config.servers.length > 0) {
    for (const server of config.servers) {
      builder.addServer(server);
    }
  }

  for (const tag of tags) {
    builder.addTag({ name: tag });
  }

  // Build paths
  for (const route of routes) {
    const pathItem: PathItemObject = {};

    for (const method of route.methods) {
      const operation = buildOperation(route, method, config);
      pathItem[method.method] = operation;
    }

    builder.addPath(route.routePath, pathItem);
  }

  // Add schema components
  if (schemaComponents.length > 0) {
    for (const comp of schemaComponents) {
      builder.addSchema(comp.name, comp.schema as SchemaObject);
    }
  }

  // Add security scheme
  if (hasAuth) {
    builder.addSecurityScheme('bearerAuth', config.auth?.securityScheme as SecuritySchemeObject || {
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
    });
  }

  return builder.getSpec();
}

function buildOperation(
  route: RouteInfo,
  method: MethodInfo,
  config: SvelteKitOpenAPIConfig,
): OperationObject {
  const operation: OperationObject = {
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
    operation.parameters = method.params.map((p): ParameterObject => ({
      name: p.name,
      in: p.in,
      required: p.required,
      schema: { type: p.type as SchemaObjectType },
      ...(p.description ? { description: p.description } : {}),
    }));
  }

  // Request body
  if (method.requestBody) {
    const rb = method.requestBody;
    let schema: SchemaObject | ReferenceObject;

    if (rb.schemaRef) {
      schema = { $ref: `#/components/schemas/${rb.schemaRef}` };
    } else if (rb.fields.length > 0) {
      const properties: Record<string, SchemaObject> = {};
      for (const field of rb.fields) {
        properties[field.name] = { type: field.type as SchemaObjectType };
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
    } as RequestBodyObject;
  }

  // Responses
  for (const resp of method.responses) {
    const responseObj: ResponseObject = {
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
          schema: resp.schema as SchemaObject,
        },
      };
    }

    operation.responses![String(resp.statusCode)] = responseObj;
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

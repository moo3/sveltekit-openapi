/** Configuration options for the OpenAPI generator. */
export interface SvelteKitOpenAPIConfig {
  /** Directory containing SvelteKit routes. Default: `'src/routes'` */
  routesDir?: string;
  /** Glob patterns for API route files. Default: `['**\/+server.ts']` */
  include?: string[];
  /** Glob patterns to exclude. */
  exclude?: string[];
  /** Output file path. Default: `'openapi.json'` */
  output?: string;
  /** Output format. Default: `'json'` */
  format?: 'json' | 'yaml';
  /** OpenAPI info object (title, version, description). */
  info?: {
    title?: string;
    version?: string;
    description?: string;
  };
  /** Server URLs included in the generated spec. */
  servers?: Array<{ url: string; description?: string }>;
  /** Auth detection configuration. */
  auth?: {
    /** Function names that indicate authentication. Default: `['requireAuth', 'requireRole']` */
    patterns?: string[];
    /** OpenAPI security scheme definition. Default: Bearer JWT. */
    securityScheme?: { type: string; scheme?: string; bearerFormat?: string; description?: string };
  };
  /** Tag generation configuration. */
  tags?: {
    /** Path segment index to use for tags (0-based, after stripping `/api/vN/`). */
    segmentIndex?: number;
  };
  /** Glob patterns for schema files containing Zod definitions. */
  schemaFiles?: string[];
  /** Viewer theme for the serve command and Vite plugin. Default: `'swagger'` */
  viewer?: 'swagger' | 'scalar' | 'redoc';
}

/** A discovered `+server.ts` route file with its OpenAPI path and parameters. */
export interface ScannedRoute {
  /** Absolute file path to the `+server.ts` file. */
  filePath: string;
  /** OpenAPI-formatted route path (e.g. `/api/v1/users/{id}`). */
  routePath: string;
  /** Path parameter names extracted from the filesystem route. */
  pathParams: string[];
}

/** Supported HTTP methods. */
export type HttpMethod = 'get' | 'post' | 'put' | 'patch' | 'delete';

/** A path or query parameter detected in a route handler. */
export interface ParamInfo {
  /** Parameter name. */
  name: string;
  /** Where the parameter appears: `'path'` or `'query'`. */
  in: 'path' | 'query';
  /** Whether the parameter is required. Path params are always required. */
  required: boolean;
  /** Parameter type (e.g. `'string'`). */
  type: string;
  /** Optional description. */
  description?: string;
}

/** Request body information extracted from a route handler. */
export interface RequestBodyInfo {
  /** Whether the request body is required. */
  required: boolean;
  /** Fields detected from destructured `event.request.json()`. */
  fields: Array<{ name: string; type: string; required: boolean }>;
  /** Reference to a Zod schema component name, if detected via `.parse()`. */
  schemaRef?: string;
}

/** A response detected from a `json()` call in a route handler. */
export interface ResponseInfo {
  /** HTTP status code (e.g. 200, 201, 400). */
  statusCode: number;
  /** Human-readable description (e.g. "Success", "Bad Request"). */
  description: string;
  /** JSON Schema for the response body, if inferable. */
  schema?: Record<string, unknown>;
  /** Reference to a named schema component. */
  schemaRef?: string;
}

/** Authentication or authorization requirement detected in a route handler. */
export interface SecurityInfo {
  /** `'auth'` for `requireAuth()`, `'role'` for `requireRole()`. */
  type: 'auth' | 'role';
  /** Role names extracted from `requireRole(event, 'admin', ...)` arguments. */
  roles?: string[];
}

/** Complete analysis of a single HTTP method handler in a route file. */
export interface MethodInfo {
  /** HTTP method (get, post, put, patch, delete). */
  method: HttpMethod;
  /** Path and query parameters. */
  params: ParamInfo[];
  /** Request body information, if the handler reads `event.request.json()`. */
  requestBody?: RequestBodyInfo;
  /** All responses detected from `json()` calls. */
  responses: ResponseInfo[];
  /** Authentication/authorization requirements. */
  security: SecurityInfo[];
  /** Inference tier: 1 (auto), 2 (Zod schema), or 3 (fallback). */
  tier: 1 | 2 | 3;
}

/** A parsed API route with all its HTTP method handlers. */
export interface RouteInfo {
  /** OpenAPI-formatted route path. */
  routePath: string;
  /** Absolute file path to the source `+server.ts`. */
  filePath: string;
  /** Analyzed HTTP method handlers. */
  methods: MethodInfo[];
}

/** A named JSON Schema component extracted from a Zod schema with `.openapi('Name')`. */
export interface SchemaComponent {
  /** Component name from `.openapi('Name')`. */
  name: string;
  /** JSON Schema object. */
  schema: Record<string, unknown>;
}

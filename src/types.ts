export interface SvelteKitOpenAPIConfig {
  /** Directory containing SvelteKit routes. Default: 'src/routes' */
  routesDir?: string;
  /** Glob patterns for API route files. Default: ['** /+server.ts'] (no space) */
  include?: string[];
  /** Glob patterns to exclude */
  exclude?: string[];
  /** Output file path. Default: 'openapi.json' */
  output?: string;
  /** Output format. Default: 'json' */
  format?: 'json' | 'yaml';
  /** OpenAPI info object */
  info?: {
    title?: string;
    version?: string;
    description?: string;
  };
  /** Server URLs */
  servers?: Array<{ url: string; description?: string }>;
  /** Auth detection config */
  auth?: {
    /** Function names that indicate authentication. Default: ['requireAuth', 'requireRole'] */
    patterns?: string[];
    /** OpenAPI security scheme. Default: Bearer JWT */
    securityScheme?: { type: string; scheme?: string; bearerFormat?: string; description?: string };
  };
  /** Tag generation config */
  tags?: {
    /** Path segment index to use for tags (0-based, after stripping /api/vN/) */
    segmentIndex?: number;
  };
  // Glob patterns for schema files containing Zod definitions
  schemaFiles?: string[];
  /** Viewer theme for serve command and Vite plugin. Default: 'swagger' */
  viewer?: 'swagger' | 'scalar' | 'redoc';
}

export interface ScannedRoute {
  filePath: string;
  routePath: string;
  pathParams: string[];
}

export type HttpMethod = 'get' | 'post' | 'put' | 'patch' | 'delete';

export interface ParamInfo {
  name: string;
  in: 'path' | 'query';
  required: boolean;
  type: string;
  description?: string;
}

export interface RequestBodyInfo {
  required: boolean;
  fields: Array<{ name: string; type: string; required: boolean }>;
  schemaRef?: string;
}

export interface ResponseInfo {
  statusCode: number;
  description: string;
  schema?: Record<string, unknown>;
  schemaRef?: string;
}

export interface SecurityInfo {
  type: 'auth' | 'role';
  roles?: string[];
}

export interface MethodInfo {
  method: HttpMethod;
  params: ParamInfo[];
  requestBody?: RequestBodyInfo;
  responses: ResponseInfo[];
  security: SecurityInfo[];
  tier: 1 | 2 | 3;
}

export interface RouteInfo {
  routePath: string;
  filePath: string;
  methods: MethodInfo[];
}

export interface SchemaComponent {
  name: string;
  schema: Record<string, unknown>;
}

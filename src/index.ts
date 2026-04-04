import { Project } from 'ts-morph';
import fs from 'fs/promises';
import path from 'path';
import { stringify as yamlStringify } from 'yaml';
import { scanRoutes } from './core/scanner.js';
import { parseAllRoutes } from './core/parser.js';
import { SchemaExtractor } from './core/schema-extractor.js';
import { generateOpenAPIDocument } from './core/generator.js';
import type { SvelteKitOpenAPIConfig, RouteInfo, SchemaComponent } from './types.js';
import type { OpenAPIV3_1 } from './openapi-types.js';

export type { SvelteKitOpenAPIConfig, RouteInfo, SchemaComponent };
export type { OpenAPIV3_1 };
export { createViewerHtml, type ViewerTheme } from './viewer.js';

export interface GenerateResult {
  document: OpenAPIV3_1.Document;
  outputPath: string;
  routeCount: number;
  endpointCount: number;
}

/**
 * Generate an OpenAPI document from SvelteKit API routes.
 */
export async function generate(config: SvelteKitOpenAPIConfig = {}): Promise<GenerateResult> {
  const resolvedConfig = resolveConfig(config);

  // 1. Scan for route files
  const routes = await scanRoutes(resolvedConfig);

  // 2. Initialize ts-morph project
  const project = new Project({
    skipAddingFilesFromTsConfig: true,
    compilerOptions: {
      allowJs: true,
      skipLibCheck: true,
    },
  });

  // 3. Extract Zod schemas if schema files are configured
  let schemaComponents: SchemaComponent[] = [];
  const schemaExtractor = new SchemaExtractor(project);

  if (resolvedConfig.schemaFiles && resolvedConfig.schemaFiles.length > 0) {
    schemaComponents = await schemaExtractor.extractFromFiles(resolvedConfig.schemaFiles);
  }

  // 4. Parse all routes
  const routeInfos = parseAllRoutes(project, routes, resolvedConfig);

  // 5. Link schema refs to component names
  for (const route of routeInfos) {
    for (const method of route.methods) {
      if (method.requestBody?.schemaRef) {
        const varSchema = schemaExtractor.getSchemaForVariable(method.requestBody.schemaRef);
        if (varSchema) {
          // Find the component name for this variable
          for (const [compName, compSchema] of schemaExtractor.getComponents()) {
            if (compSchema === varSchema) {
              method.requestBody.schemaRef = compName;
              break;
            }
          }
        }
      }
    }
  }

  // 6. Generate OpenAPI document
  const document = generateOpenAPIDocument(routeInfos, schemaComponents, resolvedConfig);

  // 7. Write output
  const outputPath = resolvedConfig.output || 'openapi.json';
  const format = resolvedConfig.format || (outputPath.endsWith('.yaml') || outputPath.endsWith('.yml') ? 'yaml' : 'json');

  const content = format === 'yaml'
    ? yamlStringify(document)
    : JSON.stringify(document, null, 2);

  await fs.mkdir(path.dirname(path.resolve(outputPath)), { recursive: true });
  await fs.writeFile(path.resolve(outputPath), content, 'utf-8');

  const endpointCount = routeInfos.reduce((sum, r) => sum + r.methods.length, 0);

  return {
    document,
    outputPath: path.resolve(outputPath),
    routeCount: routeInfos.length,
    endpointCount,
  };
}

function resolveConfig(config: SvelteKitOpenAPIConfig): SvelteKitOpenAPIConfig {
  return {
    routesDir: config.routesDir || 'src/routes',
    include: config.include || ['**/+server.ts'],
    exclude: config.exclude || [],
    output: config.output || 'openapi.json',
    format: config.format || 'json',
    info: {
      title: config.info?.title || 'SvelteKit API',
      version: config.info?.version || '1.0.0',
      description: config.info?.description,
    },
    servers: config.servers || [],
    auth: {
      patterns: config.auth?.patterns || ['requireAuth', 'requireRole'],
      securityScheme: config.auth?.securityScheme,
    },
    tags: config.tags || {},
    schemaFiles: config.schemaFiles || [],
  };
}

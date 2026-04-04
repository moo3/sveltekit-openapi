#!/usr/bin/env node
import { Command } from 'commander';
import { generate } from './index.js';
import type { SvelteKitOpenAPIConfig } from './types.js';
import { createViewerHtml, type ViewerTheme } from './viewer.js';
import fs from 'fs/promises';
import path from 'path';
import http from 'http';
import { pathToFileURL } from 'url';

const program = new Command();

program
  .name('sveltekit-openapi')
  .description('Auto-generate OpenAPI 3.1 docs from SvelteKit API routes')
  .version('0.1.0');

program
  .command('generate', { isDefault: true })
  .description('Generate OpenAPI documentation')
  .option('-c, --config <path>', 'Path to config file')
  .option('-o, --output <path>', 'Output file path')
  .option('-f, --format <format>', 'Output format (json or yaml)', 'json')
  .option('-r, --routes-dir <path>', 'Routes directory', 'src/routes')
  .option('-s, --schema-files <patterns...>', 'Glob patterns for schema files')
  .option('--title <title>', 'API title')
  .option('--api-version <version>', 'API version')
  .action(async (options) => {
    try {
      const config = await loadConfig(options);
      const result = await generate(config);

      console.log(`\n  OpenAPI spec generated successfully!`);
      console.log(`  Output: ${result.outputPath}`);
      console.log(`  Routes: ${result.routeCount}`);
      console.log(`  Endpoints: ${result.endpointCount}\n`);
    } catch (err) {
      console.error('Error generating OpenAPI spec:', err instanceof Error ? err.message : err);
      process.exit(1);
    }
  });

program
  .command('preview')
  .description('Preview discovered routes without generating')
  .option('-c, --config <path>', 'Path to config file')
  .option('-r, --routes-dir <path>', 'Routes directory', 'src/routes')
  .action(async (options) => {
    try {
      const config = await loadConfig(options);
      const { scanRoutes } = await import('./core/scanner.js');
      const routes = await scanRoutes(config);

      console.log(`\n  Discovered ${routes.length} API routes:\n`);
      for (const route of routes) {
        const params = route.pathParams.length > 0
          ? ` (params: ${route.pathParams.join(', ')})`
          : '';
        console.log(`    ${route.routePath}${params}`);
      }
      console.log();
    } catch (err) {
      console.error('Error scanning routes:', err instanceof Error ? err.message : err);
      process.exit(1);
    }
  });

program
  .command('serve')
  .description('Generate and serve API docs with interactive viewer')
  .option('-c, --config <path>', 'Path to config file')
  .option('-o, --output <path>', 'Output file path')
  .option('-r, --routes-dir <path>', 'Routes directory', 'src/routes')
  .option('-s, --schema-files <patterns...>', 'Glob patterns for schema files')
  .option('-p, --port <port>', 'Port to serve on', '4242')
  .option('--title <title>', 'API title')
  .option('--api-version <version>', 'API version')
  .option('-t, --theme <theme>', 'Viewer theme: swagger, scalar, or redoc', 'swagger')
  .option('--open', 'Open browser automatically')
  .action(async (options) => {
    try {
      const config = await loadConfig(options);
      const result = await generate(config);
      const specJson = JSON.stringify(result.document, null, 2);
      const title = result.document.info.title || 'API Reference';
      const port = parseInt(options.port as string, 10) || 4242;
      const theme = (options.theme || 'swagger') as ViewerTheme;

      const viewerHtml = createViewerHtml({ specJson, title, theme });

      const server = http.createServer((req, res) => {
        if (req.url === '/openapi.json') {
          res.writeHead(200, {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          });
          res.end(specJson);
        } else {
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(viewerHtml);
        }
      });

      server.listen(port, () => {
        const themeLabel = { swagger: 'Swagger UI', scalar: 'Scalar', redoc: 'Redoc' }[theme];
        console.log(`\n  API docs server running!  (${themeLabel})\n`);
        console.log(`  Viewer:  http://localhost:${port}`);
        console.log(`  Spec:    http://localhost:${port}/openapi.json`);
        console.log(`  Routes:  ${result.routeCount}`);
        console.log(`  Endpoints: ${result.endpointCount}`);
        console.log(`\n  Press Ctrl+C to stop.\n`);
      });

      if (options.open) {
        const { exec } = await import('child_process');
        const cmd = process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'start' : 'xdg-open';
        exec(`${cmd} http://localhost:${port}`);
      }
    } catch (err) {
      console.error('Error:', err instanceof Error ? err.message : err);
      process.exit(1);
    }
  });

async function loadConfig(options: Record<string, unknown>): Promise<SvelteKitOpenAPIConfig> {
  let fileConfig: SvelteKitOpenAPIConfig = {};

  // Try loading config file
  const configPath = options.config as string | undefined;
  if (configPath) {
    fileConfig = await importConfig(configPath);
  } else {
    // Auto-detect config files
    const candidates = [
      'sveltekit-openapi.config.ts',
      'sveltekit-openapi.config.js',
      'sveltekit-openapi.config.mjs',
    ];

    for (const candidate of candidates) {
      const fullPath = path.resolve(candidate);
      try {
        await fs.access(fullPath);
        fileConfig = await importConfig(fullPath);
        break;
      } catch {
        // File doesn't exist, try next
      }
    }
  }

  // CLI options override file config
  const config: SvelteKitOpenAPIConfig = { ...fileConfig };

  if (options.output) config.output = options.output as string;
  if (options.format) config.format = options.format as 'json' | 'yaml';
  if (options.routesDir) config.routesDir = options.routesDir as string;
  if (options.schemaFiles) config.schemaFiles = options.schemaFiles as string[];
  if (options.title || options.apiVersion) {
    config.info = {
      ...config.info,
      ...(options.title ? { title: options.title as string } : {}),
      ...(options.apiVersion ? { version: options.apiVersion as string } : {}),
    };
  }

  return config;
}

async function importConfig(filePath: string): Promise<SvelteKitOpenAPIConfig> {
  const resolved = path.resolve(filePath);
  const url = pathToFileURL(resolved).href;
  const mod = await import(url);
  return mod.default || mod;
}

program.parse();

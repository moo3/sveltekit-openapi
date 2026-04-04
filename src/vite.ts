import type { Plugin, ViteDevServer } from 'vite';
import { generate } from './index.js';
import type { SvelteKitOpenAPIConfig } from './types.js';
import { createViewerHtml, type ViewerTheme } from './viewer.js';
import path from 'path';

/**
 * Vite plugin that auto-generates OpenAPI docs from SvelteKit routes.
 *
 * Usage in vite.config.ts:
 *   import { sveltekitOpenApi } from '@sveltekit-openapi/core/vite';
 *   export default defineConfig({ plugins: [sveltekitOpenApi()] });
 */
export function sveltekitOpenApi(config: SvelteKitOpenAPIConfig = {}): Plugin {
  let root: string;
  let debounceTimer: ReturnType<typeof setTimeout> | undefined;
  let cachedSpec: string | undefined;

  async function regenerate() {
    try {
      const resolvedConfig = {
        ...config,
        routesDir: config.routesDir || path.join(root, 'src/routes'),
        schemaFiles: config.schemaFiles?.map((p) =>
          path.isAbsolute(p) ? p : path.join(root, p)
        ),
      };

      const result = await generate(resolvedConfig);
      cachedSpec = JSON.stringify(result.document, null, 2);
      console.log(`[sveltekit-openapi] Generated: ${result.endpointCount} endpoints from ${result.routeCount} routes`);
    } catch (err) {
      console.error('[sveltekit-openapi] Generation failed:', err instanceof Error ? err.message : err);
    }
  }

  function debouncedRegenerate() {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(regenerate, 300);
  }

  return {
    name: 'sveltekit-openapi',

    configResolved(resolvedConfig) {
      root = resolvedConfig.root;
    },

    async buildStart() {
      await regenerate();
    },

    configureServer(server: ViteDevServer) {
      // Serve interactive viewer at /_openapi
      server.middlewares.use('/_openapi', (req, res, next) => {
        if (req.url === '/spec.json' || req.url === '/_openapi/spec.json') {
          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.end(cachedSpec || '{}');
        } else {
          const title = config.info?.title || 'API Reference';
          const theme = (config.viewer || 'swagger') as ViewerTheme;
          res.setHeader('Content-Type', 'text/html');
          res.end(createViewerHtml({ specUrl: '/_openapi/spec.json', title, theme }));
        }
      });

      // Watch for changes to +server.ts and schema files
      server.watcher.on('change', (filePath) => {
        if (filePath.endsWith('+server.ts') || filePath.includes('/schemas/')) {
          debouncedRegenerate();
        }
      });

      server.watcher.on('add', (filePath) => {
        if (filePath.endsWith('+server.ts')) {
          debouncedRegenerate();
        }
      });

      server.watcher.on('unlink', (filePath) => {
        if (filePath.endsWith('+server.ts')) {
          debouncedRegenerate();
        }
      });
    },
  };
}

export default sveltekitOpenApi;

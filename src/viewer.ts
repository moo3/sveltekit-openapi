export type ViewerTheme = 'swagger' | 'scalar' | 'redoc';

interface ViewerOptions {
  specUrl?: string;
  specJson?: string;
  title?: string;
  theme?: ViewerTheme;
}

/**
 * Generate a self-contained HTML page that renders an OpenAPI spec.
 *
 * Themes:
 *   - swagger: Classic Swagger UI (default)
 *   - scalar:  Modern Scalar API Reference
 *   - redoc:   Clean Redoc documentation
 *
 * All loaded from CDN — zero install.
 */
export function createViewerHtml(options: ViewerOptions): string {
  const theme = options.theme || 'swagger';
  const title = options.title || 'API Reference';

  switch (theme) {
    case 'swagger':
      return swaggerHtml(options.specUrl, options.specJson, title);
    case 'scalar':
      return scalarHtml(options.specUrl, options.specJson, title);
    case 'redoc':
      return redocHtml(options.specUrl, options.specJson, title);
    default:
      return swaggerHtml(options.specUrl, options.specJson, title);
  }
}

// Legacy exports for backward compatibility
export { createViewerHtml as createViewerHtmlInline };

function swaggerHtml(specUrl?: string, specJson?: string, title: string = 'API Reference'): string {
  const specSource = specJson
    ? `spec: ${specJson}`
    : `url: "${escapeHtml(specUrl || '/openapi.json')}"`;

  return `<!doctype html>
<html>
  <head>
    <title>${escapeHtml(title)}</title>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui.css" />
    <style>
      body { margin: 0; background: #fafafa; }
      .topbar { display: none; }
    </style>
  </head>
  <body>
    <div id="swagger-ui"></div>
    <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
    <script>
      SwaggerUIBundle({
        dom_id: '#swagger-ui',
        ${specSource},
        deepLinking: true,
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIBundle.SwaggerUIStandalonePreset,
        ],
        layout: "BaseLayout",
      });
    </script>
  </body>
</html>`;
}

function scalarHtml(specUrl?: string, specJson?: string, title: string = 'API Reference'): string {
  if (specJson) {
    return `<!doctype html>
<html>
  <head>
    <title>${escapeHtml(title)}</title>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>body { margin: 0; }</style>
  </head>
  <body>
    <script
      id="api-reference"
      type="application/json"
    >${specJson}</script>
    <script>
      document.getElementById('api-reference').dataset.configuration = ${JSON.stringify(JSON.stringify({
        theme: 'kepler',
        layout: 'modern',
      }))};
    </script>
    <script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"></script>
  </body>
</html>`;
  }

  return `<!doctype html>
<html>
  <head>
    <title>${escapeHtml(title)}</title>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>body { margin: 0; }</style>
  </head>
  <body>
    <script
      id="api-reference"
      data-url="${escapeHtml(specUrl || '/openapi.json')}"
      data-configuration="${escapeHtml(JSON.stringify({
        theme: 'kepler',
        layout: 'modern',
      }))}"
    ></script>
    <script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"></script>
  </body>
</html>`;
}

function redocHtml(specUrl?: string, specJson?: string, title: string = 'API Reference'): string {
  const specSource = specJson
    ? `Redoc.init(${specJson}, { scrollYOffset: 0, theme: { colors: { primary: { main: '#e44d26' } } } }, document.getElementById('redoc'));`
    : `Redoc.init("${escapeHtml(specUrl || '/openapi.json')}", { scrollYOffset: 0, theme: { colors: { primary: { main: '#e44d26' } } } }, document.getElementById('redoc'));`;

  return `<!doctype html>
<html>
  <head>
    <title>${escapeHtml(title)}</title>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>body { margin: 0; }</style>
  </head>
  <body>
    <div id="redoc"></div>
    <script src="https://cdn.jsdelivr.net/npm/redoc@2/bundles/redoc.standalone.js"></script>
    <script>
      ${specSource}
    </script>
  </body>
</html>`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

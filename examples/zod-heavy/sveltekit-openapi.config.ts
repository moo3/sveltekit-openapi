export default {
  routesDir: 'src/routes',
  output: 'openapi.json',
  schemaFiles: ['src/lib/schemas/*.ts'],
  info: {
    title: 'Zod-Heavy API',
    version: '1.0.0',
    description: 'Tests Tier 2 Zod extraction: nested objects, arrays, enums, nullable, .openapi() metadata.',
  },
};

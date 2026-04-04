export default {
  routesDir: 'src/routes',
  output: 'openapi.json',
  info: {
    title: 'Auth Patterns API',
    version: '1.0.0',
    description: 'Tests auth detection: public (no auth), requireAuth, requireRole single, requireRole multi.',
  },
  auth: {
    patterns: ['requireAuth', 'requireRole'],
  },
};

import { describe, it, expect } from 'vitest';
import { createViewerHtml } from '../src/viewer.js';

describe('createViewerHtml', () => {
  describe('swagger theme', () => {
    it('includes swagger-ui CDN', () => {
      const html = createViewerHtml({ specUrl: '/spec.json', theme: 'swagger' });
      expect(html).toContain('swagger-ui-dist');
      expect(html).toContain('swagger-ui-bundle.js');
      expect(html).toContain('swagger-ui');
    });

    it('uses specUrl in config', () => {
      const html = createViewerHtml({ specUrl: '/my-api/spec.json', theme: 'swagger' });
      expect(html).toContain('/my-api/spec.json');
    });

    it('inlines spec JSON when provided', () => {
      const spec = '{"openapi":"3.1.0"}';
      const html = createViewerHtml({ specJson: spec, theme: 'swagger' });
      expect(html).toContain('spec: {"openapi":"3.1.0"}');
    });
  });

  describe('scalar theme', () => {
    it('includes scalar CDN', () => {
      const html = createViewerHtml({ specUrl: '/spec.json', theme: 'scalar' });
      expect(html).toContain('@scalar/api-reference');
    });

    it('sets data-url for URL mode', () => {
      const html = createViewerHtml({ specUrl: '/spec.json', theme: 'scalar' });
      expect(html).toContain('data-url="/spec.json"');
    });

    it('inlines spec JSON when provided', () => {
      const spec = '{"openapi":"3.1.0"}';
      const html = createViewerHtml({ specJson: spec, theme: 'scalar' });
      expect(html).toContain('type="application/json"');
      expect(html).toContain(spec);
    });
  });

  describe('redoc theme', () => {
    it('includes redoc CDN', () => {
      const html = createViewerHtml({ specUrl: '/spec.json', theme: 'redoc' });
      expect(html).toContain('redoc.standalone.js');
    });

    it('calls Redoc.init with URL', () => {
      const html = createViewerHtml({ specUrl: '/spec.json', theme: 'redoc' });
      expect(html).toContain('Redoc.init("/spec.json"');
    });

    it('inlines spec JSON when provided', () => {
      const spec = '{"openapi":"3.1.0"}';
      const html = createViewerHtml({ specJson: spec, theme: 'redoc' });
      expect(html).toContain('Redoc.init({"openapi":"3.1.0"}');
    });
  });

  describe('defaults', () => {
    it('defaults to swagger theme', () => {
      const html = createViewerHtml({ specUrl: '/spec.json' });
      expect(html).toContain('swagger-ui');
    });

    it('defaults title to API Reference', () => {
      const html = createViewerHtml({ specUrl: '/spec.json' });
      expect(html).toContain('<title>API Reference</title>');
    });

    it('uses custom title', () => {
      const html = createViewerHtml({ specUrl: '/spec.json', title: 'My Custom API' });
      expect(html).toContain('<title>My Custom API</title>');
    });

    it('escapes HTML in title', () => {
      const html = createViewerHtml({ specUrl: '/spec.json', title: '<script>alert("xss")</script>' });
      expect(html).not.toContain('<script>alert');
      expect(html).toContain('&lt;script&gt;');
    });
  });
});

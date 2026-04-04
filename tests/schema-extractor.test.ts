import { describe, it, expect } from 'vitest';
import { Project } from 'ts-morph';
import { SchemaExtractor } from '../src/core/schema-extractor.js';
import path from 'path';

describe('SchemaExtractor', () => {
  it('extracts Zod object schema with properties', async () => {
    const project = new Project({ skipAddingFilesFromTsConfig: true });
    const extractor = new SchemaExtractor(project);

    const fixtureFile = path.resolve(__dirname, 'fixtures/zod-schema/schemas.ts');
    const components = await extractor.extractFromFiles([fixtureFile]);

    expect(components).toHaveLength(1);
    expect(components[0].name).toBe('CreateItemRequest');

    const schema = components[0].schema as any;
    expect(schema.type).toBe('object');
    expect(schema.properties.name.type).toBe('string');
    expect(schema.properties.name.minLength).toBe(1);
    expect(schema.properties.name.maxLength).toBe(100);
    expect(schema.properties.name.example).toBe('My Item');
  });

  it('extracts number with int modifier', async () => {
    const project = new Project({ skipAddingFilesFromTsConfig: true });
    const extractor = new SchemaExtractor(project);

    const fixtureFile = path.resolve(__dirname, 'fixtures/zod-schema/schemas.ts');
    await extractor.extractFromFiles([fixtureFile]);

    const schema = extractor.getComponent('CreateItemRequest') as any;
    expect(schema.properties.quantity.type).toBe('integer');
    expect(schema.properties.quantity.minimum).toBe(0);
    expect(schema.properties.quantity.example).toBe(5);
  });

  it('extracts enum values', async () => {
    const project = new Project({ skipAddingFilesFromTsConfig: true });
    const extractor = new SchemaExtractor(project);

    const fixtureFile = path.resolve(__dirname, 'fixtures/zod-schema/schemas.ts');
    await extractor.extractFromFiles([fixtureFile]);

    const schema = extractor.getComponent('CreateItemRequest') as any;
    expect(schema.properties.status.enum).toEqual(['active', 'inactive']);
    expect(schema.properties.status.default).toBe('active');
  });

  it('marks optional fields correctly', async () => {
    const project = new Project({ skipAddingFilesFromTsConfig: true });
    const extractor = new SchemaExtractor(project);

    const fixtureFile = path.resolve(__dirname, 'fixtures/zod-schema/schemas.ts');
    await extractor.extractFromFiles([fixtureFile]);

    const schema = extractor.getComponent('CreateItemRequest') as any;
    // tags is optional, so not in required
    expect(schema.required).not.toContain('tags');
    // name and quantity are required
    expect(schema.required).toContain('name');
    expect(schema.required).toContain('quantity');
  });

  it('stores schema by variable name', async () => {
    const project = new Project({ skipAddingFilesFromTsConfig: true });
    const extractor = new SchemaExtractor(project);

    const fixtureFile = path.resolve(__dirname, 'fixtures/zod-schema/schemas.ts');
    await extractor.extractFromFiles([fixtureFile]);

    const schema = extractor.getSchemaForVariable('createItemSchema');
    expect(schema).toBeDefined();
    expect((schema as any).type).toBe('object');
  });
});

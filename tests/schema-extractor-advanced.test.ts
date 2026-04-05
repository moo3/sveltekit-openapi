import { describe, it, expect } from 'vitest';
import { Project } from 'ts-morph';
import { SchemaExtractor } from '../src/core/schema-extractor.js';
import path from 'path';

const advancedFile = path.resolve(__dirname, 'fixtures/zod-schema/advanced-schemas.ts');

function getExtractor() {
  const project = new Project({ skipAddingFilesFromTsConfig: true });
  const extractor = new SchemaExtractor(project);
  return extractor;
}

describe('SchemaExtractor — nullable', () => {
  it('converts nullable to union type with null', async () => {
    const ext = getExtractor();
    await ext.extractFromFiles([advancedFile]);
    const schema = ext.getComponent('Profile') as any;

    expect(schema.properties.bio.type).toEqual(['string', 'null']);
  });

  it('marks nullable fields as not required', async () => {
    const ext = getExtractor();
    await ext.extractFromFiles([advancedFile]);
    const schema = ext.getComponent('Profile') as any;

    // name is required, bio is nullable but not optional, website is optional
    expect(schema.required).toContain('name');
    expect(schema.required).toContain('bio');
    expect(schema.required).not.toContain('website');
  });
});

describe('SchemaExtractor — nested objects', () => {
  it('extracts nested z.object() recursively', async () => {
    const ext = getExtractor();
    await ext.extractFromFiles([advancedFile]);
    const schema = ext.getComponent('Address') as any;

    expect(schema.properties.location).toBeDefined();
    expect(schema.properties.location.type).toBe('object');
    expect(schema.properties.location.properties.lat.type).toBe('number');
    expect(schema.properties.location.properties.lng.type).toBe('number');
  });
});

describe('SchemaExtractor — arrays of objects', () => {
  it('extracts array with object items', async () => {
    const ext = getExtractor();
    await ext.extractFromFiles([advancedFile]);
    const schema = ext.getComponent('Team') as any;

    expect(schema.properties.members.type).toBe('array');
    expect(schema.properties.members.items).toBeDefined();
    expect(schema.properties.members.items.type).toBe('object');
    expect(schema.properties.members.items.properties.userId.type).toBe('string');
    expect(schema.properties.members.items.properties.userId.format).toBe('uuid');
    expect(schema.properties.members.items.properties.role.enum).toEqual(['owner', 'admin', 'member']);
  });
});

describe('SchemaExtractor — describe and chained metadata', () => {
  it('extracts .describe() text', async () => {
    const ext = getExtractor();
    await ext.extractFromFiles([advancedFile]);
    const schema = ext.getComponent('Email') as any;

    expect(schema.description).toBe('A valid email address');
    expect(schema.format).toBe('email');
    expect(schema.example).toBe('user@example.com');
    expect(schema.minLength).toBe(5);
    expect(schema.maxLength).toBe(254);
  });
});

describe('SchemaExtractor — boolean defaults', () => {
  it('extracts boolean default values', async () => {
    const ext = getExtractor();
    await ext.extractFromFiles([advancedFile]);
    const schema = ext.getComponent('Settings') as any;

    expect(schema.properties.darkMode.default).toBe(false);
    expect(schema.properties.notifications.default).toBe(true);
    expect(schema.properties.language.default).toBe('en');
  });
});

describe('SchemaExtractor — empty object', () => {
  it('handles z.object({}) gracefully', async () => {
    const ext = getExtractor();
    await ext.extractFromFiles([advancedFile]);
    const schema = ext.getComponent('EmptyObject') as any;

    expect(schema.type).toBe('object');
    expect(schema.properties).toEqual({});
  });
});

describe('SchemaExtractor — url format', () => {
  it('extracts .url() as format: uri', async () => {
    const ext = getExtractor();
    await ext.extractFromFiles([advancedFile]);
    const schema = ext.getComponent('Profile') as any;

    expect(schema.properties.website.format).toBe('uri');
  });
});

import { z } from 'zod';

export const createCategorySchema = z.object({
  name: z.string().min(1).max(100).openapi({ example: 'Electronics' }),
  slug: z.string().min(1).max(100).openapi({ example: 'electronics' }),
  parentId: z.string().uuid().nullable().optional().openapi({ description: 'Parent category ID for nesting' }),
  description: z.string().max(500).optional(),
  sortOrder: z.number().int().min(0).default(0),
}).openapi('CreateCategoryRequest');

export const categoryResponseSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  slug: z.string(),
  parentId: z.string().uuid().nullable(),
  productCount: z.number().int(),
  createdAt: z.string().datetime(),
}).openapi('Category');

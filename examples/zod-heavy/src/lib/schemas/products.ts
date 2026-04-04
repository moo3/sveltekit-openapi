import { z } from 'zod';

export const createProductSchema = z.object({
  name: z.string().min(1).max(200).openapi({ example: 'Wireless Mouse' }),
  description: z.string().max(2000).optional().openapi({ example: 'Ergonomic wireless mouse with USB-C receiver' }),
  price: z.number().min(0).openapi({ example: 29.99 }),
  currency: z.enum(['USD', 'EUR', 'GBP']).default('USD'),
  sku: z.string().min(3).max(50).openapi({ example: 'WM-001' }),
  category: z.string().uuid().openapi({ description: 'Category ID' }),
  tags: z.array(z.string()).optional(),
  weight: z.number().min(0).optional().openapi({ example: 0.15, description: 'Weight in kg' }),
  dimensions: z.object({
    width: z.number().min(0),
    height: z.number().min(0),
    depth: z.number().min(0),
  }).optional(),
  isActive: z.boolean().default(true),
}).openapi('CreateProductRequest');

export const updateProductSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
  price: z.number().min(0).optional(),
  isActive: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
}).openapi('UpdateProductRequest');

export const productResponseSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string().nullable(),
  price: z.number(),
  currency: z.enum(['USD', 'EUR', 'GBP']),
  sku: z.string(),
  category: z.string().uuid(),
  tags: z.array(z.string()),
  isActive: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
}).openapi('Product');

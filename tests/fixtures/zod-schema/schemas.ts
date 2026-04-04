import { z } from 'zod';

export const createItemSchema = z.object({
  name: z.string().min(1).max(100).openapi({ example: 'My Item' }),
  quantity: z.number().int().min(0).openapi({ example: 5 }),
  tags: z.array(z.string()).optional(),
  status: z.enum(['active', 'inactive']).default('active'),
}).openapi('CreateItemRequest');

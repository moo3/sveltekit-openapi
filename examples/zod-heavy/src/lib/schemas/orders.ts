import { z } from 'zod';

const orderItemSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().min(1).max(100),
  unitPrice: z.number().min(0),
}).openapi('OrderItem');

export const createOrderSchema = z.object({
  items: z.array(orderItemSchema).min(1).openapi({ description: 'At least one item required' }),
  shippingAddress: z.object({
    street: z.string().min(1),
    city: z.string().min(1),
    state: z.string().min(1),
    zip: z.string().min(5).max(10),
    country: z.string().length(2).openapi({ example: 'US', description: 'ISO 3166-1 alpha-2' }),
  }).openapi('ShippingAddress'),
  notes: z.string().max(500).optional(),
  couponCode: z.string().optional(),
}).openapi('CreateOrderRequest');

export const orderStatusSchema = z.enum([
  'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled',
]).openapi('OrderStatus');

export const orderResponseSchema = z.object({
  id: z.string().uuid(),
  status: orderStatusSchema,
  items: z.array(orderItemSchema),
  subtotal: z.number(),
  tax: z.number(),
  total: z.number(),
  createdAt: z.string().datetime(),
}).openapi('Order');

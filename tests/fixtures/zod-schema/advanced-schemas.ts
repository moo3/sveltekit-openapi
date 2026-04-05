import { z } from 'zod';

// Nullable string
export const profileSchema = z.object({
  name: z.string().min(1),
  bio: z.string().nullable(),
  website: z.string().url().optional(),
}).openapi('Profile');

// Nested object
export const addressSchema = z.object({
  street: z.string(),
  city: z.string(),
  location: z.object({
    lat: z.number(),
    lng: z.number(),
  }),
}).openapi('Address');

// Array of objects
export const teamSchema = z.object({
  name: z.string(),
  members: z.array(z.object({
    userId: z.string().uuid(),
    role: z.enum(['owner', 'admin', 'member']),
  })),
}).openapi('Team');

// Long chain with describe
export const emailSchema = z.string()
  .email()
  .min(5)
  .max(254)
  .describe('A valid email address')
  .openapi({ example: 'user@example.com' })
  .openapi('Email');

// Boolean default
export const settingsSchema = z.object({
  darkMode: z.boolean().default(false),
  notifications: z.boolean().default(true),
  language: z.string().default('en'),
}).openapi('Settings');

// Empty object
export const emptySchema = z.object({}).openapi('EmptyObject');

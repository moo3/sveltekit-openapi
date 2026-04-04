import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

// Simple GET with no params — minimal Tier 1
export const GET: RequestHandler = async () => {
  return json([]);
};

// POST with body but NO destructuring — Tier 3 (body = generic object)
export const POST: RequestHandler = async (event) => {
  const body = await event.request.json();
  return json(body, { status: 201 });
};

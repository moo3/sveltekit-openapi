import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

// Tier 1: query params auto-detected, request body fields from destructuring
// Tier 3: response body is generic object (no typed return)
export const GET: RequestHandler = async (event) => {
  const page = event.url.searchParams.get('page');
  const limit = event.url.searchParams.get('limit');
  const sort = event.url.searchParams.get('sort');

  const users = []; // imagine a DB call
  return json(users);
};

export const POST: RequestHandler = async (event) => {
  const { name, email, age } = await event.request.json();

  if (!name || !email) {
    return json({ message: 'Name and email are required' }, { status: 400 });
  }

  // Simulate creation
  const user = { id: crypto.randomUUID(), name, email, age };
  return json(user, { status: 201 });
};

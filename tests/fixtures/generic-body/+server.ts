import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

// Tier 3: body is NOT destructured — should be generic object
export const POST: RequestHandler = async (event) => {
  const body = await event.request.json();

  if (!body) {
    return json({ message: 'Body is required' }, { status: 400 });
  }

  return json(body, { status: 201 });
};

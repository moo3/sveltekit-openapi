import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireAuth } from '$lib/server/api';

export const GET: RequestHandler = async (event) => {
  return json([]);
};

export const POST: RequestHandler = async (event) => {
  const user = requireAuth(event);
  const { name, email } = await event.request.json();

  if (!name || !email) {
    return json({ message: 'Name and email required' }, { status: 400 });
  }

  return json({ id: '1', name, email }, { status: 201 });
};

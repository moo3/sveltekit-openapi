import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireAuth } from '$lib/server/api';

export const POST: RequestHandler = async (event) => {
  const user = requireAuth(event);

  const { title, description } = await event.request.json();

  if (!title) {
    return json({ message: 'Title is required' }, { status: 400 });
  }

  return json({ id: '123', title, description }, { status: 201 });
};

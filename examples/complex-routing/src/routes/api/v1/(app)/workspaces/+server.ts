import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireAuth } from '$lib/server/auth';

// Route group: (app) should be stripped
// Expected: /api/v1/workspaces
export const GET: RequestHandler = async (event) => {
  const user = requireAuth(event);
  return json([]);
};

export const POST: RequestHandler = async (event) => {
  const user = requireAuth(event);
  const { name, description } = await event.request.json();

  if (!name) {
    return json({ message: 'Workspace name is required' }, { status: 400 });
  }

  return json({ id: '1', name, description }, { status: 201 });
};

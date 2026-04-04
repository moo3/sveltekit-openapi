import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireAuth } from '$lib/server/auth';

// Nested under param: /api/v1/workspaces/{workspaceId}/members
export const GET: RequestHandler = async (event) => {
  const user = requireAuth(event);
  const { workspaceId } = event.params;

  const role = event.url.searchParams.get('role');

  return json([]);
};

export const POST: RequestHandler = async (event) => {
  const user = requireAuth(event);
  const { workspaceId } = event.params;
  const { email, role } = await event.request.json();

  if (!email) {
    return json({ message: 'Email is required' }, { status: 400 });
  }

  return json({ workspaceId, email, role: role || 'member' }, { status: 201 });
};

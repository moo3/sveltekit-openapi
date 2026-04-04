import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireAuth } from '$lib/server/auth';

// /api/v1/workspaces/{workspaceId}/projects
export const GET: RequestHandler = async (event) => {
  const user = requireAuth(event);
  const { workspaceId } = event.params;
  const status = event.url.searchParams.get('status');

  return json([]);
};

export const POST: RequestHandler = async (event) => {
  const user = requireAuth(event);
  const { workspaceId } = event.params;
  const { name, description, color } = await event.request.json();

  return json({ id: '1', workspaceId, name, description, color }, { status: 201 });
};

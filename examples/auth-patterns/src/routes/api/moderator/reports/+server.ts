import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireRole } from '$lib/server/auth';

// Multi-role: admin OR moderator
export const GET: RequestHandler = async (event) => {
  const user = requireRole(event, 'admin', 'moderator');

  const status = event.url.searchParams.get('status');
  const type = event.url.searchParams.get('type');

  return json([]);
};

export const POST: RequestHandler = async (event) => {
  const user = requireRole(event, 'admin', 'moderator');
  const { targetId, reason, type } = await event.request.json();

  if (!targetId || !reason) {
    return json({ message: 'targetId and reason are required' }, { status: 400 });
  }

  return json({ id: '1', targetId, reason, type, status: 'open' }, { status: 201 });
};

// Only admin can delete reports
export const DELETE: RequestHandler = async (event) => {
  const user = requireRole(event, 'admin');
  return json({ message: 'Report deleted' });
};

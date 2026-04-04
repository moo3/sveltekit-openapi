import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireRole } from '$lib/server/api';

export const GET: RequestHandler = async (event) => {
  const user = requireRole(event, 'admin', 'instructor');
  const { id } = event.params;

  return json({ id, name: 'Test' });
};

export const DELETE: RequestHandler = async (event) => {
  const user = requireRole(event, 'admin');
  const { id } = event.params;

  return json({ message: 'Deleted' });
};

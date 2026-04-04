import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireAuth } from '$lib/server/auth';

// Basic auth — any authenticated user
export const GET: RequestHandler = async (event) => {
  const user = requireAuth(event);
  return json(user);
};

export const PATCH: RequestHandler = async (event) => {
  const user = requireAuth(event);
  const { displayName, bio, avatarUrl } = await event.request.json();

  return json({ ...user, displayName, bio, avatarUrl });
};

export const DELETE: RequestHandler = async (event) => {
  const user = requireAuth(event);
  // Soft-delete account
  return json({ message: 'Account scheduled for deletion' });
};

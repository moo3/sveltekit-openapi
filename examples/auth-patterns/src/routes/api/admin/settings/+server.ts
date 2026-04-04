import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireRole } from '$lib/server/auth';

// Admin-only with multiple methods and error cases
export const GET: RequestHandler = async (event) => {
  const user = requireRole(event, 'admin');
  return json({ siteName: 'My App', maintenanceMode: false });
};

export const PUT: RequestHandler = async (event) => {
  const user = requireRole(event, 'admin');
  const { siteName, maintenanceMode, maxUploadSize } = await event.request.json();

  if (!siteName) {
    return json({ message: 'Site name is required' }, { status: 400 });
  }

  if (maintenanceMode && !user) {
    return json({ message: 'Cannot enable maintenance mode' }, { status: 403 });
  }

  return json({ siteName, maintenanceMode, maxUploadSize });
};

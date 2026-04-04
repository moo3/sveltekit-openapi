import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireRole } from '$lib/server/auth';

// Single role: admin only
export const GET: RequestHandler = async (event) => {
  const user = requireRole(event, 'admin');

  return json({
    totalUsers: 1500,
    activeToday: 342,
    revenue: 12500.50,
    pendingOrders: 28,
  });
};

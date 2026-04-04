import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

// Route group: (public) should be stripped from the path
// Expected: /api/v1/docs
export const GET: RequestHandler = async () => {
  return json({ version: '1.0.0', endpoints: [] });
};

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

// NO auth — fully public endpoint
export const GET: RequestHandler = async (event) => {
  const cursor = event.url.searchParams.get('cursor');
  const limit = event.url.searchParams.get('limit');

  return json({ items: [], nextCursor: null });
};

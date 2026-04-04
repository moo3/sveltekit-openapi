import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

// Rest params: [...query] catches everything after /search/
// Expected: /api/v1/search/{...query} or /api/v1/search/{query}
export const GET: RequestHandler = async (event) => {
  const query = event.params.query;
  const type = event.url.searchParams.get('type');
  const limit = event.url.searchParams.get('limit');

  return json({ query, results: [], total: 0 });
};

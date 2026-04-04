import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

// Optional param: [[slug]] — matches /api/v2/items AND /api/v2/items/something
// Expected: /api/v2/items/{slug}
export const GET: RequestHandler = async (event) => {
  const slug = event.params.slug;

  if (slug) {
    return json({ slug, name: 'Single item' });
  }

  // No slug — list all items
  return json([]);
};

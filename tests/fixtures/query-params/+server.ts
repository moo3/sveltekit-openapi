import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async (event) => {
  const search = event.url.searchParams.get('search');
  const page = event.url.searchParams.get('page');
  const limit = event.url.searchParams.get('limit');

  return json([]);
};

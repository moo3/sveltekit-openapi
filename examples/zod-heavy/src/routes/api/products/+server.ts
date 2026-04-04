import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createProductSchema } from '$lib/schemas/products';

export const GET: RequestHandler = async (event) => {
  const category = event.url.searchParams.get('category');
  const minPrice = event.url.searchParams.get('minPrice');
  const maxPrice = event.url.searchParams.get('maxPrice');
  const search = event.url.searchParams.get('search');
  const page = event.url.searchParams.get('page');

  return json({ items: [], total: 0, page: 1 });
};

export const POST: RequestHandler = async (event) => {
  const body = await event.request.json();
  const parsed = createProductSchema.parse(body);

  if (!parsed.name) {
    return json({ message: 'Product name is required' }, { status: 400 });
  }

  return json({ id: crypto.randomUUID(), ...parsed }, { status: 201 });
};

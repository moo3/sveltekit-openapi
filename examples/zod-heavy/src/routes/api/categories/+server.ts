import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createCategorySchema } from '$lib/schemas/categories';

export const GET: RequestHandler = async () => {
  return json([]);
};

export const POST: RequestHandler = async (event) => {
  const body = await event.request.json();
  const category = createCategorySchema.safeParse(body);

  if (!category.success) {
    return json({ message: 'Invalid category data', errors: category.error.flatten() }, { status: 422 });
  }

  return json({ id: crypto.randomUUID(), ...category.data }, { status: 201 });
};

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createOrderSchema } from '$lib/schemas/orders';

export const GET: RequestHandler = async (event) => {
  const status = event.url.searchParams.get('status');
  const from = event.url.searchParams.get('from');
  const to = event.url.searchParams.get('to');

  return json([]);
};

export const POST: RequestHandler = async (event) => {
  const body = await event.request.json();
  const order = createOrderSchema.parse(body);

  return json({ id: crypto.randomUUID(), status: 'pending', ...order }, { status: 201 });
};

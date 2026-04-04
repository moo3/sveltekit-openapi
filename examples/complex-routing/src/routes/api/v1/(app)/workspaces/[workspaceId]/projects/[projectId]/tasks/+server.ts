import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireAuth } from '$lib/server/auth';

// Deep nesting: /api/v1/workspaces/{workspaceId}/projects/{projectId}/tasks
// Two path params
export const GET: RequestHandler = async (event) => {
  const user = requireAuth(event);
  const { workspaceId, projectId } = event.params;

  const assignee = event.url.searchParams.get('assignee');
  const status = event.url.searchParams.get('status');
  const priority = event.url.searchParams.get('priority');

  return json([]);
};

export const POST: RequestHandler = async (event) => {
  const user = requireAuth(event);
  const { workspaceId, projectId } = event.params;
  const { title, description, assigneeId, priority, dueDate } = await event.request.json();

  if (!title) {
    return json({ message: 'Task title is required' }, { status: 400 });
  }

  return json(
    { id: '1', workspaceId, projectId, title, description, assigneeId, priority, dueDate },
    { status: 201 },
  );
};

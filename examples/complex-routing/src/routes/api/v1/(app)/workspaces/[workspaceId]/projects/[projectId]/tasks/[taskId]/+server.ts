import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireAuth } from '$lib/server/auth';

// Deepest nesting: /api/v1/workspaces/{workspaceId}/projects/{projectId}/tasks/{taskId}
// Three path params
export const GET: RequestHandler = async (event) => {
  const user = requireAuth(event);
  const { workspaceId, projectId, taskId } = event.params;

  return json({ id: taskId, projectId, workspaceId });
};

export const PATCH: RequestHandler = async (event) => {
  const user = requireAuth(event);
  const { workspaceId, projectId, taskId } = event.params;
  const { title, status, priority } = await event.request.json();

  return json({ id: taskId, title, status, priority });
};

export const DELETE: RequestHandler = async (event) => {
  const user = requireAuth(event);
  const { taskId } = event.params;

  return json({ message: 'Task deleted' });
};

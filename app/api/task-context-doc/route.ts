import { mkdir, writeFile, access, readFile } from 'fs/promises';
import path from 'path';

interface TaskContextDocBody {
  taskId: string;
  title: string;
  objective: string;
  briefPath: string;
  prdPath: string;
  taskListPath: string;
  definitionOfDone: string;
  currentState: string;
  nextActions: string;
  assignee?: string;
  priority?: string;
}

function sanitizeId(id: string): string {
  return id.replace(/[^a-zA-Z0-9-_]/g, '');
}

function getDocPath(taskId: string): string {
  const root = process.cwd();
  return path.join(root, 'docs', 'task-context', `${sanitizeId(taskId)}.md`);
}

function renderDoc(body: TaskContextDocBody): string {
  const now = new Date().toISOString();
  return `# Task Execution Context\n\n- Task ID: ${body.taskId}\n- Title: ${body.title}\n- Created: ${now}\n- Assignee: ${body.assignee || 'unassigned'}\n- Priority: ${body.priority || 'medium'}\n\n## Objective\n${body.objective}\n\n## Document References\n- Brief: ${body.briefPath}\n- PRD: ${body.prdPath}\n- Task List: ${body.taskListPath}\n\n## Definition of Done\n${body.definitionOfDone}\n\n## Current State\n${body.currentState}\n\n## Next Actions\n${body.nextActions}\n`;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const taskId = searchParams.get('taskId');
  const raw = searchParams.get('raw') === '1';

  if (!taskId) {
    return Response.json({ error: 'taskId is required' }, { status: 400 });
  }

  const filePath = getDocPath(taskId);
  try {
    await access(filePath);
    if (raw) {
      const text = await readFile(filePath, 'utf-8');
      return new Response(text, {
        status: 200,
        headers: {
          'Content-Type': 'text/markdown; charset=utf-8',
          'Cache-Control': 'no-store',
        },
      });
    }
    return Response.json({ exists: true, path: filePath }, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return Response.json({ exists: false, path: filePath }, { headers: { 'Cache-Control': 'no-store' } });
  }
}

export async function POST(req: Request) {
  const body = (await req.json()) as TaskContextDocBody;
  const required = ['taskId', 'title', 'objective', 'briefPath', 'prdPath', 'taskListPath', 'definitionOfDone', 'currentState', 'nextActions'] as const;

  for (const key of required) {
    if (!body[key] || String(body[key]).trim().length === 0) {
      return Response.json({ error: `${key} is required` }, { status: 400 });
    }
  }

  const filePath = getDocPath(body.taskId);
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, renderDoc(body), 'utf-8');

  return Response.json({ ok: true, path: filePath });
}

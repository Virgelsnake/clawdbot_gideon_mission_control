import { access, readFile } from 'fs/promises';
import path from 'path';

const WORKSPACE_ROOT = '/Users/gideon/clawd';

function isAllowedPath(filePath: string): boolean {
  const resolved = path.resolve(filePath);
  const root = path.resolve(WORKSPACE_ROOT);
  return resolved === root || resolved.startsWith(`${root}${path.sep}`);
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const targetPath = searchParams.get('path');

  if (!targetPath) {
    return Response.json({ error: 'path is required' }, { status: 400 });
  }

  if (!isAllowedPath(targetPath)) {
    return Response.json({ error: 'path is outside workspace' }, { status: 403 });
  }

  try {
    await access(targetPath);
    const text = await readFile(targetPath, 'utf-8');
    return new Response(text, {
      status: 200,
      headers: {
        'Content-Type': 'text/markdown; charset=utf-8',
        'Cache-Control': 'no-store',
      },
    });
  } catch {
    return Response.json({ error: 'file not found' }, { status: 404 });
  }
}

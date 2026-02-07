import { NextRequest, NextResponse } from 'next/server';

import { jsonError } from '@/lib/api/errors';

export async function POST(request: NextRequest) {
  const sitePassword = process.env.SITE_PASSWORD;

  if (!sitePassword) {
    return jsonError(500, { code: 'missing_config', message: 'Access control not configured' });
  }

  let body: { password?: string };
  try {
    body = await request.json();
  } catch {
    return jsonError(400, { code: 'bad_request', message: 'Invalid request body' });
  }

  if (body.password !== sitePassword) {
    return jsonError(401, { code: 'bad_request', message: 'Incorrect password' });
  }

  const response = NextResponse.json({ ok: true });

  response.cookies.set('mc_auth', sitePassword, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });

  return response;
}

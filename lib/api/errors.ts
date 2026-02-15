export type ApiErrorCode =
  | 'missing_config'
  | 'gateway_unreachable'
  | 'gateway_error'
  | 'bad_request'
  | 'timeout'
  | 'config_write_failed'
  | 'internal_error'
  | 'not_found';

export type ApiErrorBody = {
  code: ApiErrorCode;
  message: string;
  details?: unknown;
};

export function jsonError(status: number, body: ApiErrorBody) {
  return Response.json(body, {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
    },
  });
}

export async function safeReadText(res: Response) {
  try {
    return await res.text();
  } catch {
    return null;
  }
}

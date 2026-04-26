export class ApiError extends Error {
  status: number;
  payload: unknown;

  constructor(message: string, status: number, payload: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.payload = payload;
  }
}

type JsonObject = Record<string, unknown>;

function isJsonResponse(response: Response) {
  return response.headers.get('content-type')?.includes('application/json');
}

async function parsePayload(response: Response) {
  if (!isJsonResponse(response)) return null;

  try {
    return (await response.json()) as JsonObject | JsonObject[] | null;
  } catch {
    return null;
  }
}

export async function apiRequest<T>(input: RequestInfo | URL, init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  if (!headers.has('Accept')) {
    headers.set('Accept', 'application/json');
  }

  const response = await fetch(input, {
    ...init,
    headers,
    credentials: init.credentials ?? 'same-origin',
  });

  const payload = await parsePayload(response);

  if (!response.ok) {
    const message =
      payload && typeof payload === 'object' && 'error' in payload && typeof payload.error === 'string'
        ? payload.error
        : response.statusText || 'Request failed';

    throw new ApiError(message, response.status, payload);
  }

  return payload as T;
}

export function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof ApiError || error instanceof Error) {
    return error.message || fallback;
  }

  return fallback;
}

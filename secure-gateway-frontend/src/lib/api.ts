const BASE_URL = process.env.NEXT_PUBLIC_GATEWAY_API_URL ?? "http://localhost:3000";

export async function adminFetch<T>(
  path: string,
  options: RequestInit & { adminToken: string }
): Promise<T> {
  const { adminToken, ...rest } = options;
  const res = await fetch(`${BASE_URL}${path}`, {
    ...rest,
    headers: {
      "Content-Type": "application/json",
      "X-Admin-Token": adminToken,
      ...(rest.headers || {}),
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${res.status} ${res.statusText}: ${text}`);
  }

  return res.status === 204 ? ({} as T) : res.json();
}

export async function apiKeyFetch(
  path: string,
  options: RequestInit & { apiKey: string }
): Promise<Response> {
  const { apiKey, ...rest } = options;
  return fetch(`${BASE_URL}${path}`, {
    ...rest,
    headers: {
      "X-API-Key": apiKey,
      ...(rest.headers || {}),
    },
  });
}

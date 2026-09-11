// A trailing slash would produce "//api/..." paths.
const BASE_URL = (import.meta.env.VITE_API_URL ?? '').replace(/\/+$/, '');
const TOKEN_KEY = 'tideline.token';

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token) {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {
    /* a blocked store just means the session ends when the tab closes */
  }
}

export function clearToken() {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* nothing to clear */
  }
}

const FALLBACK_MESSAGE = {
  401: 'Your session has expired — sign in again.',
  403: 'You do not have permission to do that.',
  404: 'That item no longer exists.',
  500: 'The server could not complete that request. Try again in a moment.',
};

export async function request(path, { method = 'GET', body, auth = true } = {}) {
  const headers = {};
  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  const token = auth ? getToken() : null;
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError('Cannot reach the server — check that the API is running on port 8080.', 0);
  }

  const text = await response.text();
  let payload = null;
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = null;
    }
  }

  if (!response.ok) {
    const message = payload?.message
      || FALLBACK_MESSAGE[response.status]
      || `Request failed (${response.status}).`;
    throw new ApiError(message, response.status);
  }

  return payload;
}

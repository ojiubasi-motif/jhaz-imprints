/**
 * API Client with automatic token refresh.
 * 
 * SECURITY DECISIONS:
 * 1. Access token stored in memory only (via tokenStore).
 * 2. Refresh token stored in httpOnly cookie by the server.
 * 3. Every fetch includes credentials: 'include' to send the cookie.
 * 4. If the token is about to expire, silently refresh BEFORE the request.
 * 5. Concurrent refresh calls are deduplicated via a shared promise.
 * 6. On 401 response, clear the token and dispatch auth-expired event.
 * 
 * FLOW:
 *   1. Check if token is expiring soon (< 60s).
 *   2. If yes, refresh (deduplicated).
 *   3. Add token to Authorization header (if present).
 *   4. Make request.
 *   5. If 401, clear token and emit auth-expired event.
 */

import { tokenStore } from './tokenStore';

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "/api";

/**
 * Shared promise for deduplicated refresh calls.
 * Prevents multiple concurrent POST /refresh requests.
 */
let _refreshing: Promise<string | null> | null = null;

/**
 * Perform a refresh request and return the new access token.
 */
async function performRefresh(): Promise<string | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'GET',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    });

    if (response.status === 401 || response.status === 403) {
      // Refresh token is invalid or expired
      tokenStore.clear();
      return null;
    }

    if (!response.ok) {
      tokenStore.clear();
      return null;
    }

    const data = await response.json();
    const newAccessToken = data?.data?.access_token;

    if (newAccessToken) {
      tokenStore.setToken(newAccessToken);
      return newAccessToken;
    }

    return null;
  } catch (error) {
    console.error('Refresh failed:', error);
    tokenStore.clear();
    return null;
  }
}

/**
 * Ensure a valid access token is available, refreshing if necessary.
 * Deduplicated: concurrent calls will wait for the first refresh.
 */
async function ensureToken(): Promise<string | null> {
  const currentToken = tokenStore.getToken();

  // If we don't have a token or it's about to expire, refresh.
  if (!currentToken || tokenStore.shouldRefresh()) {
    if (!_refreshing) {
      _refreshing = performRefresh().finally(() => {
        _refreshing = null;
      });
    }
    return _refreshing;
  }

  return currentToken;
}

/**
 * Main API fetch wrapper with auto-refresh and error handling.
 */
export async function fetchApi(
  endpoint: string,
  options: RequestInit = {}
): Promise<any> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // Add custom headers from options
  if (options.headers && typeof options.headers === 'object') {
    Object.assign(headers, options.headers);
  }

  // Ensure token is valid before making the request
  const token = await ensureToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    credentials: 'include', // Browser sends httpOnly cookie
    headers,
  });

  // Handle 204 No Content
  if (response.status === 204) {
    return null;
  }

  let data: any = null;
  try {
    data = await response.json();
  } catch (e) {
    // Response is not JSON
    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }
    return null;
  }

  // Handle 401 - session expired or token invalid
  if (response.status === 401) {
    tokenStore.clear();
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('auth-expired'));
    }
    throw new Error(data?.msg || 'Session expired');
  }

  if (!response.ok) {
    throw new Error(data?.msg || `API error: ${response.statusText}`);
  }

  // Return only the data payload if it follows the Quizio envelope
  if (data && typeof data === 'object' && 'data' in data) {
    return data.data;
  }

  return data;
}

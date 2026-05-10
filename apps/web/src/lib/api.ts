export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";

export async function fetchApi(endpoint: string, options: RequestInit = {}) {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    credentials: 'include', // Include HTTP-only cookies
    headers,
  });

  // Handle 401 - session expired
  if (response.status === 401) {
    // Clear user session and redirect to login
    if (typeof window !== 'undefined') {
      // Dispatch logout action via window event
      window.dispatchEvent(new Event('auth-expired'));
    }
  }

  if (!response.ok) {
    let errorMessage = 'API request failed';
    try {
      const errorData = await response.json();
      errorMessage = errorData.error || errorMessage;
    } catch (e) {
      // Ignore
    }
    throw new Error(errorMessage);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

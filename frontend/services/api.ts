const configuredApiUrl = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000").replace(/\/+$/, "");
const API_BASE_URL = configuredApiUrl.endsWith("/api") ? configuredApiUrl : `${configuredApiUrl}/api`;

export async function apiFetch(path: string, options: RequestInit = {}) {
  const headers = new Headers(options.headers);
  if (!(options.body instanceof FormData)) headers.set("Content-Type", "application/json");
  if (typeof window !== "undefined") {
    const token = window.localStorage.getItem("access_token");
    if (token) headers.set("Authorization", `Bearer ${token}`);
  }
  const response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
  if (!response.ok && process.env.NODE_ENV === "development") {
    const errorBody = await response.clone().text();
    console.error(`Delivery Hub API ${response.status} ${response.statusText}: ${errorBody}`);
  }
  if (response.status === 401 && typeof window !== "undefined") {
    window.localStorage.removeItem("access_token");
    window.localStorage.removeItem("deliveryhub_user");
    if (!window.location.pathname.startsWith("/login")) window.location.href = "/login";
  }
  return response;
}

export { API_BASE_URL };

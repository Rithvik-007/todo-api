import { getToken } from "./token";

export const BASE_URL = "http://127.0.0.1:8000";

export async function apiFetch(path, options = {}) {
  const token = getToken();

  const headers = {
    ...(options.headers || {}),
  };

  // Attach JSON header only if we have a body and it’s not FormData
  const isFormData = options.body instanceof FormData;
  if (options.body && !isFormData) {
    headers["Content-Type"] = "application/json";
  }

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });

  // Handle 401 - Unauthorized (expired/invalid token)
  if (res.status === 401) {
    clearToken(); // Clear the invalid token
    window.location.href = "/"; // Redirect to home page
    throw new Error("Session expired. Please login again.");
  }

  // If backend returns non-JSON (like file download), caller handles it.
  const contentType = res.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");

  if (!res.ok) {
    const detail = isJson ? await res.json() : await res.text();
    const message =
      typeof detail === "string"
        ? detail
        : detail?.detail || JSON.stringify(detail);
    throw new Error(message);
  }

  return isJson ? await res.json() : res;
}

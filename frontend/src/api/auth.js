import { apiFetch } from "./client";
import { setToken, clearToken } from "./token";

export async function register(email, password) {
  return apiFetch("/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function login(email, password) {
  const data = await apiFetch("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  // expects { access_token, token_type }
  setToken(data.access_token);
  return data;
}

export function logout() {
  clearToken();
  window.location.href = "/";
}

import { apiFetch } from "./client";

export function fetchMe() {
  return apiFetch("/auth/me", { method: "GET" });
}

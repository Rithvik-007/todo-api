import { apiFetch } from "./client";

export function fetchArtifacts() {
  return apiFetch("/artifacts/me");
}

export function createArtifact(payload) {
    return apiFetch("/artifacts", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }
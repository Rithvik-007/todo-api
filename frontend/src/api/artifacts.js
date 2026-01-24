import { apiFetch } from "./client";

export function fetchArtifacts() {
  return apiFetch("/artifacts", {
    method: "GET",
  });
}

export function createArtifact(payload) {
    return apiFetch("/artifacts", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }
import { apiFetch } from "./client";

export function fetchMyArtifacts() {
  return apiFetch("/artifacts/me", { method: "GET" });
}

export function fetchAccessibleArtifacts() {
  return apiFetch("/artifacts", { method: "GET" });
}

export function fetchArtifact(artifactId) {
  return apiFetch(`/artifacts/${artifactId}`, { method: "GET" });
}

export function createArtifact(payload) {
  return apiFetch("/artifacts", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

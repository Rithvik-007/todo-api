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

export function shareArtifact(artifactId, email) {
  return apiFetch(`/artifacts/${artifactId}/share`, {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}
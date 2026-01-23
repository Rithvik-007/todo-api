import { apiFetch } from "./client";

export function fetchVersions(artifactId) {
  return apiFetch(`/artifacts/${artifactId}/versions`);
}

export function createVersion(artifactId, payload) {
  return apiFetch(`/artifacts/${artifactId}/versions`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
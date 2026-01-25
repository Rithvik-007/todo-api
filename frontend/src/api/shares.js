import { apiFetch } from "./client";

export function shareArtifact(artifactId, email) {
  return apiFetch(`/artifacts/${artifactId}/share`, {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

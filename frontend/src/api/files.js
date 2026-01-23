import { BASE_URL, apiFetch } from "./client";
import { getToken } from "./token";

// IMPORTANT: keep this consistent with your backend upload/list base path.
// If you used /artifacts/{versionId}/files earlier, change both below to match.
const VERSION_FILES_BASE = (versionId) => `/versions/${versionId}/files`;

export async function uploadFile(versionId, file) {
  const token = getToken();
  if (!token) throw new Error("Not authenticated");

  const form = new FormData();
  form.append("file", file);

  // Use fetch directly for multipart
  const res = await fetch(`${BASE_URL}${VERSION_FILES_BASE(versionId)}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: form,
  });

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

  return isJson ? await res.json() : null;
}

export function listFiles(versionId) {
  return apiFetch(VERSION_FILES_BASE(versionId));
}

export function deleteFile(fileId) {
  return apiFetch(`/files/${fileId}`, { method: "DELETE" });
}

// Download is NOT apiFetch because response is a file stream
export async function downloadFile(fileId) {
  const token = getToken();
  if (!token) throw new Error("Not authenticated");

  const res = await fetch(`${BASE_URL}/files/${fileId}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const contentType = res.headers.get("content-type") || "";
    const isJson = contentType.includes("application/json");
    const detail = isJson ? await res.json() : await res.text();
    const message =
      typeof detail === "string"
        ? detail
        : detail?.detail || JSON.stringify(detail);
    throw new Error(message);
  }

  // Get filename from Content-Disposition if present
  const cd = res.headers.get("content-disposition") || "";
  const match = cd.match(/filename="?([^"]+)"?/i);
  const filename = match?.[1] || `file_${fileId}`;

  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);

  // Trigger browser download
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);

  return true;
}

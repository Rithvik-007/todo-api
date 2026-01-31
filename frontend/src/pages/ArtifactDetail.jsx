import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import NavBar from "../components/NavBar";

import { fetchVersions, createVersion } from "../api/versions";
import { listFiles, uploadFile, downloadFile, deleteFile } from "../api/files";
import { shareArtifact } from "../api/shares";

export default function ArtifactDetail() {
  const { artifactId } = useParams();
  const nav = useNavigate();

  const [versions, setVersions] = useState([]);
  const [filesByVersion, setFilesByVersion] = useState({});

  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);

  // version create
  const [ver, setVer] = useState("");
  const [changeLog, setChangeLog] = useState("");
  const [savingVer, setSavingVer] = useState(false);

  // share
  const [shareEmail, setShareEmail] = useState("");
  const [sharing, setSharing] = useState(false);
  const [shareMsg, setShareMsg] = useState("");

  async function loadVersions() {
    setErr("");
    setLoading(true);
    try {
      const data = await fetchVersions(artifactId);
      setVersions(data);
    } catch (e) {
      setErr(e.message || "Failed to load versions");
    } finally {
      setLoading(false);
    }
  }

  async function loadFilesForVersion(versionId) {
    try {
      const files = await listFiles(versionId);
      setFilesByVersion((prev) => ({ ...prev, [versionId]: files }));
    } catch (e) {
      // list files can be denied for some users
      setErr(e.message || "Failed to load files");
    }
  }

  useEffect(() => {
    loadVersions();
  }, [artifactId]);

  useEffect(() => {
    versions.forEach((v) => loadFilesForVersion(v.id));
  }, [versions]);

  async function onCreateVersion(e) {
    e.preventDefault();
    setErr("");
    setSavingVer(true);
    try {
      await createVersion(artifactId, { version: ver.trim(), change_log: changeLog });
      setVer("");
      setChangeLog("");
      await loadVersions();
    } catch (e2) {
      setErr(e2.message || "Create version failed");
    } finally {
      setSavingVer(false);
    }
  }

  async function onUpload(versionId, file) {
    if (!file) return;
    setErr("");
    try {
      await uploadFile(versionId, file);
      await loadFilesForVersion(versionId);
    } catch (e) {
      setErr(e.message || "Upload failed");
    }
  }

  async function onDownload(fileId) {
    setErr("");
    try {
      await downloadFile(fileId);
    } catch (e) {
      setErr(e.message || "Download failed");
    }
  }

  async function onDelete(fileId, versionId) {
    const ok = window.confirm("Delete this file? This cannot be undone.");
    if (!ok) return;
    setErr("");
    try {
      await deleteFile(fileId);
      await loadFilesForVersion(versionId);
    } catch (e) {
      setErr(e.message || "Delete failed");
    }
  }

  async function onShare(e) {
    e.preventDefault();
    setErr("");
    setShareMsg("");
    setSharing(true);
    try {
      await shareArtifact(artifactId, shareEmail.trim());
      setShareMsg(`Shared with ${shareEmail}`);
      setShareEmail("");
    } catch (e2) {
      setErr(e2.message || "Share failed");
    } finally {
      setSharing(false);
    }
  }

  return (
    <div>
      <NavBar />

      <div className="container py-4" style={{ maxWidth: 900 }}>
        <button className="btn btn-outline-secondary btn-sm mb-3" onClick={() => nav("/artifacts")}>
          ← Back
        </button>

        <h3 className="mb-3">Artifact #{artifactId}</h3>

        {/* Share */}
        <div className="card mb-4">
          <div className="card-body">
            <h5 className="card-title">Share (read-only)</h5>
            <form onSubmit={onShare} className="d-flex gap-2">
              <input
                className="form-control"
                placeholder="user@example.com"
                value={shareEmail}
                onChange={(e) => setShareEmail(e.target.value)}
                required
              />
              <button className="btn btn-primary" disabled={sharing}>
                {sharing ? "Sharing..." : "Share"}
              </button>
            </form>
            {shareMsg && <div className="alert alert-success mt-3 mb-0">{shareMsg}</div>}
          </div>
        </div>

        {/* Create version */}
        <div className="card mb-4">
          <div className="card-body">
            <h5 className="card-title">Create Version</h5>
            <form onSubmit={onCreateVersion} className="row g-2">
              <div className="col-md-3">
                <input className="form-control" placeholder="v1" value={ver} onChange={(e) => setVer(e.target.value)} required />
              </div>
              <div className="col-md-7">
                <input
                  className="form-control"
                  placeholder="Change log"
                  value={changeLog}
                  onChange={(e) => setChangeLog(e.target.value)}
                />
              </div>
              <div className="col-md-2">
                <button className="btn btn-success w-100" disabled={savingVer}>
                  {savingVer ? "..." : "Add"}
                </button>
              </div>
            </form>
          </div>
        </div>

        {err && <div className="alert alert-danger">{err}</div>}

        {/* Versions */}
        {loading ? (
          <div>Loading...</div>
        ) : versions.length === 0 ? (
          <div className="text-muted">No versions yet.</div>
        ) : (
          <div className="accordion" id="versionsAccordion">
            {versions.map((v, idx) => {
              const files = filesByVersion[v.id] || [];
              const collapseId = `collapse-${v.id}`;
              const headingId = `heading-${v.id}`;

              return (
                <div className="accordion-item" key={v.id}>
                  <h2 className="accordion-header" id={headingId}>
                    <button
                      className={`accordion-button ${idx === 0 ? "" : "collapsed"}`}
                      type="button"
                      data-bs-toggle="collapse"
                      data-bs-target={`#${collapseId}`}
                      aria-expanded={idx === 0 ? "true" : "false"}
                      aria-controls={collapseId}
                    >
                      {v.version} — <span className="ms-2 text-muted small">{v.changelog}</span>
                    </button>
                  </h2>

                  <div
                    id={collapseId}
                    className={`accordion-collapse collapse ${idx === 0 ? "show" : ""}`}
                    aria-labelledby={headingId}
                    data-bs-parent="#versionsAccordion"
                  >
                    <div className="accordion-body">
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <div className="text-muted small">{new Date(v.created_at).toLocaleString()}</div>
                        <input type="file" className="form-control" style={{ maxWidth: 360 }} onChange={(e) => onUpload(v.id, e.target.files?.[0])} />
                      </div>

                      {files.length === 0 ? (
                        <div className="text-muted small">No files uploaded.</div>
                      ) : (
                        <table className="table table-sm">
                          <thead>
                            <tr>
                              <th>Filename</th>
                              <th>Size</th>
                              <th>Created</th>
                              <th></th>
                            </tr>
                          </thead>
                          <tbody>
                            {files.map((f) => (
                              <tr key={f.id}>
                                <td>{f.filename}</td>
                                <td>{Math.round((f.size_bytes || 0) / 1024)} KB</td>
                                <td className="text-muted small">{new Date(f.created_at).toLocaleString()}</td>
                                <td className="text-end">
                                  <button className="btn btn-outline-primary btn-sm me-2" onClick={() => onDownload(f.id)}>
                                    Download
                                  </button>
                                  <button className="btn btn-outline-danger btn-sm" onClick={() => onDelete(f.id, v.id)}>
                                    Delete
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { fetchVersions, createVersion } from "../api/versions";
import { uploadFile, listFiles, downloadFile, deleteFile } from "../api/files";
import "../style/ArtifactDetail.css";

export default function ArtifactDetail() {
  const { artifactId } = useParams();
  const nav = useNavigate();

  // versions list
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // create version form
  const [versionStr, setVersionStr] = useState("");
  const [changeLog, setChangeLog] = useState("");
  const [saving, setSaving] = useState(false);
  const [formErr, setFormErr] = useState("");

  // upload state
  const [uploadingFor, setUploadingFor] = useState(null);
  const [uploadErr, setUploadErr] = useState("");

  // files per version
  const [filesByVersion, setFilesByVersion] = useState({});
  const [filesErr, setFilesErr] = useState("");

  // action state
  const [deletingFileId, setDeletingFileId] = useState(null);
  const [downloadingFileId, setDownloadingFileId] = useState(null);

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
    setFilesErr("");
    try {
      const files = await listFiles(versionId);
      setFilesByVersion((prev) => ({ ...prev, [versionId]: files }));
    } catch (e) {
      setFilesErr(e.message || "Failed to load files");
    }
  }

  useEffect(() => {
    loadVersions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [artifactId]);

  useEffect(() => {
    versions.forEach((v) => loadFilesForVersion(v.id));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [versions]);

  async function onCreateVersion(e) {
    e.preventDefault();
    setFormErr("");

    if (!versionStr.trim()) {
      setFormErr("Version is required (e.g., v1, v2).");
      return;
    }

    setSaving(true);
    try {
      await createVersion(artifactId, {
        version: versionStr.trim(),
        change_log: changeLog,
      });

      setVersionStr("");
      setChangeLog("");
      await loadVersions();
    } catch (ex) {
      setFormErr(ex.message || "Failed to create version");
    } finally {
      setSaving(false);
    }
  }

  async function onUpload(versionId, file) {
    if (!file) return;
    setUploadErr("");
    setUploadingFor(versionId);

    try {
      await uploadFile(versionId, file);
      await loadFilesForVersion(versionId);
    } catch (e) {
      setUploadErr(e.message || "Upload failed");
    } finally {
      setUploadingFor(null);
    }
  }

  async function onDownload(fileId) {
    setFilesErr("");
    setDownloadingFileId(fileId);
    try {
      await downloadFile(fileId);
    } catch (e) {
      setFilesErr(e.message || "Download failed");
    } finally {
      setDownloadingFileId(null);
    }
  }

  async function onDelete(fileId, versionId) {
    const ok = window.confirm("Delete this file? This cannot be undone.");
    if (!ok) return;

    setFilesErr("");
    setDeletingFileId(fileId);
    try {
      await deleteFile(fileId);
      await loadFilesForVersion(versionId);
    } catch (e) {
      setFilesErr(e.message || "Delete failed");
    } finally {
      setDeletingFileId(null);
    }
  }

  return (
    <div className="artifact-detail-page">
      <button onClick={() => nav("/artifacts")} className="back-button">
        Back to Artifacts
      </button>

      <div className="detail-header">
        <h2>
          Artifact
          <span className="artifact-id-badge">#{artifactId}</span>
        </h2>
      </div>

      {/* Create Version */}
      <div className="version-form-card">
        <h3>
          <div className="form-icon">
            <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
          </div>
          Create New Version
        </h3>

        <form onSubmit={onCreateVersion} className="version-form">
          <div className="form-group">
            <label className="form-label">Version</label>
            <input
              value={versionStr}
              onChange={(e) => setVersionStr(e.target.value)}
              className="form-input"
              placeholder="e.g., v1.0, v2.0"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Change Log</label>
            <textarea
              value={changeLog}
              onChange={(e) => setChangeLog(e.target.value)}
              className="form-textarea"
              placeholder="What changed in this version?"
            />
          </div>

          <button disabled={saving} className="create-version-btn">
            {saving ? "Creating..." : "Create Version"}
          </button>

          {formErr && (
            <div className="form-error">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
              <span>{formErr}</span>
            </div>
          )}
        </form>
      </div>

      {/* Versions + Upload + Files */}
      <div className="versions-section">
        <div className="versions-header">
          <div className="versions-header-icon">
            <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="23 4 23 10 17 10"></polyline>
              <polyline points="1 20 1 14 7 14"></polyline>
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
            </svg>
          </div>
          Versions
        </div>

        {uploadErr && <p className="error-message">{uploadErr}</p>}
        {filesErr && <p className="error-message">{filesErr}</p>}

        {loading && (
          <div className="loading-message">
            <div className="loading-spinner"></div>
            <p>Loading versions...</p>
          </div>
        )}

        {err && <p className="error-message">{err}</p>}

        {!loading && !err && versions.length === 0 && (
          <p className="empty-message">No versions yet. Create one above!</p>
        )}

        {!loading && !err && versions.length > 0 && (
          <ul className="versions-list">
            {versions.map((v) => {
              const files = filesByVersion[v.id] || [];
              return (
                <li key={v.id} className="version-card">
                  <div className="version-header">
                    <div className="version-info">
                      <h4 className="version-name">{v.version}</h4>
                      {v.changelog && (
                        <p className="version-changelog">{v.changelog}</p>
                      )}
                      <div className="version-date">
                        <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10"></circle>
                          <polyline points="12 6 12 12 16 14"></polyline>
                        </svg>
                        {new Date(v.created_at).toLocaleString()}
                      </div>
                    </div>
                  </div>

                  {/* Upload */}
                  <div className="upload-section">
                    <label className="upload-label">Upload File</label>
                    <div className="file-input-wrapper">
                      <input
                        type="file"
                        onChange={(e) => onUpload(v.id, e.target.files?.[0])}
                        disabled={uploadingFor === v.id}
                        className="file-input"
                      />
                      {uploadingFor === v.id && (
                        <span className="uploading-text">
                          <div className="loading-spinner" style={{ width: '16px', height: '16px', borderWidth: '2px' }}></div>
                          Uploading...
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Files list */}
                  <div className="files-section">
                    <div className="files-header">
                      <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
                        <polyline points="13 2 13 9 20 9"></polyline>
                      </svg>
                      Files ({files.length})
                    </div>

                    {files.length === 0 ? (
                      <div className="files-empty">No files uploaded yet</div>
                    ) : (
                      <ul className="files-list">
                        {files.map((f) => (
                          <li key={f.id} className="file-item">
                            <div className="file-info">
                              <div className="file-details">
                                <div className="file-name">
                                  <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
                                    <polyline points="13 2 13 9 20 9"></polyline>
                                  </svg>
                                  {f.filename}
                                </div>
                                <div className="file-meta">
                                  {Math.round((f.size_bytes || 0) / 1024)} KB • {new Date(f.created_at).toLocaleString()}
                                </div>
                              </div>
                            </div>
                            <div className="file-actions">
                              <button
                                onClick={() => onDownload(f.id)}
                                disabled={downloadingFileId === f.id}
                                className="download-btn"
                              >
                                <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                  <polyline points="7 10 12 15 17 10"></polyline>
                                  <line x1="12" y1="15" x2="12" y2="3"></line>
                                </svg>
                                {downloadingFileId === f.id ? "Downloading..." : "Download"}
                              </button>

                              <button
                                onClick={() => onDelete(f.id, v.id)}
                                disabled={deletingFileId === f.id}
                                className="delete-btn"
                              >
                                <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <polyline points="3 6 5 6 21 6"></polyline>
                                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                </svg>
                                {deletingFileId === f.id ? "Deleting..." : "Delete"}
                              </button>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
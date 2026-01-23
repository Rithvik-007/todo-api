import { useEffect, useState } from "react";
import { fetchArtifacts, createArtifact } from "../api/artifacts";
import { clearToken } from "../api/token";
import { useNavigate } from "react-router-dom";
import "../style/Artifacts.css";

const ARTIFACT_TYPES = ["MODEL", "DATASET", "EMBEDDING", "RUN", "PAPER"];
const VISIBILITY = ["PRIVATE", "SHARED", "PUBLIC"];

export default function Artifacts() {
  const nav = useNavigate();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // form state
  const [title, setTitle] = useState("");
  const [artifactType, setArtifactType] = useState("MODEL");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState("PRIVATE");
  const [saving, setSaving] = useState(false);
  const [formErr, setFormErr] = useState("");

  async function load() {
    setErr(""); 
    setLoading(true);
    try {
      const data = await fetchArtifacts();
      setItems(data);
    } catch (e) {
      setErr(e.message || "Failed to load artifacts");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function onCreate(e) {
    e.preventDefault();
    setFormErr("");

    if (!title.trim()) {
      setFormErr("Title is required.");
      return;
    }

    setSaving(true);
    try {
      await createArtifact({
        title: title.trim(),
        artifact_type: artifactType,
        description,
        visibility,
      });

      // reset form + reload list
      setTitle("");
      setArtifactType("MODEL");
      setDescription("");
      setVisibility("PRIVATE");
      await load();
    } catch (ex) {
      setFormErr(ex.message || "Failed to create artifact");
    } finally {
      setSaving(false);
    }
  }

  function logout() {
    clearToken();
    nav("/");
  }

  return (
    <div className="artifacts-page">
      <div className="artifacts-header">
        <h2>
          <div className="header-icon">
            <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
              <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
              <line x1="12" y1="22.08" x2="12" y2="12"></line>
            </svg>
          </div>
          Your Artifacts
        </h2>
        <button onClick={logout} className="logout-btn">
          Logout
        </button>
      </div>

      <div className="create-form-card">
        <h3>
          <div className="form-title-icon">
            <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
          </div>
          Create New Artifact
        </h3>

        <form onSubmit={onCreate} className="artifact-form">
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">
                <svg className="label-icon" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                  <line x1="16" y1="13" x2="8" y2="13"></line>
                  <line x1="16" y1="17" x2="8" y2="17"></line>
                  <polyline points="10 9 9 9 8 9"></polyline>
                </svg>
                Title
              </label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="form-input"
                placeholder="e.g., Polyp Segmentation Model"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                <svg className="label-icon" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path>
                  <line x1="7" y1="7" x2="7.01" y2="7"></line>
                </svg>
                Artifact Type
              </label>
              <select
                value={artifactType}
                onChange={(e) => setArtifactType(e.target.value)}
                className="form-select"
              >
                {ARTIFACT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">
              <svg className="label-icon" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
              Visibility
            </label>
            <select
              value={visibility}
              onChange={(e) => setVisibility(e.target.value)}
              className="form-select"
            >
              {VISIBILITY.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">
              <svg className="label-icon" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="form-textarea"
              placeholder="Optional description..."
            />
          </div>

          <button disabled={saving} className="submit-btn">
            {saving ? (
              <>
                <div className="loading-spinner" style={{ width: '20px', height: '20px', borderWidth: '3px' }}></div>
                Creating...
              </>
            ) : (
              <>
                <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                Create Artifact
              </>
            )}
          </button>

          {formErr && (
            <div className="form-error">
              <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
              <span>{formErr}</span>
            </div>
          )}
        </form>
      </div>

      <div className="artifacts-list-section">
        <div className="list-header">
          <div className="list-header-icon">
            <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="8" y1="6" x2="21" y2="6"></line>
              <line x1="8" y1="12" x2="21" y2="12"></line>
              <line x1="8" y1="18" x2="21" y2="18"></line>
              <line x1="3" y1="6" x2="3.01" y2="6"></line>
              <line x1="3" y1="12" x2="3.01" y2="12"></line>
              <line x1="3" y1="18" x2="3.01" y2="18"></line>
            </svg>
          </div>
          My Artifacts
        </div>

        {loading && (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Loading your artifacts...</p>
          </div>
        )}

        {err && (
          <div className="error-state">
            <p>{err}</p>
          </div>
        )}

        {!loading && !err && items.length === 0 && (
          <div className="empty-state">
            <svg className="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
              <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
              <line x1="12" y1="22.08" x2="12" y2="12"></line>
            </svg>
            <p>No artifacts yet. Create your first one above!</p>
          </div>
        )}

        {!loading && !err && items.length > 0 && (
          <ul className="artifacts-grid">
            {items.map((a) => (
              <li
                key={a.id}
                className="artifact-card"
                onClick={() => nav(`/artifacts/${a.id}`)}
              >
                <div className="artifact-header">
                  <h4 className="artifact-title">{a.title}</h4>
                  <span className="artifact-type-badge">{a.artifact_type}</span>
                </div>
                <div className="artifact-meta">
                  <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>
                  </svg>
                  {new Date(a.created_at).toLocaleString()}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
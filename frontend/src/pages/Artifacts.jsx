import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import NavBar from "../components/NavBar";
import { fetchMyArtifacts, fetchAccessibleArtifacts, createArtifact } from "../api/artifacts";

export default function Artifacts() {
  const nav = useNavigate();

  const [myArtifacts, setMyArtifacts] = useState([]);
  const [accessible, setAccessible] = useState([]);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);

  // create form
  const [title, setTitle] = useState("");
  const [artifactType, setArtifactType] = useState("MODEL");
  const [visibility, setVisibility] = useState("PRIVATE");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
    setErr("");
    setLoading(true);
    try {
      const [mine, access] = await Promise.all([fetchMyArtifacts(), fetchAccessibleArtifacts()]);
      setMyArtifacts(mine);
      setAccessible(access);
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
    setErr("");
    setSaving(true);
    try {
      await createArtifact({
        title,
        artifact_type: artifactType,
        description,
        visibility,
      });
      setTitle("");
      setDescription("");
      await load();
    } catch (e2) {
      setErr(e2.message || "Create failed");
    } finally {
      setSaving(false);
    }
  }

  const ownedIds = useMemo(() => new Set(myArtifacts.map((a) => a.id)), [myArtifacts]);

  const sharedWithMe = useMemo(() => {
    // shared = accessible but not owned and not public
    return accessible.filter((a) => !ownedIds.has(a.id) && a.visibility === "SHARED");
  }, [accessible, ownedIds]);

  const publicArtifacts = useMemo(() => {
    // public = accessible but not owned and public
    return accessible.filter((a) => !ownedIds.has(a.id) && a.visibility === "PUBLIC");
  }, [accessible, ownedIds]);

  function ArtifactList({ title, items }) {
    return (
      <div className="card mb-4">
        <div className="card-body">
          <h5 className="card-title mb-3">{title}</h5>

          {items.length === 0 ? (
            <div className="text-muted">No artifacts.</div>
          ) : (
            <div className="list-group">
              {items.map((a) => (
                <button
                  key={a.id}
                  className="list-group-item list-group-item-action d-flex justify-content-between align-items-center"
                  onClick={() => nav(`/artifacts/${a.id}`)}
                >
                  <div>
                    <div className="fw-bold">{a.title}</div>
                    <div className="text-muted small">
                      {a.artifact_type} • {a.visibility}
                    </div>
                  </div>
                  <span className="text-muted small">{new Date(a.created_at).toLocaleString()}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div>
      <NavBar />

      <div className="container py-4" style={{ maxWidth: 900 }}>
        <h3 className="mb-3">Artifacts</h3>

        {/* Create Artifact */}
        <div className="card mb-4">
          <div className="card-body">
            <h5 className="card-title">Create Artifact</h5>

            <form onSubmit={onCreate} className="row g-2">
              <div className="col-md-4">
                <input
                  className="form-control"
                  placeholder="Title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div className="col-md-3">
                <select className="form-select" value={artifactType} onChange={(e) => setArtifactType(e.target.value)}>
                  <option value="MODEL">MODEL</option>
                  <option value="DATASET">DATASET</option>
                  <option value="EMBEDDING">EMBEDDING</option>
                  <option value="RUN">RUN</option>
                  <option value="PAPER">PAPER</option>
                </select>
              </div>

              <div className="col-md-3">
                <select className="form-select" value={visibility} onChange={(e) => setVisibility(e.target.value)}>
                  <option value="PRIVATE">PRIVATE</option>
                  <option value="SHARED">SHARED</option>
                  <option value="PUBLIC">PUBLIC</option>
                </select>
              </div>

              <div className="col-md-12">
                <input
                  className="form-control"
                  placeholder="Description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div className="col-md-12">
                <button className="btn btn-primary" disabled={saving}>
                  {saving ? "Creating..." : "Create"}
                </button>
              </div>
            </form>

            {err && <div className="alert alert-danger mt-3 mb-0">{err}</div>}
          </div>
        </div>

        {loading ? (
          <div>Loading...</div>
        ) : (
          <>
            <ArtifactList title="My Artifacts" items={myArtifacts} />
            <ArtifactList title="Shared With Me" items={sharedWithMe} />
            <ArtifactList title="Public Artifacts" items={publicArtifacts} />
          </>
        )}
      </div>
    </div>
  );
}

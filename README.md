# Secure Artifact Registry

A backend-driven system for securely managing machine learning and research artifacts (models, datasets, embeddings, experiment outputs) with **versioning, access control, and file storage**.  
The platform enables authenticated users to create, version, store, share, and retrieve artifacts with fine-grained permissions.

This project was built to demonstrate **real-world backend system design**, secure API development, and authorization logic commonly used in ML infrastructure and internal tooling.

---

## Why This Project Exists

In real ML and research workflows, artifacts such as trained models, datasets, embeddings, and experiment outputs must be:

- Versioned
- Stored securely
- Shared selectively
- Auditable and reproducible

This project simulates the backend of such a system, similar in spirit to internal tools used at companies (e.g., model registries, experiment trackers, internal artifact stores).

---

## Core Features

### Authentication & Security
- JWT-based authentication (OAuth2 Password Flow)
- Secure password hashing
- Stateless authorization via access tokens
- Role-aware access control enforced at the API layer

### Artifact Management
- Create artifacts with metadata:
  - Title
  - Type (MODEL, DATASET, EMBEDDING, RUN, PAPER)
  - Description
  - Visibility (PRIVATE, SHARED, PUBLIC)
- Each artifact belongs to a single owner
- Artifacts can be discovered based on visibility and sharing rules

### Versioning System
- Artifacts support multiple versions (e.g., v1, v2, v3)
- Each version includes:
  - Version identifier
  - Change log
  - Timestamp
- Version uniqueness enforced per artifact

### File Storage
- Upload files per artifact version
- Files stored on disk with:
  - Unique server-generated filenames
  - Metadata persisted in the database
- File operations include:
  - Upload
  - List
  - Download
  - Delete (owner only)

### Sharing & Permissions
- Artifacts can be shared (read-only) with specific users
- Permission model:
  - **Owner**: full access (create versions, upload/delete files, share)
  - **Shared user**: read metadata + download files
  - **Public user**: read metadata only (no download)
- Permissions enforced at CRUD level (not UI-only)

### Access Control Logic
- Centralized permission helpers:
  - `can_read_artifact`
  - `can_download_artifact`
  - `can_write_artifact`
- Prevents privilege escalation and unauthorized access

---

## Technology Stack

### Backend
- **Python**
- **FastAPI** – REST API framework
- **SQLModel** – ORM and data modeling
- **SQLite** (development) – relational storage
- **JWT / OAuth2** – authentication
- **Passlib** – password hashing

### Frontend (Supporting)
- React + Vite
- Bootstrap
- API-driven UI (no business logic on client)

> **Note:** Backend is the primary focus of this project.

---

## Database Design (Simplified)

### Core Tables
- `User`
- `Artifact`
- `ArtifactVersion`
- `ArtifactFile`
- `ArtifactShare`

### Relationships
- One User → many Artifacts  
- One Artifact → many Versions  
- One Version → many Files  
- One Artifact → many Shared Users  

All foreign key relationships are enforced at the database level.

---

## API Overview

### Authentication
- `POST /auth/register`
- `POST /auth/login`
- `GET /auth/me`

### Artifacts
- `POST /artifacts`
- `GET /artifacts`
- `GET /artifacts/{artifact_id}`

### Versions
- `POST /artifacts/{artifact_id}/versions`
- `GET /artifacts/{artifact_id}/versions`

### Files
- `POST /versions/{version_id}/files`
- `GET /versions/{version_id}/files`
- `GET /files/{file_id}`
- `DELETE /files/{file_id}`

### Sharing
- `POST /artifacts/{artifact_id}/share`

All protected endpoints require a valid Bearer token.

---

## Security Considerations

- No plaintext passwords stored
- Tokens are validated and decoded on every protected request
- Access control enforced server-side (not via frontend trust)
- File access validated against artifact permissions
- Public artifacts do **not** allow file download (metadata only)

---

## What This Project Demonstrates

- Backend API design beyond CRUD
- Real-world authorization models
- Secure file handling
- Versioned data modeling
- Clean separation of concerns
- Production-style permission enforcement
- ML-adjacent infrastructure thinking

---

## Future Enhancements

- Audit logging (artifact activity timeline)
- Expiring shares
- Role-based permissions
- Object storage integration (S3 / GCS)
- Search and tagging
- Artifact lifecycle policies

---

## Author

**Rithvik Nagaraj**  
Master’s in Computer Science  
Focus: Backend Systems, ML Infrastructure, Secure APIs
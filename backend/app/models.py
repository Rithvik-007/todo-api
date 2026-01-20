from fileinput import filename
from sqlalchemy.engine import create
from sqlmodel import SQLModel, Field
import enum, datetime

class ArtifactType(str, enum.Enum):
    MODEL = "MODEL"
    DATASET = "DATASET"
    EMBEDDING = "EMBEDDING"
    RUN = "RUN"
    PAPER = "PAPER"

class VisibilityType(str, enum.Enum):
    PUBLIC = "PUBLIC"
    SHARED = "SHARED"
    PRIVATE = "PRIVATE"

class User(SQLModel, table=True):
    id: int = Field(default=None, primary_key=True)
    email: str = Field(index=True, unique=True)
    hashed_password: str

class Artifact(SQLModel, table=True):
    id: int = Field(default=None, primary_key=True)
    owner_id: int = Field(foreign_key="user.id")
    title: str = Field(index=True)
    artifact_type: ArtifactType = Field(index=True)
    description: str = Field(default="")
    visibility: VisibilityType   # PUBLIC, SHARED, or PRIVATE
    created_at: datetime.datetime = Field(default_factory=datetime.datetime.now)

class ArtifactVersion(SQLModel, table=True):
    id: int = Field(default=None, primary_key=True)
    artifact_id: int = Field(foreign_key="artifact.id")
    version: str = Field(index=True)
    changelog: str = Field(default="")
    created_at: datetime.datetime = Field(default_factory=datetime.datetime.now)

class ArtifactFile(SQLModel, table=True):
    id: int = Field(default=None, primary_key=True)
    version_id: int = Field(foreign_key="artifactversion.id")
    owner_id: int = Field(foreign_key="user.id")
    filename: str
    content_type: str  # e.g., "application/octet-stream"
    size_bytes: int
    storage_path: str  # Path or URL to the stored file
    created_at: datetime.datetime = Field(default_factory=datetime.datetime.now)

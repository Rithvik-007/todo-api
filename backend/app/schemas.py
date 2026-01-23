from ast import Str
from pydantic import EmailStr, BaseModel, Field
from app.models import Artifact, ArtifactType, VisibilityType

# User Schemas
class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)

class UserResponse(BaseModel):
    id: int
    email: str

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


# Artifact Schemas

class ArtifactCreateRequest(BaseModel):
    title: str = Field(min_length=1)
    artifact_type: ArtifactType = Field(...)
    description: str = ""
    visibility: VisibilityType

class ArtifactResponse(BaseModel):
    id: int
    owner_id: int
    title: str
    artifact_type: ArtifactType = Field(...)
    description: str
    visibility: VisibilityType
    created_at: str

# Artifact Version Schemas

class ArtifactVersionRequest(BaseModel):
    version: str
    change_log: str = ""

class ArtifactVersionResponse(BaseModel):
    id: int
    artifact_id: int
    version: str
    changelog: str
    created_at: str

# Artifact File Schemas
class ArtifactFileResponse(BaseModel):
    id: int
    version_id: int
    filename: str
    content_type: str
    size_bytes: int
    created_at: str
from sys import version
from fastapi import FastAPI, File, HTTPException, Depends, UploadFile
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from app.schemas import RegisterRequest, UserResponse, ArtifactResponse
from app.crud import create_user, get_user_by_email, create_artifact, get_artifacts_by_owner, create_artifact_version, list_artifact_versions, create_artifact_file, get_file_record, list_files_for_version, delete_file
from app.security import verify_password
from app.auth import create_access_token
from app.schemas import LoginRequest, TokenResponse, ArtifactCreateRequest, ArtifactVersionRequest, ArtifactVersionResponse, ArtifactFileResponse
from app.deps import get_current_user
from app.models import User


app = FastAPI()

origins = ["http://localhost:5173"]

app.add_middleware(CORSMiddleware, 
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Welcome to the User Registration API"}

@app.post("/auth/register", status_code=201)
def register_user(request: RegisterRequest) -> UserResponse:
    try:
        user = create_user(email=request.email, password=request.password)
        return UserResponse(id=user.id, email=user.email)
    except ValueError as e:
        print("Email already exists")
        raise HTTPException(status_code=409, detail=str(e)) 

@app.post("/auth/login")
def login_user(request: LoginRequest) -> TokenResponse:
    user = get_user_by_email(request.email)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    if not verify_password(request.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    access_token = create_access_token({"sub": user.email})
    return TokenResponse(access_token=access_token)

@app.get("/auth/me")
def read_current_user(current_user: User = Depends(get_current_user)) -> UserResponse:
    return UserResponse(id=current_user.id, email=current_user.email)

@app.post("/artifacts", status_code=201)
def create_artifact_endpoint(artifact_in: ArtifactCreateRequest, current_user: User = Depends(get_current_user)) -> ArtifactResponse:
    artifact = create_artifact(
        owner_id=current_user.id,
        title=artifact_in.title,
        artifact_type=artifact_in.artifact_type,
        description=artifact_in.description,
        visibility=artifact_in.visibility
    )
    return ArtifactResponse(
        id=artifact.id,
        owner_id=artifact.owner_id,
        title=artifact.title,
        artifact_type=artifact.artifact_type,
        description=artifact.description,
        visibility=artifact.visibility,
        created_at=artifact.created_at.isoformat()
    )

@app.get("/artifacts/me", response_model=list[ArtifactResponse])
def get_my_artifacts(current_user: User = Depends(get_current_user)) -> list[ArtifactResponse]:
    artifacts = get_artifacts_by_owner(current_user.id)
    return [
        ArtifactResponse(
            id=artifact.id,
            owner_id=artifact.owner_id,
            title=artifact.title,
            artifact_type=artifact.artifact_type,
            description=artifact.description,
            visibility=artifact.visibility,
            created_at=artifact.created_at.isoformat()
        )
        for artifact in artifacts
    ]

@app.post("/artifacts/{artifact_id}/versions", response_model=ArtifactVersionResponse)
def add_artifact_version(artifact_id: int, verions_req: ArtifactVersionRequest, current_user: User = Depends(get_current_user)) -> ArtifactVersionResponse:
    try:
        artifact_version = create_artifact_version(
            artifact_id=artifact_id,
            version=verions_req.version,
            changelog=verions_req.change_log,
            current_user_id=current_user.id
        )
        return ArtifactVersionResponse(
            id=artifact_version.id,
            artifact_id=artifact_version.artifact_id,
            version=artifact_version.version,
            changelog=artifact_version.changelog,
            created_at=artifact_version.created_at.isoformat()
        )
    except ValueError as e:
        error_message = str(e)
        if "Artifact not found or access denied" in error_message:
            raise HTTPException(status_code=404, detail=error_message)
        elif "already exists" in error_message:
            raise HTTPException(status_code=409, detail=error_message)
        else:
            raise HTTPException(status_code=400, detail=error_message)

@app.get("/artifacts/{artifact_id}/versions", response_model=list[ArtifactVersionResponse])
def list_artifact_versions_endpoint(artifact_id: int, current_user: User = Depends(get_current_user)) -> list[ArtifactVersionResponse]:
    versions = list_artifact_versions(artifact_id, current_user.id)
    return [
        ArtifactVersionResponse(
            id=version.id,
            artifact_id=version.artifact_id,
            version=version.version,
            changelog=version.changelog,
            created_at=version.created_at.isoformat()
        )
        for version in versions
    ]


@app.post("/versions/{version_id}/files", response_model=ArtifactFileResponse)
def upload_artifact_file(version_id: int, file: UploadFile = File(...), current_user: User = Depends(get_current_user)) -> ArtifactFileResponse:
    try:
        artifact_file = create_artifact_file(
            version_id=version_id,
            owner_id=current_user.id,
            file=file
        )
        return ArtifactFileResponse(
            id=artifact_file.id,
            version_id=artifact_file.version_id,
            filename=artifact_file.filename,
            content_type=artifact_file.content_type,
            size_bytes=artifact_file.size_bytes,
            created_at=artifact_file.created_at.isoformat()
        )
    except ValueError as e:
        error_message = str(e)
        if "not found" in error_message or "denied" in error_message:
            raise HTTPException(status_code=404, detail=error_message)
        else:
            raise HTTPException(status_code=400, detail=error_message)

@app.get("/files/{file_id}")
def download_file(file_id: int, current_user: User = Depends(get_current_user)):
    try:
        file_record = get_file_record(file_id, current_user.id)
        return FileResponse(
            path=file_record.storage_path,
            filename=file_record.filename,
            media_type=file_record.content_type
        )
    except ValueError as e: 
        raise HTTPException(status_code=404, detail=str(e))
    
@app.get("/versions/{version_id}/files", response_model=list[ArtifactFileResponse])
def list_artifact_files(version_id: int, current_user: User = Depends(get_current_user)) -> list[ArtifactFileResponse]:
    try:
        files = list_files_for_version(version_id, current_user.id)
        return [
            ArtifactFileResponse(
                id=file.id,
                version_id=file.version_id,
                filename=file.filename,
                content_type=file.content_type,
                size_bytes=file.size_bytes,
                created_at=file.created_at.isoformat()
            )
            for file in files
        ]
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    

@app.delete("/files/{file_id}")
def delete_artifact_file(file_id: int, current_user: User = Depends(get_current_user)):
    try:
        delete_file(file_id, current_user.id)
        return {"message": "File deleted successfully"}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
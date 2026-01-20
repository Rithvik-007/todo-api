import datetime
import os
import shutil
import uuid
from pathlib import Path
from fastapi import UploadFile
from sqlmodel import Session, select
from backend.app.models import User
from backend.app.db import engine
from backend.app.security import hash_password
from backend.app.models import Artifact, ArtifactType, VisibilityType, ArtifactVersion, ArtifactFile

# User CRUD operations

def get_user_by_email(email: str) -> User | None:
    with Session(engine) as session:
        statement = select(User).where(User.email == email)
        result = session.exec(statement).first()
        return result

def create_user(email: str, password: str) -> User:
    if get_user_by_email(email):
        raise ValueError("Email already registered")
    
    hashed_pw = hash_password(password)
    user = User(email=email, hashed_password=hashed_pw)
    with Session(engine) as session:
        session.add(user)
        session.commit()
        session.refresh(user)
        print(f"User created with email: {email}")
    return user

# Artifact CRUD operations

def create_artifact(owner_id: int, title: str, artifact_type: ArtifactType,
                    description: str = "", visibility: VisibilityType = VisibilityType.PRIVATE) -> Artifact:
    artifact = Artifact(
        owner_id=owner_id,
        title=title,
        artifact_type=artifact_type,
        description=description,
        visibility=visibility
    )
    with Session(engine) as session:
        session.add(artifact)
        session.commit()
        session.refresh(artifact)
    return artifact

def get_artifacts_by_owner(owner_id: int):
    with Session(engine) as session:
        statement = select(Artifact).where(Artifact.owner_id == owner_id).order_by(Artifact.created_at.desc())
        results = session.exec(statement).all()
        return results
    

# Artifact Version CRUD operations

def create_artifact_version(artifact_id: int, version: str, current_user_id: int, changelog: str = ""):
    with Session(engine) as session:
        # Verify artifact ownership
        artifact = session.get(Artifact, artifact_id)
        if not artifact or artifact.owner_id != current_user_id:
            raise ValueError("Artifact not found or access denied")
        
        # Check if version already exists for this artifact
        statement = select(ArtifactVersion).where(
            ArtifactVersion.artifact_id == artifact_id,
            ArtifactVersion.version == version
        )
        existing_version = session.exec(statement).first()
        if existing_version:
            raise ValueError(f"Version {version} already exists for this artifact")

        artifact_version = ArtifactVersion(
            artifact_id=artifact_id,
            version=version,
            changelog=changelog
        )
        session.add(artifact_version)
        session.commit()
        session.refresh(artifact_version)
        return artifact_version

def list_artifact_versions(artifact_id: int, current_user_id: int):
    try:
        with Session(engine) as session:
            # Verify artifact ownership
            artifact = session.get(Artifact, artifact_id)
            if not artifact or artifact.owner_id != current_user_id:
                raise ValueError("Artifact not found or access denied")
            
            statement = select(ArtifactVersion).where(ArtifactVersion.artifact_id == artifact_id).order_by(ArtifactVersion.created_at.desc())
            results = session.exec(statement).all()
            return results
    except Exception as e:
        raise ValueError("Error retrieving artifact versions") from e

# helper function to verify artifact version existence
def _verify_artifact_version(session: Session, current_user_id: int, version_id: int) -> ArtifactVersion:
    
    artifact_version = session.get(ArtifactVersion, version_id)
    if not artifact_version:
        raise ValueError("Artifact version not found")
        
    artifact = session.get(Artifact, artifact_version.artifact_id)
    if not artifact or artifact.owner_id != current_user_id:
        raise ValueError("Access denied to this artifact version")
        
    return artifact_version

# Artifact File CRUD operations

def create_artifact_file(version_id: int, owner_id: int, file: UploadFile) -> ArtifactFile:
    with Session(engine) as session:
        # Verify artifact version ownership
        artifact_version = _verify_artifact_version(session = session, current_user_id=owner_id, version_id=version_id)

        artifact_id = artifact_version.artifact_id
        
        artifact = session.get(Artifact, artifact_id)
        
        project_root = Path(__file__).parent.parent.parent
        storage_dir = project_root / "storage" /f"user_{owner_id}" /f"artifact_{artifact.id}" / f"version_{version_id}"
        storage_dir.mkdir(parents=True, exist_ok=True)
       
        original_filename = file.filename or "unnamed_file"
        filename = f"{uuid.uuid4()}_{original_filename}"
        storage_path = str(storage_dir / filename)
      
        with open(storage_path, "wb") as dest_file:
            shutil.copyfileobj(file.file, dest_file)
       
        file_size = os.path.getsize(storage_path)
        content_type = file.content_type 
        
        artifact_file = ArtifactFile(
            version_id=version_id,
            owner_id=owner_id,  
            filename=filename,
            content_type=content_type or "application/octet-stream",
            size_bytes=file_size,
            storage_path=storage_path
        )
        session.add(artifact_file)
        session.commit()
        session.refresh(artifact_file)
        return artifact_file

       
# Download Artifact File
# If a Session is passed in, reuse it; otherwise, open a new one.
def get_file_record(file_id: int, current_user_id: int, session: Session | None = None) -> ArtifactFile:
    if session is not None:
        artifact_file = session.get(ArtifactFile, file_id)
    else:
        with Session(engine) as session_local:
            artifact_file = session_local.get(ArtifactFile, file_id)

    if not artifact_file:
        raise ValueError("Artifact file not found")
    if artifact_file.owner_id != current_user_id:
        raise ValueError("Access denied to this artifact file")
    if not os.path.exists(artifact_file.storage_path):
        raise ValueError("Stored file not found on server")

    return artifact_file

#List all files for a given artifact version
def list_files_for_version(version_id: int, current_user_id: int):
    with Session(engine) as session:
        # Verify artifact version ownership
        artifact_version = _verify_artifact_version(current_user_id=current_user_id, version_id=version_id, session = session)
        statement = (
            select(ArtifactFile)
            .where(
                ArtifactFile.version_id == version_id,
                ArtifactFile.owner_id == current_user_id
            )
            .order_by(ArtifactFile.created_at.desc())
        )

        results = session.exec(statement).all()
        return results

# Delete an artifact file
def delete_file(file_id: int, current_user_id: int):
    with Session(engine) as session:
        file_record = get_file_record(file_id=file_id, current_user_id=current_user_id, session=session)
        
        try:
            # Delete the physical file
            if os.path.exists(file_record.storage_path):
                os.remove(file_record.storage_path)
        except Exception as e:
            raise ValueError("Error deleting the physical file") from e
        
        # Delete the database record
        session.delete(file_record)
        session.commit()
        
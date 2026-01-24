import os
from re import A
import shutil
import uuid
from pathlib import Path
from fastapi import UploadFile
from sqlmodel import Session, select
from app.models import User
from app.db import engine
from app.security import hash_password
from app.models import Artifact, ArtifactType, VisibilityType, ArtifactVersion, ArtifactFile, ArtifactShare


# helper function to verify artifact version existence
def _verify_artifact_version(session: Session, current_user_id: int, version_id: int) -> ArtifactVersion:
    
    artifact_version = session.get(ArtifactVersion, version_id)
    if not artifact_version:
        raise ValueError("Artifact version not found")
        
    artifact = session.get(Artifact, artifact_version.artifact_id)
    if not artifact or artifact.owner_id != current_user_id:
        raise ValueError("Access denied to this artifact version")
        
    return artifact_version

def can_read_artifact(session: Session, artifact: Artifact, user_id: int) -> bool:
    if artifact.visibility == VisibilityType.PUBLIC:
        return True
    if artifact.owner_id == user_id:
        return True

    statement = select(ArtifactShare).where(
            ArtifactShare.artifact_id == artifact.id,
            ArtifactShare.shared_with_user_id == user_id
    )
    shared_record = session.exec(statement).first()
    if shared_record:
        return True    
    return False

def can_write_artifact(session: Session, artifact: Artifact, user_id: int) -> bool:
    return artifact.owner_id == user_id

def can_download_artifact(session: Session, artifact: Artifact, user_id: int) -> bool:
    if artifact.owner_id == user_id:
        return True
    statement = select(ArtifactShare).where(ArtifactShare.artifact_id == artifact.id, 
            ArtifactShare.shared_with_user_id == user_id)
    shared_record = session.exec(statement).first()
    if shared_record:
        return True

# User CRUD operations

def get_user_by_email(session: Session, email: str) -> User | None:
        statement = select(User).where(User.email == email)
        result = session.exec(statement).first()
        return result
    

def create_user(email: str, password: str) -> User:
    with Session(engine) as session:
        if get_user_by_email(session= session, email=email):
            raise ValueError("Email already registered")
    
        hashed_pw = hash_password(password)
        user = User(email=email, hashed_password=hashed_pw)
    
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
            if not artifact:
                raise ValueError("Artifact not found")
            if not can_read_artifact(session, artifact, current_user_id):
                raise ValueError("Access denied to this artifact's versions")
            
            statement = select(ArtifactVersion).where(ArtifactVersion.artifact_id == artifact_id).order_by(ArtifactVersion.created_at.desc())
            results = session.exec(statement).all()
            return results
    except Exception as e:
        raise ValueError("Error retrieving artifact versions") from e

# Artifact File CRUD operations

def create_artifact_file(version_id: int, owner_id: int, file: UploadFile) -> ArtifactFile:
    with Session(engine) as session:
        # Verify artifact version ownership
        artifact_version = _verify_artifact_version(session = session, current_user_id=owner_id, version_id=version_id)

        artifact_id = artifact_version.artifact_id
        
        artifact = session.get(Artifact, artifact_id)
        
        project_root = Path(__file__).parent.parent
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
def get_file_record(session: Session, file_id: int, current_user_id: int) -> ArtifactFile:
    
    artifact_file = session.get(ArtifactFile, file_id)
    
    if not artifact_file:
        raise ValueError("Artifact file not found")

    version = session.get(ArtifactVersion, artifact_file.version_id)
    if not version:
        raise ValueError("Artifact version not found for this file")

    artifact = session.get(Artifact, version.artifact_id)
    if not artifact:
        raise ValueError("Artifact not found for this file")

    if not can_download_artifact(session, artifact, current_user_id):
        raise ValueError("Access denied to download this artifact file")
        
    if not os.path.exists(artifact_file.storage_path):
        raise ValueError("Stored file not found on server")

    return artifact_file

#List all files for a given artifact version
def list_files_for_version(version_id: int, current_user_id: int):
    with Session(engine) as session:
        version = session.get(ArtifactVersion, version_id)
        if not version:
            raise ValueError("Artifact version not found")

        artifact = session.get(Artifact, version.artifact_id)
        if not artifact:
            raise ValueError("Artifact not found for this version")

        if not can_read_artifact(session, artifact, current_user_id):
            raise ValueError("Access denied to this artifact version's files")
            
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

# CRUD operations for ArtifactShare 
def share_artifact(artifact_id: int, owner_id: int, target_email: str):
    with Session(engine) as session:
        # Verify artifact ownership
        artifact = session.get(Artifact, artifact_id)
        if not artifact or artifact.owner_id != owner_id:
            raise ValueError("Artifact not found or access denied")

        #if can_write_artifact(session, artifact, owner_id) is False:
            #raise ValueError("You do not have permission to share this artifact")

        # Get target user
        target_user = get_user_by_email(session=session, email=target_email)
        if not target_user:
            raise ValueError("Target user not found")
        
        if target_user.id == owner_id:
            raise ValueError("Cannot share artifact with yourself")
        
        # Check if already shared
        statement = select(ArtifactShare).where(
            ArtifactShare.artifact_id == artifact_id,
            ArtifactShare.shared_with_user_id == target_user.id
        )
        existing_share = session.exec(statement).first()
        if existing_share:
            raise ValueError("Artifact already shared with this user")
        
        artifact_share = ArtifactShare(
            artifact_id=artifact_id,
            shared_with_user_id=target_user.id
        )
        session.add(artifact_share)
        session.commit()
        session.refresh(artifact_share)
        return artifact_share
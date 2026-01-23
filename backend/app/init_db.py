from app.db import engine
from sqlmodel import SQLModel
from app.models import User, Artifact, ArtifactVersion, ArtifactFile

def init_db():
    SQLModel.metadata.create_all(engine)

if __name__ == "__main__":
    init_db()
    print("Database initialized.")          
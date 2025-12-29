from sqlmodel import Session, select
from app.models import User
from app.db import engine
from app.security import hash_password

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

    
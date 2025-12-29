from pydantic import EmailStr
from sqlmodel import SQLModel, Field

class RegisterRequest(SQLModel):
    email: EmailStr
    password: str = Field(min_length=8)

class UserResponse(SQLModel):
    id: int
    email: str
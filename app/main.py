from fastapi import FastAPI, HTTPException, Depends
from app.schemas import RegisterRequest, UserResponse
from app.crud import create_user, get_user_by_email
from app.security import verify_password
from app.auth import create_access_token
from app.schemas import TokenResponse, LoginRequest, UserResponse
from app.deps import get_current_user, oauth2_scheme
from app.models import User

app = FastAPI()

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

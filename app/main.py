from fastapi import FastAPI, HTTPException
from app.schemas import RegisterRequest, UserResponse
from app.crud import create_user


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
    
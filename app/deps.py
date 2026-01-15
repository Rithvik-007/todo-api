from fastapi import Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer, HTTPBearer, HTTPAuthorizationCredentials
from app.models import User
from app.crud import get_user_by_email
from app.auth import SECRET_KEY, ALGORITHM
from jose import jwt, JWTError


oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")
bearer_token = HTTPBearer()

def get_current_user(creds: HTTPAuthorizationCredentials = Depends(bearer_token)) -> User:
    token = creds.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if not email:
            raise HTTPException(status_code=401, detail="could not validate credentials")
    except JWTError:
        raise HTTPException(status_code=401, detail="could not validate credentials")
    user = get_user_by_email(email)
    if user is None:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    return user
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.database import get_db
from app import models

router = APIRouter()

class AuthRequest(BaseModel):
    username: str
    password: str

@router.post("/login")
def login(req: AuthRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.username == req.username).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials. Handshake failed."
        )
    
    # Hash password with stored user salt
    test_hash, _ = models.hash_password(req.password, user.salt)
    if test_hash != user.password_hash:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials. Handshake failed."
        )
    
    # Simple static token simulation for demo purposes
    return {
        "success": True,
        "token": f"copilot_session_token_{user.username}",
        "username": user.username
    }

@router.post("/register")
def register(req: AuthRequest, db: Session = Depends(get_db)):
    if not req.username.strip() or not req.password.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username and password cannot be empty."
        )
    
    existing = db.query(models.User).filter(models.User.username == req.username).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already enrolled in core gateway."
        )
    
    pwd_hash, salt = models.hash_password(req.password)
    new_user = models.User(
        username=req.username,
        password_hash=pwd_hash,
        salt=salt
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return {
        "success": True,
        "detail": "Ingress keys successfully enrolled."
    }

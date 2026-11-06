import bcrypt
from datetime import datetime, timedelta, timezone
from typing import Any, List, Optional, Union
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db

oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_V1_STR}/auth/login",
    auto_error=False,
)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifies a plain-text password against a bcrypt hash with 72-byte truncation safety."""
    try:
        if not plain_password or not hashed_password:
            return False
        # Truncate to 72 bytes to conform with bcrypt specifications
        password_bytes = plain_password.encode("utf-8")[:72]
        hash_bytes = hashed_password.encode("utf-8")
        return bcrypt.checkpw(password_bytes, hash_bytes)
    except Exception:
        return False


def get_password_hash(password: str) -> str:
    """Hashes a password with salt using bcrypt with 72-byte safety."""
    password_bytes = password.encode("utf-8")[:72]
    salt = bcrypt.gensalt(rounds=12)
    return bcrypt.hashpw(password_bytes, salt).decode("utf-8")


def create_access_token(
    subject: Union[str, Any],
    role: str,
    user_id: int,
    permissions: Optional[List[str]] = None,
    expires_delta: Optional[timedelta] = None
) -> str:
    """Creates a signed JSON Web Token (JWT) with user claims."""
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(
            minutes=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES
        )

    to_encode = {
        "exp": expire,
        "sub": str(subject),
        "role": str(role),
        "id": int(user_id),
        "permissions": permissions or [],
    }
    encoded_jwt = jwt.encode(
        to_encode,
        settings.JWT_SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM
    )
    return encoded_jwt


def decode_access_token(token: str) -> Optional[dict]:
    """Decodes and validates a JWT token signature and expiration."""
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM]
        )
        return payload
    except JWTError:
        return None


def require_user(token: Optional[str] = Depends(oauth2_scheme)) -> dict:
    """
    Enforces authentication for protected endpoints.
    Returns standard 401 with machine-readable AUTH_REQUIRED error code.
    """
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"message": "Authentication required to access this resource", "code": "AUTH_REQUIRED"},
            headers={"WWW-Authenticate": "Bearer"},
        )
    payload = decode_access_token(token)
    if not payload or not payload.get("sub"):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"message": "Invalid or expired session token", "code": "AUTH_REQUIRED"},
            headers={"WWW-Authenticate": "Bearer"},
        )
    return payload


def get_optional_user(token: Optional[str] = Depends(oauth2_scheme)) -> Optional[dict]:
    """Extracts user claims if a valid token is present; returns None for guests."""
    if not token:
        return None
    return decode_access_token(token)


def get_current_user_payload(payload: dict = Depends(require_user)) -> dict:
    """Extracts and verifies claims from the Bearer token."""
    return payload


def get_current_user(payload: dict = Depends(require_user)) -> dict:
    """Returns token claims payload including user id, email, and role."""
    return payload


def require_role(allowed_roles: List[str]):
    """Role-based access control dependency factory."""
    def role_checker(payload: dict = Depends(require_user)) -> dict:
        user_role = payload.get("role")
        if user_role not in allowed_roles and user_role != "super_admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={"message": f"Access denied: Required role in {allowed_roles}, your role is '{user_role}'", "code": "FORBIDDEN"}
            )
        return payload
    return role_checker


def require_permission(permission_code: str):
    """
    RBAC dependency factory that validates the user has the required permission code.
    Resolves permissions from user roles with cached/fallback mapping.
    """
    def permission_checker(
        payload: dict = Depends(require_user),
        db: Session = Depends(get_db),
    ) -> dict:
        user_id = payload.get("id")
        user_role = payload.get("role")

        if user_role == "super_admin":
            return payload

        # Query user roles & permissions from DB
        from app.models.user import User
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail={"message": "User account not found", "code": "AUTH_REQUIRED"},
            )

        granted_codes = set()
        if hasattr(user, 'assigned_roles') and user.assigned_roles:
            for r in user.assigned_roles:
                if r.name == "super_admin":
                    return payload
                for p in r.permissions:
                    granted_codes.add(p.code)

        # Fallback defaults for legacy role enums
        if not granted_codes:
            role_matrix = {
                "student": {"resume:analyze", "ai:use", "blog:read"},
                "alumni": {"resume:analyze", "ai:use", "blog:read", "blog:create", "blog:edit_own"},
                "author": {"resume:analyze", "ai:use", "blog:read", "blog:create", "blog:edit_own"},
                "editor": {
                    "resume:analyze", "ai:use", "blog:read", "blog:create", "blog:edit_own",
                    "blog:edit_any", "blog:publish"
                },
                "tnp_admin": {
                    "resume:analyze", "ai:use", "blog:read", "blog:create", "blog:edit_own",
                    "blog:edit_any", "blog:publish", "ads:manage", "users:manage"
                },
                "admin": {
                    "resume:analyze", "ai:use", "blog:read", "blog:create", "blog:edit_own",
                    "blog:edit_any", "blog:publish", "ads:manage", "users:manage"
                },
            }
            granted_codes = role_matrix.get(user_role, set())

        if permission_code not in granted_codes:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={"message": f"Action requires '{permission_code}' permission", "code": "FORBIDDEN"}
            )

        payload["permissions"] = list(granted_codes)
        return payload

    return permission_checker

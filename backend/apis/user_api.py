import json
from typing import Optional, Callable
from sqlalchemy import select
from sqlalchemy.orm import Session

# Your SQLAlchemy User model lives here:
from models.db_model import User

# ---- session factory plumbing (same pattern you use elsewhere) ----
_SESSION_FACTORY: Optional[Callable[[], Session]] = None

def set_session_factory_for_user(factory: Callable[[], Session]) -> None:
    """Called once from app.py to inject SessionLocal."""
    global _SESSION_FACTORY
    _SESSION_FACTORY = factory

# ---- local response helpers (kept minimal to avoid circular imports) ----
def _success(data=None, message: str = "", status: int = 200):
    return {"status": "SUCCESS", "statusCode": status, "message": message, "data": data}

def _fail(message: str, status: int = 400):
    return {"status": "FAIL", "statusCode": status, "message": message}

# ---- GET /users/{user_id} ----
def get_user_by_id(user_id: int):
    """
    Fetch a single user by ID. Does NOT return password.
    Response mirrors your style: data is a JSON string.
    """
    if _SESSION_FACTORY is None:
        return _fail("Server misconfigured: no DB session factory is set.", status=500)

    with _SESSION_FACTORY() as db:
        stmt = select(
            User.user_id,
            User.user_email,
            User.user_firstname,
            User.user_lastname,
        ).where(User.user_id == user_id)

        row = db.execute(stmt).first()
        if not row:
            return _fail(f"User not found for user_id={user_id}.", status=404)

        payload = {
            "user_id": row.user_id,
            "user_email": row.user_email,
            "user_firstname": row.user_firstname,
            "user_lastname": row.user_lastname,
        }
        return _success(json.dumps(payload, ensure_ascii=False),
                        message=f"Fetched user_id={user_id}.")

# ---- GET /user?user_id=... ----
def get_user_by_query(user_id: int):
    """Same as above but with query param style."""
    return get_user_by_id(user_id)

import logging
import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import require_user
from app.models.settings import UserSetting, ThemePreference
from app.schemas.settings_schema import UserSettingResponse, UserSettingUpdate

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/me/settings", tags=["User Settings & Theme Preferences"])


@router.get("", response_model=UserSettingResponse)
def get_user_settings(
    db: Session = Depends(get_db),
    user_payload: dict = Depends(require_user),
):
    """Retrieves the authenticated user's settings and visual theme preferences."""
    user_id = user_payload.get("id")
    setting = db.query(UserSetting).filter(UserSetting.user_id == user_id).first()

    if not setting:
        # Create default settings row on demand
        setting = UserSetting(
            id=str(uuid.uuid4()),
            user_id=user_id,
            theme_preference=ThemePreference.SYSTEM,
        )
        db.add(setting)
        db.commit()
        db.refresh(setting)

    return setting


@router.patch("", response_model=UserSettingResponse)
def update_user_settings(
    update_data: UserSettingUpdate,
    db: Session = Depends(get_db),
    user_payload: dict = Depends(require_user),
):
    """Updates user theme preference and persistent UI customizations."""
    user_id = user_payload.get("id")
    setting = db.query(UserSetting).filter(UserSetting.user_id == user_id).first()

    if not setting:
        setting = UserSetting(
            id=str(uuid.uuid4()),
            user_id=user_id,
            theme_preference=update_data.theme_preference,
        )
        db.add(setting)
    else:
        setting.theme_preference = update_data.theme_preference

    db.commit()
    db.refresh(setting)
    return setting

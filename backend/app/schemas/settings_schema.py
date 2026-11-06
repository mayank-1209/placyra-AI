from datetime import datetime
from pydantic import BaseModel, ConfigDict
from app.models.settings import ThemePreference


class UserSettingUpdate(BaseModel):
    theme_preference: ThemePreference


class UserSettingResponse(BaseModel):
    id: str
    user_id: int
    theme_preference: ThemePreference
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

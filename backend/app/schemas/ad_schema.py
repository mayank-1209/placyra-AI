from datetime import datetime
from typing import Any, Dict, Optional
from pydantic import BaseModel, ConfigDict
from app.models.ad import AdPlacement, AdDevice, PostCtaType


class AdSlotResponse(BaseModel):
    id: str
    slot_key: str
    placement: AdPlacement
    ad_unit_id: Optional[str] = None
    format: str
    min_height_px: int
    is_enabled: bool
    device: AdDevice

    model_config = ConfigDict(from_attributes=True)


class AdSlotUpdate(BaseModel):
    ad_unit_id: Optional[str] = None
    is_enabled: Optional[bool] = None
    min_height_px: Optional[int] = None
    format: Optional[str] = None
    device: Optional[AdDevice] = None


class PostCtaHookResponse(BaseModel):
    id: str
    post_id: str
    hook_type: PostCtaType
    config: Optional[Dict[str, Any]] = None
    is_enabled: bool

    model_config = ConfigDict(from_attributes=True)


class PostCtaHookCreate(BaseModel):
    hook_type: PostCtaType
    config: Optional[Dict[str, Any]] = None
    is_enabled: bool = True

from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import require_permission
from app.schemas.ad_schema import AdSlotResponse, AdSlotUpdate
from app.services.blog_service import AdService

router = APIRouter(prefix="/ads", tags=["AdSense Ad Units & Dynamic Slot Configuration"])


@router.get("/slots", response_model=List[AdSlotResponse])
def get_public_ad_slots(
    db: Session = Depends(get_db),
):
    """
    Public Endpoint: Returns active Google AdSense slot placements and formats.
    No authentication required.
    """
    return AdService.get_public_ad_slots(db)


@router.patch("/slots/{slot_key}", response_model=AdSlotResponse)
def update_ad_slot_config(
    slot_key: str,
    update_data: AdSlotUpdate,
    db: Session = Depends(get_db),
    user_payload: dict = Depends(require_permission("ads:manage")),
):
    """
    Protected Endpoint: Toggles or configures AdSense ad unit IDs and dimensions.
    Requires 'ads:manage' permission.
    """
    return AdService.update_ad_slot(db, slot_key, update_data)

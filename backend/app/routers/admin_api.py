"""
Admin API - API Key Management
Provides HTTP endpoints for managing API keys remotely.

All endpoints require the admin secret via X-Admin-Secret header.
"""

import logging
import secrets

from fastapi import APIRouter, Depends, HTTPException, Request, Security
from fastapi.security.api_key import APIKeyHeader
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.models.database import get_db
from app.models.api_key_model import ApiKey, hash_api_key
from app.rate_limit import limiter

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/admin", tags=["Admin"])

# ========== Admin Auth ==========

_admin_header = APIKeyHeader(name="X-Admin-Secret", auto_error=False)


async def verify_admin(secret: str = Security(_admin_header)):
    """Verify admin secret from request header"""
    if not secret or secret != settings.agent_api_key:
        raise HTTPException(status_code=403, detail="Forbidden")
    return True


# ========== Models ==========


class CreateKeyRequest(BaseModel):
    customer_name: str = Field(..., min_length=1, max_length=100)
    credits: int = Field(default=100, ge=0)


class CreateKeyResponse(BaseModel):
    customer_name: str
    api_key: str = Field(..., description="Only shown once at creation time")
    credits: int


class KeyInfoResponse(BaseModel):
    id: int
    customer_name: str
    credits: int
    is_active: bool
    key_hash_prefix: str


class RechargeRequest(BaseModel):
    amount: int = Field(..., gt=0, description="Credits to add")


class MessageResponse(BaseModel):
    message: str


# ========== Routes ==========


@router.get(
    "/keys",
    response_model=list[KeyInfoResponse],
    summary="List all API keys",
    dependencies=[Depends(verify_admin)],
)
@limiter.limit("30/minute")
async def list_keys(request: Request, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(ApiKey).order_by(ApiKey.id))
    records = result.scalars().all()
    return [
        KeyInfoResponse(
            id=r.id,
            customer_name=r.customer_name,
            credits=r.credits,
            is_active=r.is_active,
            key_hash_prefix=r.key_hash[:16] + "...",
        )
        for r in records
    ]


@router.post(
    "/keys",
    response_model=CreateKeyResponse,
    status_code=201,
    summary="Create a new API key",
    dependencies=[Depends(verify_admin)],
)
@limiter.limit("10/minute")
async def create_key(
    request: Request,
    payload: CreateKeyRequest,
    db: AsyncSession = Depends(get_db),
):
    # Check duplicate
    result = await db.execute(
        select(ApiKey).where(ApiKey.customer_name == payload.customer_name)
    )
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=409,
            detail=f"Customer '{payload.customer_name}' already exists",
        )

    raw_key = f"sk-snap-{secrets.token_urlsafe(30)}"
    record = ApiKey(
        key_hash=hash_api_key(raw_key),
        customer_name=payload.customer_name,
        credits=payload.credits,
        is_active=True,
    )
    db.add(record)
    await db.commit()

    logger.info("Admin created key for '%s' with %d credits", payload.customer_name, payload.credits)

    return CreateKeyResponse(
        customer_name=payload.customer_name,
        api_key=raw_key,
        credits=payload.credits,
    )


@router.patch(
    "/keys/{customer_name}/recharge",
    response_model=MessageResponse,
    summary="Add credits to a key",
    dependencies=[Depends(verify_admin)],
)
@limiter.limit("30/minute")
async def recharge_key(
    request: Request,
    customer_name: str,
    payload: RechargeRequest,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(ApiKey).where(ApiKey.customer_name == customer_name)
    )
    record = result.scalar_one_or_none()
    if not record:
        raise HTTPException(status_code=404, detail=f"Customer '{customer_name}' not found")

    old = record.credits
    record.credits += payload.amount
    await db.commit()

    logger.info("Admin recharged '%s': %d -> %d", customer_name, old, record.credits)
    return MessageResponse(message=f"Credits: {old} -> {record.credits} (+{payload.amount})")


@router.patch(
    "/keys/{customer_name}/toggle",
    response_model=MessageResponse,
    summary="Enable or disable a key",
    dependencies=[Depends(verify_admin)],
)
@limiter.limit("30/minute")
async def toggle_key(
    request: Request,
    customer_name: str,
    active: bool = True,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(ApiKey).where(ApiKey.customer_name == customer_name)
    )
    record = result.scalar_one_or_none()
    if not record:
        raise HTTPException(status_code=404, detail=f"Customer '{customer_name}' not found")

    record.is_active = active
    await db.commit()

    action = "enabled" if active else "disabled"
    logger.info("Admin %s key for '%s'", action, customer_name)
    return MessageResponse(message=f"Key for '{customer_name}' is now {action}")


@router.delete(
    "/keys/{customer_name}",
    status_code=204,
    summary="Delete a key permanently",
    dependencies=[Depends(verify_admin)],
)
@limiter.limit("10/minute")
async def delete_key(
    request: Request,
    customer_name: str,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(ApiKey).where(ApiKey.customer_name == customer_name)
    )
    record = result.scalar_one_or_none()
    if not record:
        raise HTTPException(status_code=404, detail=f"Customer '{customer_name}' not found")

    await db.delete(record)
    await db.commit()
    logger.info("Admin deleted key for '%s'", customer_name)

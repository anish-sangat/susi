from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel


class PaymentCreateResponse(BaseModel):
    payment_id: UUID
    order_id: UUID
    payment_reference: str
    amount: Decimal
    currency: str
    status: str


class PaymentVerifyRequest(BaseModel):
    payment_id: str


class PaymentResponse(BaseModel):
    payment_id: UUID
    order_id: UUID
    provider: str
    provider_payment_id: str
    amount: Decimal
    currency: str
    status: str


class PortOneWebhookRequest(BaseModel):
    type: str
    timestamp: str
    data: dict
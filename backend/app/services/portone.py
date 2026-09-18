from typing import Any

import httpx
from fastapi import HTTPException, status

from app.config import settings


def _headers() -> dict[str, str]:
    return {
        "Authorization": f"PortOne {settings.portone_api_secret}",
        "Content-Type": "application/json",
    }


def _handle_response(response: httpx.Response) -> dict[str, Any]:
    try:
        data = response.json()
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Invalid response from PortOne",
        )

    if response.is_error:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail={
                "message": "PortOne API request failed",
                "portone_status": response.status_code,
                "portone_response": data,
            },
        )

    return data


def get_payment(payment_id: str) -> dict[str, Any]:
    url = (
        f"{settings.portone_api_url}"
        f"/payments/{payment_id}"
    )

    try:
        with httpx.Client(timeout=10.0) as client:
            response = client.get(
                url,
                headers=_headers(),
            )
    except httpx.RequestError:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Could not connect to PortOne",
        )

    return _handle_response(response)
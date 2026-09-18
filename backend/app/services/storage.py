from pathlib import Path
from uuid import uuid4

import boto3
from botocore.exceptions import BotoCoreError, ClientError
from fastapi import HTTPException, UploadFile, status

from app.config import settings


ALLOWED_IMAGE_TYPES = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
}

MAX_IMAGE_SIZE = 5 * 1024 * 1024  # 5 MB


def get_r2_client():
    return boto3.client(
        "s3",
        endpoint_url=settings.r2_endpoint_url,
        aws_access_key_id=settings.r2_access_key_id,
        aws_secret_access_key=settings.r2_secret_access_key,
        region_name="auto",
    )


async def upload_product_image(
    file: UploadFile,
    product_id: str,
) -> tuple[str, str]:
    if file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only JPEG, PNG, and WebP images are allowed",
        )

    content = await file.read()

    if not content:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Image file is empty",
        )

    if len(content) > MAX_IMAGE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Image must be 5 MB or smaller",
        )

    extension = ALLOWED_IMAGE_TYPES[file.content_type]

    object_key = (
        f"products/{product_id}/"
        f"{uuid4().hex}{extension}"
    )

    try:
        r2 = get_r2_client()

        r2.put_object(
            Bucket=settings.r2_bucket_name,
            Key=object_key,
            Body=content,
            ContentType=file.content_type,
            CacheControl="public, max-age=31536000, immutable",
        )

    except (BotoCoreError, ClientError):
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Could not upload image to storage",
        )

    public_url = (
        f"{settings.r2_public_url.rstrip('/')}/"
        f"{object_key}"
    )

    return public_url, object_key


def delete_product_image(object_key: str) -> None:
    try:
        r2 = get_r2_client()

        r2.delete_object(
            Bucket=settings.r2_bucket_name,
            Key=object_key,
        )

    except (BotoCoreError, ClientError):
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Could not delete image from storage",
        )
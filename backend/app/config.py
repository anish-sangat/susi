from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # PostgreSQL
    database_url: str

    # Application
    app_name: str = "SUSI API"
    app_version: str = "1.0.0"
    debug: bool = False
    frontend_url: str = "http://localhost:3000"

    # Authentication
    jwt_secret_key: str
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60

    # PortOne
    portone_api_secret: str
    portone_webhook_secret: str
    portone_api_url: str = "https://api.portone.io"

    # Cloudflare R2
    r2_access_key_id: str
    r2_secret_access_key: str
    r2_endpoint_url: str
    r2_bucket_name: str
    r2_public_url: str

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )


settings = Settings()
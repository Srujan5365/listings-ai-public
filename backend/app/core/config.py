from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    ENV: str = "development"
    DATABASE_URL: str = "postgresql+asyncpg://listingsai:listingsai@localhost:5432/listingsai"
    SECRET_KEY: str = ...  # type: ignore[assignment]
    ENCRYPTION_KEY: str = ...  # type: ignore[assignment]
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    GOOGLE_CLIENT_ID: str = ""
    GOOGLE_CLIENT_SECRET: str = ""
    GOOGLE_REDIRECT_URI: str = ""
    ASANA_CLIENT_ID: str = ""
    ASANA_CLIENT_SECRET: str = ""
    ASANA_REDIRECT_URI: str = ""
    ASANA_PAT: str = ""
    ASANA_PROJECT_GID: str = ""
    GOOGLE_DRIVE_ROOT_FOLDER_ID: str = ""
    WORDPRESS_POST_TYPE: str = "posts"
    FUB_API_KEY: str = ""
    WORDPRESS_BASE_URL: str = ""
    WORDPRESS_USERNAME: str = ""
    WORDPRESS_APP_PASSWORD: str = ""
    CORS_ORIGINS: list[str] = ["http://localhost:5173", "http://localhost:3000"]
    # Email / password reset
    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    FROM_EMAIL: str = ""
    APP_URL: str = "http://localhost:5173"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


@lru_cache
def get_settings() -> Settings:
    return Settings()

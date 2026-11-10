from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Setting(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env", env_file_encoding="utf-8", extra="ignore"
    )

    # Load env
    APP_NAME: str
    MODE: str

    PII_ENCRYPTION_KEY: str
    PII_VERSION: str

    POSTGRES_ENDPOINT: str
    POSTGRES_DATABASE: str

    REDIS_HOST: str
    REDIS_PORT: int
    REDIS_DB: int

    JWT_ACCESS: str
    JWT_REFRESH: str
    JWT_ALGORITHM: str

    CLOUDINARY_CLOUD_NAME: str
    CLOUDINARY_API_KEY: str
    CLOUDINARY_API_SECRET: str


# Singleton cache
@lru_cache
def get_setting() -> Setting:
    return Setting()

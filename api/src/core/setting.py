from functools import lru_cache

from pydantic import Field
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

    AI_OLLAMA_URL: str = "http://127.0.0.1:11434"
    AI_MODEL: str = "qwen2.5:3b"
    AI_DAILY_LIMIT: int = Field(default=20, ge=0)
    AI_TIMEOUT_SECONDS: int = Field(default=300, ge=1, le=300)

    IPN_SECRET: str = ""


# Singleton cache
@lru_cache
def get_setting() -> Setting:
    return Setting()

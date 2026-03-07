"""
Application configuration
"""

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Default SQLite for dev; set DATABASE_URL in .env for PostgreSQL
    database_url: str = "sqlite:///./snooker_scoring.db"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()

from pydantic_settings import BaseSettings, SettingsConfigDict


def normalize_database_url(value: str) -> str:
    """Use the installed psycopg v3 driver for hosted PostgreSQL URLs."""
    if value.startswith("postgres://"):
        return "postgresql+psycopg://" + value[len("postgres://"):]
    if value.startswith("postgresql://"):
        return "postgresql+psycopg://" + value[len("postgresql://"):]
    return value


class Settings(BaseSettings):
    database_url: str = "sqlite:///./deliveryhub.db"
    app_env: str = "local"
    delivery_hub_jwt_secret: str = "change-this-delivery-hub-secret"
    cors_origins: str = "http://localhost:3000,http://127.0.0.1:3000"
    model_config = SettingsConfigDict(env_file="../.env", extra="ignore")

    @property
    def is_local(self) -> bool:
        return self.app_env.lower() in {"local", "development", "test"}

    def validate_security(self) -> None:
        if not self.is_local and self.delivery_hub_jwt_secret == "change-this-delivery-hub-secret":
            raise RuntimeError("DELIVERY_HUB_JWT_SECRET must be set to a non-default value outside local environments")

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    @property
    def sqlalchemy_database_url(self) -> str:
        return normalize_database_url(self.database_url)


settings = Settings()

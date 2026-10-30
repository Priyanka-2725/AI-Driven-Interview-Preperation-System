from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "AI Interview Coach ML Service"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Can be overridden by environment variables
    ENVIRONMENT: str = "development"
    ENABLE_INTERIM_RUNNER: bool = False
    HOST: str = "127.0.0.1"
    PORT: int = 8000

    model_config = SettingsConfigDict(
        case_sensitive=True,
        extra="ignore",
        env_file=".env"
    )

settings = Settings()

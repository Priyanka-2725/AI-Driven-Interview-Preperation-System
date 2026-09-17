from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "AI Interview Coach ML Service"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Can be overridden by environment variables
    ENVIRONMENT: str = "development"

    class Config:
        case_sensitive = True

settings = Settings()

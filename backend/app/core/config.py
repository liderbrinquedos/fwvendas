from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    active_erp: str = "veloflow"
    veloflow_api_url: str = ""
    veloflow_api_token: str = ""
    veloflow_timeout: int = 30
    veloflow_retry_attempts: int = 3
    veloflow_verify_ssl: bool = False
    database_url: str = "postgresql://postgres:postgres@localhost:5432/erp_vendas"
    sync_interval_minutes: int = 30
    sync_full_hour: int = 3

    auth_jwt_secret: str = "forcevendas-pro-secret-key-change-in-production"
    auth_jwt_algorithm: str = "HS256"
    auth_jwt_expire_minutes: int = 480
    admin_user: str = "admin"
    admin_pass: str = "admin123"

    class Config:
        env_file = ".env"
        extra = "allow"

    @property
    def erp_api_url(self) -> str:
        return self.veloflow_api_url

    @property
    def erp_api_token(self) -> str:
        return self.veloflow_api_token

    @property
    def erp_timeout_seconds(self) -> int:
        return self.veloflow_timeout


settings = Settings()
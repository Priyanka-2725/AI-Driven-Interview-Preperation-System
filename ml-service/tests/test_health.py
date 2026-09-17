from fastapi.testclient import TestClient
from app.main import app
from app.config import settings

client = TestClient(app)

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["service"] == settings.PROJECT_NAME
    assert "version" in data
    assert "uptimeSeconds" in data

def test_get_version():
    response = client.get("/api/v1/version")
    assert response.status_code == 200
    data = response.json()
    assert data["version"] == settings.VERSION
    assert "pythonVersion" in data
    assert "dependencies" in data

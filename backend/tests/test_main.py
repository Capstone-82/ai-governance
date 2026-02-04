from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_read_main():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"message": "Welcome to AI Cloud Governance API"}

def test_governance_analyze():
    response = client.post(
        "/api/v1/governance/analyze",
        json={"query": "is my bucket public?", "cloud_provider": "aws"}
    )
    assert response.status_code == 200
    assert "result" in response.json()

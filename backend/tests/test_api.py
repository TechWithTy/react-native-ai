from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_read_main():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"message": "Welcome to CareerLift Backend API"}

def test_get_user_profile():
    response = client.get("/api/v1/users/profile")
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "tyriq@careerlift.io"
    assert "id" in data

def test_get_jobs():
    response = client.get("/api/v1/jobs/")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    if len(data) > 0:
        assert "company" in data[0]

def test_get_credits():
    response = client.get("/api/v1/wallet/credits")
    assert response.status_code == 200
    data = response.json()
    assert "ai_credits" in data
    assert isinstance(data["ai_credits"], int)

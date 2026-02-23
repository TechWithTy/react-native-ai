import pytest
from httpx import AsyncClient, ASGITransport
import os
import sys

# Ensure backend root is in the path
backend_path = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if backend_path not in sys.path:
    sys.path.append(backend_path)

import json

@pytest.mark.asyncio
async def test_generate_resume_endpoint():
    # This assumes test client is available or we use httpx directly against the app
    # Let's import app
    from app.main import app
    
    # Load dummy data
    data_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "resume_builder", "data", "base.json"))
    with open(data_path, "r", encoding="utf-8") as f:
        data = json.load(f)
        
    request_payload = {
        "template": "standard",
        "data": data
    }

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.post("/api/v1/documents/generate/resume", json=request_payload)
        
    assert response.status_code == 200
    assert response.headers["content-type"] == "application/pdf"
    assert len(response.content) > 0

@pytest.mark.asyncio
async def test_generate_cover_letter_endpoint():
    from app.main import app
    
    # Load dummy data
    data_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "resume_builder", "data", "cover_letter_base.json"))
    with open(data_path, "r", encoding="utf-8") as f:
        data = json.load(f)
        
    request_payload = {
        "template": "standard",
        "data": data
    }

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.post("/api/v1/documents/generate/cover_letter", json=request_payload)
        
    assert response.status_code == 200
    assert response.headers["content-type"] == "application/pdf"
    assert len(response.content) > 0

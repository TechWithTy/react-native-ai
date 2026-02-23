import pytest
from httpx import AsyncClient, ASGITransport
import os
import sys
from unittest.mock import patch, MagicMock

# Ensure backend root is in the path
backend_path = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if backend_path not in sys.path:
    sys.path.append(backend_path)

@pytest.mark.asyncio
@patch('app.api.v1.endpoints.ai.generation.OpenAIGenerator')
async def test_generate_text_success(MockOpenAIGenerator):
    from app.main import app
    
    # Setup mock
    mock_generator_instance = MagicMock()
    mock_generator_instance.send_message.return_value = {
        "status": "success",
        "response": "Hello world"
    }
    MockOpenAIGenerator.return_value = mock_generator_instance
    
    request_payload = {
        "prompt": "Say hello",
        "provider": "openai",
        "model": "gpt-4"
    }

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.post("/api/v1/ai/generation/text", json=request_payload)
        
    assert response.status_code == 200
    assert response.json() == {
        "status": "success",
        "result": "Hello world",
        "error": None
    }
    mock_generator_instance.send_message.assert_called_once_with(prompt_text="Say hello", max_tokens=1000)

@pytest.mark.asyncio
@patch('app.api.v1.endpoints.ai.generation.OpenAIGenerator')
async def test_generate_image_success(MockOpenAIGenerator):
    from app.main import app
    
    # Setup mock
    mock_generator_instance = MagicMock()
    mock_generator_instance.generate_image.return_value = {
        "status": "success",
        "image_url": "http://example.com/image.png"
    }
    MockOpenAIGenerator.return_value = mock_generator_instance
    
    request_payload = {
        "prompt": "Make an image",
        "provider": "openai"
    }

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.post("/api/v1/ai/generation/image", json=request_payload)
        
    assert response.status_code == 200
    assert response.json() == {
        "status": "success",
        "result": "http://example.com/image.png",
        "error": None
    }
    mock_generator_instance.generate_image.assert_called_once_with(scoped_prompt="Make an image")

@pytest.mark.asyncio
async def test_generate_text_invalid_provider():
    from app.main import app
    
    request_payload = {
        "prompt": "Say hello",
        "provider": "invalid_provider",
        "model": "gpt-4"
    }

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.post("/api/v1/ai/generation/text", json=request_payload)
        
    assert response.status_code == 400
    assert "not supported" in response.json()["detail"]

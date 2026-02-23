import os
import sys
from fastapi import APIRouter, HTTPException
from app.schemas.ai import TextGenerationRequest, ImageGenerationRequest, GenerationResponse

# Add ai-ml-models to sys.path so we can import from it
backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "..", ".."))
ai_models_dir = os.path.join(backend_dir, "ai-ml-models")
if ai_models_dir not in sys.path:
    sys.path.append(ai_models_dir)

try:
    from openai_provider.openai_generator import OpenAIGenerator
except ImportError as e:
    print(f"Failed to import OpenAIGenerator: {e}")
    OpenAIGenerator = None

router = APIRouter()

@router.post("/text", response_model=GenerationResponse)
async def generate_text(request: TextGenerationRequest):
    if request.provider == "openai":
        if not OpenAIGenerator:
            raise HTTPException(status_code=500, detail="OpenAIGenerator is not available")
        
        try:
            generator = OpenAIGenerator(model=request.model)
            result = generator.send_message(prompt_text=request.prompt, max_tokens=request.max_tokens)
            
            if result.get("status") == "success":
                return GenerationResponse(status="success", result=result.get("response"))
            else:
                return GenerationResponse(status="error", error=result.get("message", "Unknown error"))
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    else:
        raise HTTPException(status_code=400, detail=f"Provider {request.provider} not supported")

@router.post("/image", response_model=GenerationResponse)
async def generate_image(request: ImageGenerationRequest):
    if request.provider == "openai":
        if not OpenAIGenerator:
            raise HTTPException(status_code=500, detail="OpenAIGenerator is not available")
        
        try:
            generator = OpenAIGenerator()
            result = generator.generate_image(scoped_prompt=request.prompt)
            
            if result.get("status") == "success":
                return GenerationResponse(status="success", result=result.get("image_url"))
            else:
                return GenerationResponse(status="error", error=result.get("response", "Unknown error"))
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    else:
        raise HTTPException(status_code=400, detail=f"Provider {request.provider} not supported")

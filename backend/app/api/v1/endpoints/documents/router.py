import os
import tempfile
from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
from typing import Dict, Any

from app.schemas.documents import DocumentRequest

import sys
# Make sure resume_builder is in the path
resume_builder_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "..", "resume_builder"))
if resume_builder_path not in sys.path:
    sys.path.append(resume_builder_path)

from resume_builder.generator import generate_resume

router = APIRouter()

@router.post("/generate/resume")
async def generate_resume_endpoint(request: DocumentRequest):
    """
    Generate an ATS-friendly resume PDF.
    """
    fd, pdf_path = tempfile.mkstemp(suffix=".pdf")
    os.close(fd)
    
    try:
        generate_resume(request.template, request.data, pdf_path)
        # Using background tasks to delete the file after sending it is better, but FileResponse doesn't delete it automatically unless using a BackgroundTask. Let's just return it for now, can improve later.
        return FileResponse(pdf_path, media_type="application/pdf", filename=f"resume_{request.template}.pdf")
    except Exception as e:
        if os.path.exists(pdf_path):
            os.remove(pdf_path)
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/generate/cover_letter")
async def generate_cover_letter_endpoint(request: DocumentRequest):
    """
    Generate a formatted cover letter PDF.
    """
    # Ensure template logic handles typical cover letter request
    template = request.template if request.template != "standard" else "cover_letter"

    fd, pdf_path = tempfile.mkstemp(suffix=".pdf")
    os.close(fd)
    
    try:
        generate_resume(template, request.data, pdf_path)
        return FileResponse(pdf_path, media_type="application/pdf", filename=f"cover_letter_{template}.pdf")
    except Exception as e:
        if os.path.exists(pdf_path):
            os.remove(pdf_path)
        raise HTTPException(status_code=500, detail=str(e))

from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse
from pydantic import BaseModel
from typing import Optional, List, Dict
from fastapi.middleware.cors import CORSMiddleware
import os
from pathlib import Path

from backend.chat import generate_excuse

app = FastAPI(title="Excuse Generator API", version="1.0.0")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ExcuseRequest(BaseModel):
    context: str
    event: Optional[str] = None
    medium: str
    user_input: Optional[str] = None

class ExcuseResponse(BaseModel):
    excuse: str
    context: str
    event: Optional[str]
    medium: str

class OptionsResponse(BaseModel):
    events: List[str]

# Dynamic option mappings based on context
CONTEXT_OPTIONS = {
    "work": ["meeting", "general", "presentation", "deadline"],
    "university": ["class", "lecture", "exam", "assignment", "office hours"],
    "school": ["class", "test", "activity", "general"],
    "social": ["party", "dinner", "gathering", "date"],
    "family": ["dinner", "gathering", "event", "visit"],
    "medical": ["appointment", "checkup", "procedure", "emergency"],
    "custom": ["general"]
}

@app.get("/", response_class=HTMLResponse)
async def serve_frontend():
    """Serve the main frontend page"""
    frontend_path = Path(__file__).parent.parent / "frontend" / "index.html"
    if frontend_path.exists():
        return HTMLResponse(content=frontend_path.read_text(), status_code=200)
    else:
        return HTMLResponse(content="<h1>Frontend not found</h1>", status_code=404)

@app.get("/api/options/{context}", response_model=OptionsResponse)
async def get_context_options(context: str):
    """Get available event options for a given context"""
    if context not in CONTEXT_OPTIONS:
        raise HTTPException(status_code=400, detail=f"Invalid context: {context}")
    
    return OptionsResponse(events=CONTEXT_OPTIONS[context])

@app.post("/api/generate", response_model=ExcuseResponse)
async def generate_excuse_endpoint(request: ExcuseRequest):
    """Generate an excuse based on the provided parameters"""
    try:
        # Validate context
        if request.context not in CONTEXT_OPTIONS:
            raise HTTPException(status_code=400, detail=f"Invalid context: {request.context}")
        
        # Validate event if provided
        if request.event and request.event not in CONTEXT_OPTIONS[request.context]:
            raise HTTPException(status_code=400, detail=f"Invalid event '{request.event}' for context '{request.context}'")
        
        # Generate excuse
        excuse = await generate_excuse(
            context=request.context,
            event=request.event or "general",
            medium=request.medium,
            user_input=request.user_input
        )
        
        return ExcuseResponse(
            excuse=excuse,
            context=request.context,
            event=request.event,
            medium=request.medium
        )
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")

@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "message": "Excuse Generator API is running"}

# Mount static files (CSS, JS) from frontend directory
frontend_dir = Path(__file__).parent.parent / "frontend"
if frontend_dir.exists():
    app.mount("/static", StaticFiles(directory=str(frontend_dir)), name="static")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
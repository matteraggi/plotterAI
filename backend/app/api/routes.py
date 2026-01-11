from fastapi import APIRouter, Request, HTTPException
from pydantic import BaseModel
from app.services.image_generation import image_generation_service
import os

router = APIRouter()

class GenerateRequest(BaseModel):
    prompt: str
    complexity: str = "simple" # "simple" | "complex"

class GenerateResponse(BaseModel):
    image_url: str
    prompt: str

@router.get("/health")
def health_check():
    return {"status": "ok"}

@router.post("/generate", response_model=GenerateResponse)
async def generate_image(request: GenerateRequest, req: Request):
    try:
        image_result = await image_generation_service.generate_image(request.prompt, request.complexity)
        
        # If result is a relative path (starts with /static), make it absolute
        if image_result and image_result.startswith("/static"):
            base_url = str(req.base_url).rstrip("/")
            image_url = f"{base_url}{image_result}"
        else:
            image_url = image_result

        return GenerateResponse(
            image_url=image_url,
            prompt=request.prompt
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
@router.post("/vectorize")
async def vectorize_image_endpoint(request: GenerateResponse): 
    # Reusing GenerateResponse which has image_url, or create new model. 
    # Let's use a simple dict or new model for clear API.
    # Actually, let's allow passing the URL returned by generate.
    
    input_url = request.image_url
    if not input_url:
        raise HTTPException(status_code=400, detail="Image URL is required")
    
    # Extract relative path from URL (remove http://.../static/)
    # Assumption: URL ends with /static/filename.png
    if "/static/" not in input_url:
         raise HTTPException(status_code=400, detail="Invalid image URL format")
    
    filename = input_url.split("/static/")[-1]
    file_path = os.path.join("app/static", filename)
    
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Image file not found")
        
    try:
        from app.services.processing import processing_service
        from app.services.vectorization import vectorization_service
        
        # 1. Preprocess
        processed_path = processing_service.preprocess_image(file_path)
        
        # 2. Vectorize
        svg_path = vectorization_service.vectorize_image(processed_path)
        
        # 3. Return SVG URL
        # Construct simplified URL
        svg_filename = os.path.basename(svg_path)
        return {"svg_url": f"/static/{svg_filename}"}
        
    except Exception as e:
        print(f"Error during vectorization: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
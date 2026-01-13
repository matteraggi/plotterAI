from fastapi import APIRouter, Request, HTTPException, BackgroundTasks
from pydantic import BaseModel
from app.services.image_generation import image_generation_service
from app.services.processing import processing_service
from app.services.vectorization import vectorization_service
from app.services.gcode import gcode_service
from app.core.config import settings
import os
import traceback
from pathlib import Path

router = APIRouter()

# --- Modelli Pydantic ---
class GenerateRequest(BaseModel):
    prompt: str
    complexity: str = "simple"

class GenerateResponse(BaseModel):
    image_url: str
    prompt: str

class PrintRequest(BaseModel):
    imageUrl: str
    x_mm: float
    y_mm: float
    width_mm: float
    height_mm: float
    rotation: float = 0.0

# --- Routes ---

@router.get("/health")
def health_check():
    return {"status": "ok"}

@router.post("/generate", response_model=GenerateResponse)
async def generate_image(request: GenerateRequest, req: Request):
    try:
        # Passiamo la complexity al service (che la userà nel system prompt)
        image_result = await image_generation_service.generate_image(request.prompt, request.complexity)
        
        if image_result and image_result.startswith("/static"):
            base_url = str(req.base_url).rstrip("/")
            image_url = f"{base_url}{image_result}"
        else:
            image_url = image_result

        return GenerateResponse(image_url=image_url, prompt=request.prompt)
    except Exception as e:
        print(f"ERROR GENERATION: {e}")
        raise HTTPException(status_code=500, detail=f"Generation failed: {str(e)}")

# NOTA: Rimosso 'async' perché le operazioni di immagine sono CPU-bound (pesanti)
# Usando 'def' standard, FastAPI le esegue in un threadpool senza bloccare gli altri utenti
@router.post("/print")
def print_image(request: PrintRequest):
    """
    Riceve le coordinate dall'interfaccia Angular e avvia la pipeline:
    Processing -> Vectorization -> GCode -> Plotting
    """
    print(f">>> PRINT REQUEST: {request.imageUrl} at ({request.x_mm}, {request.y_mm})")
    
    # 1. Identificazione sicura del file locale
    try:
        if "/static/" not in request.imageUrl:
            raise HTTPException(status_code=400, detail="Only local static images are supported for now.")
        
        # Estraiamo il nome file in modo più robusto usando Path
        filename = request.imageUrl.split("/static/")[-1].split("?")[0] # Rimuove eventuali query params
        
        # Costruiamo il path assoluto rispetto alla cartella app
        base_path = Path(__file__).resolve().parent.parent / "static"
        file_path = base_path / filename

        if not file_path.exists():
            raise HTTPException(status_code=404, detail=f"File not found on disk: {file_path}")

        # 2. Pipeline di elaborazione
        # NOTA: In un prodotto reale qui useresti BackgroundTasks perché il plotter è lento
        
        # A. Binarizzazione e pulizia (OpenCV)
        print("Step 1: Preprocessing...")
        processed_path = processing_service.preprocess_image(str(file_path))
        
        # B. Vettorializzazione (Potrace/Centerline)
        print("Step 2: Vectorizing...")
        svg_path = vectorization_service.vectorize_image(processed_path)
        
        # C. Generazione G-Code con trasformazione coordinate
        # Qui passiamo i millimetri e la scala decisi dall'utente in Angular
        print("Step 3: Generating G-Code...")
        gcode_data = gcode_service.generate_gcode(
            svg_path=svg_path,
            target_x=request.x_mm,
            target_y=request.y_mm,
            target_width=request.width_mm,
            target_height=request.height_mm,
            rotation=request.rotation
        )
        
        # D. Invio ai motori (su Raspberry Pi)
        # gcode_service.execute_plot(gcode_data) # Questo muoverà i GPIO

        return {
            "status": "success", 
            "message": "Image processed and sent to plotter",
            "details": {
                "svg": os.path.basename(svg_path),
                "commands": len(gcode_data)
            }
        }

    except Exception as e:
        print(f"Error during print processing: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))